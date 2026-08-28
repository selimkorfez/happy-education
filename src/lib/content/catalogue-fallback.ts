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

export function listEnglishInstitutionShadows(types: string[], destinationSlug?: string) {
  return types
    .flatMap((type) => allOfType(type, 'tr'))
    .map(institutionSource)
    .filter((source) => isUsableInstitutionSource(source) && institutionMatchesEnglishDestination(source, destinationSlug))
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(buildEnglishInstitutionCard)
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
    .sort((a, b) => a.title.localeCompare(b.title))
    .map(buildEnglishSummerCard)
}

export function getEnglishSummerShadow(slug: string) {
  const doc = allOfType('summerProgramme', 'tr').find((candidate) => slugOf(candidate) === slug)
  return doc ? buildEnglishSummerShadow(summerSource(doc)) : null
}
