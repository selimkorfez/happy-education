import 'server-only'
import { allOfType, deref, slugOf } from './local-source'
import {
  englishCatalogueTitle,
  englishCityLabel,
  englishCountryLabel,
  englishDestinationForSource,
  type InstitutionShadowSource,
} from './shadow-content'
import { listStarterDestinations, listStarterProse } from './starter-content'
import {
  listEditorialArticles,
  listEditorialProse,
  listEditorialTours,
} from './starter-editorial'
import type { SearchResult } from '@/lib/sanity/queries/search'

function normalise(value: string): string {
  return value
    .toLocaleLowerCase('en-GB')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function matches(query: string, ...values: Array<string | undefined>): boolean {
  const needle = normalise(query)
  return values.some((value) => value && normalise(value).includes(needle))
}

function institutionSource(type: string): InstitutionShadowSource[] {
  return allOfType(type, 'tr').map((doc) => {
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
  })
}

function isUsableInstitutionSource(source: InstitutionShadowSource): boolean {
  const title = source.title.trim().toLocaleLowerCase('tr-TR')
  const slug = source.slug.trim().toLowerCase()
  return Boolean(source.slug) && ![
    'universiteler',
    'üniversiteler',
    'universities',
    'university',
  ].includes(title) && !['universiteler', 'universities'].includes(slug)
}

/** Search the useful English preview corpus while the real English CMS tree is empty. */
export function searchEnglishFallback(query: string): SearchResult[] {
  const results: SearchResult[] = []

  for (const section of ['universities', 'languageSchools'] as const) {
    for (const destination of listStarterDestinations('en', section)) {
      if (matches(query, destination.title, destination.intro)) {
        results.push({
          _type: 'destination',
          title: destination.title,
          slug: destination.slug,
          excerpt: destination.intro,
          section,
        })
      }
    }
  }

  for (const type of ['institution', 'languageSchool', 'boardingSchool']) {
    for (const source of institutionSource(type)) {
      if (!isUsableInstitutionSource(source)) continue
      const destination = englishDestinationForSource(source)
      const city = englishCityLabel(source.city)
      const country = destination?.title ?? englishCountryLabel(source.country)
      const title = englishCatalogueTitle(source.title, source.slug)
      if (!matches(query, title, source.title, city, country)) continue
      results.push({
        _type: source._type,
        title,
        slug: source.slug,
        city,
        destinationSlug: source._type === 'boardingSchool' ? undefined : destination?.slug,
      })
    }
  }

  for (const doc of allOfType('summerProgramme', 'tr')) {
    const slug = slugOf(doc) ?? ''
    const format = doc.format === 'group' ? 'group' : 'individual'
    const title = englishCatalogueTitle(doc.title, slug)
    if (!matches(query, title, doc.title, format === 'group' ? 'group summer school' : 'individual summer school')) continue
    results.push({ _type: 'summerProgramme', title, slug, format })
  }

  for (const tour of listEditorialTours('en')) {
    if (matches(query, tour.title, 'educational group tours')) {
      results.push({ _type: 'tour', title: tour.title, slug: tour.slug })
    }
  }

  for (const article of listEditorialArticles('en')) {
    if (matches(query, article.title, article.excerpt, article.category)) {
      results.push({
        _type: 'article',
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
      })
    }
  }

  for (const type of ['guide', 'service'] as const) {
    const docs = [...listStarterProse('en', type), ...listEditorialProse('en', type)]
      .filter((item, index, all) => all.findIndex((other) => other.slug === item.slug) === index)
    for (const doc of docs) {
      if (matches(query, doc.title, doc.summary)) {
        results.push({
          _type: type,
          title: doc.title,
          slug: doc.slug,
          excerpt: doc.summary,
        })
      }
    }
  }

  return results.slice(0, 40)
}
