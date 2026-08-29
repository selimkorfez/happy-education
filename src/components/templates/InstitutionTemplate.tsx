import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { ReviewMeta } from '@/components/shared/ReviewMeta'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { ProseSection, FactTable, DetailList, CardGrid } from './shared'
import { ExternalLink } from '@/components/ui/Button'
import { safeExternalHref } from '@/lib/links'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import { licensedMediaForInstitutionOrPlace } from '@/lib/media/licensed-media'
import type { InstitutionDoc } from '@/lib/sanity/queries/content'

export function InstitutionTemplate({
  locale,
  section,
  doc,
}: {
  locale: Locale
  section: SectionKey
  doc: InstitutionDoc
}) {
  const copy = COPY[locale]
  const sectionCopy = SECTION_COPY[section]

  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: sectionCopy?.title[locale] ?? doc.title, href: sectionPath(locale, section) },
    ...(doc.destination
      ? [{ label: doc.destination.title, href: docPath(locale, section, doc.destination.slug) }]
      : []),
    { label: doc.title },
  ]

  const website = safeExternalHref(doc.officialWebsite)
  const verifiedAccreditations = (doc.accreditations ?? []).filter((a) => a.verified)
  const cmsImageCleared = doc.heroImage?.licence?.cleared === true
  const documentaryImage = cmsImageCleared ? null : licensedMediaForInstitutionOrPlace(doc.title, doc.city)
  const visualVariant = !cmsImageCleared && !documentaryImage
    ? section === 'languageSchools'
      ? 'language'
      : section === 'boardingSchools'
        ? 'boarding'
        : 'universities'
    : undefined

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={[doc.city, doc.country].filter(Boolean).join(', ') || sectionCopy?.title[locale]}
        title={doc.title}
        image={cmsImageCleared ? doc.heroImage : null}
        externalImage={documentaryImage}
        imageAlt={cmsImageCleared ? doc.heroImage?.alt : documentaryImage?.alt}
        visualVariant={visualVariant}
      />

      <section className="bg-paper">
        <Container>
          <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-14 lg:py-12">
            <div className="min-w-0 rounded-[1.5rem] border border-border/60 bg-white px-5 shadow-[0_12px_36px_rgba(35,35,38,0.045)] sm:px-8 lg:px-10">
              <ProseSection locale={locale} title={copy.overview} body={doc.overview} id="overview" />
              <ProseSection locale={locale} title={copy.entryGuidance} body={doc.entryGuidance} id="entry" />
              <FactTable locale={locale} title={copy.englishRequirements} facts={doc.englishRequirements} />
              <FactTable locale={locale} title={copy.fees} facts={doc.fees} />
              <ProseSection locale={locale} title={copy.scholarships} body={doc.scholarships} id="funding" />
              <ProseSection locale={locale} title={copy.accommodation} body={doc.accommodation} id="accommodation" />
              <ProseSection locale={locale} title={copy.startDates} body={doc.startDates} />
              <ProseSection locale={locale} title={copy.socialProgramme} body={doc.socialProgramme} />
              <ProseSection locale={locale} title={copy.boardingOptions} body={doc.boardingOptions} />
              <ProseSection locale={locale} title={copy.admissions} body={doc.admissions} />

              {doc.safeguardingNote ? (
                <section className="border-t border-border/70 py-10 sm:py-12">
                  <div className="rounded-[1.2rem] border border-amber-200/80 bg-[#fff7dd] p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.09em] text-warning">{copy.safeguarding}</p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-fg-muted">{copy.safeguardingNote}</p>
                    <div className="mt-2">
                      <ProseSection locale={locale} title="" body={doc.safeguardingNote} />
                    </div>
                  </div>
                </section>
              ) : null}

              {doc.rankings && doc.rankings.length > 0 ? (
                <section className="border-t border-border/70 py-10 sm:py-12">
                  <h2 className="text-[length:var(--text-2xl)] font-bold text-fg">{copy.rankings}</h2>
                  <div className="scroll-x mt-6 overflow-hidden rounded-[1.2rem] border border-border/80 bg-white" tabIndex={0} role="group">
                    <table className="text-sm">
                      <thead>
                        <tr>
                          <th scope="col">{copy.rankingOrg}</th>
                          <th scope="col">{copy.rankingCategory}</th>
                          <th scope="col">{copy.rankingYear}</th>
                          <th scope="col">{copy.rankingPosition}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doc.rankings.map((ranking, index) => (
                          <tr key={`${ranking.organisation}-${ranking.year}-${index}`}>
                            <td>{ranking.organisation}</td>
                            <td>{ranking.category}</td>
                            <td>{ranking.year}</td>
                            <td>{ranking.position}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ) : null}

              {verifiedAccreditations.length > 0 ? (
                <section className="border-t border-border/70 py-10 sm:py-12">
                  <h2 className="text-[length:var(--text-2xl)] font-bold text-fg">{copy.accreditations}</h2>
                  <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                    {verifiedAccreditations.map((item, index) => (
                      <li key={`${item.body}-${index}`} className="rounded-[1rem] border border-border/70 bg-mint-soft/60 p-4 text-sm font-bold leading-relaxed text-fg">
                        {item.body}
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}

              <ReviewMeta locale={locale} review={doc.review} className="my-10" />
            </div>

            <aside>
              <div className="sticky top-32 space-y-5">
                <DetailList
                  title={copy.atAGlance}
                  items={[
                    { label: copy.location, value: [doc.city, doc.country].filter(Boolean).join(', ') || undefined },
                    { label: copy.founded, value: doc.founded },
                    { label: copy.degreeLevels, value: doc.degreeLevels?.join(', ') },
                    { label: copy.courseTypes, value: doc.courseTypes?.join(', ') },
                    { label: copy.ageRange, value: doc.ageRange },
                    { label: copy.minimumAge, value: doc.minimumAge ? String(doc.minimumAge) : undefined },
                  ]}
                />

                <div className="rounded-[1.3rem] border border-border/70 bg-ink-surface p-5 text-fg-on-ink shadow-[0_16px_42px_rgba(35,35,38,0.1)]">
                  <p className="text-xs font-bold uppercase tracking-[0.09em] text-brand-on-ink">{copy.nextStep}</p>
                  <h2 className="mt-2 text-lg font-bold text-fg-on-ink">{copy.nextStepTitle}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted-on-ink">{copy.nextStepBody}</p>
                  <Link href={sectionPath(locale, 'consultation')} className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-fg no-underline transition hover:-translate-y-0.5">
                    {copy.consultation} <span aria-hidden="true" className="ml-2">→</span>
                  </Link>
                  {website ? <ExternalLink href={website} srSuffix={copy.opensNewTab} className="mt-3 w-full justify-center border-white/25 text-fg-on-ink hover:bg-white/10">{copy.officialWebsite}</ExternalLink> : null}
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {doc.relatedArticles && doc.relatedArticles.length > 0 ? (
        <section className="border-t border-border/70 bg-white py-14 sm:py-16">
          <Container>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{copy.keepReading}</p>
            <h2 className="mt-2 text-[length:var(--text-3xl)] font-bold text-fg">{copy.relatedReading}</h2>
            <div className="mt-8">
              <CardGrid items={doc.relatedArticles.map((article) => ({ href: docPath(locale, 'insights', article.slug), title: article.title }))} />
            </div>
          </Container>
        </section>
      ) : null}

      <FaqSection locale={locale} faqs={doc.faqs ?? []} />
      <ConsultationBand locale={locale} />
    </>
  )
}

const COPY = {
  en: {
    overview: 'About this institution',
    entryGuidance: 'Entry guidance',
    englishRequirements: 'English language requirements',
    fees: 'Fees',
    scholarships: 'Scholarships and funding',
    accommodation: 'Accommodation',
    startDates: 'Start dates',
    socialProgramme: 'Student life and social programme',
    boardingOptions: 'Boarding options',
    admissions: 'Admissions',
    safeguarding: 'Safeguarding information',
    safeguardingNote: 'This information relates to the institution’s own safeguarding arrangements. Happy Education does not make safety guarantees on another organisation’s behalf.',
    rankings: 'Published rankings',
    rankingOrg: 'Organisation',
    rankingCategory: 'Category',
    rankingYear: 'Year',
    rankingPosition: 'Position',
    accreditations: 'Verified accreditations',
    atAGlance: 'At a glance',
    location: 'Location',
    founded: 'Founded',
    degreeLevels: 'Degree levels',
    courseTypes: 'Course types',
    ageRange: 'Age range',
    minimumAge: 'Minimum age',
    nextStep: 'Considering this option?',
    nextStepTitle: 'Turn one profile into a real shortlist.',
    nextStepBody: 'We can help compare this institution with alternatives and organise the application steps that follow.',
    consultation: 'Talk it through',
    officialWebsite: 'Official website',
    opensNewTab: 'opens in a new tab',
    keepReading: 'Keep exploring',
    relatedReading: 'Related reading',
  },
  tr: {
    overview: 'Kurum hakkında',
    entryGuidance: 'Kabul rehberi',
    englishRequirements: 'İngilizce dil koşulları',
    fees: 'Ücretler',
    scholarships: 'Burslar ve finansman',
    accommodation: 'Konaklama',
    startDates: 'Başlangıç tarihleri',
    socialProgramme: 'Öğrenci hayatı ve sosyal program',
    boardingOptions: 'Yatılılık seçenekleri',
    admissions: 'Kabul süreci',
    safeguarding: 'Çocuk koruma bilgileri',
    safeguardingNote: 'Bu bilgiler kurumun kendi çocuk koruma düzenlemeleriyle ilgilidir. Happy Education başka bir kuruluş adına güvenlik garantisi vermez.',
    rankings: 'Yayımlanmış sıralamalar',
    rankingOrg: 'Kuruluş',
    rankingCategory: 'Kategori',
    rankingYear: 'Yıl',
    rankingPosition: 'Sıra',
    accreditations: 'Doğrulanmış akreditasyonlar',
    atAGlance: 'Özet bilgiler',
    location: 'Konum',
    founded: 'Kuruluş',
    degreeLevels: 'Derece seviyeleri',
    courseTypes: 'Kurs türleri',
    ageRange: 'Yaş aralığı',
    minimumAge: 'Minimum yaş',
    nextStep: 'Bu seçeneği mi düşünüyorsunuz?',
    nextStepTitle: 'Tek bir profili gerçek bir kısa listeye dönüştürün.',
    nextStepBody: 'Bu kurumu alternatiflerle karşılaştırmanıza ve sonraki başvuru adımlarını düzenlemenize yardımcı olabiliriz.',
    consultation: 'Birlikte değerlendirelim',
    officialWebsite: 'Resmî web sitesi',
    opensNewTab: 'yeni sekmede açılır',
    keepReading: 'Keşfetmeye devam edin',
    relatedReading: 'İlgili yazılar',
  },
} as const
