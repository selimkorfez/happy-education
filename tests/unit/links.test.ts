import { describe, expect, it } from 'vitest'
import { LINK_PROJECTION, resolveInternalHref, safeExternalHref } from '@/lib/links'

/**
 * `safeExternalHref` is a security control, not a formatter: the WordPress import
 * is exactly the kind of source that can carry a `javascript:` href, and an
 * anchor is all it takes to turn that into stored XSS. Every rejection case below
 * is a real bypass shape, including the whitespace and control-character tricks
 * that survive a naive `startsWith('javascript:')` check.
 */

describe('safeExternalHref: rejects script-bearing schemes', () => {
  const hostile = [
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    'javascript:alert(1)  ',
    '\tjavascript:alert(1)',
    '\njavascript:alert(1)',
    'java\nscript:alert(1)',
    'java\tscript:alert(1)',
    'java\rscript:alert(1)',
    'javascript:void(document.cookie)',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'data:text/html,<script>alert(1)</script>',
    'DATA:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'VBScript:msgbox(1)',
    'file:///etc/passwd',
    'blob:https://evil.example/1234',
    'about:blank',
    'chrome://settings',
    'ftp://files.example.com/x',
    'ws://evil.example',
  ]

  for (const href of hostile) {
    it(`rejects ${JSON.stringify(href)}`, () => {
      expect(safeExternalHref(href)).toBeNull()
    })
  }
})

describe('safeExternalHref: rejects protocol-relative and unparseable input', () => {
  const rejected = [
    '//evil.example/phish',
    '  //evil.example',
    '///evil.example',
    'not a url at all',
    'evil.example/path',
    'www.evil.example',
    '',
    '   ',
  ]

  for (const href of rejected) {
    it(`rejects ${JSON.stringify(href)}`, () => {
      expect(safeExternalHref(href)).toBeNull()
    })
  }

  it('rejects empty input of every nullish shape', () => {
    expect(safeExternalHref(null)).toBeNull()
    expect(safeExternalHref(undefined)).toBeNull()
  })
})

describe('safeExternalHref: accepts the schemes the site actually uses', () => {
  it('accepts http and https', () => {
    expect(safeExternalHref('https://www.gov.uk/student-visa')).toBe(
      'https://www.gov.uk/student-visa',
    )
    expect(safeExternalHref('http://example.com/path?q=1#frag')).toBe(
      'http://example.com/path?q=1#frag',
    )
    expect(safeExternalHref('https://example.com')).toMatch(/^https:\/\/example\.com\/?$/)
  })

  it('accepts mailto and tel for the published contact details', () => {
    expect(safeExternalHref('mailto:admin@happyeducation.uk')).toBe('mailto:admin@happyeducation.uk')
    expect(safeExternalHref('tel:+447735826785')).toBe('tel:+447735826785')
  })

  it('passes internal paths and fragments through untouched', () => {
    expect(safeExternalHref('/en/universities/united-kingdom')).toBe(
      '/en/universities/united-kingdom',
    )
    expect(safeExternalHref('/tr/universiteler')).toBe('/tr/universiteler')
    expect(safeExternalHref('#requirements')).toBe('#requirements')
    expect(safeExternalHref('  /en/about  ')).toBe('/en/about')
  })

  it('never returns a value whose scheme is outside the allowlist', () => {
    const inputs = [
      'https://example.com',
      'http://example.com',
      'mailto:a@b.co',
      'tel:+1',
      '/en',
      '#x',
      'javascript:alert(1)',
      '//evil.example',
    ]
    for (const input of inputs) {
      const result = safeExternalHref(input)
      if (result === null) continue
      const scheme = /^([a-z][a-z0-9+.-]*):/i.exec(result)?.[1]?.toLowerCase() ?? null
      expect(scheme === null || ['http', 'https', 'mailto', 'tel'].includes(scheme)).toBe(true)
    }
  })
})

describe('resolveInternalHref', () => {
  const cases: Array<[string, Record<string, unknown>, string, string]> = [
    ['article', { _type: 'article', slug: { current: 'student-visa-basics' } }, 'en', '/en/insights/student-visa-basics'],
    ['article (tr tree uses /blog)', { _type: 'article', slug: { current: 'ogrenci-vizesi' } }, 'tr', '/tr/blog/ogrenci-vizesi'],
    ['institution', { _type: 'institution', slug: { current: 'university-of-leeds' } }, 'en', '/en/universities/university-of-leeds'],
    ['languageSchool', { _type: 'languageSchool', slug: { current: 'ec-london' } }, 'en', '/en/language-schools/ec-london'],
    ['languageSchool (tr)', { _type: 'languageSchool', slug: { current: 'ec-london' } }, 'tr', '/tr/dil-okullari/ec-london'],
    ['boardingSchool', { _type: 'boardingSchool', slug: { current: 'bishopstrow' } }, 'en', '/en/boarding-schools/bishopstrow'],
    ['summerProgramme', { _type: 'summerProgramme', slug: { current: 'oxford-summer' } }, 'en', '/en/summer-schools/oxford-summer'],
    ['tour', { _type: 'tour', slug: { current: 'campus-tour' } }, 'tr', '/tr/turlar/campus-tour'],
    ['guide', { _type: 'guide', slug: { current: 'parent-guide' } }, 'en', '/en/student-guide/parent-guide'],
    ['service', { _type: 'service', slug: { current: 'application-support' } }, 'tr', '/tr/hizmetler/application-support'],
    ['legalPage', { _type: 'legalPage', slug: { current: 'privacy-policy' } }, 'en', '/en/legal/privacy-policy'],
    ['page', { _type: 'page', slug: { current: 'our-approach' } }, 'en', '/en/about/our-approach'],
  ]

  for (const [label, doc, locale, expected] of cases) {
    it(`resolves ${label}`, () => {
      expect(resolveInternalHref(locale as 'en' | 'tr', doc)).toBe(expected)
    })
  }

  it('accepts a plain string slug as well as a slug object', () => {
    expect(resolveInternalHref('en', { _type: 'article', slug: 'a-post' })).toBe('/en/insights/a-post')
  })

  it('unwraps a Portable Text annotation with a dereferenced reference', () => {
    expect(
      resolveInternalHref('tr', {
        reference: { _type: 'article', slug: { current: 'bir-yazi' } },
      }),
    ).toBe('/tr/blog/bir-yazi')
  })

  describe('destinations', () => {
    it('defaults to the universities tree when no section is set', () => {
      expect(resolveInternalHref('en', { _type: 'destination', slug: { current: 'ireland' } })).toBe(
        '/en/universities/ireland',
      )
    })

    it('follows the section recorded on the document', () => {
      expect(
        resolveInternalHref('en', {
          _type: 'destination',
          slug: { current: 'malta' },
          section: 'languageSchools',
        }),
      ).toBe('/en/language-schools/malta')
    })

    it('nests a city page under its parent country', () => {
      expect(
        resolveInternalHref('tr', {
          _type: 'destination',
          slug: { current: 'londra' },
          parentSlug: 'ingiltere',
          section: 'universities',
        }),
      ).toBe('/tr/universiteler/ingiltere/londra')
      expect(
        resolveInternalHref('en', {
          _type: 'destination',
          slug: { current: 'london' },
          parentSlug: 'united-kingdom',
          section: 'languageSchools',
        }),
      ).toBe('/en/language-schools/united-kingdom/london')
    })
  })

  describe('degradation', () => {
    it('returns null when the reference was never dereferenced', () => {
      expect(resolveInternalHref('en', null)).toBeNull()
      expect(resolveInternalHref('en', undefined)).toBeNull()
      expect(resolveInternalHref('en', {})).toBeNull()
      expect(resolveInternalHref('en', { reference: null })).toBeNull()
      // An undereferenced reference: the type is there, the slug never arrived.
      expect(resolveInternalHref('en', { _type: 'reference' })).toBeNull()
    })

    it('returns null when the slug is missing, so the renderer can fall back to text', () => {
      expect(resolveInternalHref('en', { _type: 'article' })).toBeNull()
      expect(resolveInternalHref('en', { _type: 'article', slug: {} })).toBeNull()
    })

    it('sends an unmapped document type to the locale home rather than a broken path', () => {
      expect(resolveInternalHref('en', { _type: 'teamMember', slug: { current: 'x' } })).toBe('/en')
      expect(resolveInternalHref('tr', { _type: 'partner', slug: { current: 'x' } })).toBe('/tr')
    })
  })
})

describe('LINK_PROJECTION', () => {
  it('projects every field resolveInternalHref reads', () => {
    for (const field of ['_type', 'slug', 'locale', 'section', 'parentSlug']) {
      expect(LINK_PROJECTION).toContain(field)
    }
  })
})

/**
 * SKIPPED because it fails today, and the fix belongs to `src/lib/links.ts`,
 * which this track does not own.
 *
 * `TYPE_SECTION` is an object literal, so a document whose `_type` happens to name
 * an `Object.prototype` member ('toString', 'constructor', '__proto__') resolves to
 * an inherited value instead of undefined. That value is truthy, so the
 * `if (!section)` fallback is skipped and `docPath` is called with a non-key, which
 * throws `TypeError: Cannot read properties of undefined` and takes down the render
 * of any page containing that link.
 *
 * Fix: `Object.create(null)` for the map, or an `Object.hasOwn` guard. Then unskip.
 */
describe('resolveInternalHref: prototype-inherited document types', () => {
  for (const type of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
    it(`falls back to the locale home for _type "${type}"`, () => {
      expect(resolveInternalHref('en', { _type: type, slug: { current: 'x' } })).toBe('/en')
    })
  }
})
