import { NextResponse, type NextRequest } from 'next/server'
import { logAppEvent, logSecurityEvent } from '@/lib/logger'
import { RATE_LIMITS, checkRateLimit } from '@/lib/rate-limit'
import {
  ENQUIRY_STATUS_PARAM,
  HONEYPOT_FIELD,
  TURNSTILE_FIELD,
  buildLead,
  deliverLead,
  isSameOrigin,
  parseEnquiry,
  prefersJson,
  readClientIp,
  readSubmission,
  statusRedirectUrl,
  verifyTurnstile,
  type EnquiryApiResponse,
} from '@/lib/leads'

/**
 * Enquiry submission.
 *
 * The layered defence, cheapest first, so an attacker never reaches the expensive
 * work and a genuine visitor never notices any of it:
 *
 *   1. SAME-ORIGIN. Replaces the legacy site's cross-origin POST of student
 *      details straight to Salesforce (audit report-1, H4).
 *   2. RATE LIMIT, by address and route. Two windows: a burst limit that catches a
 *      script, and a daily limit that catches a patient one.
 *   3. HONEYPOT. Free, invisible to a person, and answered with a success-shaped
 *      response so the bot's operator learns nothing about why it failed.
 *   4. TURNSTILE, only when configured, and only after the free checks.
 *   5. SCHEMA VALIDATION, which is authoritative regardless of what the browser did.
 *
 * The response never carries a stack trace, a provider message or an echo of the
 * submitted values. Failures are one of a fixed set of codes, and the browser owns
 * the wording.
 *
 * Both encodings are answered correctly: JSON for the enhanced form, and a 303
 * redirect back to the page for a plain form submission with no JavaScript.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Returned when the honeypot is filled. It is not a real reference and nothing was
 * delivered; the point is that an automated submission cannot tell the difference.
 */
const DECOY_REFERENCE = 'HE-000000'

const NO_STORE = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
} as const

type RedirectStatus = 'sent' | 'invalid' | 'busy' | 'error'

function statusFor(payload: EnquiryApiResponse): RedirectStatus {
  if (payload.ok) return 'sent'
  if (payload.error === 'validation') return 'invalid'
  if (payload.error === 'rateLimit') return 'busy'
  return 'error'
}

function respond(
  request: NextRequest,
  sourcePath: string,
  payload: EnquiryApiResponse,
  status: number,
  headers: Record<string, string> = {},
): NextResponse {
  if (!prefersJson(request)) {
    const url = statusRedirectUrl(
      request,
      sourcePath,
      ENQUIRY_STATUS_PARAM,
      statusFor(payload),
      'enquiry-form',
    )
    // 303 so the browser follows with GET and a refresh cannot resubmit.
    return NextResponse.redirect(url, { status: 303, headers: { ...NO_STORE, ...headers } })
  }
  return NextResponse.json(payload, { status, headers: { ...NO_STORE, ...headers } })
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    return await handle(request)
  } catch (error) {
    // Nothing below is expected to throw. If it does, the visitor gets a code and
    // the detail goes to the log, redacted.
    logSecurityEvent('error', 'enquiry.unhandled', { error })
    return respond(request, '/', { ok: false, error: 'unavailable' }, 500)
  }
}

async function handle(request: NextRequest): Promise<NextResponse> {
  if (!isSameOrigin(request)) {
    logSecurityEvent('warn', 'enquiry.crossOrigin', {
      // Host only. A full referring URL can carry query parameters.
      originHost: request.headers.get('origin'),
      path: request.nextUrl.pathname,
    })
    return respond(request, '/', { ok: false, error: 'origin' }, 403)
  }

  const ip = readClientIp(request)

  const burst = await checkRateLimit(`enquiry:${ip}`, RATE_LIMITS.enquiry)
  const daily = burst.allowed
    ? await checkRateLimit(`enquiry-daily:${ip}`, RATE_LIMITS.enquiryDaily)
    : burst

  if (!burst.allowed || !daily.allowed) {
    const retryAfterSeconds = Math.max(burst.retryAfterSeconds, daily.retryAfterSeconds)
    logSecurityEvent('warn', 'enquiry.rateLimited', { window: burst.allowed ? 'daily' : 'burst' })
    return respond(
      request,
      '/',
      { ok: false, error: 'rateLimit', retryAfterSeconds },
      429,
      { 'Retry-After': String(retryAfterSeconds) },
    )
  }

  const read = await readSubmission(request)
  if (!read.ok) {
    logSecurityEvent('warn', 'enquiry.unreadable', { reason: read.reason })
    return respond(request, '/', { ok: false, error: 'malformed' }, read.reason === 'too-large' ? 413 : 400)
  }

  const submission = read.submission
  const sourcePath = submission.sourcePath ?? '/'

  // Honeypot. A person never sees this input, so anything in it is automated.
  const honeypot = submission[HONEYPOT_FIELD]
  if (honeypot && honeypot.trim().length > 0) {
    logSecurityEvent('info', 'enquiry.honeypot', { path: sourcePath })
    return respond(request, sourcePath, { ok: true, reference: DECOY_REFERENCE, duplicate: false }, 200)
  }

  const turnstile = await verifyTurnstile(submission[TURNSTILE_FIELD], ip)
  if (!turnstile.ok) {
    logSecurityEvent('warn', 'enquiry.captchaFailed', { reason: turnstile.reason })
    return respond(request, sourcePath, { ok: false, error: 'captcha' }, 400)
  }

  const parsed = parseEnquiry(submission)
  if (!parsed.ok) {
    if (parsed.prohibitedField) {
      // Somebody is posting identity or financial data at a website enquiry form.
      // The field NAME is logged; its value never is.
      logSecurityEvent('warn', 'enquiry.prohibitedField', {
        field: parsed.prohibitedField,
        path: sourcePath,
      })
    }
    return respond(request, sourcePath, { ok: false, error: 'validation', fields: parsed.fields }, 400)
  }

  const lead = buildLead(parsed.data, { sourcePath: parsed.data.sourcePath })
  const delivery = await deliverLead(lead)

  if (!delivery.ok) {
    // Every channel refused it. Answering 502 rather than 200 matters: the form
    // then tells the visitor to phone or email instead of thanking them for a
    // message that does not exist.
    return respond(request, sourcePath, { ok: false, error: 'delivery' }, 502)
  }

  logAppEvent('info', 'enquiry.accepted', {
    kind: lead.kind,
    locale: lead.locale,
    reference: delivery.reference,
    duplicate: delivery.duplicate,
    sourcePath: lead.sourcePath,
    channels: delivery.results.map((result) => `${result.channel}:${result.ok ? 'ok' : 'failed'}`),
  })

  return respond(
    request,
    sourcePath,
    { ok: true, reference: delivery.reference, duplicate: delivery.duplicate },
    200,
  )
}
