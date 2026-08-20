import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { ReviewMeta } from '@/components/shared/ReviewMeta'
import { ProseSection, FactTable, DetailList, IncludedExcluded } from './shared'
import { ProgrammeEnquiryPanel } from './ProgrammeEnquiryPanel'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { legalPath } from '@/lib/legal'
import type { SummerProgrammeDoc } from '@/lib/sanity/queries/content'
import Link from 'next/link'

/**
 * Summer programme page.
 *
 * Minors are involved, so the template separates programme marketing from the
 * safeguarding information a parent needs, and states plainly who is responsible
 * for what. It makes no safety guarantees on a third party's behalf.
 */
export function SummerProgrammeTemplate({
  locale,
  doc,
  formatSlug,
}: {
  locale: Locale
  doc: SummerProgrammeDoc
  formatSlug: string
}) {
  const copy = COPY[locale]
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'nav.summerSchools'), href: sectionPath(locale, 'summerSchools') },
    {
      label: doc.format === 'group' ? copy.groupFormat : copy.individualFormat,
      href: docPath(locale, 'summerSchools', formatSlug),
    },
    { label: doc.title },
  ]

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={doc.city}
        title={doc.title}
        image={doc.heroImage ?? null}
        imageAlt={doc.heroImage?.alt ?? doc.title}
      />

      <Container>
        <div className="grid gap-12 py-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ProseSection locale={locale} title={copy.overview} body={doc.overview} id="overview" />
            <ProseSection locale={locale} title={copy.dates} body={doc.dates} id="dates" />
            <ProseSection locale={locale} title={copy.accommodation} body={doc.accommodation} />
            <ProseSection locale={locale} title={copy.activities} body={doc.activities} />
            <ProseSection locale={locale} title={copy.excursions} body={doc.excursions} />
            <IncludedExcluded locale={locale} included={doc.included} excluded={doc.excluded} />
            <FactTable locale={locale} title={copy.price} facts={doc.price} />

            {/* Safeguarding is a distinct block, visually separated from the marketing. */}
            {doc.providerResponsibilities ||
            doc.happyEducationResponsibilities ||
            doc.parentalRequirements ? (
              <section id="safeguarding" className="scroll-mt-28 border-t border-border py-10">
                <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">
                  {copy.safeguarding}
                </h2>
                <p className="mt-3 max-w-[68ch] border-l-2 border-warning bg-paper-sunk p-4 text-sm leading-relaxed text-fg-muted">
                  {copy.safeguardingIntro}
                </p>

                <div className="mt-6 grid gap-8 sm:grid-cols-2">
                  {doc.providerResponsibilities ? (
                    <div>
                      <h3 className="font-display text-lg font-semibold text-fg">
                        {copy.providerResponsibilities}
                      </h3>
                      <div className="mt-2">
                        <ProseSection locale={locale} title="" body={doc.providerResponsibilities} />
                      </div>
                    </div>
                  ) : null}
                  {doc.happyEducationResponsibilities ? (
                    <div>
                      <h3 className="font-display text-lg font-semibold text-fg">
                        {copy.ourResponsibilities}
                      </h3>
                      <div className="mt-2">
                        <ProseSection
                          locale={locale}
                          title=""
                          body={doc.happyEducationResponsibilities}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                <ProseSection
                  locale={locale}
                  title={copy.parentalRequirements}
                  body={doc.parentalRequirements}
                />
                <ProseSection locale={locale} title={copy.cancellation} body={doc.cancellationPolicy} />

                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <li>
                    <Link
                      href={legalPath(locale, 'safeguarding')}
                      className="text-brand-strong underline underline-offset-4"
                    >
                      {copy.safeguardingPolicy}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={legalPath(locale, 'refunds')}
                      className="text-brand-strong underline underline-offset-4"
                    >
                      {copy.refundPolicy}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href={legalPath(locale, 'serviceTerms')}
                      className="text-brand-strong underline underline-offset-4"
                    >
                      {copy.serviceTerms}
                    </Link>
                  </li>
                </ul>
              </section>
            ) : null}

            <ReviewMeta locale={locale} review={doc.review} className="mt-10" />
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              <DetailList
                title={copy.atAGlance}
                items={[
                  { label: copy.city, value: doc.city },
                  { label: copy.ageRange, value: doc.ageRange },
                  { label: copy.duration, value: doc.duration },
                  { label: copy.lessonsPerWeek, value: doc.lessonsPerWeek },
                  { label: copy.languageLevel, value: doc.languageLevel },
                  { label: copy.academicFocus, value: doc.academicFocus },
                  { label: copy.meals, value: doc.meals },
                ]}
              />
              <ProgrammeEnquiryPanel
                locale={locale}
                programmeTitle={doc.title}
                programmePath={docPath(locale, 'summerSchools', formatSlug, doc.slug)}
              />
            </div>
          </aside>
        </div>
      </Container>

      <FaqSection locale={locale} faqs={doc.faqs ?? []} />
    </>
  )
}

const COPY = {
  en: {
    overview: 'About this programme',
    dates: 'Dates',
    accommodation: 'Accommodation',
    activities: 'Activities',
    excursions: 'Excursions',
    price: 'Price',
    safeguarding: 'Safety and safeguarding',
    safeguardingIntro:
      'The school running this programme is responsible for supervision, welfare and safeguarding on site. Happy Education arranges the placement and supports you through the booking. We set out below what each party is responsible for so there is no ambiguity, and we do not make safety guarantees on another organisation’s behalf.',
    providerResponsibilities: 'The school is responsible for',
    ourResponsibilities: 'Happy Education is responsible for',
    parentalRequirements: 'What parents need to provide',
    cancellation: 'Cancellation',
    safeguardingPolicy: 'Safeguarding information',
    refundPolicy: 'Refunds and cancellation',
    serviceTerms: 'Service terms',
    atAGlance: 'At a glance',
    city: 'City',
    ageRange: 'Age range',
    duration: 'Duration',
    lessonsPerWeek: 'Lessons per week',
    languageLevel: 'Language level',
    academicFocus: 'Academic focus',
    meals: 'Meals',
    groupFormat: 'Group summer schools',
    individualFormat: 'Individual summer schools',
  },
  tr: {
    overview: 'Program hakkında',
    dates: 'Tarihler',
    accommodation: 'Konaklama',
    activities: 'Aktiviteler',
    excursions: 'Geziler',
    price: 'Ücret',
    safeguarding: 'Güvenlik ve çocuk koruma',
    safeguardingIntro:
      'Programı yürüten okul; gözetim, öğrenci refahı ve çocuk koruma uygulamalarından yerinde sorumludur. Happy Education yerleştirmeyi düzenler ve kayıt sürecinde size destek olur. Belirsizlik kalmaması için hangi tarafın neyden sorumlu olduğunu aşağıda açıkça belirtiyoruz; başka bir kurumun adına güvenlik garantisi vermiyoruz.',
    providerResponsibilities: 'Okulun sorumlulukları',
    ourResponsibilities: "Happy Education'ın sorumlulukları",
    parentalRequirements: 'Velilerden beklenenler',
    cancellation: 'İptal',
    safeguardingPolicy: 'Çocuk koruma bilgileri',
    refundPolicy: 'İade ve iptal',
    serviceTerms: 'Hizmet şartları',
    atAGlance: 'Özet bilgiler',
    city: 'Şehir',
    ageRange: 'Yaş aralığı',
    duration: 'Süre',
    lessonsPerWeek: 'Haftalık ders',
    languageLevel: 'Dil seviyesi',
    academicFocus: 'Akademik odak',
    meals: 'Öğünler',
    groupFormat: 'Grup yaz okulları',
    individualFormat: 'Bireysel yaz okulları',
  },
} as const
