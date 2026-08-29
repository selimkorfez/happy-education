import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { SortableCardGrid } from '@/components/content/SortableCardGrid'
import { SummerListingTemplate } from './SummerListingTemplate'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { isConfigured } from '@/lib/env'
import { listEnglishSummerShadows } from '@/lib/content/catalogue-fallback'

export async function StarterAwareSummerListingTemplate({
  locale,
  format,
  formatSlug,
}: {
  locale: Locale
  format: 'individual' | 'group'
  formatSlug: string
}) {
  if (locale !== 'en' || isConfigured.sanity()) {
    return <SummerListingTemplate locale={locale} format={format} formatSlug={formatSlug} />
  }

  const programmes = listEnglishSummerShadows(format)
  if (programmes.length === 0) {
    return <SummerListingTemplate locale={locale} format={format} formatSlug={formatSlug} />
  }

  const copy = format === 'group'
    ? {
        title: 'Group summer schools',
        intro: 'Browse group programmes already present in the migrated catalogue. Current dates, ages, prices and safeguarding arrangements are confirmed before booking.',
      }
    : {
        title: 'Individual summer schools',
        intro: 'Browse individual programmes already present in the migrated catalogue. Current dates, ages, prices and safeguarding arrangements are confirmed before booking.',
      }

  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'nav.summerSchools'), href: sectionPath(locale, 'summerSchools') },
    { label: copy.title },
  ]

  return (
    <>
      <PageHero locale={locale} crumbs={crumbs} title={copy.title} intro={copy.intro} />
      <Container>
        <div className="py-12">
          <SortableCardGrid
            locale={locale}
            items={programmes.map((programme) => ({
              href: docPath(locale, 'summerSchools', formatSlug, programme.slug),
              title: programme.title,
            }))}
          />
        </div>
      </Container>
      <ConsultationBand locale={locale} />
    </>
  )
}
