import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { SortableCardGrid } from '@/components/content/SortableCardGrid'
import { EmptySection } from './shared'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { licensedMediaForPlace } from '@/lib/media/licensed-media'
import { licensedMediaForEditorialText, licensedMediaForEditorialVariant } from '@/lib/media/editorial-media'
import { listSummerProgrammes } from '@/lib/sanity/queries/content'

/** Listing of summer programmes for one format. */
export async function SummerListingTemplate({
  locale,
  format,
  formatSlug,
}: {
  locale: Locale
  format: 'individual' | 'group'
  formatSlug: string
}) {
  const copy = COPY[locale][format]
  const programmes = await listSummerProgrammes(locale, format)

  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'nav.summerSchools'), href: sectionPath(locale, 'summerSchools') },
    { label: copy.title },
  ]

  return (
    <>
      <PageHero locale={locale} crumbs={crumbs} title={copy.title} intro={copy.intro} visualVariant="summer" />
      <Container>
        <div className="py-12">
          {programmes.length === 0 ? (
            <EmptySection locale={locale} contactHref={sectionPath(locale, 'contact')} />
          ) : (
            <SortableCardGrid
              locale={locale}
              items={programmes.map((programme) => {
                const clearedCmsImage = programme.heroImage?.licence?.cleared === true
                return {
                  href: docPath(locale, 'summerSchools', formatSlug, programme.slug),
                  title: programme.title,
                  meta: [programme.city, programme.ageRange].filter(Boolean).join(' · ') || undefined,
                  image: clearedCmsImage ? programme.heroImage : undefined,
                  externalImage: clearedCmsImage
                    ? null
                    : licensedMediaForPlace(programme.city)
                      ?? licensedMediaForEditorialText(programme.title, programme.city, 'summer programme')
                      ?? licensedMediaForEditorialVariant('summer'),
                  imageAlt: programme.heroImage?.alt ?? programme.title,
                }
              })}
            />
          )}
        </div>
      </Container>
      <ConsultationBand locale={locale} />
    </>
  )
}

const COPY = {
  en: {
    individual: {
      title: 'Individual summer schools',
      intro:
        'Programmes a student joins on their own. The school provides supervision, accommodation and a full activity programme alongside lessons.',
    },
    group: {
      title: 'Group summer schools',
      intro:
        'Programmes for groups travelling together with a group leader, with the itinerary and supervision arranged in advance.',
    },
  },
  tr: {
    individual: {
      title: 'Bireysel yaz okulları',
      intro:
        'Öğrencinin tek başına katıldığı programlar. Okul; gözetim, konaklama ve derslerin yanında tam bir aktivite programı sunar.',
    },
    group: {
      title: 'Grup yaz okulları',
      intro:
        'Refakatçi eşliğinde birlikte seyahat eden gruplar için düzenlenen, programı ve gözetimi önceden planlanan seçenekler.',
    },
  },
} as const
