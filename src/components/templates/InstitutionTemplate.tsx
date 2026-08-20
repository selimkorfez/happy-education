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
import type { InstitutionDoc } from '@/lib/sanity/queries/content'

/**
 * University, language school and boarding school pages.
 *
 * One template for all three because the page furniture is identical and only the
 * detail fields differ. Each block renders only when the data exists, which matters
 * here: the legacy site had no official website URL on any of its 313 institution
 * pages, and most carry only a short description.
 *
 * Rankings render only with organisation, year, category and source together.
 * A bare "ranked 42nd" with no provenance is not shown at all.
 */
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

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={[doc.city, doc.country].filter(Boolean).join(', ') || undefined}
        title={doc.title}
        image={doc.heroImage ?? null}
        imageAlt={doc.heroImage?.alt ?? doc.title}
      />

      <Container>
        <div className="grid gap-12 py-4 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <ProseSection locale={locale} title={copy.overview} body={doc.overview} id="overview" />
            <ProseSection locale={locale} title={copy.entryGuidance} body={doc.entryGuidance} id="entry" />
            <FactTable locale={locale} title={copy.englishRequirements} facts={doc.englishRequirements} />
            <FactTable locale={locale} title={copy.fees} facts={doc.fees} />
            <ProseSection locale={locale} title={copy.scholarships} body={doc.scholarships} id="funding" />
            <ProseSection
              locale={locale}
              title={copy.accommodation}
              body={doc.accommodation}
              id="accommodation"
            />
            <ProseSection locale={locale} title={copy.startDates} body={doc.startDates} />
            <ProseSection locale={locale} title={copy.socialProgramme} body={doc.socialProgramme} />
            <ProseSection locale={locale} title={copy.boardingOptions} body={doc.boardingOptions} />
            <ProseSection locale={locale} title={copy.admissions} body={doc.admissions} />

            {doc.safeguardingNote ? (
              <section className="border-t border-border py-10">
                <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">
                  {copy.safeguarding}
                </h2>
                <p className="mt-3 text-sm text-fg-muted">{copy.safeguardingNote}</p>
                <div className="mt-4">
                  <ProseSection locale={locale} title="" body={doc.safeguardingNote} />
                </div>
              </section>
            ) : null}

            {doc.rankings && doc.rankings.length > 0 ? (
              <section className="border-t border-border py-10">
                <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">
                  {copy.rankings}
                </h2>
                <div className="scroll-x mt-5 border border-border" tabIndex={0} role="group">
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
                      {doc.rankings.map((rank, i) => (
                        <tr key={i}>
                          <th scope="row" className="font-medium">
                            {rank.source?.url ? (
                              <a
                                href={safeExternalHref(rank.source.url) ?? '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-brand-strong underline underline-offset-2"
                              >
                                {rank.organisation}
                              </a>
                            ) : (
                              rank.organisation
                            )}
                          </th>
                          <td>{rank.category}</td>
                          <td>{rank.year}</td>
                          <td>{rank.position}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
                  { label: copy.city, value: doc.city },
                  { label: copy.country, value: doc.country },
                  { label: copy.founded, value: doc.founded },
                  { label: copy.degreeLevels, value: doc.degreeLevels },
                  { label: copy.subjectAreas, value: doc.subjectAreas },
                  { label: copy.intakes, value: doc.intakes },
                  { label: copy.courseTypes, value: doc.courseTypes },
                  { label: copy.lessonsPerWeek, value: doc.lessonsPerWeek },
                  { label: copy.levels, value: doc.levels },
                  { label: copy.minimumAge, value: doc.minimumAge },
                  { label: copy.ageRange, value: doc.ageRange },
                  { label: copy.curriculum, value: doc.curriculum },
                  { label: copy.facilities, value: doc.facilities },
                ]}
              />

              {verifiedAccreditations.length > 0 ? (
                <div className="border border-border p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-fg">
                    {copy.accreditation}
                  </h2>
                  <p className="mt-2 text-xs text-fg-muted">{copy.accreditationNote}</p>
                  <ul className="mt-3 space-y-1.5 text-sm text-fg">
                    {verifiedAccreditations.map((a) => (
                      <li key={a.body}>{a.body}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {website ? (
                <div className="border border-border p-5">
                  <h2 className="text-sm font-semibold uppercase tracking-[0.06em] text-fg">
                    {copy.officialSite}
                  </h2>
                  <p className="mt-3 text-sm">
                    <ExternalLink href={website} srSuffix={t(locale, 'a11y.opensInNewTab')}>
                      {new URL(website).hostname.replace(/^www\./, '')}
                    </ExternalLink>
                  </p>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      </Container>

      <FaqSection locale={locale} faqs={doc.faqs ?? []} />

      {doc.relatedArticles && doc.relatedArticles.length > 0 ? (
        <section className="border-t border-border py-14">
          <Container>
            <h2 className="font-display text-[length:var(--text-3xl)] font-semibold text-fg">
              {copy.relatedReading}
            </h2>
            <div className="mt-8">
              <CardGrid
                items={doc.relatedArticles.map((a) => ({
                  href: docPath(locale, 'insights', a.slug),
                  title: a.title,
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
    overview: 'Overview',
    entryGuidance: 'Entry guidance',
    englishRequirements: 'English language requirements',
    fees: 'Fees',
    scholarships: 'Scholarships',
    accommodation: 'Accommodation',
    startDates: 'Start dates',
    socialProgramme: 'Social programme',
    boardingOptions: 'Boarding',
    admissions: 'Admissions',
    safeguarding: 'Safeguarding',
    safeguardingNote:
      "This describes the school's own arrangements. Happy Education does not supervise students on site and cannot guarantee another organisation's procedures.",
    rankings: 'Rankings',
    rankingOrg: 'Published by',
    rankingCategory: 'Category',
    rankingYear: 'Year',
    rankingPosition: 'Position',
    atAGlance: 'At a glance',
    city: 'City',
    country: 'Country',
    founded: 'Founded',
    degreeLevels: 'Degree levels',
    subjectAreas: 'Subject areas',
    intakes: 'Intakes',
    courseTypes: 'Course types',
    lessonsPerWeek: 'Lessons per week',
    levels: 'Levels',
    minimumAge: 'Minimum age',
    ageRange: 'Age range',
    curriculum: 'Curriculum',
    facilities: 'Facilities',
    accreditation: 'Accreditation',
    accreditationNote: "The school's accreditation, verified against the accrediting body.",
    officialSite: 'Official website',
    relatedReading: 'Related reading',
  },
  tr: {
    overview: 'Genel bakış',
    entryGuidance: 'Kabul koşulları',
    englishRequirements: 'İngilizce dil koşulları',
    fees: 'Ücretler',
    scholarships: 'Burslar',
    accommodation: 'Konaklama',
    startDates: 'Başlangıç tarihleri',
    socialProgramme: 'Sosyal program',
    boardingOptions: 'Yatılı seçenekleri',
    admissions: 'Başvuru süreci',
    safeguarding: 'Çocuk koruma',
    safeguardingNote:
      'Bu bölüm okulun kendi uygulamalarını anlatır. Happy Education öğrencileri okulda gözetmez ve başka bir kurumun prosedürlerini garanti edemez.',
    rankings: 'Sıralamalar',
    rankingOrg: 'Yayımlayan',
    rankingCategory: 'Kategori',
    rankingYear: 'Yıl',
    rankingPosition: 'Sıra',
    atAGlance: 'Özet bilgiler',
    city: 'Şehir',
    country: 'Ülke',
    founded: 'Kuruluş',
    degreeLevels: 'Program düzeyleri',
    subjectAreas: 'Öne çıkan alanlar',
    intakes: 'Dönemler',
    courseTypes: 'Kurs türleri',
    lessonsPerWeek: 'Haftalık ders',
    levels: 'Seviyeler',
    minimumAge: 'Asgari yaş',
    ageRange: 'Yaş aralığı',
    curriculum: 'Müfredat',
    facilities: 'Olanaklar',
    accreditation: 'Akreditasyon',
    accreditationNote: 'Okulun akreditasyonu, ilgili kurum nezdinde doğrulanmıştır.',
    officialSite: 'Resmî web sitesi',
    relatedReading: 'İlgili yazılar',
  },
} as const
