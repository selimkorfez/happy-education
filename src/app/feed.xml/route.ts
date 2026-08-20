import type { NextRequest } from 'next/server'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n/config'
import { buildRssFeed } from '@/lib/seo/feed'

/**
 * /feed.xml
 *
 * One route serves both languages, selected by query string:
 *
 *   /feed.xml             English (the default locale)
 *   /feed.xml?locale=tr   Turkish
 *
 * A single route rather than a pair, because the locale segment convention used
 * everywhere else (`/tr/feed.xml`) would put the feed inside the localised route
 * tree, where the proxy's locale handling and the `[locale]` layout both apply to
 * something that is not a page. The query string keeps it a plain document.
 *
 * An unrecognised `locale` falls back to English rather than 404-ing: a feed
 * reader that mangles the URL should still get a working feed.
 */

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get('locale')
  const locale = requested && isLocale(requested) ? requested : DEFAULT_LOCALE

  const xml = await buildRssFeed(locale)

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // Fresh for fifteen minutes, servable stale for a day while it refreshes.
      // Feed readers poll hard; this keeps them off the origin.
      'Cache-Control': 'public, max-age=0, s-maxage=900, stale-while-revalidate=86400',
      // Feeds are meant to be fetched by third-party readers.
      'Cross-Origin-Resource-Policy': 'cross-origin',
    },
  })
}
