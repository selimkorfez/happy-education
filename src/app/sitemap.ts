import type { MetadataRoute } from 'next'
import { collectSitemapEntries } from '@/lib/seo/sitemap'

/**
 * /sitemap.xml
 *
 * Both locale trees, every indexable document, with per-URL hreflang alternates.
 * All of the work lives in `@/lib/seo/sitemap` so the same collection can feed a
 * sitemap index later without this file changing.
 *
 * Revalidated hourly rather than rebuilt on demand: a new article should show up
 * to crawlers within the hour, and an hourly regeneration of roughly a thousand
 * URLs is cheap. `sanityFetch` returns its fallback when Sanity is unconfigured or
 * unreachable, so this degrades to the static routes instead of failing the build.
 */
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return collectSitemapEntries()
}
