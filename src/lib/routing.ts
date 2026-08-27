import 'server-only'
import type { Locale, SectionKey } from '@/lib/i18n/config'
import {
  getDestination,
  getInstitution,
  getSummerProgramme,
  getTour,
  getArticle,
  getProseDoc,
  getPageByKey,
  type DestinationDoc,
  type InstitutionDoc,
  type SummerProgrammeDoc,
  type TourDoc,
  type ArticleDoc,
  type ProseDoc,
} from '@/lib/sanity/queries/content'
import { getStarterDestination, getStarterProse } from '@/lib/content/starter-content'
import { getEnglishInstitutionShadow, getEnglishSummerShadow } from '@/lib/content/catalogue-fallback'
import {
  getEditorialArticle,
  getEditorialProse,
  getEditorialTour,
} from '@/lib/content/starter-editorial'
import { legalSlug, LEGAL_PAGES, type LegalKey } from '@/lib/legal'

/**
 * Turns URL segments into a description of what should render.
 *
 * Resolution is deliberately separated from rendering so that `generateMetadata`
 * and the page body run identical logic. If they diverged, a page could advertise
 * metadata for one document while rendering another.
 *
 * Section indexes always resolve even on an empty dataset. During the pre-Sanity
 * authoring phase the English tree also has safe catalogue/editorial fallbacks so
 * the public IA can be reviewed without copying unverified Turkish claims.
 */

export type ResolvedRoute =
  | { kind: 'sectionIndex'; section: SectionKey }
  | { kind: 'destination'; section: SectionKey; doc: DestinationDoc }
  | { kind: 'institution'; section: SectionKey; doc: InstitutionDoc }
  | { kind: 'summerListing'; format: 'individual' | 'group'; formatSlug: string }
  | { kind: 'summerProgramme'; doc: SummerProgrammeDoc; formatSlug: string }
  | { kind: 'tour'; doc: TourDoc }
  | { kind: 'article'; doc: ArticleDoc }
  | { kind: 'prose'; section: SectionKey; doc: ProseDoc }
  | { kind: 'legal'; doc: ProseDoc | null; legalKey: LegalKey; slug: string }
  | { kind: 'fixedPage'; pageKey: 'about' | 'contact' | 'consultation'; doc: ProseDoc | null }

/** Institution document types available under each section. */
const INSTITUTION_TYPES: Partial<Record<SectionKey, string[]>> = {
  universities: ['institution'],
  languageSchools: ['languageSchool'],
  boardingSchools: ['boardingSchool'],
}

/** Localised slugs for the two summer-school formats. */
const SUMMER_FORMAT_SLUG: Record<'individual' | 'group', Record<Locale, string>> = {
  individual: { en: 'individual', tr: 'bireysel' },
  group: { en: 'group', tr: 'grup' },
}

function summerFormatFromSlug(locale: Locale, slug: string): 'individual' | 'group' | null {
  if (SUMMER_FORMAT_SLUG.individual[locale] === slug) return 'individual'
  if (SUMMER_FORMAT_SLUG.group[locale] === slug) return 'group'
  return null
}

export function summerFormatSlug(locale: Locale, format: 'individual' | 'group'): string {
  return SUMMER_FORMAT_SLUG[format][locale]
}

export async function resolveRoute({
  locale,
  section,
  segments,
}: {
  locale: Locale
  section: SectionKey
  segments: string[]
}): Promise<ResolvedRoute | null> {
  if (section === 'search') return null

  if (section === 'about' || section === 'contact' || section === 'consultation') {
    if (segments.length > 0) return null
    const doc = await getPageByKey(locale, section)
    return { kind: 'fixedPage', pageKey: section, doc }
  }

  if (section === 'legal') {
    if (segments.length === 0) return { kind: 'sectionIndex', section }
    const slug = segments[0]
    if (!slug || segments.length > 1) return null
    const entry = LEGAL_PAGES.find((p) => p[locale] === slug)
    if (!entry) return null
    const doc = await getProseDoc(locale, slug, 'legalPage')
    return { kind: 'legal', doc, legalKey: entry.key as LegalKey, slug }
  }

  if (segments.length === 0) {
    return { kind: 'sectionIndex', section }
  }

  if (section === 'insights') {
    const slug = segments[0]
    if (!slug || segments.length > 1) return null
    const doc = (await getArticle(locale, slug)) ?? getEditorialArticle(locale, slug)
    return doc ? { kind: 'article', doc } : null
  }

  if (section === 'tours') {
    const slug = segments[0]
    if (!slug || segments.length > 1) return null
    const doc = (await getTour(locale, slug)) ?? getEditorialTour(locale, slug)
    return doc ? { kind: 'tour', doc } : null
  }

  if (section === 'guides' || section === 'services') {
    const slug = segments[0]
    if (!slug || segments.length > 1) return null
    const type = section === 'guides' ? 'guide' : 'service'
    const doc =
      (await getProseDoc(locale, slug, type)) ??
      getStarterProse(locale, slug, type) ??
      getEditorialProse(locale, type, slug)
    return doc ? { kind: 'prose', section, doc } : null
  }

  if (section === 'summerSchools') {
    const [formatSlug, programmeSlug, ...extra] = segments
    if (!formatSlug || extra.length > 0) return null

    const format = summerFormatFromSlug(locale, formatSlug)
    if (!format) return null

    if (!programmeSlug) return { kind: 'summerListing', format, formatSlug }

    const doc =
      (await getSummerProgramme(locale, programmeSlug)) ??
      (locale === 'en' ? getEnglishSummerShadow(programmeSlug) : null)
    if (!doc || doc.format !== format) return null
    return { kind: 'summerProgramme', doc, formatSlug }
  }

  if (section === 'boardingSchools') {
    const slug = segments[0]
    if (!slug || segments.length > 1) return null

    const destination = await getDestination(locale, slug, section)
    if (destination) return { kind: 'destination', section, doc: destination }

    const types = INSTITUTION_TYPES[section] ?? []
    const doc =
      (await getInstitution(locale, slug, types)) ??
      (locale === 'en' ? getEnglishInstitutionShadow(slug, types) : null)
    return doc ? { kind: 'institution', section, doc } : null
  }

  if (section === 'universities' || section === 'languageSchools') {
    const [countrySlug, leafSlug, ...extra] = segments
    if (!countrySlug || extra.length > 0) return null

    if (!leafSlug) {
      const destination =
        (await getDestination(locale, countrySlug, section)) ??
        getStarterDestination(locale, section, countrySlug)
      return destination ? { kind: 'destination', section, doc: destination } : null
    }

    const types = INSTITUTION_TYPES[section] ?? []
    const doc =
      (await getInstitution(locale, leafSlug, types)) ??
      (locale === 'en' ? getEnglishInstitutionShadow(leafSlug, types) : null)

    if (!doc) return null
    // A catalogue shadow must still belong to the country route the visitor used.
    if (locale === 'en' && doc.destination?.slug && doc.destination.slug !== countrySlug) return null
    return { kind: 'institution', section, doc }
  }

  return null
}

/** Canonical path for a resolved route, used for metadata and hreflang. */
export function routePath(locale: Locale, route: ResolvedRoute): string[] {
  switch (route.kind) {
    case 'sectionIndex':
      return []
    case 'destination':
      return route.doc.parentSlug ? [route.doc.parentSlug, route.doc.slug] : [route.doc.slug]
    case 'institution':
      return route.doc.destination?.slug
        ? [route.doc.destination.slug, route.doc.slug]
        : [route.doc.slug]
    case 'summerListing':
      return [route.formatSlug]
    case 'summerProgramme':
      return [route.formatSlug, route.doc.slug]
    case 'tour':
    case 'article':
      return [route.doc.slug]
    case 'prose':
      return [route.doc.slug]
    case 'legal':
      return [route.slug]
    case 'fixedPage':
      return []
  }
}

export function legalIndexEntries(locale: Locale) {
  return LEGAL_PAGES.map((p) => ({ key: p.key as LegalKey, slug: legalSlug(locale, p.key as LegalKey) }))
}
