import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { ReviewMeta } from '@/components/shared/ReviewMeta'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { ProseSection, FactTable, CardGrid } from './shared'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import type { DestinationDoc } from '@/lib/sanity/queries/content'

/**
 * A country or city page.
 *
 * The editorial backbone of the site: this is what a family reads before deciding
 * where to apply, so it leads with substance and carries its review date visibly.
 * Sections render only when the editor has filled them, so a partially written
 * destination looks deliberate rather than skeletal.
 */
export function DestinationTemplate({
  locale,
  section,
  doc,
}: {
  locale: Locale
  section: SectionKey
  doc: DestinationDoc
}) {
  const sectionCopy = SECTION_COPY[section]
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: sectionCopy?.title[locale] ?? doc.title, href: sectionPath(locale, section) },
    ...(doc.parentSlug && doc.parentTitle
      ? [{ label: doc.parentTitle, href: docPath(locale, section, doc.parentSlug) }]
      : []),
    { label: doc.title },
  ]

  const labels = COPY[locale]

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={sectionCopy?.title[locale]}
        title={doc.title}
        intro={doc.intro}
        image={doc.heroImage ?? null}
        imageAlt={doc.heroImage?.alt ?? doc.title}
      />

      <Container>
        <div className="grid gap-12 py-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ProseSection locale={locale} title={labels.whyStudyHere} body={doc.whyStudyHere} id="why" />
            <ProseSection
              locale={locale}
              title={labels.educationSystem}
              body={doc.educationSystem}
              id="education-system"
            />
            <ProseSection
              locale={locale}
              title={labels.applicationJourney}
              body={doc.applicationJourney}
              id="applying"
            />
            <ProseSection
              locale={locale}
              title={labels.entryRequirements}
              body={doc.entryRequirements}
              id="entry"
            />
            <FactTable locale={locale} title={labels.englishRequirements} facts={doc.englishRequirements} />
            <FactTable locale={locale} title={labels.costs} facts={doc.costs} />
            <ProseSection locale={locale} title={labels.scholarships} body={doc.scholarships} id="funding" />
            <ProseSection
              locale={locale}
              title={labels.accommodation}
              body={doc.accommodation}
              id="accommodation"
            />

            {doc.visaOverview ? (
              <section id="visa" className="scroll-mt-28 border-t border-border py-10">
                <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">
                  {labels.visa}
                </h2>
                {/*
                 * Standing disclaimer. Happy Education has no confirmed registration
                 * with the Immigration Advice Authority, so visa content describes
                 * the process and points at official sources. It is never advice and
                 * never predicts an outcome.
                 */}
                <p className="mt-3 border-l-2 border-warning bg-paper-sunk p-4 text-sm leading-relaxed text-fg-muted">
                  {labels.visaDisclaimer}
                </p>
                <div className="mt-4">
                  <ProseSection locale={locale} title="" body={doc.visaOverview} />
                </div>
              </section>
            ) : null}

            <ReviewMeta locale={locale} review={doc.review} className="mt-10" />
          </div>

          <aside className="lg:col-span-4">
            <div className="sticky top-32 space-y-6">
              {doc.keyCities && doc.keyCities.length > 0 ? (
                <nav aria-labelledby="key-cities" className="border border-border p-5">
                  <h2 id="key-cities" className="text-sm font-semibold uppercase tracking-[0.06em] text-fg">
                    {labels.keyCities}
                  </h2>
                  <ul className="mt-4 space-y-2 text-sm">
                    {doc.keyCities.map((city) => (
                      <li key={city.slug}>
                        <a
                          href={docPath(locale, section, doc.slug, city.slug)}
                          className="text-brand-strong underline underline-offset-4"
                        >
                          {city.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ) : null}
            </div>
          </aside>
        </div>
      </Container>

      {doc.institutions && doc.institutions.length > 0 ? (
        <section className="border-t border-border py-14">
          <Container>
            <h2 className="font-display text-[length:var(--text-3xl)] font-semibold text-fg">
              {labels.institutions}
            </h2>
            <div className="mt-8">
              <CardGrid
                items={doc.institutions.map((inst) => ({
                  href: docPath(locale, section, doc.slug, inst.slug),
                  title: inst.title,
                  meta: inst.city,
                }))}
              />
            </div>
          </Container>
        </section>
      ) : null}

      <FaqSection locale={locale} faqs={doc.faqs ?? []} />

      {doc.relatedArticles && doc.relatedArticles.length > 0 ? (
        <section className="border-t border-border py-14">
          <Container>
            <h2 className="font-display text-[length:var(--text-3xl)] font-semibold text-fg">
              {labels.relatedReading}
            </h2>
            <div className="mt-8">
              <CardGrid
                items={doc.relatedArticles.map((article) => ({
                  href: docPath(locale, 'insights', article.slug),
                  title: article.title,
                  excerpt: article.excerpt,
                }))}
              />
            </div>
          </Container>
        </section>
      ) : null}

      <ConsultationBand locale={locale} />
    </>
  )
}

const COPY = {
  en: {
    whyStudyHere: 'Why study here',
    educationSystem: 'How the education system works',
    applicationJourney: 'The application journey',
    entryRequirements: 'Entry requirements',
    englishRequirements: 'English language requirements',
    costs: 'Fees and living costs',
    scholarships: 'Scholarships and funding',
    accommodation: 'Accommodation',
    visa: 'Student visa overview',
    visaDisclaimer:
      'This is a general overview of the process, not immigration advice. Requirements change, and the decision on any application rests with the relevant government authority. Always check the official guidance, and speak to a regulated immigration adviser if you need advice on your own circumstances.',
    keyCities: 'Key student cities',
    institutions: 'Institutions we work with here',
    relatedReading: 'Related reading',
  },
  tr: {
    whyStudyHere: 'Neden burada okumalı?',
    educationSystem: 'Eğitim sistemi nasıl işliyor?',
    applicationJourney: 'Başvuru süreci',
    entryRequirements: 'Kabul koşulları',
    englishRequirements: 'İngilizce dil koşulları',
    costs: 'Öğrenim ücretleri ve yaşam maliyeti',
    scholarships: 'Burslar ve finansman',
    accommodation: 'Konaklama',
    visa: 'Öğrenci vizesine genel bakış',
    visaDisclaimer:
      'Bu bölüm sürecin genel bir özetidir; göçmenlik danışmanlığı değildir. Koşullar değişebilir ve her başvuruya ilişkin karar ilgili ülkenin yetkili makamına aittir. Resmî kaynakları mutlaka kontrol edin; kendi durumunuza özel danışmanlık gerekiyorsa yetkili bir göçmenlik danışmanına başvurun.',
    keyCities: 'Öne çıkan öğrenci şehirleri',
    institutions: 'Bu ülkede çalıştığımız kurumlar',
    relatedReading: 'İlgili yazılar',
  },
} as const
