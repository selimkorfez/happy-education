import 'server-only'
import type {
  InstitutionCard,
  InstitutionDoc,
  SummerProgrammeDoc,
} from '@/lib/sanity/queries/content'

/**
 * English catalogue shadows for records that currently exist only in Turkish.
 *
 * The migration deliberately produced a Turkish-only corpus. Hiding every one of
 * those institutions and summer programmes from the English site makes the IA look
 * broken, but copying the Turkish marketing prose into English would also copy
 * stale rankings, fees, visa wording and unsupported claims.
 *
 * These builders take the safer middle path: expose only identity/location fields
 * needed for discovery, add fresh neutral English explanatory copy, and mark the
 * resulting detail page noindex. A genuine English CMS document always wins and
 * automatically replaces the shadow.
 */

export interface InstitutionShadowSource {
  _id: string
  _type: string
  title: string
  slug: string
  city?: string
  country?: string
  destination?: { title?: string; slug?: string; section?: string }
}

export interface SummerShadowSource {
  _id: string
  title: string
  slug: string
  format?: string
}

interface DestinationIdentity {
  title: string
  slug: string
}

const DESTINATIONS: Array<{
  title: string
  slug: string
  aliases: string[]
}> = [
  {
    title: 'United Kingdom',
    slug: 'united-kingdom',
    aliases: ['united kingdom', 'uk', 'u k', 'england', 'britain', 'great britain', 'ingiltere'],
  },
  {
    title: 'United States',
    slug: 'united-states',
    aliases: ['united states', 'united states of america', 'usa', 'u s a', 'america', 'amerika', 'abd'],
  },
  { title: 'Canada', slug: 'canada', aliases: ['canada', 'kanada'] },
  { title: 'Ireland', slug: 'ireland', aliases: ['ireland', 'irlanda'] },
  { title: 'Australia', slug: 'australia', aliases: ['australia', 'avustralya'] },
  { title: 'New Zealand', slug: 'new-zealand', aliases: ['new zealand', 'yeni zelanda'] },
  { title: 'Malta', slug: 'malta', aliases: ['malta'] },
  { title: 'Cyprus', slug: 'cyprus', aliases: ['cyprus', 'kibris', 'kıbrıs'] },
  { title: 'Grenada', slug: 'grenada', aliases: ['grenada'] },
]

function normalise(value: string): string {
  return value
    .toLocaleLowerCase('en-GB')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function destinationFromValue(value?: string): DestinationIdentity | undefined {
  if (!value) return undefined
  const needle = normalise(value)

  for (const destination of DESTINATIONS) {
    if (normalise(destination.slug) === needle) {
      return { title: destination.title, slug: destination.slug }
    }
    if (destination.aliases.some((alias) => normalise(alias) === needle)) {
      return { title: destination.title, slug: destination.slug }
    }
  }

  return undefined
}

export function englishDestinationForSource(
  source: Pick<InstitutionShadowSource, 'country' | 'destination'>,
): DestinationIdentity | undefined {
  return (
    destinationFromValue(source.destination?.slug) ??
    destinationFromValue(source.destination?.title) ??
    destinationFromValue(source.country)
  )
}

export function englishCountryLabel(value?: string): string | undefined {
  const mapped = destinationFromValue(value)
  return mapped?.title ?? value
}

/** A small set of location-name translations that are safe identity labels. */
export function englishCityLabel(value?: string): string | undefined {
  if (!value) return undefined
  return value
    .replace(/\bLondra\b/gi, 'London')
    .replace(/\bİngiltere\b/gi, 'England')
    .replace(/\bBatı Avustralya\b/gi, 'Western Australia')
    .replace(/\bYeni Zelanda\b/gi, 'New Zealand')
    .replace(/\bİrlanda\b/gi, 'Ireland')
    .replace(/\bAvustralya\b/gi, 'Australia')
    .replace(/\bKanada\b/gi, 'Canada')
    .replace(/\bAmerika Birleşik Devletleri\b/gi, 'United States')
}

function portableParagraphs(paragraphs: string[]) {
  return paragraphs.map((text, index) => ({
    _type: 'block',
    _key: `shadow-${index}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `shadow-text-${index}`, text, marks: [] }],
  }))
}

function institutionCopy(source: InstitutionShadowSource): string[] {
  if (source._type === 'languageSchool') {
    return [
      `Use this profile as a starting point for considering ${source.title}. Course types, dates, accommodation, entry conditions and prices can change, so the current details should be confirmed before a booking is made.`,
      'Happy Education can help you compare language-school options, organise the application and booking paperwork, and clarify which questions should be confirmed with the school before you commit.',
    ]
  }

  if (source._type === 'boardingSchool') {
    return [
      `Use this profile as a starting point for considering ${source.title}. Current admissions requirements, boarding arrangements, fees and availability should be confirmed directly before an application or payment is made.`,
      'For families considering boarding education, the shortlist should cover academic fit as well as pastoral care, accommodation, supervision and safeguarding. Happy Education can help organise the education-application side of that comparison without making guarantees on a school’s behalf.',
    ]
  }

  return [
    `Use this profile as a starting point for considering ${source.title}. Current courses, entry requirements, tuition fees and application deadlines can change, so the live institution information should be checked before you apply.`,
    'Happy Education can help you compare universities, organise application documents and plan the application timeline. Admission decisions remain with the university, and this page does not make a ranking, admission or visa-outcome claim.',
  ]
}

export function buildEnglishInstitutionShadow(source: InstitutionShadowSource): InstitutionDoc {
  const destination = englishDestinationForSource(source)
  return {
    _id: `shadow-en-${source._id}`,
    _type: source._type,
    title: source.title,
    slug: source.slug,
    locale: 'en',
    city: englishCityLabel(source.city),
    country: destination?.title ?? englishCountryLabel(source.country),
    overview: portableParagraphs(institutionCopy(source)),
    destination: destination
      ? {
          title: destination.title,
          slug: destination.slug,
          section:
            source._type === 'languageSchool'
              ? 'languageSchools'
              : source._type === 'boardingSchool'
                ? 'boardingSchools'
                : 'universities',
        }
      : undefined,
    seo: { noIndex: true },
    review: {
      lastReviewed: '2026-08-28',
      timeSensitive: false,
    },
  }
}

export function buildEnglishInstitutionCard(source: InstitutionShadowSource): InstitutionCard {
  const destination = englishDestinationForSource(source)
  return {
    _type: source._type,
    title: source.title,
    slug: source.slug,
    city: englishCityLabel(source.city),
    country: destination?.title ?? englishCountryLabel(source.country),
  }
}

export function institutionMatchesEnglishDestination(
  source: InstitutionShadowSource,
  destinationSlug?: string,
): boolean {
  if (!destinationSlug) return true
  return englishDestinationForSource(source)?.slug === destinationSlug
}

export function buildEnglishSummerShadow(source: SummerShadowSource): SummerProgrammeDoc {
  const format = source.format === 'group' ? 'group' : 'individual'
  const formatLabel = format === 'group' ? 'group summer programme' : 'individual summer programme'

  return {
    _id: `shadow-en-${source._id}`,
    title: source.title,
    slug: source.slug,
    locale: 'en',
    format,
    overview: portableParagraphs([
      `This is an English catalogue profile for ${source.title}, listed as a ${formatLabel}. The current dates, age range, accommodation, supervision, activities and price should be confirmed before a booking is made.`,
      'Happy Education can help families compare the programme with other options and organise the education-booking process. For students under 18, safeguarding and supervision arrangements should be reviewed in writing with the programme provider before commitment.',
    ]),
    providerResponsibilities: portableParagraphs([
      'The programme provider is responsible for the services, supervision and safeguarding arrangements it operates on site. Ask for the current written programme and welfare information before booking.',
    ]),
    happyEducationResponsibilities: portableParagraphs([
      'Happy Education can support the comparison, placement and booking administration and can help you identify information that should be confirmed with the provider.',
    ]),
    parentalRequirements: portableParagraphs([
      'Parents or guardians should review the current programme terms, supervision arrangements, travel requirements and consent documentation before confirming a place.',
    ]),
    seo: { noIndex: true },
    review: {
      lastReviewed: '2026-08-28',
      timeSensitive: false,
    },
  }
}

export function buildEnglishSummerCard(source: SummerShadowSource) {
  return {
    title: source.title,
    slug: source.slug,
    format: source.format === 'group' ? 'group' : 'individual',
  }
}
