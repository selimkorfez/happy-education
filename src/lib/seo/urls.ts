import { siteUrl } from '@/lib/env'
import { HREFLANG, LOCALES, type Locale } from '@/lib/i18n/config'

/**
 * URL shaping shared by metadata, the sitemap, the feed and the JSON-LD blocks.
 *
 * One rule underpins all of it: a canonical URL has exactly one spelling. Absolute,
 * https, no trailing slash (the locale roots `/en` and `/tr` included), no query
 * string. `next.config.ts` sets `trailingSlash: false`, so anything that emits a
 * trailing slash here would disagree with what the server actually serves and
 * split the signal across two URLs.
 */

/** Normalises any internal path to a leading-slashed, non-trailing-slashed form. */
export function canonicalPath(pathname: string): string {
  const withLeading = pathname.startsWith('/') ? pathname : `/${pathname}`
  const trimmed = withLeading.replace(/\/+$/, '')
  return trimmed.length > 0 ? trimmed : '/'
}

/** Absolute URL for an internal path. */
export function absoluteUrl(pathname: string): string {
  const path = canonicalPath(pathname)
  return path === '/' ? siteUrl : `${siteUrl}${path}`
}

/** A locale-to-path map, as produced by a translation lookup. */
export type LocalePaths = Partial<Record<Locale, string>>

/**
 * hreflang alternates for the `<link rel="alternate">` block.
 *
 * Only locales present in `paths` are advertised. A hreflang pointing at a URL
 * that does not exist is worse than no hreflang at all: it tells Google the pair
 * are equivalent and then hands it a 404, which suppresses both. Since English and
 * Turkish are independently authored trees here, a Turkish page frequently has no
 * English twin, and that must be reflected honestly.
 *
 * `x-default` is emitted only when the English URL exists, because English is the
 * fallback the site is built around. When only Turkish exists there is no sensible
 * default and the key is omitted rather than pointed at a language the visitor may
 * not read.
 */
export function hreflangAlternates(paths: LocalePaths): Record<string, string> {
  const languages: Record<string, string> = {}

  for (const locale of LOCALES) {
    const path = paths[locale]
    if (path) languages[HREFLANG[locale]] = absoluteUrl(path)
  }

  if (paths.en) languages['x-default'] = absoluteUrl(paths.en)

  return languages
}

/** Escapes text for inclusion in an XML text node or attribute value. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
