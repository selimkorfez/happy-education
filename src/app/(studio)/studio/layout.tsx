import type { Metadata } from 'next'

/**
 * The Studio is its own root layout: it needs a bare document without the site
 * chrome, fonts or consent provider.
 *
 * Access is controlled by Sanity project membership. There is no public
 * registration, no self-service sign-up, and no route here that reads or writes
 * content without an authenticated Sanity session. Enable SSO and enforce 2FA on
 * the Sanity organisation — see docs/SECURITY.md.
 */
export const metadata: Metadata = {
  title: 'Happy Education CMS',
  // The Studio must never appear in search results.
  robots: { index: false, follow: false },
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  )
}
