import { createHash } from 'node:crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type Stripe from 'stripe'
import { getStripe, paymentsEnabled, stripeErrorSummary } from '@/lib/payments/stripe'
import { CLIENT_AMOUNT_KEYS, isFree, resolvePayable } from '@/lib/payments/catalogue'
import { checkoutReturnUrls } from '@/lib/payments/urls'
import { formatInternalReference, getPaymentStore } from '@/lib/payments/records'
import {
  clientKey,
  isSameOrigin,
  logSecurityEvent,
  rateLimit,
  readJsonBody,
} from '@/lib/payments/request-guard'
import { LOCALES, type Locale } from '@/lib/i18n/config'

/**
 * POST /api/checkout — creates a Stripe Checkout Session.
 *
 * THE AMOUNT IS NEVER TAKEN FROM THE REQUEST. The body carries a catalogue
 * `reference` and contact details; the price is resolved server-side by
 * `resolvePayable()`. A body containing any amount-shaped field is refused
 * outright and logged, because the only reason to send one is to try to set the
 * price. See the header comment in `src/lib/payments/catalogue.ts`.
 *
 * The response is `{ url }` and nothing else: no secret key, no Stripe object, no
 * client secret, no PaymentIntent id. The browser gets somewhere to go.
 */

// Node runtime: the Stripe SDK and node:crypto are used here.
export const runtime = 'nodejs'
// Never prerendered, never cached: this creates state at Stripe.
export const dynamic = 'force-dynamic'

const MAX_REQUESTS = 8
const WINDOW_SECONDS = 60

/** Extra context we let a page attach. Never money, never anything authorising. */
const metadataSchema = z
  .record(
    z.string().regex(/^[a-zA-Z0-9_-]{1,40}$/),
    z.string().min(1).max(200),
  )
  .refine((value) => Object.keys(value).length <= 8, {
    message: 'Too many metadata keys',
  })

const bodySchema = z.strictObject({
  reference: z.string().min(3).max(96),
  locale: z.enum(LOCALES),
  customer: z.strictObject({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().toLowerCase().email().max(200),
  }),
  metadata: metadataSchema.optional(),
})

type ErrorCode =
  | 'forbidden_origin'
  | 'rate_limited'
  | 'invalid_request'
  | 'amount_not_accepted'
  | 'unknown_item'
  | 'no_payment_required'
  | 'payments_unavailable'
  | 'checkout_failed'

function fail(code: ErrorCode, status: number, headers?: HeadersInit): NextResponse {
  return NextResponse.json({ error: code }, { status, headers: { ...headers } })
}

/** Stripe's own locale codes. British English is a distinct option from `en`. */
const STRIPE_LOCALE: Record<Locale, Stripe.Checkout.SessionCreateParams.Locale> = {
  en: 'en-GB',
  tr: 'tr',
}

/**
 * Idempotency.
 *
 * The key is a hash of what is being bought, by whom, for how much, inside a
 * ten-minute bucket. A double click, a retried fetch or a browser that replays the
 * request lands on the same key, so Stripe returns the session it already created
 * instead of opening a second one. The same hash produces the internal reference,
 * so the payment record is upserted rather than duplicated.
 *
 * The bucket exists so that a genuine second purchase of the same item later in
 * the day is not silently answered with the first session. Ten minutes is far
 * longer than any double click and far shorter than a considered repeat purchase.
 */
const BUCKET_MS = 10 * 60 * 1000

function requestFingerprint(input: {
  reference: string
  email: string
  locale: Locale
  amountMinor: number
  currency: string
}): { hash: string; bucketStart: Date } {
  const bucket = Math.floor(Date.now() / BUCKET_MS)
  const hash = createHash('sha256')
    .update(
      [input.reference, input.email, input.locale, input.amountMinor, input.currency, bucket].join(
        '|',
      ),
    )
    .digest('hex')
  // The reference date comes from the bucket, not from `now`: a request that
  // crosses midnight UTC between two clicks must still derive one reference.
  return { hash, bucketStart: new Date(bucket * BUCKET_MS) }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    logSecurityEvent('checkout.cross_origin', {
      origin: request.headers.get('origin') ?? 'none',
    })
    return fail('forbidden_origin', 403)
  }

  const limit = rateLimit(clientKey(request, 'checkout'), MAX_REQUESTS, WINDOW_SECONDS)
  if (!limit.ok) {
    logSecurityEvent('checkout.rate_limited', { retryAfter: limit.retryAfterSeconds })
    return fail('rate_limited', 429, { 'Retry-After': String(limit.retryAfterSeconds) })
  }

  const raw = await readJsonBody(request)
  if (raw === null || typeof raw !== 'object') return fail('invalid_request', 400)

  // Explicit tamper check before validation, so it is logged as what it is rather
  // than as a generic schema failure. `.strict()` would reject these anyway.
  const suppliedKeys = Object.keys(raw as Record<string, unknown>)
  const amountKey = suppliedKeys.find((key) =>
    (CLIENT_AMOUNT_KEYS as readonly string[]).includes(key),
  )
  if (amountKey) {
    logSecurityEvent('checkout.client_supplied_amount', { field: amountKey })
    return fail('amount_not_accepted', 400)
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) return fail('invalid_request', 400)
  const body = parsed.data

  // Resolved server-side. This is the only place an amount comes from.
  const payable = await resolvePayable(body.reference, body.locale)
  if (!payable) return fail('unknown_item', 404)

  if (isFree(payable)) {
    // A free consultation is booked, not bought. Creating a zero-value Checkout
    // Session would be rejected by Stripe and would confuse the visitor.
    return fail('no_payment_required', 400)
  }

  if (!paymentsEnabled()) {
    // Missing secret key or missing webhook secret. Taking money without a verified
    // webhook would leave the site unable to confirm what was actually paid.
    return fail('payments_unavailable', 503)
  }

  const stripe = getStripe()
  if (!stripe) return fail('payments_unavailable', 503)

  const { hash, bucketStart } = requestFingerprint({
    reference: payable.reference,
    email: body.customer.email,
    locale: body.locale,
    amountMinor: payable.amountMinor,
    currency: payable.currency,
  })
  const internalReference = formatInternalReference(hash, bucketStart)
  const idempotencyKey = `he_checkout_${hash.slice(0, 48)}`

  const leadId = body.metadata?.leadId
  const appointmentReference = body.metadata?.appointmentReference

  const metadata: Record<string, string> = {
    internalReference,
    reference: payable.reference,
    locale: body.locale,
    ...(leadId ? { leadId } : {}),
    ...(appointmentReference ? { appointmentReference } : {}),
  }

  await getPaymentStore().create({
    internalReference,
    customerName: body.customer.name,
    customerEmail: body.customer.email,
    serviceType: payable.reference,
    amountMinor: payable.amountMinor,
    currency: payable.currency,
    locale: body.locale,
    ...(appointmentReference ? { appointmentReference } : {}),
  })

  const { successUrl, cancelUrl } = checkoutReturnUrls(body.locale, internalReference)

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',

        // GUEST CHECKOUT. No account, no password, nothing to remember. In payment
        // mode Stripe only creates a Customer when a payment method requires one.
        customer_creation: 'if_required',
        customer_email: body.customer.email,

        // `payment_method_types` is deliberately NOT set. Leaving it out hands the
        // decision to Stripe's dynamic payment methods, which show each visitor
        // only what actually works for their device, browser, currency and country
        // — including wallets such as Apple Pay and Google Pay where the visitor is
        // eligible. Nothing in the UI may claim a particular wallet is available:
        // Apple Pay needs Safari or an Apple device with a card set up, and
        // promising it to everyone would be a claim we cannot keep.
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: payable.currency.toLowerCase(),
              unit_amount: payable.amountMinor,
              product_data: {
                name: payable.title,
                ...(payable.description ? { description: payable.description.slice(0, 500) } : {}),
              },
            },
          },
        ],

        client_reference_id: internalReference,
        metadata,
        // Repeated onto the PaymentIntent: `payment_intent.payment_failed` carries
        // only the intent, so without this the failure could not be matched to a
        // record.
        payment_intent_data: {
          description: `${payable.title} (${internalReference})`,
          metadata,
        },

        locale: STRIPE_LOCALE[body.locale],
        success_url: successUrl,
        cancel_url: cancelUrl,

        // One hour. Long enough to find a card, short enough that an abandoned
        // session does not sit open all week.
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
      },
      { idempotencyKey },
    )

    if (!session.url) {
      console.error('[checkout] session created without a redirect url', { internalReference })
      return fail('checkout_failed', 502)
    }

    await getPaymentStore().update(internalReference, {
      stripeSessionId: session.id,
      stripePaymentIntentId:
        typeof session.payment_intent === 'string' ? session.payment_intent : null,
    })

    // Only the redirect URL crosses back to the browser.
    return NextResponse.json(
      { url: session.url },
      { status: 200, headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    // Logged without the request body: a rejected body is exactly where a card
    // number would end up if a visitor pasted one into the wrong field.
    console.error('[checkout] stripe session creation failed', {
      internalReference,
      ...stripeErrorSummary(error),
    })
    return fail('checkout_failed', 502)
  }
}

/** Anything other than POST is a mistake or a probe. */
export function GET(): NextResponse {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405, headers: { Allow: 'POST' } })
}
