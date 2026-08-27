import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import { isConfigured } from '@/lib/env'
import { listStarterProse } from '@/lib/content/starter-content'
import type { Locale } from '@/lib/i18n/config'

/** Lightweight listings for index pages. */
export async function getProseIndex(
  locale: Locale,
  type: 'guide' | 'service',
): Promise<Array<{ title: string; slug: string; summary?: string }>> {
  // The migrated WordPress bundle contains no guide/service document type. Until
  // Sanity is configured, use the deliberately small safe starter set rather than
  // rendering a dead section index. Once the CMS is connected it becomes the sole
  // source of truth and this fallback is no longer consulted.
  if (!isConfigured.sanity()) return listStarterProse(locale, type)

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
