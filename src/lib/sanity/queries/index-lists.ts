import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import type { Locale } from '@/lib/i18n/config'

/** Lightweight listings for index pages. */
export async function getProseIndex(
  locale: Locale,
  type: 'guide' | 'service',
): Promise<Array<{ title: string; slug: string; summary?: string }>> {
  return sanityFetch(
    /* groq */ `
      *[_type == $type && locale == $locale && defined(slug.current)] | order(title asc){
        title, "slug": slug.current, summary
      }
    `,
    { locale, type },
    { tags: [type], revalidate: 1800 },
    [],
  )
}
