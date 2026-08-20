import { describe, expect, it } from 'vitest'
import {
  CATEGORIES,
  CONSENT_COOKIE,
  CONSENT_VERSION,
  DENY_ALL,
  acceptAll,
  consentCookieAttributes,
  custom,
  parseConsent,
  rejectAll,
  serialiseConsent,
  toGoogleConsentMode,
  type ConsentRecord,
} from '@/lib/consent'

/**
 * PECR requires prior consent for non-essential storage, so the failure mode that
 * matters here is a parser that returns something permissive when it should return
 * null. Every malformed, stale or hostile cookie below must degrade to "no
 * decision yet", which the UI treats as deny-and-ask.
 */

const NOW = '2026-08-20T10:30:00.000Z'

describe('consent model', () => {
  it('names the cookie and pins a version', () => {
    expect(CONSENT_COOKIE).toBe('he_consent')
    expect(CONSENT_VERSION).toBeGreaterThanOrEqual(1)
    expect([...CATEGORIES]).toEqual(['essential', 'analytics', 'marketing'])
  })

  it('denies both optional categories by default', () => {
    expect(DENY_ALL.analytics).toBe(false)
    expect(DENY_ALL.marketing).toBe(false)
    expect(DENY_ALL.essential).toBe(true)
    expect(DENY_ALL.v).toBe(CONSENT_VERSION)
  })

  it('builds accept, reject and custom records that always keep essential on', () => {
    expect(acceptAll(NOW)).toEqual({
      v: CONSENT_VERSION,
      essential: true,
      analytics: true,
      marketing: true,
      at: NOW,
    })
    expect(rejectAll(NOW)).toEqual({
      v: CONSENT_VERSION,
      essential: true,
      analytics: false,
      marketing: false,
      at: NOW,
    })
    expect(custom(NOW, { analytics: true, marketing: false })).toEqual({
      v: CONSENT_VERSION,
      essential: true,
      analytics: true,
      marketing: false,
      at: NOW,
    })
  })

  it('records the decision timestamp as proof of consent', () => {
    expect(acceptAll(NOW).at).toBe(NOW)
    expect(new Date(rejectAll(NOW).at).toISOString()).toBe(NOW)
  })
})

describe('serialise and parse', () => {
  const records: ConsentRecord[] = [
    acceptAll(NOW),
    rejectAll(NOW),
    custom(NOW, { analytics: true, marketing: false }),
    custom(NOW, { analytics: false, marketing: true }),
  ]

  for (const record of records) {
    it(`round-trips analytics=${record.analytics} marketing=${record.marketing}`, () => {
      expect(parseConsent(serialiseConsent(record))).toEqual(record)
    })
  }

  it('produces a cookie-safe value with no separators that would truncate it', () => {
    const encoded = serialiseConsent(acceptAll(NOW))
    expect(encoded).not.toMatch(/[;,\s"]/)
  })

  it('treats an absent cookie as no decision', () => {
    expect(parseConsent(undefined)).toBeNull()
    expect(parseConsent(null)).toBeNull()
    expect(parseConsent('')).toBeNull()
  })

  it('rejects a record from an older or newer version', () => {
    const stale = serialiseConsent({ ...acceptAll(NOW), v: CONSENT_VERSION - 1 })
    const future = serialiseConsent({ ...acceptAll(NOW), v: CONSENT_VERSION + 1 })
    expect(parseConsent(stale)).toBeNull()
    expect(parseConsent(future)).toBeNull()
  })

  it('rejects malformed JSON', () => {
    for (const raw of ['{', 'not-json', '{"v":1,', '%7B%22v%22%3A1', '[1,2,3']) {
      expect(parseConsent(raw), raw).toBeNull()
    }
  })

  it('rejects broken percent-encoding without throwing', () => {
    expect(parseConsent('%E0%A4%A')).toBeNull()
    expect(parseConsent('%')).toBeNull()
  })

  it('rejects JSON that is not an object', () => {
    for (const raw of ['null', '42', '"granted"', 'true', '[]']) {
      expect(parseConsent(encodeURIComponent(raw)), raw).toBeNull()
    }
  })

  it('rejects a record whose category flags are not booleans', () => {
    const payloads = [
      { v: CONSENT_VERSION, analytics: 'true', marketing: false },
      { v: CONSENT_VERSION, analytics: true, marketing: 'yes' },
      { v: CONSENT_VERSION, analytics: 1, marketing: 0 },
      { v: CONSENT_VERSION, marketing: false },
      { v: CONSENT_VERSION },
    ]
    for (const payload of payloads) {
      expect(parseConsent(encodeURIComponent(JSON.stringify(payload)))).toBeNull()
    }
  })

  it('forces essential on even if the cookie says otherwise', () => {
    const tampered = encodeURIComponent(
      JSON.stringify({ v: CONSENT_VERSION, essential: false, analytics: false, marketing: false, at: NOW }),
    )
    expect(parseConsent(tampered)?.essential).toBe(true)
  })

  it('never grants a category the cookie did not grant', () => {
    const parsed = parseConsent(serialiseConsent(rejectAll(NOW)))
    expect(parsed?.analytics).toBe(false)
    expect(parsed?.marketing).toBe(false)
  })

  it('tolerates a missing timestamp', () => {
    const raw = encodeURIComponent(
      JSON.stringify({ v: CONSENT_VERSION, analytics: true, marketing: true }),
    )
    expect(parseConsent(raw)).toEqual({
      v: CONSENT_VERSION,
      essential: true,
      analytics: true,
      marketing: true,
      at: '',
    })
  })
})

describe('cookie attributes', () => {
  it('scopes the cookie to the whole site, same-site, for six months', () => {
    const attrs = consentCookieAttributes(false)
    expect(attrs).toContain('Path=/')
    expect(attrs).toContain('SameSite=Lax')
    expect(attrs).toContain(`Max-Age=${60 * 60 * 24 * 180}`)
  })

  it('adds Secure only in production', () => {
    expect(consentCookieAttributes(true)).toContain('Secure')
    expect(consentCookieAttributes(false)).not.toContain('Secure')
  })

  it('is not HttpOnly, because the client must read it before injecting tags', () => {
    expect(consentCookieAttributes(true)).not.toContain('HttpOnly')
  })
})

describe('Google Consent Mode v2 mapping', () => {
  it('denies advertising and analytics signals before any decision', () => {
    expect(toGoogleConsentMode(DENY_ALL)).toEqual({
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      analytics_storage: 'denied',
      functionality_storage: 'granted',
      security_storage: 'granted',
    })
  })

  it('grants everything after accept-all', () => {
    expect(toGoogleConsentMode(acceptAll(NOW))).toEqual({
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      security_storage: 'granted',
    })
  })

  it('maps the categories independently', () => {
    const analyticsOnly = toGoogleConsentMode(custom(NOW, { analytics: true, marketing: false }))
    expect(analyticsOnly.analytics_storage).toBe('granted')
    expect(analyticsOnly.ad_storage).toBe('denied')
    expect(analyticsOnly.ad_user_data).toBe('denied')
    expect(analyticsOnly.ad_personalization).toBe('denied')

    const marketingOnly = toGoogleConsentMode(custom(NOW, { analytics: false, marketing: true }))
    expect(marketingOnly.analytics_storage).toBe('denied')
    expect(marketingOnly.ad_storage).toBe('granted')
  })

  it('keeps security and functionality signals granted in every state', () => {
    for (const record of [DENY_ALL, acceptAll(NOW), rejectAll(NOW)]) {
      const mapped = toGoogleConsentMode(record)
      expect(mapped.security_storage).toBe('granted')
      expect(mapped.functionality_storage).toBe('granted')
    }
  })
})
