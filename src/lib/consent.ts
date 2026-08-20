/**
 * Cookie consent model.
 *
 * PECR requires prior consent for any non-essential storage, and UK GDPR requires
 * that consent be as easy to refuse as to give. So:
 *   - nothing in `analytics` or `marketing` runs until explicitly allowed
 *   - the first banner layer carries Accept, Reject and Manage as equal actions
 *   - no category is pre-ticked
 *   - the choice is re-openable from the footer on every page
 *
 * The record is stored in a first-party cookie (not localStorage) so the server can
 * read it during SSR and avoid emitting tag markup for a visitor who has refused.
 */

export const CONSENT_COOKIE = 'he_consent'
export const CONSENT_VERSION = 1

/** Bump when the tag inventory changes materially; forces a fresh decision. */
export const CATEGORIES = ['essential', 'analytics', 'marketing'] as const
export type ConsentCategory = (typeof CATEGORIES)[number]

export interface ConsentRecord {
  v: number
  /** Essential is always true and is not user-controllable. */
  essential: true
  analytics: boolean
  marketing: boolean
  /** ISO timestamp of the decision, retained as proof of consent. */
  at: string
}

export const DENY_ALL: ConsentRecord = {
  v: CONSENT_VERSION,
  essential: true,
  analytics: false,
  marketing: false,
  at: '',
}

export function acceptAll(now: string): ConsentRecord {
  return { v: CONSENT_VERSION, essential: true, analytics: true, marketing: true, at: now }
}

export function rejectAll(now: string): ConsentRecord {
  return { v: CONSENT_VERSION, essential: true, analytics: false, marketing: false, at: now }
}

export function custom(
  now: string,
  choices: { analytics: boolean; marketing: boolean },
): ConsentRecord {
  return { v: CONSENT_VERSION, essential: true, ...choices, at: now }
}

/** Parses a cookie value, returning null when absent, malformed or from an old version. */
export function parseConsent(raw: string | undefined | null): ConsentRecord | null {
  if (!raw) return null
  try {
    const parsed: unknown = JSON.parse(decodeURIComponent(raw))
    if (typeof parsed !== 'object' || parsed === null) return null
    const record = parsed as Partial<ConsentRecord>
    if (record.v !== CONSENT_VERSION) return null
    if (typeof record.analytics !== 'boolean' || typeof record.marketing !== 'boolean') return null
    return {
      v: CONSENT_VERSION,
      essential: true,
      analytics: record.analytics,
      marketing: record.marketing,
      at: typeof record.at === 'string' ? record.at : '',
    }
  } catch {
    return null
  }
}

export function serialiseConsent(record: ConsentRecord): string {
  return encodeURIComponent(JSON.stringify(record))
}

/**
 * Cookie attributes. `SameSite=Lax` keeps the preference on top-level navigation
 * without exposing it to cross-site requests. Not HttpOnly, because the client
 * script must read it to decide whether to inject tags.
 */
export function consentCookieAttributes(isProduction: boolean): string {
  const parts = [
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${60 * 60 * 24 * 180}`, // six months, then we ask again
  ]
  if (isProduction) parts.push('Secure')
  return parts.join('; ')
}

/**
 * Maps our categories onto Google Consent Mode v2 signals. Used only when the
 * client has GTM configured; the site works fine with no analytics at all.
 */
export function toGoogleConsentMode(record: ConsentRecord) {
  return {
    ad_storage: record.marketing ? 'granted' : 'denied',
    ad_user_data: record.marketing ? 'granted' : 'denied',
    ad_personalization: record.marketing ? 'granted' : 'denied',
    analytics_storage: record.analytics ? 'granted' : 'denied',
    functionality_storage: 'granted',
    security_storage: 'granted',
  } as const
}
