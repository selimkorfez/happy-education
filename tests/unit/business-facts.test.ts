import { describe, expect, it } from 'vitest'
import {
  BLOCKED_CLAIMS,
  BUSINESS,
  IMMIGRATION_ADVICE_STATUS,
  SOCIAL,
  allVerified,
  pendingFacts,
  publicValue,
  type Fact,
} from '@/lib/business-facts'

/**
 * The rule this module exists to enforce: an unverified claim renders as nothing,
 * never as a placeholder and never as a guess. A regression here is not a display
 * bug, it is the site publishing something the company cannot evidence.
 */

describe('publicValue', () => {
  it('returns the value for a verified fact', () => {
    expect(publicValue(BUSINESS.legalName)).toBe('HAPPY EDUCATION CONSULTANCY LTD')
    expect(publicValue(BUSINESS.companyNumber)).toBe('11331426')
    expect(publicValue(BUSINESS.director)).toBe('Sefa Mutlu Koca')
    expect(publicValue(BUSINESS.foundedYear)).toBe('2018')
    expect(publicValue(BUSINESS.email)).toBe('admin@happyeducation.uk')
  })

  it('returns null for anything not verified', () => {
    expect(publicValue(BUSINESS.visitingOffice)).toBeNull()
    expect(publicValue(BUSINESS.istanbulOffice)).toBeNull()
  })

  it('returns null for a pending or refuted fact regardless of its value', () => {
    const pending: Fact = { value: 'Winner, Best Agency 2025', status: 'pending', source: 'x', checked: '2026-08-20' }
    const refuted: Fact = { value: '500+ students placed', status: 'refuted', source: 'x', checked: '2026-08-20' }
    expect(publicValue(pending)).toBeNull()
    expect(publicValue(refuted)).toBeNull()
  })

  it('preserves the value type for non-string facts', () => {
    const numeric: Fact<number> = { value: 2018, status: 'verified', source: 'x', checked: '2026-08-20' }
    const result: number | null = publicValue(numeric)
    expect(result).toBe(2018)
  })

  it('only ever returns a value when status is exactly "verified"', () => {
    for (const [key, fact] of Object.entries(BUSINESS)) {
      const typed = fact as Fact
      if (typed.status === 'verified') {
        expect(publicValue(typed), key).toBe(typed.value)
      } else {
        expect(publicValue(typed), key).toBeNull()
      }
    }
  })
})

describe('pendingFacts', () => {
  const pending = pendingFacts()

  it('lists the facts still blocking launch', () => {
    const keys = pending.map((fact) => fact.key).sort()
    expect(keys).toContain('visitingOffice')
    expect(keys).toContain('istanbulOffice')
  })

  it('excludes everything already verified', () => {
    const keys = pending.map((fact) => fact.key)
    for (const key of ['legalName', 'companyNumber', 'director', 'phone', 'email', 'registeredOffice']) {
      expect(keys, key).not.toContain(key)
    }
  })

  it('explains what still needs checking, so the launch checklist is actionable', () => {
    for (const fact of pending) {
      expect(fact.source.length, fact.key).toBeGreaterThan(20)
    }
  })

  it('reports the business record as not fully verified while anything is pending', () => {
    expect(allVerified(BUSINESS as unknown as Record<string, Fact<unknown>>)).toBe(
      pending.length === 0,
    )
    expect(pending.length).toBeGreaterThan(0)
  })

  it('treats an all-verified record as verified', () => {
    expect(
      allVerified({
        a: { value: 'x', status: 'verified', source: 's', checked: '2026-08-20' },
        b: { value: 'y', status: 'verified', source: 's', checked: '2026-08-20' },
      }),
    ).toBe(true)
  })
})

describe('verified facts match the Companies House record', () => {
  it('carries the exact registered name and number, not a similarly named company', () => {
    expect(publicValue(BUSINESS.legalName)).toBe('HAPPY EDUCATION CONSULTANCY LTD')
    expect(publicValue(BUSINESS.companyNumber)).toMatch(/^\d{8}$/)
  })

  it('records the registered office without calling it an office or headquarters', () => {
    const address = publicValue(BUSINESS.registeredOffice)
    expect(address).toContain('16 Upper Woburn Place')
    expect(address).toContain('WC1H 0AF')
    expect(address?.toLowerCase()).not.toMatch(/headquarters|head office/)
  })

  it('cites a source and a check date for every fact', () => {
    for (const [key, fact] of Object.entries(BUSINESS)) {
      const typed = fact as Fact
      expect(typed.source.length, key).toBeGreaterThan(10)
      expect(typed.checked, key).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})

describe('social profiles', () => {
  it('lists only verified profiles, over https', () => {
    expect(SOCIAL.length).toBeGreaterThan(0)
    for (const profile of SOCIAL) {
      expect(profile.status, profile.platform).toBe('verified')
      expect(profile.url, profile.platform).toMatch(/^https:\/\//)
    }
  })

  it('points at the accounts observed on the live site', () => {
    const urls = SOCIAL.map((profile) => profile.url).join(' ')
    expect(urls).toContain('instagram.com/happyeducationturkiye')
    expect(urls).toContain('facebook.com/HappyEdUK')
    expect(urls).toContain('linkedin.com/company/happyeducation')
  })
})

describe('blocked claims and regulated advice', () => {
  it('keeps a non-empty list of claims that must never be published', () => {
    expect(BLOCKED_CLAIMS.length).toBeGreaterThan(0)
    expect(BLOCKED_CLAIMS.length).toBeGreaterThanOrEqual(10)
  })

  it('covers every category the audit flagged', () => {
    const joined = BLOCKED_CLAIMS.join(' | ').toLowerCase()
    for (const topic of [
      'student',
      'universities',
      'countries',
      'rate',
      'years-of-experience',
      'british council',
      'oisc',
      'award',
      'review score',
      'headquarters',
    ]) {
      expect(joined, topic).toContain(topic)
    }
  })

  it('states that no immigration-advice registration is confirmed', () => {
    expect(IMMIGRATION_ADVICE_STATUS.registrationConfirmed).toBe(false)
    expect(IMMIGRATION_ADVICE_STATUS.regulator).toContain('Immigration Advice Authority')
    expect(IMMIGRATION_ADVICE_STATUS.note.toLowerCase()).toContain('administrative')
  })

  it('publishes no blocked figure through a verified fact', () => {
    const publishable = Object.values(BUSINESS)
      .map((fact) => fact as Fact)
      .filter((fact) => fact.status === 'verified')
      .map((fact) => String(fact.value))
      .join(' ')
    expect(publishable).not.toMatch(/\b\d{2,4}\s*\+/)
    expect(publishable.toLowerCase()).not.toMatch(/british council|icef|oisc|accredited/)
  })
})
