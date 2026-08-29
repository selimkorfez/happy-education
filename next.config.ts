import type { NextConfig } from 'next'
// Relative import: next.config.ts is loaded before the TypeScript path aliases resolve.
import { getRedirects } from './src/lib/redirects'

/**
 * Headers that do not vary per request live here. The Content-Security-Policy is
 * NOT set here: it carries a per-request nonce so that we can avoid
 * `script-src 'unsafe-inline'`, so it is emitted from `src/middleware.ts`.
 *
 * Cloudflare sits in front of Vercel for this site. Cloudflare must be configured
 * to respect origin cache headers rather than run its own overlapping cache — see
 * docs/DEPLOYMENT.md. These headers are set at the origin so they survive either way.
 */
const securityHeaders = [
  // Stops MIME sniffing turning an uploaded file into an executable script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },

  // Clickjacking. `frame-ancestors` in the CSP is the modern control and is also
  // set in middleware; this is the legacy backstop for older agents.
  { key: 'X-Frame-Options', value: 'DENY' },

  // Send the full URL same-origin, origin-only cross-origin. Keeps enquiry page
  // paths out of third-party referer logs.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },

  // Deny hardware and ambient APIs the site never uses.
  {
    key: 'Permissions-Policy',
    value: [
      'accelerometer=()',
      'autoplay=()',
      'camera=()',
      'display-capture=()',
      'encrypted-media=()',
      'fullscreen=(self)',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'payment=(self "https://js.stripe.com" "https://checkout.stripe.com")',
      'usb=()',
      'interest-cohort=()',
    ].join(', '),
  },

  // Cross-origin isolation hardening.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
]

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fail the production build on type errors rather than shipping them.
  // Linting runs as a separate CI step (`npm run lint`) in Next 16.
  typescript: { ignoreBuildErrors: false },

  trailingSlash: false,
  poweredByHeader: false,

  images: {
    // Sanity remains the CMS source. Wikimedia Commons is additionally allowed for
    // the small audited open-licence registry in src/lib/media/licensed-media.ts.
    // No arbitrary external hostname is accepted and legacy WordPress remains out.
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' },
      { protocol: 'https', hostname: 'commons.wikimedia.org', pathname: '/wiki/Special:Redirect/file/**' },
      { protocol: 'https', hostname: 'upload.wikimedia.org', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 375, 390, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: false,
  },

  experimental: {
    optimizePackageImports: ['@sanity/image-url'],
  },

  async redirects() {
    return getRedirects()
  },

  async rewrites() {
    return [
      { source: '/tr/arama', destination: '/tr/search' },
    ]
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
    ]
  },
}

export default nextConfig
