import { siteUrl } from '@/lib/env'
import { docPath, HREFLANG, type Locale } from '@/lib/i18n/config'
import { BUSINESS } from '@/lib/business-facts'
import { schemaImage } from '@/lib/seo/jsonld'
import type { ArticleDoc } from '@/lib/sanity/queries/content'

/**
 * Article structured data.
 *
 * The author is only declared when a real, consented person is recorded. Where no
 * author exists the publisher is named instead, which is accurate, rather than
 * inventing a person to satisfy the schema.
 *
 * The lead image is included only once its licence is cleared, because a schema
 * reference is a publication: Google fetches the URL and may show the image in
 * search results.
 */
export function ArticleSchema({ locale, doc }: { locale: Locale; doc: ArticleDoc }) {
  const url = `${siteUrl}${docPath(locale, 'insights', doc.slug)}`
  const hasAuthor = Boolean(doc.author?.name && doc.author.consentOnFile)

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    headline: doc.title,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    inLanguage: HREFLANG[locale],
    publisher: { '@id': `${siteUrl}/#organization`, '@type': 'Organization', name: BUSINESS.tradingName.value },
    author: hasAuthor
      ? { '@type': 'Person', name: doc.author?.name, jobTitle: doc.author?.role }
      : { '@id': `${siteUrl}/#organization` },
  }

  const image = schemaImage(doc.leadImage)
  if (image) schema.image = image

  if (doc.excerpt) schema.description = doc.excerpt
  if (doc.publishedAt) schema.datePublished = doc.publishedAt
  if (doc.updatedAt ?? doc.publishedAt) schema.dateModified = doc.updatedAt ?? doc.publishedAt
  if (doc.category?.title) schema.articleSection = doc.category.title
  if (doc.tags?.length) schema.keywords = doc.tags.join(', ')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
    />
  )
}
