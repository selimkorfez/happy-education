import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import { docPath, sectionPath, HREFLANG, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { absoluteUrl, escapeXml } from '@/lib/seo/urls'

/**
 * RSS 2.0 feed generation.
 *
 * The feed carries titles, links and excerpts, never full article bodies. A
 * full-text feed hands the whole of the site's only original content asset to
 * scrapers in a form they can republish verbatim, and the aggregator copy then
 * competes with the original in search.
 */

const FEED_LIMIT = 20

interface FeedItem {
  title: string | null
  slug: string | null
  excerpt: string | null
  publishedAt: string | null
  updatedAt: string | null
  category: string | null
  author: string | null
}

const FEED_QUERY = /* groq */ `
*[
  _type == "article"
  && locale == $locale
  && defined(slug.current)
  && defined(publishedAt)
  && seo.noIndex != true
  && !(_id in path("drafts.**"))
] | order(publishedAt desc)[0...$limit] {
  title,
  "slug": slug.current,
  excerpt,
  publishedAt,
  updatedAt,
  "category": category->title,
  "author": author->name
}
`

/** RFC 822 date, which is what RSS 2.0 requires. `toUTCString` emits exactly that. */
function rfc822(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date.toUTCString()
}

function tag(name: string, value: string): string {
  return `    <${name}>${escapeXml(value)}</${name}>`
}

export async function buildRssFeed(locale: Locale): Promise<string> {
  const items = await sanityFetch<FeedItem[]>(
    FEED_QUERY,
    { locale, limit: FEED_LIMIT },
    { tags: ['article'], revalidate: 900 },
    [],
  )

  const channelLink = absoluteUrl(sectionPath(locale, 'insights'))
  const selfLink = absoluteUrl(`/feed.xml?locale=${locale}`)

  const newest = items.map((item) => item.publishedAt).find(Boolean) ?? null
  const lastBuild = rfc822(newest) ?? new Date().toUTCString()

  const entries = items
    .map((item) => {
      if (!item.slug || !item.title) return null
      const url = absoluteUrl(docPath(locale, 'insights', item.slug))
      const published = rfc822(item.publishedAt)

      const parts = [
        '  <item>',
        tag('title', item.title),
        tag('link', url),
        // A permalink guid: the URL is stable, so readers de-duplicate correctly
        // even after an article is edited.
        `    <guid isPermaLink="true">${escapeXml(url)}</guid>`,
      ]

      if (item.excerpt) parts.push(tag('description', item.excerpt))
      if (published) parts.push(tag('pubDate', published))
      if (item.category) parts.push(tag('category', item.category))
      // dc:creator is only emitted for a named author; "Happy Education" as a
      // person would be a fabricated byline.
      if (item.author) parts.push(tag('dc:creator', item.author))

      parts.push('  </item>')
      return parts.join('\n')
    })
    .filter((entry): entry is string => entry !== null)

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">',
    '  <channel>',
    tag('title', `${t(locale, 'brand.name')}: ${t(locale, 'nav.insights')}`),
    tag('link', channelLink),
    tag('description', t(locale, 'meta.defaultDescription')),
    tag('language', HREFLANG[locale]),
    `    <lastBuildDate>${escapeXml(lastBuild)}</lastBuildDate>`,
    `    <atom:link href="${escapeXml(selfLink)}" rel="self" type="application/rss+xml" />`,
    ...entries,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n')
}
