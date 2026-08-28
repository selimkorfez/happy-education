import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import type { MediaSource } from '@/components/ui/MediaFrame'
import type { Locale } from '@/lib/i18n/config'
import { isConfigured } from '@/lib/env'
import { hasLocalContent } from '@/lib/content/local-source'
import * as local from '@/lib/content/local-queries'
import { listEditorialArticles } from '@/lib/content/starter-editorial'

/** Sanity always wins; local/starter content answers only before it is configured. */
function shouldReadLocalBundle(): boolean {
  return !isConfigured.sanity() && hasLocalContent()
}

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
  if (shouldReadLocalBundle()) {
    const migrated = local.localListArticles(locale, limit)
    if (migrated.length > 0) return migrated
    return listEditorialArticles(locale).slice(0, limit)
  }
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
  if (shouldReadLocalBundle()) {
    const migrated = local.localListArticles(locale, limit, categorySlug)
    if (migrated.length > 0) return migrated
    const starters = listEditorialArticles(locale)
    if (!categorySlug) return starters.slice(0, limit)
    const needle = categorySlug.toLowerCase()
    return starters
      .filter((article) => article.category?.toLowerCase().replace(/[^a-z0-9]+/g, '-') === needle)
      .slice(0, limit)
  }
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

export async function getAllArticleSlugs(): Promise<Array<{ locale: Locale; slug: string }>> {
  if (!isConfigured.sanity()) {
    return listEditorialArticles('en').map((article) => ({ locale: 'en' as const, slug: article.slug }))
  }
  return sanityFetch<Array<{ locale: Locale; slug: string }>>(
    /* groq */ `
      *[_type == "article" && defined(slug.current)] { locale, "slug": slug.current }
    `,
    {},
    { tags: ['article'], revalidate: 3600 },
    [],
  )
}
