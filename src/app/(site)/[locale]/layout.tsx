import type { Metadata, Viewport } from 'next'
import { notFound } from 'next/navigation'
import '@/styles/globals.css'
import { fontVariables } from '@/lib/fonts'
import { LOCALES, HREFLANG, isLocale, type Locale } from '@/lib/i18n/config'
import { SiteHeader } from '@/components/chrome/SiteHeader'
import { SiteFooter } from '@/components/chrome/SiteFooter'
import { SkipLink } from '@/components/chrome/SkipLink'
import { ConsentProvider } from '@/components/consent/ConsentProvider'
import { CookieBanner } from '@/components/consent/CookieBanner'
import { Analytics } from '@/components/consent/Analytics'
import { t } from '@/lib/i18n/dictionary'

/** Pre-render both locale trees at build time. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Never cap zoom: WCAG 1.4.4 requires 200% zoom to work.
  maximumScale: 5,
  themeColor: '#faf8f5',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://happyeducation.uk'),
    title: {
      default: t(locale, 'meta.defaultTitle'),
      template: `%s | ${t(locale, 'brand.name')}`,
    },
    description: t(locale, 'meta.defaultDescription'),
    robots: { index: true, follow: true },
  }
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const typed: Locale = locale

  return (
    <html lang={HREFLANG[typed]} className={fontVariables} suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col bg-paper text-fg antialiased">
        <ConsentProvider>
          <SkipLink locale={typed} />
          <SiteHeader locale={typed} />
          <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
            {children}
          </main>
          <SiteFooter locale={typed} />
          <CookieBanner locale={typed} />
          <Analytics />
        </ConsentProvider>
      </body>
    </html>
  )
}
