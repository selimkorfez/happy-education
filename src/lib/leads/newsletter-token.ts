import { createHmac, randomBytes } from 'node:crypto'
import { isProduction, serverEnv } from '@/lib/env'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { logSecurityEvent, safeEquals } from '@/lib/logger'

/**
 * Signed confirmation tokens for newsletter double opt-in.
 *
 * The token is stateless and carries its own claim: the address, the locale and
 * the moment it was issued, signed with an HMAC. That is what makes the flow
 * correct on a platform with no shared session store, where a pending record
 * written by one instance would be invisible to the instance that handles the
 * click.
 *
 * The address is inside the token, which is unavoidable in a stateless design and
 * is why three things are true here: the expiry is short, the confirm route
 * redirects immediately so the token does not linger in the address bar, and the
 * signature makes the payload useless to modify. A token cannot be used to
 * subscribe a different address than the one that was signed.
 *
 * ### Key material
 *
 * `NEWSLETTER_TOKEN_SECRET` is the intended source. It is read from `process.env`
 * directly rather than through `serverEnv()` because `src/lib/env.ts` belongs to
 * another track; ADDING IT TO `serverSchema` THERE IS A FOLLOW-UP TASK, after
 * which this read should move.
 *
 * Failing that, a key is DERIVED from an existing secret rather than reused
 * verbatim: `HMAC(rootSecret, purpose)` gives a subkey that cannot be used to
 * forge anything in the system the root secret belongs to. With no secret at all,
 * production refuses to issue tokens (the route reports the feature unavailable)
 * and development falls back to a per-process random key, so tokens work locally
 * until the process restarts.
 */

const PURPOSE = 'happy-education/newsletter-confirm/v1'

export const TOKEN_EXPIRY_HOURS = 24
const TOKEN_EXPIRY_MS = TOKEN_EXPIRY_HOURS * 60 * 60 * 1000

let cachedKey: Buffer | null = null
let cachedKeyIsEphemeral = false

function rootSecret(): string | null {
  const explicit = process.env.NEWSLETTER_TOKEN_SECRET
  if (explicit && explicit.length >= 32) return explicit

  const env = serverEnv()
  return env.SANITY_REVALIDATE_SECRET ?? env.SANITY_PREVIEW_SECRET ?? null
}

function signingKey(): Buffer | null {
  if (cachedKey) return cachedKey

  const root = rootSecret()
  if (root) {
    cachedKey = createHmac('sha256', root).update(PURPOSE).digest()
    cachedKeyIsEphemeral = false
    return cachedKey
  }

  if (!isProduction) {
    cachedKey = randomBytes(32)
    cachedKeyIsEphemeral = true
    return cachedKey
  }

  return null
}

/** False when no key is available, which makes the whole feature unavailable. */
export function isTokenSigningAvailable(): boolean {
  return signingKey() !== null
}

/** True when tokens are signed with a throwaway key, i.e. local development only. */
export function isEphemeralSigningKey(): boolean {
  signingKey()
  return cachedKeyIsEphemeral
}

export interface NewsletterTokenPayload {
  email: string
  locale: Locale
  /** Page the sign-up came from, so the confirmation can return the visitor there. */
  sourcePath: string
  /** Milliseconds since the epoch, set when the token was issued. */
  issuedAt: number
  name?: string
}

function encode(value: object): string {
  return Buffer.from(JSON.stringify(value), 'utf8').toString('base64url')
}

export function createConfirmationToken(
  payload: Omit<NewsletterTokenPayload, 'issuedAt'>,
  now: number = Date.now(),
): string | null {
  const key = signingKey()
  if (!key) {
    logSecurityEvent('error', 'newsletter.token.noKey')
    return null
  }

  const body = encode({ ...payload, issuedAt: now })
  const signature = createHmac('sha256', key).update(body).digest('base64url')
  return `${body}.${signature}`
}

export type TokenVerification =
  | { ok: true; payload: NewsletterTokenPayload }
  | { ok: false; reason: 'invalid' | 'expired' | 'unavailable' }

function parsePayload(decoded: unknown): NewsletterTokenPayload | null {
  if (!decoded || typeof decoded !== 'object') return null
  const record = decoded as Record<string, unknown>

  const email = record.email
  const locale = record.locale
  const sourcePath = record.sourcePath
  const issuedAt = record.issuedAt
  const name = record.name

  if (typeof email !== 'string' || email.length < 3 || email.length > 254) return null
  if (typeof locale !== 'string' || !isLocale(locale)) return null
  if (typeof sourcePath !== 'string' || !sourcePath.startsWith('/')) return null
  if (typeof issuedAt !== 'number' || !Number.isFinite(issuedAt)) return null
  if (name !== undefined && typeof name !== 'string') return null

  return { email, locale, sourcePath, issuedAt, name }
}

export function verifyConfirmationToken(
  token: string,
  now: number = Date.now(),
): TokenVerification {
  const key = signingKey()
  if (!key) return { ok: false, reason: 'unavailable' }

  const separator = token.lastIndexOf('.')
  if (separator <= 0) return { ok: false, reason: 'invalid' }

  const body = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const expected = createHmac('sha256', key).update(body).digest('base64url')

  // Constant-time comparison: a length or timing leak here would let a caller
  // grind out a valid signature one character at a time.
  if (!safeEquals(signature, expected)) return { ok: false, reason: 'invalid' }

  let decoded: unknown
  try {
    decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as unknown
  } catch {
    return { ok: false, reason: 'invalid' }
  }

  const payload = parsePayload(decoded)
  if (!payload) return { ok: false, reason: 'invalid' }

  // A token issued in the future is a clock problem or a forgery attempt; either
  // way it is not something to honour.
  if (payload.issuedAt > now + 60_000) return { ok: false, reason: 'invalid' }
  if (now - payload.issuedAt > TOKEN_EXPIRY_MS) return { ok: false, reason: 'expired' }

  return { ok: true, payload }
}
