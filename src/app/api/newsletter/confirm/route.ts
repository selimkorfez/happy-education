import { NextResponse, type NextRequest } from 'next/server'
import type { Locale } from '@/lib/i18n/config'
import { fingerprint, logAppEvent, logSecurityEvent } from '@/lib/logger'
import { RATE_LIMITS, checkRateLimit } from '@/lib/rate-limit'
import {
  NEWSLETTER_STATUS_PARAM,
  deliverLead,
  readClientIp,
  statusRedirectUrl,
  verifyConfirmationToken,
  type Lead,
  type NewsletterConfirmOutcome,
} from '@/lib/leads'

/**
 * Newsletter sign-up, step two of two.
 *
 * Following the emailed link is the act of consent, and this is where the
 * subscription is actually created. The token is verified before anything is
 * written; a tampered or expired one is refused without revealing which.
 *
 * The visitor is always redirected to a real page rather than shown JSON, and the
 * redirect drops the token from the address bar so it does not sit in a shared
 * browser's history or get pasted into a support chat.
 *
 * KNOWN LIMITATION: a link in an email can be fetched by a scanner (Outlook Safe
 * Links and similar) before the recipient clicks it, which would confirm the
 * subscription on their behalf. The exposure is bounded, since the confirmation
 * only ever reaches the owner of the address, and it is the accepted cost of a
 * one-click confirmation. Moving to a confirmation PAGE with a POST button removes
 * it, and needs a page in the site tree rather than an API route.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
} as const

/**
 * A subscriber who never gave a name still needs one in the record. This is a
 * label, not a claim about a person.
 */
const SUBSCRIBER_LABEL: Record<Locale, string> = {
  en: 'Newsletter subscriber',
  tr: 'Bülten abonesi',
}

function redirect(
  request: NextRequest,
  sourcePath: string,
  outcome: NewsletterConfirmOutcome,
): NextResponse {
  const url = statusRedirectUrl(request, sourcePath, NEWSLETTER_STATUS_PARAM, outcome)
  return NextResponse.redirect(url, { status: 303, headers: NO_STORE })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    return await handle(request)
  } catch (error) {
    logSecurityEvent('error', 'newsletter.confirm.unhandled', { error })
    return redirect(request, '/', 'unavailable')
  }
}

async function handle(request: NextRequest): Promise<NextResponse> {
  const ip = readClientIp(request)
  const limit = await checkRateLimit(`newsletter-confirm:${ip}`, RATE_LIMITS.newsletterConfirm)
  if (!limit.allowed) {
    logSecurityEvent('warn', 'newsletter.confirm.rateLimited')
    return redirect(request, '/', 'invalid')
  }

  const token = request.nextUrl.searchParams.get('token')
  if (!token) return redirect(request, '/', 'invalid')

  const verification = verifyConfirmationToken(token)
  if (!verification.ok) {
    logSecurityEvent('info', 'newsletter.confirm.rejected', { reason: verification.reason })
    const outcome: NewsletterConfirmOutcome =
      verification.reason === 'expired'
        ? 'expired'
        : verification.reason === 'unavailable'
          ? 'unavailable'
          : 'invalid'
    return redirect(request, '/', outcome)
  }

  const { payload } = verification
  const now = new Date().toISOString()

  const lead: Lead = {
    kind: 'newsletter',
    locale: payload.locale,
    name: payload.name ?? SUBSCRIBER_LABEL[payload.locale],
    email: payload.email,
    sourcePath: payload.sourcePath,
    submittedAt: now,
    marketingConsent: true,
    // The moment the link was followed, not the moment the form was submitted.
    // This is the timestamp that evidences the consent.
    consentAt: now,
  }

  const delivery = await deliverLead(lead)

  if (!delivery.ok) {
    logSecurityEvent('error', 'newsletter.confirm.deliveryFailed', {
      contact: fingerprint(payload.email),
    })
    return redirect(request, payload.sourcePath, 'unavailable')
  }

  logAppEvent('info', 'newsletter.confirmed', {
    locale: payload.locale,
    reference: delivery.reference,
    contact: fingerprint(payload.email),
  })

  return redirect(request, payload.sourcePath, 'confirmed')
}
