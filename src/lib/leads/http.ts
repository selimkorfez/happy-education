import { isProduction, siteUrl } from '@/lib/env'
import type { RawSubmission } from './validation'

/**
 * Request-level helpers shared by the enquiry and newsletter routes.
 *
 * Kept out of the route files so the two endpoints cannot drift apart on the
 * checks that matter, and so each can be reasoned about on its own.
 */

/** Requests larger than this are refused unread. The largest legitimate field is 2000 characters. */
const MAX_BODY_BYTES = 32 * 1024

/** No submission has this many fields. A request that does is probing, not enquiring. */
const MAX_FIELDS = 40

/* -------------------------------------------------------------------------- */
/* Origin                                                                      */
/* -------------------------------------------------------------------------- */

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
 * `Origin` is sent by every current browser on a POST, including a plain HTML form
 * submission with no JavaScript, which is why the progressive-enhancement path
 * still passes. `Referer` is the fallback for the handful of agents that omit it.
 *
 * A request with neither header is refused in production. That is a real, if
 * small, cost: a privacy tool that strips both will block a genuine visitor. It is
 * accepted because the alternative is an endpoint any page on the internet can
 * post to, and this one sends email.
 *
 * `Sec-Fetch-Site` is consulted when present as a second, harder-to-forge signal.
 */
export function isSameOrigin(request: Request): boolean {
  const fetchSite = request.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return false

  const permitted = new Set<string>()
  const hostHeader = request.headers.get('host')?.toLowerCase()
  if (hostHeader) permitted.add(hostHeader)
  const configured = hostOf(siteUrl)
  if (configured) permitted.add(configured)

  const origin = hostOf(request.headers.get('origin'))
  if (origin) return permitted.has(origin)

  const referer = hostOf(request.headers.get('referer'))
  if (referer) return permitted.has(referer)

  // Neither header. Permitted locally so `curl` remains usable during development.
  return !isProduction
}

/* -------------------------------------------------------------------------- */
/* Client identity                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Best available client address, for rate limiting only.
 *
 * `x-forwarded-for` is trivially forged by a direct caller, so this is only sound
 * because the deployment terminates at a proxy (Vercel, and Cloudflare in front of
 * it per docs/DEPLOYMENT.md) that overwrites the header. If the app is ever served
 * without a proxy, this value becomes attacker-controlled and the limiter degrades
 * to a speed bump. The leftmost entry is the original client where the chain is
 * trustworthy; platform-specific headers are preferred over it where present.
 */
export function readClientIp(request: Request): string {
  const cloudflare = request.headers.get('cf-connecting-ip')
  if (cloudflare) return cloudflare.trim()

  const real = request.headers.get('x-real-ip')
  if (real) return real.trim()

  const forwarded = request.headers.get('x-forwarded-for')
  const first = forwarded?.split(',')[0]?.trim()
  if (first) return first

  return 'unknown'
}

/* -------------------------------------------------------------------------- */
/* Body                                                                        */
/* -------------------------------------------------------------------------- */

export type SubmissionOutcome =
  | { ok: true; submission: RawSubmission }
  | { ok: false; reason: 'unsupported-type' | 'too-large' | 'malformed' }

function flattenJson(parsed: unknown): RawSubmission | null {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const out: Record<string, string> = {}
  let count = 0
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (count >= MAX_FIELDS) return null
    // Scalars only. A nested object or array has no meaning in this form and is
    // the shape an injection attempt arrives in, so it is dropped rather than
    // stringified into something that looks like a value.
    if (typeof value === 'string') out[key] = value
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = String(value)
    else if (typeof value === 'boolean') out[key] = value ? 'true' : 'false'
    else if (value === null || value === undefined) continue
    else return null
    count += 1
  }
  return out
}

/**
 * Read a submission from either encoding.
 *
 * `application/x-www-form-urlencoded` is what a plain `<form method="post">` sends
 * and is therefore the no-JavaScript path; `application/json` is what the enhanced
 * form sends. `multipart/form-data` is deliberately NOT accepted: this site takes
 * no uploads, and refusing the encoding is a stronger guarantee than checking for
 * files after parsing.
 */
export async function readSubmission(request: Request): Promise<SubmissionOutcome> {
  const declaredLength = Number(request.headers.get('content-length') ?? '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return { ok: false, reason: 'too-large' }
  }

  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() ?? ''

  let body: string
  try {
    body = await request.text()
  } catch {
    return { ok: false, reason: 'malformed' }
  }

  if (body.length > MAX_BODY_BYTES) return { ok: false, reason: 'too-large' }

  if (contentType === 'application/json') {
    try {
      const flattened = flattenJson(JSON.parse(body) as unknown)
      if (!flattened) return { ok: false, reason: 'malformed' }
      return { ok: true, submission: flattened }
    } catch {
      return { ok: false, reason: 'malformed' }
    }
  }

  if (contentType === 'application/x-www-form-urlencoded') {
    const params = new URLSearchParams(body)
    const out: Record<string, string> = {}
    let count = 0
    for (const [key, value] of params) {
      if (count >= MAX_FIELDS) return { ok: false, reason: 'malformed' }
      // Last value wins on a repeated key, matching how a browser treats one.
      out[key] = value
      count += 1
    }
    return { ok: true, submission: out }
  }

  return { ok: false, reason: 'unsupported-type' }
}

/**
 * Whether to answer with JSON or with a redirect back to the page.
 *
 * The enhanced form sends JSON and reads JSON. A plain form submission navigates,
 * so it must be answered with a redirect or the visitor lands on a page of raw
 * JSON, which is the classic way progressive enhancement is claimed but not
 * delivered.
 */
export function prefersJson(request: Request): boolean {
  const accept = request.headers.get('accept') ?? ''
  if (accept.includes('application/json')) return true
  const contentType = request.headers.get('content-type') ?? ''
  return contentType.includes('application/json')
}

/**
 * Redirect target for the no-JavaScript path: back to the page that was submitted
 * from, carrying the outcome and an anchor so the visitor lands on the form.
 */
function isSafePath(value: string): boolean {
  return value.startsWith('/') && !value.startsWith('//') && !value.includes('..')
}

/**
 * Where the request came from, when the form could not say.
 *
 * A form rendered by a server component may not know its own path at render time,
 * so a submission with JavaScript disabled can arrive with `sourcePath` still at
 * the default. The `Referer` fills that gap. It is only consulted for the
 * PATHNAME, and only after `isSameOrigin` has already vouched for the request.
 */
function refererPath(request: Request): string | null {
  const referer = request.headers.get('referer')
  if (!referer) return null
  try {
    const path = new URL(referer).pathname
    return isSafePath(path) ? path : null
  } catch {
    return null
  }
}

export function statusRedirectUrl(
  request: Request,
  sourcePath: string,
  param: string,
  status: string,
  anchor?: string,
): URL {
  const declared = isSafePath(sourcePath) && sourcePath !== '/' ? sourcePath : null
  const safePath = declared ?? refererPath(request) ?? '/'
  const url = new URL(safePath, request.url)
  url.searchParams.set(param, status)
  if (anchor) url.hash = anchor
  return url
}
