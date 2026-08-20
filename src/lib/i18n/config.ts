/**
 * Locale and URL-segment registry.
 *
 * Happy Education runs two INDEPENDENT editorial trees, not a runtime translation
 * of one tree. English and Turkish content are separate documents in Sanity, linked
 * to each other by a `translationOf` reference so the language switcher can land on
 * the equivalent page instead of dumping the visitor on the homepage.
 *
 * Public URLs use localised segments throughout:
 *   /en/universities/united-kingdom
 *   /tr/universiteler/ingiltere
 *
 * `SECTIONS` is the single source of truth for that mapping. Nothing else in the
 * codebase should hard-code a URL segment — use `sectionPath()` / `buildPath()`.
 */

export const LOCALES = ['en', 'tr'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

/** BCP 47 tags used for `hreflang` and the `lang` attribute. */
export const HREFLANG: Record<Locale, string> = {
  en: 'en-GB',
  tr: 'tr-TR',
}

/** Human label for the language switcher, written in its own language. */
export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'English',
  tr: 'Türkçe',
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}

/**
 * Section keys are stable, locale-independent identifiers. They appear in Sanity
 * documents and in code. Only the *rendered segment* changes per locale.
 */
export const SECTION_KEYS = [
  'universities',
  'languageSchools',
  'summerSchools',
  'boardingSchools',
  'tours',
  'services',
  'guides',
  'insights',
  'about',
  'contact',
  'consultation',
  'search',
  'legal',
] as const

export type SectionKey = (typeof SECTION_KEYS)[number]

/**
 * Localised first-level URL segment per section.
 *
 * The Turkish segments intentionally mirror the slugs the current WordPress site
 * already ranks for (universiteler, dil-okullari, yaz-okullari), so the migration
 * preserves slug intent rather than inventing new Turkish paths.
 */
export const SECTIONS: Record<SectionKey, Record<Locale, string>> = {
  universities: { en: 'universities', tr: 'universiteler' },
  languageSchools: { en: 'language-schools', tr: 'dil-okullari' },
  summerSchools: { en: 'summer-schools', tr: 'yaz-okullari' },
  boardingSchools: { en: 'boarding-schools', tr: 'yatili-okullar' },
  tours: { en: 'tours', tr: 'turlar' },
  services: { en: 'services', tr: 'hizmetler' },
  guides: { en: 'student-guide', tr: 'ogrenci-rehberi' },
  insights: { en: 'insights', tr: 'blog' },
  about: { en: 'about', tr: 'hakkimizda' },
  contact: { en: 'contact', tr: 'iletisim' },
  consultation: { en: 'free-consultation', tr: 'ucretsiz-danismanlik' },
  search: { en: 'search', tr: 'arama' },
  legal: { en: 'legal', tr: 'yasal' },
}

/**
 * Reverse lookup: a URL segment in a given locale back to its section key.
 *
 * Built on null-prototype objects because the keys come straight from the URL.
 * A plain object literal inherits from Object.prototype, so a request for
 * /en/constructor or /en/toString would find an inherited function rather than
 * missing, and the caller's `?? null` would never fire.
 */
const SEGMENT_TO_SECTION: Record<Locale, Record<string, SectionKey>> = (() => {
  const out = Object.create(null) as Record<Locale, Record<string, SectionKey>>
  for (const locale of LOCALES) {
    out[locale] = Object.create(null) as Record<string, SectionKey>
  }
  for (const key of SECTION_KEYS) {
    for (const locale of LOCALES) {
      out[locale][SECTIONS[key][locale]] = key
    }
  }
  return out
})()

export function sectionFromSegment(locale: Locale, segment: string): SectionKey | null {
  const table = SEGMENT_TO_SECTION[locale]
  // Own-property check as well as the null prototype: belt and braces, since this
  // is the entry point for every untrusted URL on the site.
  if (!Object.hasOwn(table, segment)) return null
  return table[segment] ?? null
}

/** The localised segment for a section, e.g. sectionSegment('tr','universities') -> 'universiteler'. */
export function sectionSegment(locale: Locale, key: SectionKey): string {
  return SECTIONS[key][locale]
}

/**
 * Build an absolute-from-root path. Always leading-slashed, never trailing-slashed
 * (except the locale home). Empty/undefined parts are dropped so callers can pass
 * optional slugs without guarding.
 */
export function buildPath(locale: Locale, ...parts: Array<string | undefined | null>): string {
  const clean = parts
    .filter((p): p is string => typeof p === 'string' && p.length > 0)
    .map((p) => p.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
  return `/${locale}${clean.length ? `/${clean.join('/')}` : ''}`
}

/** Path to a section index, e.g. sectionPath('tr','universities') -> '/tr/universiteler'. */
export function sectionPath(locale: Locale, key: SectionKey): string {
  return buildPath(locale, sectionSegment(locale, key))
}

/** Path to a document inside a section. */
export function docPath(
  locale: Locale,
  key: SectionKey,
  ...slugs: Array<string | undefined | null>
): string {
  return buildPath(locale, sectionSegment(locale, key), ...slugs)
}

/** The locale home page. */
export function homePath(locale: Locale): string {
  return `/${locale}`
}
