import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import type { Locale } from '@/lib/i18n/config'
import { isConfigured } from '@/lib/env'
import { hasLocalContent } from '@/lib/content/local-source'
import { localSearch } from '@/lib/content/local-queries'
import { searchEnglishFallback } from '@/lib/content/fallback-search'

/**
 * Site search.
 *
 * Implemented with GROQ's `match` against the Sanity dataset once the CMS is live.
 * Before that, Turkish searches use the migrated bundle and English searches use
 * the deliberately safe preview catalogue/editorial layer.
 */

export interface SearchResult {
  _type: string
  title: string
  slug: string
  excerpt?: string
  section?: string
  city?: string
  destinationSlug?: string
  format?: string
}

const SEARCHABLE = [
  'destination',
  'institution',
  'languageSchool',
  'boardingSchool',
  'summerProgramme',
  'tour',
  'article',
  'guide',
  'service',
] as const

export function toMatchTerm(query: string): string | null {
  const cleaned = query
    .trim()
    .replace(/["'\\*]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
  if (cleaned.length < 2) return null
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word}*`)
    .join(' ')
}

export async function searchContent(locale: Locale, query: string): Promise<SearchResult[]> {
  const term = toMatchTerm(query)
  if (!term) return []

  if (!isConfigured.sanity() && hasLocalContent()) {
    return locale === 'en' ? searchEnglishFallback(query) : localSearch(locale, query)
  }

  return sanityFetch<SearchResult[]>(
    /* groq */ `
      *[
        _type in $types
        && locale == $locale
        && defined(slug.current)
        && (
          title match $term
          || excerpt match $term
          || intro match $term
          || summary match $term
          || city match $term
          || country match $term
          || pt::text(body) match $term
          || pt::text(overview) match $term
        )
      ][0...40]{
        _type,
        title,
        "slug": slug.current,
        "excerpt": coalesce(excerpt, intro, summary),
        section,
        city,
        format,
        "destinationSlug": destination->slug.current
      }
    `,
    { locale, term, types: [...SEARCHABLE] },
    { tags: ['search'], revalidate: 300 },
    [],
  )
}
