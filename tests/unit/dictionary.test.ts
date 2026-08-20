import { describe, expect, it } from 'vitest'
import { LOCALES } from '@/lib/i18n/config'
import { t, translator, type MessageKey } from '@/lib/i18n/dictionary'
import { readSourceFile } from './helpers/source'

/**
 * The dictionary objects are not exported, and deliberately so: `t()` is the only
 * supported way in. The key list is therefore recovered from the source text and
 * every value is read back through the public API, which means these tests fail if
 * either the English or the Turkish half drifts.
 *
 * TypeScript already makes a missing Turkish key a compile error. What it cannot
 * catch is a Turkish value that is still English, an empty string, or copy that
 * breaks the project's house style.
 */

const DICTIONARY_PATH = 'src/lib/i18n/dictionary.ts'
const source = readSourceFile(DICTIONARY_PATH).text

function keysIn(block: string): string[] {
  return [...block.matchAll(/^\s+'([A-Za-z0-9._]+)':/gm)].map((match) => match[1] ?? '')
}

const [englishBlock = '', turkishBlock = ''] = source.split(/^const tr\b[^\n]*\{$/m)
const englishKeys = keysIn(englishBlock)
const turkishKeys = keysIn(turkishBlock)

/**
 * Keys whose two locales are legitimately identical. Anything else matching across
 * locales is almost certainly an untranslated string pasted into `tr`.
 */
const IDENTICAL_BY_DESIGN = new Set<string>([
  // A registered trading name is not translated.
  'brand.name',
])

/**
 * Values that are the same in both languages because they are proper nouns or
 * international abbreviations. Matched on the value rather than the key, so a new
 * key carrying one of these does not need adding to a list.
 */
const PROPER_NOUNS = new Set<string>([
  'happy education',
  'whatsapp',
  'instagram',
  'facebook',
  'linkedin',
  'stripe',
  'e-mail',
  'sms',
  'ielts',
  'toefl',
  'ucas',
  'pdf',
])

describe('dictionary shape', () => {
  it('parses a non-trivial key list out of both locale blocks', () => {
    expect(englishBlock).toContain("'nav.universities'")
    expect(englishKeys.length).toBeGreaterThan(50)
    expect(turkishKeys.length).toBe(englishKeys.length)
  })

  it('declares every key in both locales, in the same order', () => {
    expect(turkishKeys).toEqual(englishKeys)
  })

  it('has no duplicate keys within a locale', () => {
    for (const [locale, keys] of [
      ['en', englishKeys],
      ['tr', turkishKeys],
    ] as const) {
      const duplicates = keys.filter((key, i) => keys.indexOf(key) !== i)
      expect(duplicates, `duplicate keys in ${locale}`).toEqual([])
    }
  })

  it('resolves every key through t() in every locale', () => {
    for (const key of englishKeys) {
      for (const locale of LOCALES) {
        const value = t(locale, key as MessageKey)
        expect(typeof value, `${locale}:${key}`).toBe('string')
        expect(value.trim().length, `${locale}:${key} is empty`).toBeGreaterThan(0)
      }
    }
  })

  it('binds the locale once through translator()', () => {
    const tr = translator('tr')
    expect(tr('nav.universities')).toBe(t('tr', 'nav.universities'))
    expect(translator('en')('nav.universities')).toBe('Universities')
  })
})

describe('Turkish is written as Turkish', () => {
  it('never leaves an English string in the Turkish dictionary', () => {
    const untranslated = englishKeys.filter((key) => {
      if (IDENTICAL_BY_DESIGN.has(key)) return false
      const english = t('en', key as MessageKey)
      if (english !== t('tr', key as MessageKey)) return false
      return !PROPER_NOUNS.has(english.trim().toLowerCase())
    })
    expect(untranslated).toEqual([])
  })

  it('uses Turkish phrasing rather than a transliteration for the consultation CTA', () => {
    // Documented intent in the dictionary header: a first appointment is an
    // "on gorusme" in Turkish agency language, not a literal "danismanlik
    // rezervasyonu" calqued from the English.
    const turkish = t('tr', 'nav.consultation')
    expect(turkish).toMatch(/görüşme/i)
    expect(turkish).not.toMatch(/rezervasyon/i)
    expect(turkish).not.toBe(t('en', 'nav.consultation'))
  })

  it('carries Turkish diacritics somewhere in the Turkish copy', () => {
    const joined = englishKeys.map((key) => t('tr', key as MessageKey)).join(' ')
    expect(joined).toMatch(/[ğışçöüİĞŞÇÖÜ]/)
  })
})

describe('house style', () => {
  const values = englishKeys.flatMap((key) =>
    LOCALES.map((locale) => ({ locale, key, value: t(locale, key as MessageKey) })),
  )

  /**
   * Known em-dash debt in the shipped dictionary, kept as an explicit baseline so
   * the rule can be enforced today without failing on copy this track does not own.
   *
   * Both entries are the same string in two locales:
   *   'meta.defaultTitle' -> 'Happy Education — study abroad advisers in London'
   *
   * House style bans the em dash in user-facing copy, and this one is the page
   * title, so it reaches the browser tab and the search snippet. The owning track
   * should replace it with a comma or a colon and delete this baseline.
   */
  const KNOWN_EM_DASH_KEYS = new Set<string>(['meta.defaultTitle'])

  it('introduces no new em dashes in user-facing strings', () => {
    const offenders = values
      .filter(({ value }) => value.includes('—'))
      .filter(({ key }) => !KNOWN_EM_DASH_KEYS.has(key))
      .map(({ locale, key }) => `${locale}:${key}`)
    expect(offenders).toEqual([])
  })

  it('has not grown the em-dash baseline', () => {
    const offenders = values.filter(({ value }) => value.includes('—'))
    expect(offenders.length).toBeLessThanOrEqual(KNOWN_EM_DASH_KEYS.size * LOCALES.length)
  })

  it('never uses a straight double quote inside copy', () => {
    // Typographic quotes only; a straight quote in JSX copy usually means the
    // string was pasted from a spreadsheet.
    const offenders = values.filter(({ value }) => value.includes('"'))
    expect(offenders.map((o) => `${o.locale}:${o.key}`)).toEqual([])
  })

  it('has no untrimmed or double-spaced values', () => {
    const offenders = values
      .filter(({ value }) => value !== value.trim() || /\s{2,}/.test(value))
      .map(({ locale, key }) => `${locale}:${key}`)
    expect(offenders).toEqual([])
  })

  it('publishes no blocked business claim through the UI dictionary', () => {
    // Counts, rates and accreditations are forbidden until verified; see
    // src/lib/business-facts.ts BLOCKED_CLAIMS.
    const banned =
      /\b\d{2,4}\s*\+|\b(?:British Council|English UK|ICEF|OISC|IAA[- ]registered|Trustpilot)\b|(?:success|acceptance|approval)\s+rate/i
    const offenders = values
      .filter(({ value }) => banned.test(value))
      .map(({ locale, key, value }) => `${locale}:${key} -> ${value}`)
    expect(offenders).toEqual([])
  })

  it('uses British English spellings in the English dictionary', () => {
    const americanisms = /\b(?:organiz(?:e|ed|ation)|program(?:s)?\b|enroll(?:ment)?|customiz(?:e|ed))\b/i
    const offenders = englishKeys
      .map((key) => ({ key, value: t('en', key as MessageKey) }))
      .filter(({ value }) => americanisms.test(value))
      .map(({ key, value }) => `${key} -> ${value}`)
    expect(offenders).toEqual([])
  })
})
