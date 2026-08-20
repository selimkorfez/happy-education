import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import type { MediaSource } from '@/components/ui/MediaFrame'
import type { Locale } from '@/lib/i18n/config'

/**
 * Article queries.
 *
 * Every projection here selects explicit fields rather than returning whole
 * documents. That keeps the payload small and, more importantly, means an editor
 * adding an internal-only field never leaks it to the client bundle.
 */

export interface ArticleCard {
  title: string
  slug: string
  excerpt?: string
  category?: string
  publishedAt?: string
  updatedAt?: string
  readingMinutes?: number
  image?: MediaSource
  imageAlt?: string
}

const CARD_PROJECTION = /* groq */ `
  title,
  "slug": slug.current,
  excerpt,
  "category": category->title,
  publishedAt,
  updatedAt,
  readingMinutes,
  "image": leadImage{
    ...,
    "licence": leadImage.licence
  },
  "imageAlt": leadImage.alt
`

export async function getLatestArticles(locale: Locale, limit = 5): Promise<ArticleCard[]> {
  return sanityFetch<ArticleCard[]>(
    /* groq */ `
      *[_type == "article" && locale == $locale && defined(slug.current) && !(_id in path("drafts.**"))]
        | order(coalesce(publishedAt, _createdAt) desc)[0...$limit] {
          ${CARD_PROJECTION}
        }
    `,
    { locale, limit },
    { tags: ['article'], revalidate: 900 },
    [],
  )
}

export async function getArticlesByCategory(
  locale: Locale,
  categorySlug: string | null,
  limit = 24,
): Promise<ArticleCard[]> {
  return sanityFetch<ArticleCard[]>(
    /* groq */ `
      *[
        _type == "article"
        && locale == $locale
        && defined(slug.current)
        && ($categorySlug == null || category->slug.current == $categorySlug)
      ] | order(coalesce(publishedAt, _createdAt) desc)[0...$limit] {
        ${CARD_PROJECTION}
      }
    `,
    { locale, categorySlug, limit },
    { tags: ['article'], revalidate: 900 },
    [],
  )
}

/** Slugs for `generateStaticParams`. */
export async function getAllArticleSlugs(): Promise<Array<{ locale: Locale; slug: string }>> {
  return sanityFetch<Array<{ locale: Locale; slug: string }>>(
    /* groq */ `
      *[_type == "article" && defined(slug.current)] { locale, "slug": slug.current }
    `,
    {},
    { tags: ['article'], revalidate: 3600 },
    [],
  )
}
