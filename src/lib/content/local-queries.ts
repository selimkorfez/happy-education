import 'server-only'
import {
  allOfType,
  deref,
  derefAll,
  findBySlug,
  findTranslation,
  searchLocal,
  slugOf,
  type LocalDoc,
} from './local-source'
import type {
  DestinationDoc,
  InstitutionDoc,
  SummerProgrammeDoc,
  TourDoc,
  ArticleDoc,
  ProseDoc,
  InstitutionCard,
} from '@/lib/sanity/queries/content'
import type { ArticleCard } from '@/lib/sanity/queries/articles'
import type { SearchResult } from '@/lib/sanity/queries/search'
import type { Locale } from '@/lib/i18n/config'

/**
 * Shapes local documents into the same objects the Sanity projections return, so
 * the templates cannot tell the two sources apart.
 *
 * Every mapper here mirrors a GROQ projection in `src/lib/sanity/queries/`. When a
 * projection changes, its mapper changes with it — that duplication is the cost of
 * having a source that works without a CMS, and it is bounded because this source
 * is deleted once the import runs.
 *
 * Images are deliberately NOT carried across. Migrated media has `cleared: false`
 * by design, so `MediaFrame` would refuse to render it anyway; passing it through
 * would only produce withheld-image placeholders.
 */

function review(doc: LocalDoc) {
  const r = doc.review as
    | {
        lastReviewed?: string
        timeSensitive?: boolean
        sources?: Array<{ label?: string; url?: string; accessed?: string }>
        editorialFlag?: string
        reviewedBy?: unknown
      }
    | undefined
  if (!r) return undefined

  const reviewer = deref(r.reviewedBy)
  return {
    lastReviewed: r.lastReviewed,
    timeSensitive: r.timeSensitive,
    sources: r.sources,
    ...(reviewer
      ? { reviewedBy: { name: String(reviewer.name ?? ''), role: String(reviewer.role ?? '') } }
      : {}),
  }
}

function base(doc: LocalDoc) {
  return {
    _id: doc._id,
    title: doc.title,
    slug: slugOf(doc) ?? '',
    locale: doc.locale,
    seo: doc.seo as never,
    review: review(doc),
    translationGroupId: (doc.translationGroup as { _ref?: string } | undefined)?._ref,
    cta: doc.cta as never,
  }
}

const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
const arr = (v: unknown): string[] | undefined => (Array.isArray(v) ? (v as string[]) : undefined)

/* ------------------------------------------------------------ destinations */

export function localGetDestination(
  locale: Locale,
  slug: string,
  section: string,
): DestinationDoc | null {
  const doc = allOfType('destination', locale).find(
    (d) => slugOf(d) === slug && d.section === section,
  )
  if (!doc) return null

  const parent = deref(doc.parent)

  return {
    ...base(doc),
    kind: (doc.kind as 'country' | 'city') ?? 'country',
    section: String(doc.section ?? section),
    intro: str(doc.intro),
    whyStudyHere: doc.whyStudyHere,
    educationSystem: doc.educationSystem,
    applicationJourney: doc.applicationJourney,
    entryRequirements: doc.entryRequirements,
    englishRequirements: doc.englishRequirements as never,
    costs: doc.costs as never,
    scholarships: doc.scholarships,
    accommodation: doc.accommodation,
    visaOverview: doc.visaOverview,
    faqs: doc.faqs as never,
    parentSlug: parent ? (slugOf(parent) ?? undefined) : undefined,
    parentTitle: parent?.title,
    keyCities: derefAll(doc.keyCities).map((c) => ({
      title: c.title,
      slug: slugOf(c) ?? '',
      section: str(c.section),
    })),
    // The migration links institutions to destinations, not the other way round,
    // so the list is derived rather than read from a field.
    institutions: institutionsForDestination(locale, doc).map((i) => ({
      _type: i._type,
      title: i.title,
      slug: slugOf(i) ?? '',
      city: str(i.city),
    })),
    relatedArticles: derefAll(doc.relatedArticles).map((a) => ({
      title: a.title,
      slug: slugOf(a) ?? '',
      excerpt: str(a.excerpt),
    })),
  } as DestinationDoc
}

function institutionsForDestination(locale: Locale, destination: LocalDoc): LocalDoc[] {
  const types = ['institution', 'languageSchool', 'boardingSchool']
  return types
    .flatMap((t) => allOfType(t, locale))
    .filter((i) => (i.destination as { _ref?: string } | undefined)?._ref === destination._id)
}

export function localListDestinations(locale: Locale, section: string) {
  return allOfType('destination', locale)
    .filter((d) => d.section === section && d.kind === 'country')
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((d) => ({
      title: d.title,
      slug: slugOf(d) ?? '',
      intro: str(d.intro),
      kind: String(d.kind ?? 'country'),
    }))
}

/* ------------------------------------------------------------ institutions */

export function localGetInstitution(
  locale: Locale,
  slug: string,
  types: string[],
): InstitutionDoc | null {
  const doc = findBySlug(types, locale, slug)
  if (!doc) return null

  const destination = deref(doc.destination)

  return {
    ...base(doc),
    _type: doc._type,
    city: str(doc.city),
    country: str(doc.country),
    officialWebsite: str(doc.officialWebsite),
    overview: doc.overview,
    accommodation: doc.accommodation,
    fees: doc.fees as never,
    faqs: doc.faqs as never,
    destination: destination
      ? {
          title: destination.title,
          slug: slugOf(destination) ?? '',
          section: str(destination.section),
        }
      : undefined,
    relatedArticles: derefAll(doc.relatedArticles).map((a) => ({
      title: a.title,
      slug: slugOf(a) ?? '',
    })),
    founded: str(doc.founded),
    subjectAreas: arr(doc.subjectAreas),
    degreeLevels: arr(doc.degreeLevels),
    intakes: arr(doc.intakes),
    entryGuidance: doc.entryGuidance,
    englishRequirements: doc.englishRequirements as never,
    scholarships: doc.scholarships,
    rankings: doc.rankings as never,
    accreditations: doc.accreditations as never,
    courseTypes: arr(doc.courseTypes),
    lessonsPerWeek: str(doc.lessonsPerWeek),
    levels: arr(doc.levels),
    minimumAge: typeof doc.minimumAge === 'number' ? doc.minimumAge : undefined,
    facilities: arr(doc.facilities),
    socialProgramme: doc.socialProgramme,
    startDates: doc.startDates,
    ageRange: str(doc.ageRange),
    curriculum: arr(doc.curriculum),
    boardingOptions: doc.boardingOptions,
    admissions: doc.admissions,
    safeguardingNote: doc.safeguardingNote,
  } as InstitutionDoc
}

export function localListInstitutions(
  locale: Locale,
  types: string[],
  destinationSlug?: string,
): InstitutionCard[] {
  return types
    .flatMap((t) => allOfType(t, locale))
    .filter((i) => {
      if (!destinationSlug) return true
      const destination = deref(i.destination)
      return destination ? slugOf(destination) === destinationSlug : false
    })
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((i) => ({
      _type: i._type,
      title: i.title,
      slug: slugOf(i) ?? '',
      city: str(i.city),
      country: str(i.country),
      courseTypes: arr(i.courseTypes),
      degreeLevels: arr(i.degreeLevels),
      ageRange: str(i.ageRange),
    }))
}

/* ------------------------------------------------------ summer and tours */

export function localGetSummerProgramme(locale: Locale, slug: string): SummerProgrammeDoc | null {
  const doc = findBySlug(['summerProgramme'], locale, slug)
  if (!doc) return null
  const destination = deref(doc.destination)

  return {
    ...base(doc),
    format: (doc.format as 'individual' | 'group') ?? 'individual',
    city: str(doc.city),
    overview: doc.overview,
    ageRange: str(doc.ageRange),
    dates: doc.dates,
    duration: str(doc.duration),
    academicFocus: arr(doc.academicFocus),
    languageLevel: str(doc.languageLevel),
    lessonsPerWeek: str(doc.lessonsPerWeek),
    accommodation: doc.accommodation,
    meals: str(doc.meals),
    activities: doc.activities,
    excursions: doc.excursions,
    included: arr(doc.included),
    excluded: arr(doc.excluded),
    price: doc.price as never,
    providerResponsibilities: doc.providerResponsibilities,
    happyEducationResponsibilities: doc.happyEducationResponsibilities,
    parentalRequirements: doc.parentalRequirements,
    cancellationPolicy: doc.cancellationPolicy,
    faqs: doc.faqs as never,
    destination: destination
      ? { title: destination.title, slug: slugOf(destination) ?? '' }
      : undefined,
  } as SummerProgrammeDoc
}

export function localListSummerProgrammes(locale: Locale, format?: 'individual' | 'group') {
  return allOfType('summerProgramme', locale)
    .filter((p) => (format ? p.format === format : true))
    .sort((a, b) => a.title.localeCompare(b.title))
    .map((p) => ({
      title: p.title,
      slug: slugOf(p) ?? '',
      city: str(p.city),
      ageRange: str(p.ageRange),
      format: String(p.format ?? 'individual'),
    }))
}

export function localGetTour(locale: Locale, slug: string): TourDoc | null {
  const doc = findBySlug(['tour'], locale, slug)
  if (!doc) return null
  const destination = deref(doc.destination)
  return {
    ...base(doc),
    overview: doc.overview,
    itinerary: doc.itinerary,
    dates: doc.dates,
    ageEligibility: str(doc.ageEligibility),
    included: arr(doc.included),
    excluded: arr(doc.excluded),
    price: doc.price as never,
    availability: str(doc.availability),
    cancellationTerms: doc.cancellationTerms,
    safeguardingNote: doc.safeguardingNote,
    destination: destination
      ? { title: destination.title, slug: slugOf(destination) ?? '' }
      : undefined,
  } as TourDoc
}

export function localListTours(locale: Locale) {
  return allOfType('tour', locale).map((t) => ({
    title: t.title,
    slug: slugOf(t) ?? '',
    availability: str(t.availability),
  }))
}

/* ------------------------------------------------------------- editorial */

export function localGetArticle(locale: Locale, slug: string): ArticleDoc | null {
  const doc = findBySlug(['article'], locale, slug)
  if (!doc) return null
  const category = deref(doc.category)
  const author = deref(doc.author)

  return {
    ...base(doc),
    excerpt: str(doc.excerpt),
    body: doc.body,
    tags: arr(doc.tags),
    showTableOfContents: doc.showTableOfContents === true,
    publishedAt: str(doc.publishedAt),
    updatedAt: str(doc.updatedAt),
    readingMinutes: typeof doc.readingMinutes === 'number' ? doc.readingMinutes : undefined,
    faqs: doc.faqs as never,
    category: category ? { title: category.title, slug: slugOf(category) ?? '' } : undefined,
    // Migrated posts have no genuine byline: the sole WordPress author was the
    // default `root` account. No author is rendered rather than inventing one.
    author: author
      ? {
          name: String(author.name ?? ''),
          role: str(author.role),
          consentOnFile: author.consentOnFile === true,
        }
      : undefined,
    relatedArticles: derefAll(doc.relatedArticles).map((a) => ({
      title: a.title,
      slug: slugOf(a) ?? '',
      excerpt: str(a.excerpt),
    })),
    relatedDestinations: derefAll(doc.relatedDestinations).map((d) => ({
      title: d.title,
      slug: slugOf(d) ?? '',
      section: str(d.section),
    })),
  } as ArticleDoc
}

export function localListArticles(locale: Locale, limit: number, categorySlug?: string | null): ArticleCard[] {
  return allOfType('article', locale)
    .filter((a) => {
      if (!categorySlug) return true
      const category = deref(a.category)
      return category ? slugOf(category) === categorySlug : false
    })
    .sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')))
    .slice(0, limit)
    .map((a) => {
      const category = deref(a.category)
      return {
        title: a.title,
        slug: slugOf(a) ?? '',
        excerpt: str(a.excerpt),
        category: category?.title,
        publishedAt: str(a.publishedAt),
        updatedAt: str(a.updatedAt),
        readingMinutes: typeof a.readingMinutes === 'number' ? a.readingMinutes : undefined,
      }
    })
}

export function localGetProseDoc(
  locale: Locale,
  slug: string,
  type: 'guide' | 'service' | 'page' | 'legalPage',
): ProseDoc | null {
  const doc = findBySlug([type], locale, slug)
  if (!doc) return null
  return {
    ...base(doc),
    summary: str(doc.summary),
    intro: str(doc.intro),
    body: doc.body,
    faqs: doc.faqs as never,
    pageKey: str(doc.pageKey),
    effectiveDate: str(doc.effectiveDate),
    solicitorApproved: doc.solicitorApproved === true,
  } as ProseDoc
}

export function localGetPageByKey(locale: Locale, pageKey: string): ProseDoc | null {
  const doc = allOfType('page', locale).find((p) => p.pageKey === pageKey)
  if (!doc) return null
  return localGetProseDoc(locale, slugOf(doc) ?? '', 'page')
}

/* ---------------------------------------------------------------- search */

const SEARCH_TYPES = [
  'destination',
  'institution',
  'languageSchool',
  'boardingSchool',
  'summerProgramme',
  'tour',
  'article',
]

export function localSearch(locale: Locale, query: string): SearchResult[] {
  return searchLocal(locale, query, SEARCH_TYPES).map((doc) => {
    const destination = deref(doc.destination)
    return {
      _type: doc._type,
      title: doc.title,
      slug: slugOf(doc) ?? '',
      excerpt: str(doc.excerpt) ?? str(doc.intro) ?? str(doc.summary),
      section: str(doc.section),
      city: str(doc.city),
      format: str(doc.format),
      destinationSlug: destination ? (slugOf(destination) ?? undefined) : undefined,
    }
  })
}

/* ---------------------------------------------------------- translations */

export function localFindTranslatedSlug(
  fromLocale: Locale,
  toLocale: Locale,
  types: string[],
  slug: string,
): string | null {
  const doc = findBySlug(types, fromLocale, slug)
  if (!doc) return null
  const sibling = findTranslation(doc, toLocale)
  return sibling ? slugOf(sibling) : null
}

/** Every routable document, for the sitemap and generateStaticParams. */
export function localAllRoutable(): Array<{
  _type: string
  locale: Locale
  slug: string
  section?: string
  updatedAt?: string
}> {
  const types = [
    'destination',
    'institution',
    'languageSchool',
    'boardingSchool',
    'summerProgramme',
    'tour',
    'article',
    'page',
    'legalPage',
  ]
  return types.flatMap((t) =>
    allOfType(t)
      .filter((d) => slugOf(d))
      .map((d) => ({
        _type: d._type,
        locale: d.locale,
        slug: slugOf(d) ?? '',
        section: str(d.section),
        updatedAt: str(d.updatedAt),
      })),
  )
}
