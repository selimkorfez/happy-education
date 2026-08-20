import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  HREFLANG,
  LOCALES,
  LOCALE_LABEL,
  SECTIONS,
  SECTION_KEYS,
  buildPath,
  docPath,
  homePath,
  isLocale,
  sectionFromSegment,
  sectionPath,
  sectionSegment,
  type Locale,
} from '@/lib/i18n/config'

/**
 * The URL registry is the spine of a bilingual site with two independent
 * editorial trees. A collision or a broken round-trip here does not throw; it
 * silently sends a visitor (or a crawler) to the wrong tree, so these are the
 * cheapest high-value assertions in the suite.
 */

describe('locale primitives', () => {
  it('exposes exactly the two supported locales', () => {
    expect([...LOCALES]).toEqual(['en', 'tr'])
    expect(LOCALES).toContain(DEFAULT_LOCALE)
  })

  it('narrows only real locale codes', () => {
    expect(isLocale('en')).toBe(true)
    expect(isLocale('tr')).toBe(true)
    for (const value of ['EN', 'en-GB', 'de', '', ' en', 'tr/', 'enn']) {
      expect(isLocale(value)).toBe(false)
    }
  })

  it('gives every locale a BCP 47 tag and a label written in its own language', () => {
    expect(HREFLANG.en).toBe('en-GB')
    expect(HREFLANG.tr).toBe('tr-TR')
    for (const locale of LOCALES) {
      expect(HREFLANG[locale]).toMatch(/^[a-z]{2}-[A-Z]{2}$/)
      expect(LOCALE_LABEL[locale].length).toBeGreaterThan(0)
    }
    expect(LOCALE_LABEL.tr).toBe('Türkçe')
  })
})

describe('section registry', () => {
  it('defines every section in every locale with a URL-safe segment', () => {
    for (const key of SECTION_KEYS) {
      for (const locale of LOCALES) {
        const segment = SECTIONS[key][locale]
        expect(segment, `${key}/${locale}`).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      }
    }
  })

  it('never lets two sections share a segment within a locale', () => {
    for (const locale of LOCALES) {
      const segments = SECTION_KEYS.map((key) => sectionSegment(locale, key))
      const duplicates = segments.filter((segment, i) => segments.indexOf(segment) !== i)
      expect(duplicates, `duplicate segments in ${locale}`).toEqual([])
      expect(new Set(segments).size).toBe(SECTION_KEYS.length)
    }
  })

  it('keeps the English and Turkish segment namespaces disjoint', () => {
    // A segment valid in both trees would make `sectionFromSegment` ambiguous for
    // anything that has to guess the locale, such as the redirect map.
    const english = new Set(SECTION_KEYS.map((key) => sectionSegment('en', key)))
    const overlap = SECTION_KEYS.map((key) => sectionSegment('tr', key)).filter((segment) =>
      english.has(segment),
    )
    expect(overlap).toEqual([])
  })

  it('round-trips segment to section and back for every locale', () => {
    for (const locale of LOCALES) {
      for (const key of SECTION_KEYS) {
        expect(sectionFromSegment(locale, sectionSegment(locale, key))).toBe(key)
      }
    }
  })

  it('resolves a segment only in the locale that owns it', () => {
    expect(sectionFromSegment('tr', 'universiteler')).toBe('universities')
    expect(sectionFromSegment('en', 'universiteler')).toBeNull()
    expect(sectionFromSegment('tr', 'universities')).toBeNull()
    expect(sectionFromSegment('en', 'blog')).toBeNull()
    expect(sectionFromSegment('tr', 'blog')).toBe('insights')
  })

  it('returns null rather than throwing for an unknown segment', () => {
    for (const segment of ['', '..', 'wp-content', 'anasayfa', 'universities-2', 'UNIVERSITIES']) {
      expect(sectionFromSegment('en', segment), segment).toBeNull()
      expect(sectionFromSegment('tr', segment), segment).toBeNull()
    }
  })

  /**
   * SKIPPED because it fails today, and the fix belongs to `src/lib/i18n/config.ts`,
   * which this track does not own.
   *
   * The reverse lookup is built on an object literal, so it inherits every member
   * of `Object.prototype`. `sectionFromSegment('en', 'constructor')` therefore
   * returns a Function, and `'__proto__'` returns Object.prototype, both of which
   * are truthy and pass the `if (!section)` guards downstream.
   *
   * Live impact: GET /api/locale?to=tr&from=/en/constructor/x reaches
   * `sectionSegment(to, section)` with a non-key, evaluates `SECTIONS[key][locale]`
   * on undefined and throws, turning a crafted URL into a 500.
   *
   * Fix: build the lookup with `Object.create(null)`, or guard the return with
   * `Object.hasOwn(SEGMENT_TO_SECTION[locale], segment)`. Then unskip this test.
   */
  it('returns null for inherited Object.prototype keys', () => {
    for (const segment of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf']) {
      expect(sectionFromSegment('en', segment), segment).toBeNull()
      expect(sectionFromSegment('tr', segment), segment).toBeNull()
    }
  })

  it('keeps the Turkish slugs the legacy site already ranks for', () => {
    expect(sectionSegment('tr', 'universities')).toBe('universiteler')
    expect(sectionSegment('tr', 'languageSchools')).toBe('dil-okullari')
    expect(sectionSegment('tr', 'summerSchools')).toBe('yaz-okullari')
  })
})

describe('buildPath', () => {
  it('returns the locale root when given no usable parts', () => {
    expect(buildPath('en')).toBe('/en')
    expect(buildPath('tr')).toBe('/tr')
    expect(buildPath('en', '')).toBe('/en')
    expect(buildPath('en', undefined)).toBe('/en')
    expect(buildPath('en', null)).toBe('/en')
    expect(buildPath('en', undefined, '', null)).toBe('/en')
    expect(buildPath('en', '/')).toBe('/en')
    expect(buildPath('en', '///')).toBe('/en')
  })

  it('strips leading and trailing slashes from every part', () => {
    expect(buildPath('en', '/about')).toBe('/en/about')
    expect(buildPath('en', 'about/')).toBe('/en/about')
    expect(buildPath('en', '/about/')).toBe('/en/about')
    expect(buildPath('en', '//about//')).toBe('/en/about')
    expect(buildPath('en', '/a/', '/b/')).toBe('/en/a/b')
  })

  it('preserves interior slashes so a nested slug can be passed as one part', () => {
    expect(buildPath('tr', 'universiteler/ingiltere')).toBe('/tr/universiteler/ingiltere')
  })

  it('never emits a double slash or a trailing slash', () => {
    const paths = [
      buildPath('en', '/a/', '', undefined, '/b'),
      buildPath('tr', 'a', 'b', 'c'),
      buildPath('en'),
    ]
    for (const path of paths) {
      expect(path.startsWith('/')).toBe(true)
      expect(path).not.toMatch(/\/\//)
      expect(path === '/en' || path === '/tr' || !path.endsWith('/')).toBe(true)
    }
  })
})

describe('sectionPath, docPath and homePath', () => {
  it('builds section indexes in the right tree', () => {
    expect(sectionPath('en', 'universities')).toBe('/en/universities')
    expect(sectionPath('tr', 'universities')).toBe('/tr/universiteler')
    expect(sectionPath('en', 'guides')).toBe('/en/student-guide')
    expect(sectionPath('tr', 'guides')).toBe('/tr/ogrenci-rehberi')
    expect(sectionPath('tr', 'consultation')).toBe('/tr/ucretsiz-danismanlik')
  })

  it('builds document paths, including nested city pages', () => {
    expect(docPath('en', 'universities', 'united-kingdom')).toBe('/en/universities/united-kingdom')
    expect(docPath('tr', 'universities', 'ingiltere', 'londra')).toBe(
      '/tr/universiteler/ingiltere/londra',
    )
    expect(docPath('en', 'insights', 'a-post')).toBe('/en/insights/a-post')
    expect(docPath('tr', 'insights', 'bir-yazi')).toBe('/tr/blog/bir-yazi')
  })

  it('degrades to the section index when the slug is missing', () => {
    expect(docPath('en', 'universities')).toBe('/en/universities')
    expect(docPath('en', 'universities', undefined)).toBe('/en/universities')
    expect(docPath('en', 'universities', null, '')).toBe('/en/universities')
    expect(docPath('tr', 'universities', undefined, 'londra')).toBe('/tr/universiteler/londra')
  })

  it('equals sectionPath for a slugless document path', () => {
    for (const locale of LOCALES) {
      for (const key of SECTION_KEYS) {
        expect(docPath(locale, key)).toBe(sectionPath(locale, key))
      }
    }
  })

  it('builds the locale home', () => {
    expect(homePath('en')).toBe('/en')
    expect(homePath('tr')).toBe('/tr')
  })

  it('prefixes every generated path with a valid locale', () => {
    for (const locale of LOCALES) {
      for (const key of SECTION_KEYS) {
        const path = sectionPath(locale, key)
        const first = path.split('/')[1] ?? ''
        expect(isLocale(first)).toBe(true)
        expect(first as Locale).toBe(locale)
      }
    }
  })
})
