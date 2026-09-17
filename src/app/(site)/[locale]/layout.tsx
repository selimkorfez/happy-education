import type { Metadata, Viewport } from 'next'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import '@/styles/globals.css'
import '@/styles/travel-motion.css'
import '@/styles/sharp-ui.css'
import { fontVariables } from '@/lib/fonts'
import { LOCALES, HREFLANG, isLocale, type Locale } from '@/lib/i18n/config'
import { SiteHeader } from '@/components/chrome/SiteHeader'
import { SiteFooter } from '@/components/chrome/SiteFooter'
import { SkipLink } from '@/components/chrome/SkipLink'
import { RouteCloudTransition } from '@/components/chrome/RouteCloudTransition'
import { ConsentProvider } from '@/components/consent/ConsentProvider'
import { CookieBanner } from '@/components/consent/CookieBanner'
import { Analytics } from '@/components/consent/Analytics'
import { WhatsAppMascotButton } from '@/components/chrome/WhatsAppMascotButton'
import { t } from '@/lib/i18n/dictionary'
import { imageUrl } from '@/lib/sanity/image'
import { brandThemeStyle, getSiteSettings } from '@/lib/sanity/queries/settings'

/** Pre-render both locale trees at build time. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }))
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Never cap zoom: WCAG 1.4.4 requires 200% zoom to work.
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfaf8' },
    { media: '(prefers-color-scheme: dark)', color: '#00256c' },
  ],
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  const settings = await getSiteSettings()
  const favicon = settings?.brand?.favicon?.licence?.cleared === true
    ? imageUrl(settings.brand.favicon, 192, 192)
    : null
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://happyeducation.uk'),
    title: {
      default: t(locale, 'meta.defaultTitle'),
      template: `%s | ${t(locale, 'brand.name')}`,
    },
    description: t(locale, 'meta.defaultDescription'),
    icons: {
      icon: favicon ?? '/brand/official/favicon-color.svg',
      shortcut: favicon ?? '/brand/official/favicon-color.svg',
      apple: favicon ?? '/brand/official/favicon-color.svg',
    },
    // No `robots` here on purpose. "index, follow" is the crawler default, and
    // declaring it site-wide put a second, contradictory robots meta tag on the
    // 404 page alongside its own noindex.
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
  const settings = await getSiteSettings()
  const savedTheme = (await cookies()).get('happy-education-theme')?.value
  const initialTheme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : undefined

  return (
    <html lang={HREFLANG[typed]} className={fontVariables} style={brandThemeStyle(settings)} data-theme={initialTheme} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body className="flex min-h-dvh flex-col bg-paper text-fg antialiased">
        <ConsentProvider>
          <SkipLink locale={typed} />
          <RouteCloudTransition />
          <div id="route-scene" className="flex min-h-dvh flex-1 flex-col">
            <SiteHeader locale={typed} settings={settings} />
            <main id="main-content" tabIndex={-1} className="flex-1 focus:outline-none">
              {children}
            </main>
            <SiteFooter locale={typed} settings={settings} />
          </div>
          <CookieBanner locale={typed} />
          <WhatsAppMascotButton locale={typed} settings={settings} />
          <Analytics />
        </ConsentProvider>
      </body>
    </html>
  )
}
