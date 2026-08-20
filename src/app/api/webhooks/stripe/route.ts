import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe, stripeErrorSummary, STRIPE_API_VERSION } from '@/lib/payments/stripe'
import { serverEnv } from '@/lib/env'
import { getProcessedEventStore } from '@/lib/payments/event-log'
import {
  getPaymentStore,
  type PaymentPatch,
  type PaymentRecord,
  type PaymentStatus,
} from '@/lib/payments/records'
import { logSecurityEvent } from '@/lib/payments/request-guard'

/**
 * POST /api/webhooks/stripe
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE WEBHOOK IS AUTHORITATIVE.
 *
 * A `success=true` (or any other) URL parameter on the return page is NEVER proof
 * of payment. The visitor controls their own address bar: anyone can type the
 * success URL. A payment is real when Stripe says so — either through a
 * signature-verified event delivered here, or through a server-side retrieval of
 * the session from the Stripe API. Nothing is fulfilled, no confirmation is sent
 * and no record is marked paid on the strength of a redirect.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Three properties this handler must keep:
 *
 *   RAW BODY. The signature is computed over the exact bytes Stripe sent. The body
 *   is read with `request.text()` and passed through untouched — no JSON parsing
 *   before verification, no framework body parser, no re-serialisation.
 *
 *   VERIFIED. An unverifiable signature is a 400 and a logged security event, not
 *   a best-effort parse. An attacker who could post unsigned events could mark any
 *   payment as paid.
 *
 *   IDEMPOTENT. Stripe delivers at least once. Every event id is claimed before it
 *   is handled; a duplicate delivery is acknowledged and dropped.
 */

// Node runtime: signature verification uses node:crypto through the Stripe SDK.
// The Edge runtime would require the async, WebCrypto verification path.
export const runtime = 'nodejs'
// Never cached, never prerendered, never statically analysed.
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/** Events this endpoint acts on. Anything else is acknowledged and ignored. */
const HANDLED_EVENTS = [
  'checkout.session.completed',
  'checkout.session.expired',
  'checkout.session.async_payment_succeeded',
  'checkout.session.async_payment_failed',
  'payment_intent.payment_failed',
  'charge.refunded',
] as const

export async function POST(request: Request): Promise<NextResponse> {
  const secret = serverEnv().STRIPE_WEBHOOK_SECRET

  /*
   * ORDER MATTERS HERE.
   *
   * Signature verification runs before anything else and depends only on the
   * webhook secret, never on the API client. An earlier version required the
   * secret key too, which meant a half-configured deployment answered forged
   * payloads with 503 instead of rejecting them: signature checking silently
   * switched itself off exactly when the configuration was least trustworthy.
   *
   * Verification needs no authenticated client, so a bare instance is used. It
   * makes no API call; `constructEvent` is pure HMAC over the raw bytes.
   */
  if (!secret) {
    // Genuinely unconfigured. 503 rather than 200, so Stripe surfaces the endpoint
    // as failing instead of the site silently discarding real payment events.
    return NextResponse.json({ error: 'not_configured' }, { status: 503 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    logSecurityEvent('webhook.missing_signature', { path: '/api/webhooks/stripe' })
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 })
  }

  // RAW body. Nothing may touch these bytes before verification.
  const payload = await request.text()

  // The SDK refuses an empty key, but `constructEvent` never makes an API call, so
  // a placeholder is enough to reach the HMAC check. It can authenticate nothing.
  const verifier =
    getStripe() ?? new Stripe('sk_signature_verification_only', { apiVersion: STRIPE_API_VERSION })

  let event: Stripe.Event
  try {
    event = verifier.webhooks.constructEvent(payload, signature, secret)
  } catch (error) {
    logSecurityEvent('webhook.invalid_signature', {
      reason: stripeErrorSummary(error).message,
      bytes: payload.length,
    })
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 })
  }

  if (!(HANDLED_EVENTS as readonly string[]).includes(event.type)) {
    // Acknowledged so Stripe stops retrying an event we have no opinion about.
    return NextResponse.json({ received: true, handled: false }, { status: 200 })
  }

  const events = getProcessedEventStore()
  const claimed = await events.reserve(event.id)
  if (!claimed) {
    console.info('[webhook] duplicate delivery ignored', { id: event.id, type: event.type })
    return NextResponse.json({ received: true, duplicate: true }, { status: 200 })
  }

  try {
    await handleEvent(event)
    return NextResponse.json({ received: true }, { status: 200 })
  } catch (error) {
    // Release the claim so Stripe's retry is processed rather than being mistaken
    // for a duplicate, then fail loudly enough that the retry actually happens.
    await events.release(event.id)
    console.error('[webhook] handler failed', {
      id: event.id,
      eventType: event.type,
      ...stripeErrorSummary(error),
    })
    return NextResponse.json({ error: 'handler_failed' }, { status: 500 })
  }
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object
      // `completed` means the visitor finished Checkout, NOT that money has moved.
      // Delayed methods (bank transfer, some local methods) complete as `unpaid`
      // and settle later through async_payment_succeeded.
      const status: PaymentStatus = session.payment_status === 'paid' ? 'paid' : 'pending'
      await applySessionUpdate(session, { status })
      return
    }

    case 'checkout.session.async_payment_succeeded': {
      await applySessionUpdate(event.data.object, { status: 'paid' })
      return
    }

    case 'checkout.session.async_payment_failed': {
      await applySessionUpdate(event.data.object, { status: 'failed' })
      return
    }

    case 'checkout.session.expired': {
      const record = await locate({
        internalReference: metadataReference(event.data.object.metadata),
        sessionId: event.data.object.id,
      })
      // An expired session that was already paid must not be walked backwards.
      if (record && record.status !== 'paid' && record.status !== 'refunded') {
        await getPaymentStore().update(record.internalReference, { status: 'cancelled' })
      }
      log('session.expired', record, event.id)
      return
    }

    case 'payment_intent.payment_failed': {
      const intent = event.data.object
      const record = await locate({
        internalReference: metadataReference(intent.metadata),
        paymentIntentId: intent.id,
      })
      if (record && record.status !== 'paid') {
        await getPaymentStore().update(record.internalReference, {
          status: 'failed',
          stripePaymentIntentId: intent.id,
        })
      }
      // The decline reason is operational detail and is never shown to the visitor
      // beyond "the payment did not go through" — card issuers do not want the
      // precise reason surfaced, and it is rarely actionable.
      console.warn('[webhook] payment failed', {
        eventId: event.id,
        internalReference: record?.internalReference ?? 'unmatched',
        code: intent.last_payment_error?.code ?? 'unknown',
      })
      return
    }

    case 'charge.refunded': {
      const charge = event.data.object
      const paymentIntentId =
        typeof charge.payment_intent === 'string'
          ? charge.payment_intent
          : (charge.payment_intent?.id ?? null)

      const record = await locate({
        internalReference: metadataReference(charge.metadata),
        paymentIntentId,
      })

      const fullyRefunded = charge.amount_refunded >= charge.amount
      const patch: PaymentPatch = {
        status: fullyRefunded ? 'refunded' : 'partially_refunded',
        amountRefundedMinor: charge.amount_refunded,
        ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
      }

      if (record) await getPaymentStore().update(record.internalReference, patch)
      log(fullyRefunded ? 'charge.refunded' : 'charge.partially_refunded', record, event.id)
      return
    }

    default:
      return
  }
}

async function applySessionUpdate(
  session: Stripe.Checkout.Session,
  patch: PaymentPatch,
): Promise<void> {
  const internalReference = metadataReference(session.metadata) ?? session.client_reference_id
  const record = await locate({ internalReference, sessionId: session.id })

  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : (session.payment_intent?.id ?? null)

  if (record) {
    await getPaymentStore().update(record.internalReference, {
      ...patch,
      stripeSessionId: session.id,
      ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
    })
  } else {
    // No local record. On a serverless deployment with the in-memory store this is
    // expected, because the instance that created the record is not the instance
    // receiving the event. It is logged rather than swallowed so the gap is
    // visible until a durable PaymentStore is wired in.
    console.warn('[webhook] no local record for session', {
      sessionId: session.id,
      internalReference: internalReference ?? 'none',
      status: patch.status ?? 'unchanged',
    })
  }

  console.info('[webhook] session updated', {
    sessionId: session.id,
    internalReference: internalReference ?? 'none',
    status: patch.status ?? 'unchanged',
    amountTotal: session.amount_total ?? 0,
    currency: (session.currency ?? '').toUpperCase(),
  })
}

/** Metadata is attacker-influenced only via our own code paths, but still validated. */
function metadataReference(metadata: Stripe.Metadata | null | undefined): string | null {
  const value = metadata?.internalReference
  if (typeof value !== 'string') return null
  return /^HE-\d{8}-[A-Z0-9]{6}$/.test(value) ? value : null
}

async function locate(keys: {
  internalReference?: string | null
  sessionId?: string | null
  paymentIntentId?: string | null
}): Promise<PaymentRecord | null> {
  const store = getPaymentStore()

  if (keys.internalReference) {
    const byReference = await store.findByInternalReference(keys.internalReference)
    if (byReference) return byReference
  }
  if (keys.sessionId) {
    const bySession = await store.findByStripeSessionId(keys.sessionId)
    if (bySession) return bySession
  }
  if (keys.paymentIntentId) {
    const byIntent = await store.findByPaymentIntentId(keys.paymentIntentId)
    if (byIntent) return byIntent
  }
  return null
}

function log(what: string, record: PaymentRecord | null, eventId: string): void {
  console.info('[webhook]', what, {
    eventId,
    internalReference: record?.internalReference ?? 'unmatched',
  })
}

/** A GET here is a probe or a misconfigured endpoint URL, never Stripe. */
export function GET(): NextResponse {
  return NextResponse.json({ error: 'method_not_allowed' }, { status: 405, headers: { Allow: 'POST' } })
}
