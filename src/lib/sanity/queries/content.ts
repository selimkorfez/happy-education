import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import { LINK_PROJECTION } from '@/lib/links'
import type { MediaSource } from '@/components/ui/MediaFrame'
import type { ReviewData } from '@/components/shared/ReviewMeta'
import type { Faq } from '@/components/shared/FaqSection'
import type { Locale } from '@/lib/i18n/config'

/**
 * Content queries for the routed templates.
 *
 * Projections select explicit fields. Beyond payload size, this means an editor
 * adding an internal note field never leaks it to the client bundle.
 *
 * References inside rich text are dereferenced through LINK_PROJECTION so
 * `resolveInternalHref` can build a real path at render time rather than emitting
 * a dangling link.
 */

export interface SourcedFact {
  label: string
  value: string
  note?: string
  source?: { label?: string; url?: string; accessed?: string }
}

export interface SeoData {
  title?: string
  description?: string
  image?: MediaSource
  noIndex?: boolean
}

interface BaseDoc {
  _id: string
  title: string
  slug: string
  locale: Locale
  seo?: SeoData
  review?: ReviewData
  translationGroupId?: string
  cta?: { label?: string; href?: string }
}

const RICH_TEXT = /* groq */ `
  ...,
  markDefs[]{
    ...,
    _type == "internalLink" => { "reference": reference->{ ${LINK_PROJECTION} } }
  }
`

const BASE = /* groq */ `
  _id,
  title,
  "slug": slug.current,
  locale,
  seo,
  "translationGroupId": translationGroup._ref,
  cta,
  review{
    lastReviewed,
    timeSensitive,
    sources,
    editorialFlag,
    reviewedBy->{ name, role }
  }
`

const FAQS = /* groq */ `faqs[]{ question, answer[]{ ${RICH_TEXT} } }`

// ---------------------------------------------------------------- destinations

export interface DestinationDoc extends BaseDoc {
  kind: 'country' | 'city'
  section: string
  intro?: string
  heroImage?: MediaSource
  whyStudyHere?: unknown
  educationSystem?: unknown
  applicationJourney?: unknown
  entryRequirements?: unknown
  englishRequirements?: SourcedFact[]
  costs?: SourcedFact[]
  scholarships?: unknown
  accommodation?: unknown
  visaOverview?: unknown
  keyCities?: Array<{ title: string; slug: string; section?: string }>
  institutions?: Array<{ _type: string; title: string; slug: string; city?: string }>
  relatedArticles?: Array<{ title: string; slug: string; excerpt?: string }>
  faqs?: Faq[]
  parentSlug?: string
  parentTitle?: string
}

export async function getDestination(
  locale: Locale,
  slug: string,
  section: string,
): Promise<DestinationDoc | null> {
  return sanityFetch<DestinationDoc | null>(
    /* groq */ `
      *[_type == "destination" && locale == $locale && slug.current == $slug && section == $section][0]{
        ${BASE},
        kind, section, intro, heroImage,
        whyStudyHere[]{ ${RICH_TEXT} },
        educationSystem[]{ ${RICH_TEXT} },
        applicationJourney[]{ ${RICH_TEXT} },
        entryRequirements[]{ ${RICH_TEXT} },
        englishRequirements, costs,
        scholarships[]{ ${RICH_TEXT} },
        accommodation[]{ ${RICH_TEXT} },
        visaOverview[]{ ${RICH_TEXT} },
        ${FAQS},
        "parentSlug": parent->slug.current,
        "parentTitle": parent->title,
        keyCities[]->{ title, "slug": slug.current, section },
        institutions[]->{ _type, title, "slug": slug.current, city },
        relatedArticles[]->{ title, "slug": slug.current, excerpt }
      }
    `,
    { locale, slug, section },
    { tags: ['destination', `destination:${slug}`], revalidate: 1800 },
    null,
  )
}

export async function listDestinations(
  locale: Locale,
  section: string,
): Promise<Array<{ title: string; slug: string; intro?: string; heroImage?: MediaSource; kind: string }>> {
  return sanityFetch(
    /* groq */ `
      *[_type == "destination" && locale == $locale && section == $section && kind == "country"]
        | order(title asc){
          title, "slug": slug.current, intro, heroImage, kind
        }
    `,
    { locale, section },
    { tags: ['destination'], revalidate: 1800 },
    [],
  )
}

// ---------------------------------------------------------------- institutions

export interface InstitutionDoc extends BaseDoc {
  _type: string
  city?: string
  country?: string
  heroImage?: MediaSource
  logo?: MediaSource
  officialWebsite?: string
  overview?: unknown
  accommodation?: unknown
  fees?: SourcedFact[]
  faqs?: Faq[]
  destination?: { title: string; slug: string; section?: string }
  relatedArticles?: Array<{ title: string; slug: string }>
  // university
  founded?: string
  subjectAreas?: string[]
  degreeLevels?: string[]
  intakes?: string[]
  entryGuidance?: unknown
  englishRequirements?: SourcedFact[]
  scholarships?: unknown
  rankings?: Array<{
    organisation: string
    year: string
    category: string
    position: string
    source?: { label?: string; url?: string; accessed?: string }
  }>
  // language school
  accreditations?: Array<{ body: string; verified: boolean; source?: { url?: string } }>
  courseTypes?: string[]
  lessonsPerWeek?: string
  levels?: string[]
  minimumAge?: number
  facilities?: string[]
  socialProgramme?: unknown
  startDates?: unknown
  // boarding
  ageRange?: string
  curriculum?: string[]
  boardingOptions?: unknown
  admissions?: unknown
  safeguardingNote?: unknown
}

const INSTITUTION_PROJECTION = /* groq */ `
  ${BASE},
  _type, city, country, heroImage, logo, officialWebsite,
  overview[]{ ${RICH_TEXT} },
  accommodation[]{ ${RICH_TEXT} },
  fees, ${FAQS},
  destination->{ title, "slug": slug.current, section },
  relatedArticles[]->{ title, "slug": slug.current },
  founded, subjectAreas, degreeLevels, intakes,
  entryGuidance[]{ ${RICH_TEXT} },
  englishRequirements,
  scholarships[]{ ${RICH_TEXT} },
  rankings,
  accreditations, courseTypes, lessonsPerWeek, levels, minimumAge, facilities,
  socialProgramme[]{ ${RICH_TEXT} },
  startDates[]{ ${RICH_TEXT} },
  ageRange, curriculum,
  boardingOptions[]{ ${RICH_TEXT} },
  admissions[]{ ${RICH_TEXT} },
  safeguardingNote[]{ ${RICH_TEXT} }
`

export async function getInstitution(
  locale: Locale,
  slug: string,
  types: string[],
): Promise<InstitutionDoc | null> {
  return sanityFetch<InstitutionDoc | null>(
    /* groq */ `
      *[_type in $types && locale == $locale && slug.current == $slug][0]{
        ${INSTITUTION_PROJECTION}
      }
    `,
    { locale, slug, types },
    { tags: ['institution', `institution:${slug}`], revalidate: 1800 },
    null,
  )
}

export interface InstitutionCard {
  _type: string
  title: string
  slug: string
  city?: string
  country?: string
  heroImage?: MediaSource
  courseTypes?: string[]
  degreeLevels?: string[]
  ageRange?: string
}

export async function listInstitutions(
  locale: Locale,
  types: string[],
  destinationSlug?: string,
): Promise<InstitutionCard[]> {
  return sanityFetch<InstitutionCard[]>(
    /* groq */ `
      *[
        _type in $types
        && locale == $locale
        && defined(slug.current)
        && ($destinationSlug == null || destination->slug.current == $destinationSlug)
      ] | order(title asc){
        _type, title, "slug": slug.current, city, country, heroImage,
        courseTypes, degreeLevels, ageRange
      }
    `,
    { locale, types, destinationSlug: destinationSlug ?? null },
    { tags: ['institution'], revalidate: 1800 },
    [],
  )
}

// ------------------------------------------------------------ summer and tours

export interface SummerProgrammeDoc extends BaseDoc {
  format: 'individual' | 'group'
  city?: string
  heroImage?: MediaSource
  overview?: unknown
  ageRange?: string
  dates?: unknown
  duration?: string
  academicFocus?: string[]
  languageLevel?: string
  lessonsPerWeek?: string
  accommodation?: unknown
  meals?: string
  activities?: unknown
  excursions?: unknown
  included?: string[]
  excluded?: string[]
  price?: SourcedFact[]
  providerResponsibilities?: unknown
  happyEducationResponsibilities?: unknown
  parentalRequirements?: unknown
  cancellationPolicy?: unknown
  faqs?: Faq[]
  destination?: { title: string; slug: string }
}

export async function getSummerProgramme(
  locale: Locale,
  slug: string,
): Promise<SummerProgrammeDoc | null> {
  return sanityFetch<SummerProgrammeDoc | null>(
    /* groq */ `
      *[_type == "summerProgramme" && locale == $locale && slug.current == $slug][0]{
        ${BASE},
        format, city, heroImage, ageRange, duration, academicFocus, languageLevel,
        lessonsPerWeek, meals, included, excluded, price,
        overview[]{ ${RICH_TEXT} },
        dates[]{ ${RICH_TEXT} },
        accommodation[]{ ${RICH_TEXT} },
        activities[]{ ${RICH_TEXT} },
        excursions[]{ ${RICH_TEXT} },
        providerResponsibilities[]{ ${RICH_TEXT} },
        happyEducationResponsibilities[]{ ${RICH_TEXT} },
        parentalRequirements[]{ ${RICH_TEXT} },
        cancellationPolicy[]{ ${RICH_TEXT} },
        ${FAQS},
        destination->{ title, "slug": slug.current }
      }
    `,
    { locale, slug },
    { tags: ['summerProgramme', `summerProgramme:${slug}`], revalidate: 1800 },
    null,
  )
}

export async function listSummerProgrammes(
  locale: Locale,
  format?: 'individual' | 'group',
): Promise<Array<{ title: string; slug: string; city?: string; ageRange?: string; format: string; heroImage?: MediaSource }>> {
  return sanityFetch(
    /* groq */ `
      *[
        _type == "summerProgramme" && locale == $locale && defined(slug.current)
        && ($format == null || format == $format)
      ] | order(title asc){
        title, "slug": slug.current, city, ageRange, format, heroImage
      }
    `,
    { locale, format: format ?? null },
    { tags: ['summerProgramme'], revalidate: 1800 },
    [],
  )
}

export interface TourDoc extends BaseDoc {
  heroImage?: MediaSource
  overview?: unknown
  itinerary?: unknown
  dates?: unknown
  ageEligibility?: string
  included?: string[]
  excluded?: string[]
  price?: SourcedFact[]
  availability?: string
  cancellationTerms?: unknown
  safeguardingNote?: unknown
  destination?: { title: string; slug: string }
}

export async function getTour(locale: Locale, slug: string): Promise<TourDoc | null> {
  return sanityFetch<TourDoc | null>(
    /* groq */ `
      *[_type == "tour" && locale == $locale && slug.current == $slug][0]{
        ${BASE},
        heroImage, ageEligibility, included, excluded, price, availability,
        overview[]{ ${RICH_TEXT} },
        itinerary[]{ ${RICH_TEXT} },
        dates[]{ ${RICH_TEXT} },
        cancellationTerms[]{ ${RICH_TEXT} },
        safeguardingNote[]{ ${RICH_TEXT} },
        destination->{ title, "slug": slug.current }
      }
    `,
    { locale, slug },
    { tags: ['tour', `tour:${slug}`], revalidate: 1800 },
    null,
  )
}

export async function listTours(
  locale: Locale,
): Promise<Array<{ title: string; slug: string; heroImage?: MediaSource; availability?: string }>> {
  return sanityFetch(
    /* groq */ `
      *[_type == "tour" && locale == $locale && defined(slug.current)] | order(title asc){
        title, "slug": slug.current, heroImage, availability
      }
    `,
    { locale },
    { tags: ['tour'], revalidate: 1800 },
    [],
  )
}

// --------------------------------------------------------- articles and prose

export interface ArticleDoc extends BaseDoc {
  excerpt?: string
  leadImage?: MediaSource
  body?: unknown
  author?: { name: string; role?: string; slug?: string; photo?: MediaSource; consentOnFile?: boolean }
  category?: { title: string; slug: string }
  tags?: string[]
  showTableOfContents?: boolean
  publishedAt?: string
  updatedAt?: string
  readingMinutes?: number
  faqs?: Faq[]
  relatedArticles?: Array<{ title: string; slug: string; excerpt?: string; leadImage?: MediaSource }>
  relatedDestinations?: Array<{ title: string; slug: string; section?: string }>
}

export async function getArticle(locale: Locale, slug: string): Promise<ArticleDoc | null> {
  return sanityFetch<ArticleDoc | null>(
    /* groq */ `
      *[_type == "article" && locale == $locale && slug.current == $slug][0]{
        ${BASE},
        excerpt, leadImage, tags, showTableOfContents, publishedAt, updatedAt, readingMinutes,
        body[]{ ${RICH_TEXT} },
        author->{ name, role, "slug": slug.current, photo, consentOnFile },
        category->{ title, "slug": slug.current },
        ${FAQS},
        relatedArticles[]->{ title, "slug": slug.current, excerpt, leadImage },
        relatedDestinations[]->{ title, "slug": slug.current, section }
      }
    `,
    { locale, slug },
    { tags: ['article', `article:${slug}`], revalidate: 900 },
    null,
  )
}

export interface ProseDoc extends BaseDoc {
  summary?: string
  intro?: string
  heroImage?: MediaSource
  body?: unknown
  faqs?: Faq[]
  pageKey?: string
  effectiveDate?: string
  solicitorApproved?: boolean
}

/** Shared loader for the prose-shaped types: guide, service, page, legalPage. */
export async function getProseDoc(
  locale: Locale,
  slug: string,
  type: 'guide' | 'service' | 'page' | 'legalPage',
): Promise<ProseDoc | null> {
  return sanityFetch<ProseDoc | null>(
    /* groq */ `
      *[_type == $type && locale == $locale && slug.current == $slug][0]{
        ${BASE},
        summary, intro, heroImage, pageKey, effectiveDate, solicitorApproved,
        body[]{ ${RICH_TEXT} },
        ${FAQS}
      }
    `,
    { locale, slug, type },
    { tags: [type, `${type}:${slug}`], revalidate: 1800 },
    null,
  )
}

export async function getPageByKey(locale: Locale, pageKey: string): Promise<ProseDoc | null> {
  return sanityFetch<ProseDoc | null>(
    /* groq */ `
      *[_type == "page" && locale == $locale && pageKey == $pageKey][0]{
        ${BASE}, intro, heroImage, pageKey,
        body[]{ ${RICH_TEXT} },
        ${FAQS}
      }
    `,
    { locale, pageKey },
    { tags: ['page', `page:${pageKey}`], revalidate: 1800 },
    null,
  )
}

/** Every routable slug, for generateStaticParams and the sitemap. */
export async function getAllRoutableDocs(): Promise<
  Array<{ _type: string; locale: Locale; slug: string; section?: string; updatedAt?: string }>
> {
  return sanityFetch(
    /* groq */ `
      *[
        _type in [
          "destination","institution","languageSchool","boardingSchool","summerProgramme",
          "tour","article","guide","service","page","legalPage"
        ] && defined(slug.current) && locale in ["en","tr"]
      ]{
        _type, locale, "slug": slug.current, section,
        "updatedAt": coalesce(updatedAt, _updatedAt)
      }
    `,
    {},
    { tags: ['routes'], revalidate: 3600 },
    [],
  )
}
