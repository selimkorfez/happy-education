import 'server-only'
import { allOfType, deref, slugOf, type LocalDoc } from './local-source'
import {
  buildEnglishInstitutionCard,
  buildEnglishInstitutionShadow,
  buildEnglishSummerCard,
  buildEnglishSummerShadow,
  institutionMatchesEnglishDestination,
  type InstitutionShadowSource,
  type SummerShadowSource,
} from './shadow-content'

function institutionSource(doc: LocalDoc): InstitutionShadowSource {
  const destination = deref(doc.destination)
  return {
    _id: doc._id,
    _type: doc._type,
    title: doc.title,
    slug: slugOf(doc) ?? '',
    city: typeof doc.city === 'string' ? doc.city : undefined,
    country: typeof doc.country === 'string' ? doc.country : undefined,
    destination: destination
      ? {
          title: destination.title,
          slug: slugOf(destination) ?? undefined,
          section: typeof destination.section === 'string' ? destination.section : undefined,
        }
      : undefined,
  }
}

function summerSource(doc: LocalDoc): SummerShadowSource {
  return {
    _id: doc._id,
    title: doc.title,
    slug: slugOf(doc) ?? '',
    format: typeof doc.format === 'string' ? doc.format : undefined,
  }
}

/** Migration/navigation artefacts are not real institution records. */
function isUsableInstitutionSource(source: InstitutionShadowSource): boolean {
  if (!source.slug) return false
  const title = source.title.trim().toLocaleLowerCase('tr-TR')
  const slug = source.slug.trim().toLowerCase()
  return ![
    'universiteler',
    'üniversiteler',
    'universities',
    'university',
  ].includes(title) && !['universiteler', 'universities'].includes(slug)
}

/**
 * Editorial Popular order for the temporary pre-CMS catalogue.
 *
 * There is no behavioural popularity dataset yet, so we must not manufacture a
 * numeric ranking. This simply brings a small group of frequently recognised
 * study-abroad institutions/providers to the front, then preserves the migration
 * order for everything else. The UI explicitly says this is curated rather than a
 * live ranking. Once Sanity/analytics has a real popularity signal this function
 * can be replaced without changing the browser UI.
 */
function curatedPopularity(source: InstitutionShadowSource): number {
  const title = source.title.toLocaleLowerCase('en-GB')
  const patterns = source._type === 'languageSchool'
    ? [
        'ec english',
        'kaplan',
        'oxford international',
        'st giles',
        'international house',
        'lsi',
        'kings',
        'stafford house',
        'bell',
      ]
    : source._type === 'boardingSchool'
      ? []
      : [
          'university of oxford',
          'university of cambridge',
          'imperial college london',
          'university college london',
          'ucl',
          "king's college london",
          'london school of economics',
          'university of manchester',
          'university of edinburgh',
          'university of birmingham',
          'university of bristol',
          'university of warwick',
        ]

  const index = patterns.findIndex((pattern) => title.includes(pattern))
  return index === -1 ? 10_000 : index
}

export function listEnglishInstitutionShadows(types: string[], destinationSlug?: string) {
  return types
    .flatMap((type) => allOfType(type, 'tr'))
    .map(institutionSource)
    .filter((source) => isUsableInstitutionSource(source) && institutionMatchesEnglishDestination(source, destinationSlug))
    .map((source, sourceIndex) => ({ source, sourceIndex }))
    .sort((a, b) => curatedPopularity(a.source) - curatedPopularity(b.source) || a.sourceIndex - b.sourceIndex)
    .map(({ source }) => buildEnglishInstitutionCard(source))
}

export function getEnglishInstitutionShadow(slug: string, types: string[]) {
  for (const type of types) {
    const doc = allOfType(type, 'tr').find((candidate) => slugOf(candidate) === slug)
    if (!doc) continue
    const source = institutionSource(doc)
    if (isUsableInstitutionSource(source)) return buildEnglishInstitutionShadow(source)
  }
  return null
}

export function listEnglishSummerShadows(format?: 'individual' | 'group') {
  return allOfType('summerProgramme', 'tr')
    .map(summerSource)
    .filter((source) => !format || (source.format === 'group' ? 'group' : 'individual') === format)
    .map(buildEnglishSummerCard)
}

export function getEnglishSummerShadow(slug: string) {
  const doc = allOfType('summerProgramme', 'tr').find((candidate) => slugOf(candidate) === slug)
  return doc ? buildEnglishSummerShadow(summerSource(doc)) : null
}
