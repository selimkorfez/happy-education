import { siteUrl } from '@/lib/env'
import { HREFLANG, homePath, sectionPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { absoluteUrl } from '@/lib/seo/urls'
import { compact, jsonLdHtml, ORGANIZATION_ID } from '@/lib/seo/jsonld'

/**
 * WebSite structured data.
 *
 * One node per locale tree, linked to the Organization emitted by
 * `OrganizationSchema` through its `@id` so the two describe the same publisher
 * rather than two unrelated entities.
 *
 * The `SearchAction` is opt-in. Declaring one tells Google a sitelinks search box
 * is available and hands it a URL template it will actually request; if the search
 * route is not live, or is not reachable by GET with a `q` parameter, the
 * declaration is a promise the site cannot keep. Callers pass `hasSearch` only
 * from a page that knows the search route is built.
 */
export function WebSiteSchema({
  locale,
  hasSearch = false,
}: {
  locale: Locale
  /** Set only once the site search route is live and accepts `?q=`. */
  hasSearch?: boolean
}) {
  const home = absoluteUrl(homePath(locale))

  const schema = compact({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${home}#website`,
    url: home,
    name: t(locale, 'brand.name'),
    description: t(locale, 'meta.defaultDescription'),
    inLanguage: HREFLANG[locale],
    publisher: { '@id': ORGANIZATION_ID },
    potentialAction: hasSearch
      ? {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${siteUrl}${sectionPath(locale, 'search')}?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        }
      : undefined,
  })

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdHtml(schema) }}
    />
  )
}
