import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SearchTemplate } from '@/components/templates/SearchTemplate'

/**
 * Search has its own route rather than living in the catch-all, because it must
 * render dynamically per query while every other content route is statically
 * generated and revalidated. Mixing the two under one route file would force the
 * whole content tree dynamic.
 *
 * The Turkish URL is /tr/arama; a rewrite in next.config.ts maps it here, so both
 * locales share this file while keeping their own public URL.
 */
export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}
  return {
    title: t(locale, 'search.label'),
    // Thin and effectively infinite: never indexed.
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  return <SearchTemplate locale={locale} />
}
