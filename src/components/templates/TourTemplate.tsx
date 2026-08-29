import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { ReviewMeta } from '@/components/shared/ReviewMeta'
import { ProseSection, FactTable, DetailList, IncludedExcluded } from './shared'
import { ProgrammeEnquiryPanel } from './ProgrammeEnquiryPanel'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import type { TourDoc } from '@/lib/sanity/queries/content'

/**
 * Tour page.
 *
 * Availability is shown as a plain status from the CMS. There is deliberately no
 * places-remaining counter and no countdown: manufactured scarcity is a dark
 * pattern, and the brief rules it out unless it comes from real availability data.
 */
export function TourTemplate({ locale, doc }: { locale: Locale; doc: TourDoc }) {
  const copy = COPY[locale]
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'nav.tours'), href: sectionPath(locale, 'tours') },
    { label: doc.title },
  ]

  const availabilityLabel = doc.availability ? copy.availability[doc.availability] : undefined

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={doc.destination?.title}
        title={doc.title}
        image={doc.heroImage ?? null}
        imageAlt={doc.heroImage?.alt ?? doc.title}
        visualVariant="tours"
      />

      <Container>
        <div className="grid gap-12 py-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ProseSection locale={locale} title={copy.overview} body={doc.overview} id="overview" />
            <ProseSection locale={locale} title={copy.itinerary} body={doc.itinerary} id="itinerary" />
            <ProseSection locale={locale} title={copy.dates} body={doc.dates} />
            <IncludedExcluded locale={locale} included={doc.included} excluded={doc.excluded} />
            <FactTable locale={locale} title={copy.price} facts={doc.price} />
            <ProseSection locale={locale} title={copy.cancellation} body={doc.cancellationTerms} />

            {doc.safeguardingNote ? (
              <section className="border-t border-border py-10">
                <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">
                  {copy.safeguarding}
                </h2>
                <p className="mt-3 border-l-2 border-warning bg-paper-sunk p-4 text-sm leading-relaxed text-fg-muted">
                  {copy.safeguardingIntro}
                </p>
                <div className="mt-4">
                  <ProseSection locale={locale} title="" body={doc.safeguardingNote} />
                </div>
              </section>
            ) : null}

            <ReviewMeta locale={locale} review={doc.review} className="mt-10" />
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <DetailList
                title={copy.atAGlance}
                items={[
                  { label: copy.destination, value: doc.destination?.title },
                  { label: copy.ageEligibility, value: doc.ageEligibility },
                  { label: copy.availabilityLabel, value: availabilityLabel },
                ]}
              />
              <ProgrammeEnquiryPanel
                locale={locale}
                programmeTitle={doc.title}
                programmePath={docPath(locale, 'tours', doc.slug)}
              />
            </div>
          </aside>
        </div>
      </Container>
    </>
  )
}

const COPY = {
  en: {
    overview: 'About this tour',
    itinerary: 'Itinerary',
    dates: 'Dates',
    price: 'Price',
    cancellation: 'Cancellation terms',
    safeguarding: 'Travelling with minors',
    safeguardingIntro:
      'Where students under 18 travel, supervision arrangements, consent requirements and emergency procedures are set out before booking. We do not make safety guarantees on behalf of a third-party operator.',
    atAGlance: 'At a glance',
    destination: 'Destination',
    ageEligibility: 'Age eligibility',
    availabilityLabel: 'Availability',
    availability: {
      open: 'Open for enquiries',
      waitlist: 'Waiting list',
      closed: 'Closed',
    } as Record<string, string>,
  },
  tr: {
    overview: 'Tur hakkında',
    itinerary: 'Program',
    dates: 'Tarihler',
    price: 'Ücret',
    cancellation: 'İptal koşulları',
    safeguarding: '18 yaş altı katılımcılar',
    safeguardingIntro:
      '18 yaşından küçük öğrencilerin katıldığı turlarda gözetim düzenlemeleri, veli onayı koşulları ve acil durum prosedürleri kayıt öncesinde paylaşılır. Üçüncü taraf operatör adına güvenlik garantisi vermiyoruz.',
    atAGlance: 'Özet bilgiler',
    destination: 'Ülke',
    ageEligibility: 'Yaş koşulu',
    availabilityLabel: 'Durum',
    availability: {
      open: 'Başvurulara açık',
      waitlist: 'Yedek listesi',
      closed: 'Kapalı',
    } as Record<string, string>,
  },
} as const
