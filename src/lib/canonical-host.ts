import { siteUrl } from '@/lib/env'

/**
 * Whether a request arrived on the site's real domain.
 *
 * WHY THIS EXISTS
 * Keying "is this production?" off `VERCEL_ENV` alone is not enough. A deployment
 * promoted with `vercel --prod` sets `VERCEL_ENV=production` even while it is only
 * reachable at `happy-education.vercel.app`. The site would then invite indexing on
 * a domain that is not the canonical one, which means:
 *
 *   - the Vercel URL competes with happyeducation.uk for the same content
 *   - legal drafts that have not been through solicitor review get indexed
 *   - a search engine can pick the wrong canonical for the whole site
 *
 * The brief is explicit that staging must not be indexable, and a `.vercel.app`
 * production deployment is staging in everything but name until DNS is switched.
 *
 * So indexing requires BOTH: a production environment AND the canonical host.
 */

/** Hostname taken from NEXT_PUBLIC_SITE_URL, e.g. "happyeducation.uk". */
export function canonicalHostname(): string | null {
  try {
    return new URL(siteUrl).hostname.toLowerCase()
  } catch {
    return null
  }
}

/**
 * Compares a request Host header against the canonical hostname.
 * The port is ignored, and a leading "www." is treated as the same site.
 */
export function isCanonicalHost(host: string | null | undefined): boolean {
  const canonical = canonicalHostname()
  if (!canonical || !host) return false

  const requested = host.split(':')[0]?.toLowerCase() ?? ''
  const strip = (value: string) => (value.startsWith('www.') ? value.slice(4) : value)

  return strip(requested) === strip(canonical)
}

/**
 * True only when this response may be indexed: a production build, served from the
 * canonical domain. Everything else — previews, `.vercel.app`, local development —
 * is kept out of search results.
 */
export function isIndexableDeployment(host: string | null | undefined): boolean {
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv && vercelEnv !== 'production') return false
  if (process.env.NODE_ENV !== 'production') return false
  return isCanonicalHost(host)
}
