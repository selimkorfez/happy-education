import 'server-only'
import { isProduction, siteUrl } from '@/lib/env'

/**
 * Request guards for the payment endpoints.
 *
 * Two cheap controls that between them stop the common abuse of a public checkout
 * endpoint: creating sessions from another site (CSRF-style, and a way to run up a
 * Stripe bill), and creating them in bulk.
 *
 * SCOPE NOTE: the rate limiter is an in-process fixed window. On a serverless
 * platform each instance keeps its own counter, so the effective limit is per
 * instance, not global. That is deliberate for now — it is a real speed bump with
 * no infrastructure — but the production hardening step is to move the counter to
 * a shared store (Upstash, Redis, or the platform's own rate limiting) and to
 * enable Stripe's rate limits and Radar rules as the outer layer.
 */

interface Window {
  count: number
  resetAt: number
}

const windows = new Map<string, Window>()

/** Stops the map growing without bound on a long-lived instance. */
function sweep(now: number): void {
  if (windows.size < 5_000) return
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key)
  }
}

export interface RateLimitResult {
  ok: boolean
  remaining: number
  /** Seconds until the window resets. Sent as `Retry-After` on a 429. */
  retryAfterSeconds: number
}

export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = windows.get(key)
  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  existing.count += 1
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000))

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds }
  }
  return { ok: true, remaining: Math.max(0, limit - existing.count), retryAfterSeconds }
}

/**
 * Best-effort client identity for rate limiting.
 *
 * Forwarded headers are spoofable in general; they are trustworthy here only
 * because Cloudflare and Vercel both overwrite them at the edge. This value is
 * used for throttling only — never for authorisation, and never stored.
 */
export function clientKey(request: Request, scope: string): string {
  const headers = request.headers
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = headers.get('cf-connecting-ip') ?? forwarded ?? headers.get('x-real-ip') ?? 'unknown'
  return `${scope}:${ip}`
}

function hostOf(value: string | null): string | null {
  if (!value) return null
  try {
    return new URL(value).host.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Same-origin check.
 *
 * A browser always sends `Origin` on a cross-origin POST, and Next.js sends it on
 * same-origin fetches too, so a missing Origin on a state-changing request is
 * itself suspicious and is refused in production. In development, requests from a
 * terminal (curl, the Stripe CLI) have no Origin, so the check is relaxed there.
 */
export function isSameOrigin(request: Request): boolean {
  const allowed = new Set<string>()

  const configured = hostOf(siteUrl)
  if (configured) allowed.add(configured)

  // The host actually serving the request: covers preview deployments and any
  // custom domain in front of the origin.
  const requestHost = request.headers.get('host')?.toLowerCase()
  if (requestHost) allowed.add(requestHost)

  const origin = hostOf(request.headers.get('origin'))
  if (origin) return allowed.has(origin)

  const referer = hostOf(request.headers.get('referer'))
  if (referer) return allowed.has(referer)

  return !isProduction
}

/**
 * Reads a JSON body with a hard size cap.
 *
 * Returns null rather than throwing on malformed or oversized input, so the route
 * answers 400 without a stack trace reaching the visitor.
 */
export async function readJsonBody(request: Request, maxBytes = 8_192): Promise<unknown | null> {
  const declared = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declared) && declared > maxBytes) return null

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null

  let text: string
  try {
    text = await request.text()
  } catch {
    return null
  }
  if (text.length > maxBytes) return null

  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

/**
 * Security events are logged in a single, greppable shape and never include the
 * request body: a rejected checkout body is exactly the place a card number would
 * end up if someone posted one by mistake.
 */
export function logSecurityEvent(event: string, detail: Record<string, string | number>): void {
  console.warn('[security]', JSON.stringify({ event, ...detail }))
}
