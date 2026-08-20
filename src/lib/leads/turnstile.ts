import { isConfigured, serverEnv } from '@/lib/env'
import { logSecurityEvent } from '@/lib/logger'

/**
 * Cloudflare Turnstile verification.
 *
 * Turnstile rather than reCAPTCHA because it does not profile the visitor across
 * sites and does not make anybody identify a bus, which matters on a form that
 * students and parents fill in on a phone.
 *
 * Two behaviours worth being explicit about:
 *
 *   - NOT CONFIGURED means SKIPPED. The site must work on a clean checkout, and
 *     the honeypot and rate limiter still apply.
 *   - A NETWORK FAILURE FAILS OPEN. If Cloudflare cannot be reached, the check is
 *     abandoned and the enquiry proceeds, with a security event logged. The
 *     alternative is that a Cloudflare incident silently blocks every enquiry to
 *     the business. A rejected token is a different matter and always fails
 *     closed: that is Cloudflare answering, not failing.
 */

const VERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
const TIMEOUT_MS = 8_000

export type TurnstileOutcome =
  | { ok: true; skipped: boolean }
  | { ok: false; reason: 'missing-token' | 'rejected' }

export async function verifyTurnstile(
  token: string | undefined,
  remoteIp: string,
): Promise<TurnstileOutcome> {
  if (!isConfigured.turnstile()) return { ok: true, skipped: true }

  const secret = serverEnv().TURNSTILE_SECRET_KEY
  if (!secret) return { ok: true, skipped: true }

  if (!token) return { ok: false, reason: 'missing-token' }

  try {
    const body = new URLSearchParams({ secret, response: token })
    if (remoteIp !== 'unknown') body.set('remoteip', remoteIp)

    const response = await fetch(VERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: 'no-store',
    })

    if (!response.ok) {
      logSecurityEvent('warn', 'turnstile.unavailable', { status: response.status })
      return { ok: true, skipped: true }
    }

    const payload: unknown = await response.json()
    const success =
      payload !== null &&
      typeof payload === 'object' &&
      'success' in payload &&
      payload.success === true

    if (!success) {
      const codes =
        payload !== null && typeof payload === 'object' && 'error-codes' in payload
          ? payload['error-codes']
          : undefined
      logSecurityEvent('warn', 'turnstile.rejected', {
        codes: Array.isArray(codes) ? codes.slice(0, 5) : undefined,
      })
      return { ok: false, reason: 'rejected' }
    }

    return { ok: true, skipped: false }
  } catch (error) {
    // Reaching Cloudflare failed. Do not punish the visitor for it.
    logSecurityEvent('warn', 'turnstile.unreachable', {
      reason: error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'network',
    })
    return { ok: true, skipped: true }
  }
}
