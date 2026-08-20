import type { NextConfig } from 'next'

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

  // X-XSS-Protection is deliberately omitted: it is deprecated and its filter has
  // itself been a source of vulnerabilities. CSP is the control.
]

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Fail the production build on type errors rather than shipping them.
  // Linting runs as a separate CI step (`npm run lint`) in Next 16.
  typescript: { ignoreBuildErrors: false },

  // Trailing slashes off: one canonical form per URL, no duplicate-content pairs.
  trailingSlash: false,

  poweredByHeader: false,

  images: {
    // Sanity's CDN is the only remote image source. Nothing is ever hotlinked
    // from the legacy WordPress host.
    remotePatterns: [{ protocol: 'https', hostname: 'cdn.sanity.io', pathname: '/**' }],
    formats: ['image/avif', 'image/webp'],
    // Matches the layout breakpoints in the design system.
    deviceSizes: [320, 375, 390, 640, 768, 1024, 1280, 1440, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // SVG from the CMS is never rendered through the image optimiser.
    dangerouslyAllowSVG: false,
  },

  experimental: {
    // Rich text and schema helpers are server-only; keep them out of the client graph.
    optimizePackageImports: ['@sanity/image-url'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Immutable build assets.
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
      {
        // Never cache anything that mutates state or carries a signature.
        // Cloudflare must also be configured to bypass cache on /api/*.
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
