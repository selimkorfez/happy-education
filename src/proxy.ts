import { NextResponse, type NextRequest } from 'next/server'
import { DEFAULT_LOCALE, LOCALES, SECTIONS, isLocale, type Locale } from '@/lib/i18n/config'
import { isGone } from '@/lib/redirects'

/**
 * Next.js 16 renamed the middleware convention to `proxy`. This file does two jobs:
 *
 *  1. Emits a per-request Content-Security-Policy carrying a nonce, so we never
 *     need `script-src 'unsafe-inline'`. Next.js reads the nonce off the
 *     `x-nonce` request header and stamps it onto its own inline bootstrap
 *     scripts automatically.
 *
 *  2. Sends locale-less URLs to a locale root. It NEVER rewrites an explicit
 *     /en path into Turkish content or vice versa: an explicit locale in the URL
 *     is authoritative and is left alone. Language negotiation only applies to
 *     the bare `/`.
 */

/** Hosts the browser is permitted to talk to. Keep this list short and justified. */
const CSP_SOURCES = {
  // GTM is loaded only after analytics consent; it still needs to be allowlisted
  // for the moment consent is granted. Stripe is required for Checkout redirect
  // and Payment Element. Turnstile guards the high-abuse forms.
  script: ['https://js.stripe.com', 'https://challenges.cloudflare.com', 'https://www.googletagmanager.com'],
  connect: [
    'https://api.stripe.com',
    'https://cdn.sanity.io',
    'https://*.api.sanity.io',
    'https://*.apicdn.sanity.io',
    'https://www.google-analytics.com',
    'https://*.analytics.google.com',
    'https://*.googletagmanager.com',
  ],
  frame: ['https://js.stripe.com', 'https://hooks.stripe.com', 'https://challenges.cloudflare.com'],
  img: ['https://cdn.sanity.io', 'https://www.googletagmanager.com', 'https://*.google-analytics.com'],
}

function buildCsp(nonce: string, isDev: boolean): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],

    // `strict-dynamic` lets a nonced loader (GTM) pull its own dependencies without
    // us allowlisting every downstream host, while still blocking injected inline
    // script. Browsers that honour strict-dynamic ignore the host list; older ones
    // fall back to it, so both are supplied.
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...CSP_SOURCES.script,
      // Dev only: Next's fast-refresh client uses eval.
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],

    // Styles: Next injects inline <style> for CSS-in-JS and critical CSS without a
    // nonce, so 'unsafe-inline' is unavoidable here. Documented as accepted risk in
    // docs/SECURITY.md — the impact is style injection only, and script-src remains
    // nonce-locked, which is where the real risk sits.
    'style-src': ["'self'", "'unsafe-inline'"],

    'img-src': ["'self'", 'data:', 'blob:', ...CSP_SOURCES.img],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", ...CSP_SOURCES.connect, ...(isDev ? ['ws:', 'wss:'] : [])],
    'frame-src': ["'self'", ...CSP_SOURCES.frame],
    'media-src': ["'self'", 'https://cdn.sanity.io'],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],

    // Nothing may embed this site. Stops clickjacked consultation/payment flows.
    'frame-ancestors': ["'none'"],

    // Forms may only post back to us — blocks an injected form exfiltrating a lead.
    'form-action': ["'self'"],

    'base-uri': ["'self'"],
    'object-src': ["'none'"],
  }

  const parts = Object.entries(directives).map(([k, v]) => `${k} ${v.join(' ')}`)
  if (!isDev) parts.push('upgrade-insecure-requests')
  return parts.join('; ')
}

/** The search route in either locale: /en/search and /tr/arama. */
const SEARCH_PATHS = new Set(LOCALES.map((locale) => `/${locale}/${SECTIONS.search[locale]}`))

function isSearchPath(pathname: string): boolean {
  const withoutTrailingSlash = pathname.replace(/\/+$/, '') || '/'
  return SEARCH_PATHS.has(withoutTrailingSlash)
}

/** Picks a locale from Accept-Language, defaulting to English (also the x-default). */
function negotiateLocale(header: string | null): Locale {
  if (!header) return DEFAULT_LOCALE
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag = '', ...params] = part.trim().split(';')
      const qParam = params.find((p) => p.trim().startsWith('q='))
      const q = qParam ? Number.parseFloat(qParam.split('=')[1] ?? '1') : 1
      return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 0 }
    })
    .sort((a, b) => b.q - a.q)

  for (const { tag } of ranked) {
    const base = tag.split('-')[0]
    if (base && isLocale(base)) return base
  }
  return DEFAULT_LOCALE
}

export default function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const isDev = process.env.NODE_ENV === 'development'
  const csp = buildCsp(nonce, isDev)

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set('content-security-policy', csp)
  // Server components cannot read the request URL directly. The header lets the
  // header/footer build breadcrumb and language-switch links without client JS.
  requestHeaders.set('x-pathname', pathname)
  // Full URL including the query string, so server components can read search params
  // on routes reached through the catch-all (which does not thread searchParams down).
  requestHeaders.set('x-url', request.nextUrl.toString())

  /*
   * Genuinely obsolete legacy URLs return 410 Gone rather than 404.
   * 410 tells a crawler the URL is intentionally dead and will not return, which
   * removes it from the index faster and more cleanly than a soft 404. These are
   * the WooCommerce and LearnPress plugin artefacts and the theme demo pages,
   * none of which has a legitimate replacement.
   */
  if (isGone(pathname)) {
    return new NextResponse(null, {
      status: 410,
      headers: {
        'Content-Security-Policy': csp,
        'X-Robots-Tag': 'noindex',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  const firstSegment = pathname.split('/')[1] ?? ''

  // Bare root, or any path without a recognised locale prefix, goes to a locale root.
  // Everything under /en or /tr is served as-is.
  if (!isLocale(firstSegment)) {
    // Static files and internals are excluded by `config.matcher`, so anything
    // arriving here is a content path.
    const target = negotiateLocale(request.headers.get('accept-language'))
    const url = request.nextUrl.clone()
    url.pathname = pathname === '/' ? `/${target}` : `/${target}${pathname}`
    url.search = search

    const redirect = NextResponse.redirect(url, 307)
    redirect.headers.set('Content-Security-Policy', csp)
    // Vary so a cached redirect is not served to a visitor with a different language.
    redirect.headers.set('Vary', 'Accept-Language')
    return redirect
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  response.headers.set('Content-Security-Policy', csp)

  /*
   * Search result pages must not be indexed: they are thin and effectively
   * infinite.
   *
   * Matching the literal string "search" missed the Turkish URL entirely, because
   * it is /tr/arama. The segments are read from the locale registry so this cannot
   * drift again if a segment is renamed.
   */
  if (isSearchPath(pathname)) {
    response.headers.set('X-Robots-Tag', 'noindex, follow')
  }

  // Any non-production deployment must be invisible to crawlers.
  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production') {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *   api                        route handlers. CRITICAL: without this they are
     *                              treated as locale-less content paths and 307'd
     *                              to /en/api/..., which does not exist. Stripe
     *                              does not follow redirects, so the payment
     *                              webhook would fail silently in production.
     *   _next/static, _next/image  build output
     *   favicon/robots/sitemap/feed crawler files served from the app
     *   studio                     the Sanity Studio route handles its own auth,
     *                              and its bundle needs different CSP handling
     *   files with an extension    static assets in /public
     */
    '/((?!api|_next/static|_next/image|studio|favicon\\.ico|robots\\.txt|feed\\.xml|sitemap.*\\.xml|.*\\.[\\w]+$).*)',
  ],
}
