import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import type { Locale } from '@/lib/i18n/config'
import { isConfigured } from '@/lib/env'
import { hasLocalContent } from '@/lib/content/local-source'
import { localSearch } from '@/lib/content/local-queries'

/**
 * Site search.
 *
 * Implemented with GROQ's `match` against the Sanity dataset rather than an
 * external search service. That is the right starting point here: the corpus is a
 * few hundred documents in two languages, it costs nothing extra to operate, and
 * it keeps visitor queries inside infrastructure we already have a processor
 * agreement with.
 *
 * Search is locale-scoped, so a Turkish visitor never gets English results mixed in.
 *
 * If the corpus grows past a few thousand documents or the business wants typo
 * tolerance and ranking control, this is the seam to swap for Algolia or Typesense:
 * the route and UI depend only on `SearchResult`.
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

/**
 * Escapes GROQ string-literal metacharacters and builds a prefix-match term.
 * The value is still passed as a bound parameter; this only shapes the wildcard.
 */
export function toMatchTerm(query: string): string | null {
  const cleaned = query
    .trim()
    .replace(/["'\\*]/g, ' ')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
  if (cleaned.length < 2) return null
  // Prefix-match each word so "lond" finds "London".
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((word) => `${word}*`)
    .join(' ')
}

export async function searchContent(locale: Locale, query: string): Promise<SearchResult[]> {
  const term = toMatchTerm(query)
  if (!term) return []

  // Before Sanity exists, search the migrated bundle so the page is not a dead end.
  if (!isConfigured.sanity() && hasLocalContent()) return localSearch(locale, query)

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
    // Short revalidation: search should reflect newly published content quickly.
    { tags: ['search'], revalidate: 300 },
    [],
  )
}
