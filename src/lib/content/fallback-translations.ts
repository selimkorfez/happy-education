import 'server-only'
import { allOfType, deref, findBySlug, slugOf, type LocalDoc } from './local-source'
import { englishDestinationForSource, englishDestinationForValue } from './shadow-content'
import { translatedEditorialTourSlug } from './starter-editorial'
import { docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { summerFormatSlug } from '@/lib/routing'

const INSTITUTION_TYPES: Partial<Record<SectionKey, string[]>> = {
  universities: ['institution'],
  languageSchools: ['languageSchool'],
  boardingSchools: ['boardingSchool'],
}

function localCountrySlug(doc: LocalDoc): string | null {
  const destination = deref(doc.destination)
  if (!destination) return null
  return slugOf(deref(destination.parent) ?? destination)
}

function englishCountrySlug(doc: LocalDoc): string | null {
  const destination = deref(doc.destination)
  return englishDestinationForSource({
    city: typeof doc.city === 'string' ? doc.city : undefined,
    country: typeof doc.country === 'string' ? doc.country : undefined,
    destination: destination
      ? { title: destination.title, slug: slugOf(destination) ?? undefined }
      : undefined,
  })?.slug ?? null
}

function translatedDestinationSlug(fromLocale: Locale, toLocale: Locale, slug: string): string | null {
  if (fromLocale === 'tr' && toLocale === 'en') {
    const source = findBySlug(['destination'], 'tr', slug)
    return source
      ? (englishDestinationForValue(slugOf(source) ?? undefined)
          ?? englishDestinationForValue(source.title))?.slug ?? null
      : null
  }

  if (fromLocale === 'en' && toLocale === 'tr') {
    return slugOf(
      allOfType('destination', 'tr').find((doc) => {
        const mapped = englishDestinationForValue(slugOf(doc) ?? undefined)
          ?? englishDestinationForValue(doc.title)
        return mapped?.slug === slug
      }),
    )
  }

  return null
}

/**
 * Exact counterpart paths for the safe code-backed content used while the CMS
 * catalogue has only Turkish records. This runs after a real Sanity translation
 * lookup, so authored bilingual documents always win.
 */
export function findFallbackTranslatedPath({
  fromLocale,
  toLocale,
  section,
  slugPath,
}: {
  fromLocale: Locale
  toLocale: Locale
  section: SectionKey
  slugPath: string[]
}): string | null {
  const leaf = slugPath.at(-1)
  if (!leaf) return null

  if (section === 'tours') {
    const targetSlug = translatedEditorialTourSlug(fromLocale, toLocale, leaf)
    return targetSlug ? docPath(toLocale, 'tours', targetSlug) : null
  }

  if (section === 'summerSchools') {
    const doc = findBySlug(['summerProgramme'], 'tr', leaf)
    if (!doc) return null
    const format = doc.format === 'group' ? 'group' : 'individual'
    return docPath(toLocale, section, summerFormatSlug(toLocale, format), leaf)
  }

  const types = INSTITUTION_TYPES[section]
  if (types && (section === 'boardingSchools' || slugPath.length > 1)) {
    const doc = findBySlug(types, 'tr', leaf)
    if (!doc) return null
    if (section === 'boardingSchools') return docPath(toLocale, section, leaf)

    const countrySlug = toLocale === 'en' ? englishCountrySlug(doc) : localCountrySlug(doc)
    return countrySlug ? docPath(toLocale, section, countrySlug, leaf) : docPath(toLocale, section, leaf)
  }

  if ((section === 'universities' || section === 'languageSchools') && slugPath.length === 1) {
    const targetSlug = translatedDestinationSlug(fromLocale, toLocale, leaf)
    return targetSlug ? docPath(toLocale, section, targetSlug) : null
  }

  return null
}
