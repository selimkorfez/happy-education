import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import { isConfigured } from '@/lib/env'
import { listStarterProse } from '@/lib/content/starter-content'
import { listEditorialProse } from '@/lib/content/starter-editorial'
import type { Locale } from '@/lib/i18n/config'

/** Lightweight listings for index pages. */
export async function getProseIndex(
  locale: Locale,
  type: 'guide' | 'service',
): Promise<Array<{ title: string; slug: string; summary?: string }>> {
  if (!isConfigured.sanity()) {
    return [...listStarterProse(locale, type), ...listEditorialProse(locale, type)]
      .filter((item, index, all) => all.findIndex((other) => other.slug === item.slug) === index)
      .sort((a, b) => a.title.localeCompare(b.title))
  }

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
