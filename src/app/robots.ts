import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/env'
import { LOCALES, sectionSegment } from '@/lib/i18n/config'

/**
 * /robots.txt
 *
 * Production allows everything except the routes that should never be indexed.
 * Any other Vercel environment (preview, development) disallows the whole site:
 * a preview deployment competing with production for the same content is a
 * duplicate-content problem that is far easier to prevent than to unwind.
 *
 * `src/proxy.ts` also sets `X-Robots-Tag: noindex, nofollow` on non-production
 * deployments. Two independent controls, because a missed robots.txt on a preview
 * URL can take months to clear from the index.
 */

/** Search result pages: thin, effectively infinite, and never a landing page. */
const searchPaths = LOCALES.map((locale) => `/${locale}/${sectionSegment(locale, 'search')}`)

export default function robots(): MetadataRoute.Robots {
  const vercelEnv = process.env.VERCEL_ENV
  const isPreview = Boolean(vercelEnv) && vercelEnv !== 'production'

  if (isPreview) {
    return {
      rules: [{ userAgent: '*', disallow: '/' }],
    }
  }

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          // Form handlers, webhooks and the Stripe callbacks. Nothing here renders.
          '/api/',
          // Sanity Studio. Authenticated, and its bundle is not content.
          // Draft-mode entry points sit under /api/ and are already covered.
          '/studio',
          ...searchPaths,
          // Query-string search, in whichever locale it is reached from.
          '/*?q=',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
