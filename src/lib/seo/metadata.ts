import type { Metadata } from 'next'
import { HREFLANG, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import {
  absoluteUrl,
  canonicalPath,
  hreflangAlternates,
  type LocalePaths,
} from '@/lib/seo/urls'

/**
 * Page metadata.
 *
 * Every route builds its `Metadata` through `buildMetadata` so that canonical
 * URLs, hreflang, Open Graph and the Twitter card cannot drift apart. The root
 * layout already sets `metadataBase` and the `%s | Happy Education` title
 * template, so titles passed here are the page title alone, without the brand.
 */

/** A social image. Dimensions are required so the crawler does not have to fetch it. */
export interface SeoImage {
  url: string
  width?: number
  height?: number
  alt?: string
}

/**
 * Fallback social image. The logo rather than a photograph, because a generic
 * stock photo attached to every share would imply the page is about that place.
 */
const DEFAULT_IMAGE: SeoImage = {
  url: '/brand/happy-education-logo.png',
  width: 915,
  height: 384,
  alt: 'Happy Education',
}

export interface BuildMetadataInput {
  locale: Locale
  /** Page title without the brand suffix; the layout template appends it. */
  title?: string
  description?: string
  /** Internal path for this page, e.g. `/en/universities/united-kingdom`. */
  path: string
  image?: SeoImage | string | null
  noIndex?: boolean
  /** ISO 8601. Emitted as Open Graph article timestamps. */
  publishedTime?: string
  modifiedTime?: string
  /**
   * Paths of the versions of this page that genuinely exist, keyed by locale.
   * Omit a locale that has no published translation. When this is left undefined
   * only the canonical is emitted and no hreflang is advertised at all.
   */
  alternates?: LocalePaths
}

function normaliseImage(image: BuildMetadataInput['image']): SeoImage {
  if (!image) return DEFAULT_IMAGE
  if (typeof image === 'string') return { url: image }
  return image
}

export function buildMetadata({
  locale,
  title,
  description,
  path,
  image,
  noIndex = false,
  publishedTime,
  modifiedTime,
  alternates,
}: BuildMetadataInput): Metadata {
  const canonical = canonicalPath(path)
  const resolvedTitle = title ?? t(locale, 'meta.defaultTitle')
  const resolvedDescription = description ?? t(locale, 'meta.defaultDescription')

  const social = normaliseImage(image)
  const socialUrl = social.url.startsWith('http') ? social.url : absoluteUrl(social.url)
  const socialImage = {
    url: socialUrl,
    ...(social.width ? { width: social.width } : {}),
    ...(social.height ? { height: social.height } : {}),
    alt: social.alt ?? resolvedTitle,
  }

  // Only advertise alternates the caller has confirmed exist. `alternates` is
  // deliberately not defaulted to "both locales": guessing produces hreflang that
  // resolves to a 404, which is worse than shipping none.
  const languages = alternates ? hreflangAlternates(alternates) : undefined

  const isArticle = Boolean(publishedTime)

  return {
    title: resolvedTitle,
    description: resolvedDescription,

    alternates: {
      canonical: absoluteUrl(canonical),
      ...(languages && Object.keys(languages).length > 0 ? { languages } : {}),
    },

    // A noIndex page still keeps `follow` so link equity flows onwards, and still
    // carries a canonical so any parameterised variants collapse onto it.
    robots: noIndex
      ? { index: false, follow: true, googleBot: { index: false, follow: true } }
      : {
          index: true,
          follow: true,
          googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
        },

    openGraph: {
      type: isArticle ? 'article' : 'website',
      siteName: t(locale, 'brand.name'),
      title: resolvedTitle,
      description: resolvedDescription,
      url: absoluteUrl(canonical),
      locale: HREFLANG[locale].replace('-', '_'),
      images: [socialImage],
      ...(isArticle
        ? {
            publishedTime,
            ...(modifiedTime ? { modifiedTime } : {}),
          }
        : {}),
    },

    twitter: {
      card: 'summary_large_image',
      title: resolvedTitle,
      description: resolvedDescription,
      images: [socialImage.url],
    },
  }
}

/**
 * Metadata for a route that must never be indexed but is a real, linkable page:
 * search results, thank-you pages, anything thin or infinite. No canonical to a
 * different URL, no hreflang, no social card worth sharing.
 */
export function buildNoIndexMetadata({
  locale,
  title,
  path,
}: {
  locale: Locale
  title?: string
  path: string
}): Metadata {
  return {
    title: title ?? t(locale, 'meta.defaultTitle'),
    alternates: { canonical: absoluteUrl(path) },
    robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
  }
}
