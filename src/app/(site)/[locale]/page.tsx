import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { siteUrl } from '@/lib/env'
import { HomeHero } from '@/components/home/HomeHero'
import { HelpMeChoose } from '@/components/home/HelpMeChoose'
import { DestinationIndex } from '@/components/home/DestinationIndex'
import { HowWeWork } from '@/components/home/HowWeWork'
import { StudentVoices } from '@/components/home/StudentVoices'
import { LatestInsights } from '@/components/home/LatestInsights'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { OrganizationSchema } from '@/components/seo/OrganizationSchema'

export const revalidate = 3600

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  if (!isLocale(locale)) return {}

  return {
    title: t(locale, 'meta.defaultTitle'),
    description: t(locale, 'meta.defaultDescription'),
    alternates: {
      canonical: `${siteUrl}/${locale}`,
      languages: {
        'en-GB': `${siteUrl}/en`,
        'tr-TR': `${siteUrl}/tr`,
        'x-default': `${siteUrl}/en`,
      },
    },
    openGraph: {
      type: 'website',
      locale: locale === 'tr' ? 'tr_TR' : 'en_GB',
      url: `${siteUrl}/${locale}`,
      siteName: t(locale, 'brand.name'),
      title: t(locale, 'meta.defaultTitle'),
      description: t(locale, 'meta.defaultDescription'),
    },
  }
}

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  if (!isLocale(locale)) notFound()
  const typed: Locale = locale

  return (
    <>
      <OrganizationSchema locale={typed} />
      <HomeHero locale={typed} />
      <HelpMeChoose locale={typed} />
      <DestinationIndex locale={typed} />
      <HowWeWork locale={typed} />
      <StudentVoices locale={typed} />
      <LatestInsights locale={typed} />
      <ConsultationBand locale={typed} />
    </>
  )
}
