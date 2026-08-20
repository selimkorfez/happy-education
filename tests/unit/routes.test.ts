import { describe, expect, it } from 'vitest'
import { LOCALES, SECTION_KEYS, isLocale, sectionFromSegment, sectionPath } from '@/lib/i18n/config'
import { LEGAL_PAGES, legalLabel, legalLinks, legalPath, legalSlug, type LegalKey } from '@/lib/legal'
import { countryLabel, countrySlug, footerNav, primaryNav } from '@/lib/navigation'

/**
 * Every href the chrome renders is generated, not typed by hand. These assertions
 * check the generated set as a whole: one malformed path in the footer is a broken
 * link on every page of the site, in both trees.
 */

function assertWellFormedPath(path: string, label: string) {
  expect(path.startsWith('/'), `${label}: ${path}`).toBe(true)
  expect(path, label).not.toMatch(/\/\//)
  expect(path, label).not.toMatch(/\s/)
  expect(path.endsWith('/'), `${label}: ${path}`).toBe(false)
  const first = path.split('/')[1] ?? ''
  expect(isLocale(first), `${label}: ${path}`).toBe(true)
}

describe('primary navigation', () => {
  for (const locale of LOCALES) {
    describe(locale, () => {
      const groups = primaryNav(locale)

      it('renders a non-trivial set of groups', () => {
        expect(groups.length).toBeGreaterThanOrEqual(5)
      })

      it('gives every group and child a labelled, well-formed link in this locale', () => {
        for (const group of groups) {
          expect(group.label.trim().length, group.key).toBeGreaterThan(0)
          assertWellFormedPath(group.href, `${locale} ${group.key}`)
          for (const child of group.children ?? []) {
            expect(child.label.trim().length, `${group.key} child`).toBeGreaterThan(0)
            assertWellFormedPath(child.href, `${locale} ${group.key} > ${child.label}`)
          }
        }
      })

      it('points every group at a section that exists in the registry', () => {
        for (const group of groups) {
          const segment = group.href.split('/')[2] ?? ''
          expect(sectionFromSegment(locale, segment), `${group.key} -> ${segment}`).not.toBeNull()
        }
      })

      it('has no duplicate hrefs', () => {
        const hrefs = groups.flatMap((group) => [
          group.href,
          ...(group.children ?? []).map((child) => child.href),
        ])
        const duplicates = hrefs.filter((href, i) => hrefs.indexOf(href) !== i)
        expect(duplicates).toEqual([])
      })

      it('nests every child under its own group', () => {
        for (const group of groups) {
          for (const child of group.children ?? []) {
            const groupSegment = group.href.split('/')[2] ?? ''
            const childSegment = child.href.split('/')[2] ?? ''
            // Summer schools link out to a parent guide by design; otherwise a
            // child belongs to its parent's section.
            expect([groupSegment, 'student-guide', 'ogrenci-rehberi']).toContain(childSegment)
          }
        }
      })
    })
  }

  it('produces the same group structure in both locales', () => {
    expect(primaryNav('tr').map((group) => group.key)).toEqual(
      primaryNav('en').map((group) => group.key),
    )
  })

  it('translates every group label', () => {
    const english = primaryNav('en')
    const turkish = primaryNav('tr')
    english.forEach((group, index) => {
      const other = turkish[index]
      expect(other?.key).toBe(group.key)
      expect(other?.href).not.toBe(group.href)
    })
  })
})

describe('country slugs', () => {
  it('keeps the Turkish slugs the legacy site ranks for', () => {
    expect(countrySlug('tr', 'uk')).toBe('ingiltere')
    expect(countrySlug('tr', 'usa')).toBe('amerika')
    expect(countrySlug('en', 'uk')).toBe('united-kingdom')
  })

  it('labels countries in their own language', () => {
    expect(countryLabel('tr', 'uk')).toBe('İngiltere')
    expect(countryLabel('en', 'uk')).toBe('United Kingdom')
  })
})

describe('footer navigation', () => {
  for (const locale of LOCALES) {
    it(`emits well-formed ${locale} footer links`, () => {
      const footer = footerNav(locale)
      for (const link of [...footer.explore, ...footer.company]) {
        expect(link.label.trim().length).toBeGreaterThan(0)
        assertWellFormedPath(link.href, `${locale} footer ${link.label}`)
      }
    })
  }
})

describe('legal registry', () => {
  it('lists the full set of documents the footer promises', () => {
    expect(LEGAL_PAGES.length).toBeGreaterThanOrEqual(10)
    const keys = LEGAL_PAGES.map((page) => page.key)
    for (const required of ['privacy', 'cookies', 'terms', 'refunds', 'complaints', 'safeguarding']) {
      expect(keys).toContain(required)
    }
  })

  it('has unique keys and unique slugs in both locales', () => {
    const keys = LEGAL_PAGES.map((page) => page.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const locale of LOCALES) {
      const slugs = LEGAL_PAGES.map((page) => page[locale])
      expect(new Set(slugs).size, locale).toBe(slugs.length)
    }
  })

  it('builds a well-formed, localised path and label for every document', () => {
    for (const locale of LOCALES) {
      for (const { key } of LEGAL_PAGES) {
        const typed = key as LegalKey
        const path = legalPath(locale, typed)
        assertWellFormedPath(path, `${locale} legal ${key}`)
        expect(path).toBe(`${sectionPath(locale, 'legal')}/${legalSlug(locale, typed)}`)
        expect(legalLabel(locale, typed).trim().length, `${locale} ${key}`).toBeGreaterThan(0)
      }
    }
  })

  it('uses different slugs and labels per locale', () => {
    expect(legalPath('en', 'privacy')).toBe('/en/legal/privacy-policy')
    expect(legalPath('tr', 'privacy')).toBe('/tr/yasal/gizlilik-politikasi')
    expect(legalLabel('tr', 'cookies')).toBe('Çerez Politikası')
  })

  it('returns the same set through legalLinks', () => {
    for (const locale of LOCALES) {
      const links = legalLinks(locale)
      expect(links.length).toBe(LEGAL_PAGES.length)
      for (const link of links) {
        expect(link.href).toBe(legalPath(locale, link.key))
        expect(link.label).toBe(legalLabel(locale, link.key))
      }
    }
  })

  it('throws on an unknown legal key rather than emitting a broken path', () => {
    expect(() => legalSlug('en', 'not-a-page' as LegalKey)).toThrow()
  })
})

describe('section coverage', () => {
  /**
   * Sections with no link from the generated chrome.
   *
   * `search` is deliberate: it is noindex, and the header carries the search
   * control rather than a link to the results page.
   *
   * `guides` and `services` are NOT deliberate. Both have a section index in the
   * registry, both are linked to from inside other pages, and neither is reachable
   * from the header or the footer, so a visitor cannot browse to them and a
   * crawler only finds them through body copy. Whichever track lands those index
   * pages should add them to `primaryNav` or `footerNav` and shrink this list.
   */
  const KNOWN_UNLINKED = ['guides', 'search', 'services']

  it('reaches every section from the chrome or the legal registry', () => {
    const linked = new Set<string>()
    for (const locale of LOCALES) {
      for (const group of primaryNav(locale)) linked.add(group.href.split('/')[2] ?? '')
      const footer = footerNav(locale)
      for (const link of [...footer.explore, ...footer.company]) {
        linked.add(link.href.split('/')[2] ?? '')
      }
      linked.add(legalPath(locale, 'privacy').split('/')[2] ?? '')
    }

    const unlinked = SECTION_KEYS.filter((key) =>
      LOCALES.every((locale) => !linked.has(sectionPath(locale, key).split('/')[2] ?? '')),
    )

    // Nothing new may fall out of the navigation.
    expect(unlinked.filter((key) => !KNOWN_UNLINKED.includes(key))).toEqual([])

    // The commercially important sections are always reachable.
    for (const key of ['universities', 'languageSchools', 'summerSchools', 'boardingSchools', 'tours', 'insights', 'about', 'contact', 'consultation'] as const) {
      expect(unlinked, key).not.toContain(key)
    }
  })
})
