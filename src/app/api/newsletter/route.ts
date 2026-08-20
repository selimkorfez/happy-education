import { NextResponse, type NextRequest } from 'next/server'
import { newsletterConfirmation, sendEmail } from '@/lib/email'
import { siteUrl } from '@/lib/env'
import { fingerprint, logAppEvent, logSecurityEvent } from '@/lib/logger'
import { RATE_LIMITS, checkRateLimit } from '@/lib/rate-limit'
import {
  HONEYPOT_FIELD,
  NEWSLETTER_CONFIRM_ENDPOINT,
  NEWSLETTER_STATUS_PARAM,
  TOKEN_EXPIRY_HOURS,
  TURNSTILE_FIELD,
  createConfirmationToken,
  isSameOrigin,
  isTokenSigningAvailable,
  parseNewsletter,
  prefersJson,
  readClientIp,
  readSubmission,
  statusRedirectUrl,
  verifyTurnstile,
  type NewsletterApiResponse,
} from '@/lib/leads'

/**
 * Newsletter sign-up, step one of two.
 *
 * Nothing is subscribed here. This route records the request by SIGNING it into a
 * token and emails that token to the address; the subscription happens only when
 * the link is followed. Two consequences worth stating:
 *
 *   - A mistyped address never becomes a subscriber, because the confirmation
 *     lands with whoever actually owns it and they simply ignore it.
 *   - The answer is the same whether or not the address is already on the list.
 *     Reporting "you are already subscribed" would turn this endpoint into a way
 *     to test whether a given person is a client.
 *
 * The enquiry form NEVER routes here. Marketing consent given on an enquiry is
 * recorded against that lead for an adviser to act on; it does not silently start
 * a subscription, because the person did not confirm an address for that purpose.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
} as const

type RedirectStatus = 'pending' | 'invalid' | 'busy' | 'error'

function statusFor(payload: NewsletterApiResponse): RedirectStatus {
  if (payload.ok) return 'pending'
  if (payload.error === 'validation') return 'invalid'
  if (payload.error === 'rateLimit') return 'busy'
  return 'error'
}

function respond(
  request: NextRequest,
  sourcePath: string,
  payload: NewsletterApiResponse,
  status: number,
  headers: Record<string, string> = {},
): NextResponse {
  if (!prefersJson(request)) {
    const url = statusRedirectUrl(
      request,
      sourcePath,
      NEWSLETTER_STATUS_PARAM,
      statusFor(payload),
      'newsletter-form',
    )
    return NextResponse.redirect(url, { status: 303, headers: { ...NO_STORE, ...headers } })
  }
  return NextResponse.json(payload, { status, headers: { ...NO_STORE, ...headers } })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    return await handle(request)
  } catch (error) {
    logSecurityEvent('error', 'newsletter.unhandled', { error })
    return respond(request, '/', { ok: false, error: 'unavailable' }, 500)
  }
}

async function handle(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    logSecurityEvent('warn', 'newsletter.crossOrigin', {
      originHost: request.headers.get('origin'),
    })
    return respond(request, '/', { ok: false, error: 'origin' }, 403)
  }

  const ip = readClientIp(request)
  const byAddress = await checkRateLimit(`newsletter:${ip}`, RATE_LIMITS.newsletter)
  if (!byAddress.allowed) {
    logSecurityEvent('warn', 'newsletter.rateLimited', { scope: 'ip' })
    return respond(
      request,
      '/',
      { ok: false, error: 'rateLimit', retryAfterSeconds: byAddress.retryAfterSeconds },
      429,
      { 'Retry-After': String(byAddress.retryAfterSeconds) },
    )
  }

  const read = await readSubmission(request)
  if (!read.ok) {
    logSecurityEvent('warn', 'newsletter.unreadable', { reason: read.reason })
    return respond(request, '/', { ok: false, error: 'malformed' }, read.reason === 'too-large' ? 413 : 400)
  }

  const submission = read.submission
  const sourcePath = submission.sourcePath ?? '/'

  const honeypot = submission[HONEYPOT_FIELD]
  if (honeypot && honeypot.trim().length > 0) {
    logSecurityEvent('info', 'newsletter.honeypot', { path: sourcePath })
    return respond(request, sourcePath, { ok: true, pending: true }, 200)
  }

  const turnstile = await verifyTurnstile(submission[TURNSTILE_FIELD], ip)
  if (!turnstile.ok) {
    logSecurityEvent('warn', 'newsletter.captchaFailed', { reason: turnstile.reason })
    return respond(request, sourcePath, { ok: false, error: 'captcha' }, 400)
  }

  const parsed = parseNewsletter(submission)
  if (!parsed.ok) {
    if (parsed.prohibitedField) {
      logSecurityEvent('warn', 'newsletter.prohibitedField', { field: parsed.prohibitedField })
    }
    return respond(request, sourcePath, { ok: false, error: 'validation', fields: parsed.fields }, 400)
  }

  const input = parsed.data

  /*
   * Second limit, keyed by the ADDRESS rather than the sender. Without it, a
   * script rotating through addresses could use this endpoint to post
   * confirmation emails at somebody else's inbox from many source addresses.
   */
  const perAddress = await checkRateLimit(
    `newsletter-address:${fingerprint(input.email)}`,
    { limit: 2, windowMs: 60 * 60 * 1000 },
  )
  if (!perAddress.allowed) {
    logSecurityEvent('warn', 'newsletter.rateLimited', { scope: 'address' })
    // Answered as though accepted: the owner of the address has already been sent
    // a link, and confirming that fact to a stranger would be the leak.
    return respond(request, sourcePath, { ok: true, pending: true }, 200)
  }

  if (!isTokenSigningAvailable()) {
    // No signing key in production. Refuse rather than send a link that cannot be
    // verified when it comes back.
    logSecurityEvent('error', 'newsletter.signingUnavailable')
    return respond(request, sourcePath, { ok: false, error: 'unavailable' }, 503)
  }

  const token = createConfirmationToken({
    email: input.email,
    locale: input.locale,
    sourcePath: input.sourcePath,
    name: input.name,
  })

  if (!token) {
    return respond(request, sourcePath, { ok: false, error: 'unavailable' }, 503)
  }

  const confirmUrl = `${siteUrl}${NEWSLETTER_CONFIRM_ENDPOINT}?token=${encodeURIComponent(token)}`

  const sent = await sendEmail(
    newsletterConfirmation({
      to: input.email,
      locale: input.locale,
      confirmUrl,
      expiryHours: TOKEN_EXPIRY_HOURS,
    }),
  )

  if (!sent.ok) {
    logSecurityEvent('error', 'newsletter.confirmationSendFailed', { reason: sent.reason })
    return respond(request, sourcePath, { ok: false, error: 'delivery' }, 502)
  }

  logAppEvent('info', 'newsletter.pending', {
    locale: input.locale,
    sourcePath: input.sourcePath,
    contact: fingerprint(input.email),
  })

  return respond(request, sourcePath, { ok: true, pending: true }, 200)
}
