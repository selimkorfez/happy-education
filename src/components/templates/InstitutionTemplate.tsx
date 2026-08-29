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

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={[doc.city, doc.country].filter(Boolean).join(', ') || sectionCopy?.title[locale]}
        title={doc.title}
        image={doc.heroImage ?? null}
        imageAlt={doc.heroImage?.alt ?? doc.title}
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
                        {doc.rankings.map((rank, i) => (
                          <tr key={i}>
                            <th scope="row" className="font-medium">
                              {rank.source?.url ? (
                                <a
                                  href={safeExternalHref(rank.source.url) ?? '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-bold text-brand-strong underline underline-offset-2"
                                >
                                  {rank.organisation}
                                </a>
                              ) : rank.organisation}
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

              <ReviewMeta locale={locale} review={doc.review} className="my-10" />
            </div>

            <aside>
              <div className="sticky top-32 space-y-5">
                <div className="rounded-[1.35rem] border border-brand/20 bg-brand-soft/70 p-5 shadow-[0_10px_28px_rgba(35,35,38,0.05)]">
                  <p className="text-xs font-bold uppercase tracking-[0.09em] text-brand-strong">{copy.considering}</p>
                  <h2 className="mt-2 text-lg font-bold text-fg">{copy.askTitle}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-fg-muted">{copy.askBody}</p>
                  <Link
                    href={sectionPath(locale, 'consultation')}
                    className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-brand px-5 text-sm font-bold text-fg no-underline shadow-[0_8px_20px_rgba(244,116,38,0.18)] transition hover:-translate-y-0.5"
                  >
                    {copy.askCta} <span aria-hidden="true" className="ml-2">↗</span>
                  </Link>
                </div>

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
                  <div className="rounded-[1.25rem] border border-border/70 bg-mint-soft/65 p-5">
                    <h2 className="text-sm font-bold uppercase tracking-[0.07em] text-fg">{copy.accreditation}</h2>
                    <p className="mt-2 text-xs leading-relaxed text-fg-muted">{copy.accreditationNote}</p>
                    <ul className="mt-4 space-y-2 text-sm font-semibold text-fg">
                      {verifiedAccreditations.map((a) => <li key={a.body}>{a.body}</li>)}
                    </ul>
                  </div>
                ) : null}

                {website ? (
                  <div className="rounded-[1.25rem] border border-border/70 bg-white p-5">
                    <h2 className="text-sm font-bold uppercase tracking-[0.07em] text-fg">{copy.officialSite}</h2>
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
      </section>

      <FaqSection locale={locale} faqs={doc.faqs ?? []} />

      {doc.relatedArticles && doc.relatedArticles.length > 0 ? (
        <section className="border-t border-border/70 bg-white py-14 sm:py-16">
          <Container>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{copy.keepReading}</p>
            <h2 className="mt-2 text-[length:var(--text-3xl)] font-bold text-fg">{copy.relatedReading}</h2>
            <div className="mt-8">
              <CardGrid
                items={doc.relatedArticles.map((a) => ({ href: docPath(locale, 'insights', a.slug), title: a.title }))}
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
    overview: 'Overview', entryGuidance: 'Entry guidance', englishRequirements: 'English language requirements', fees: 'Fees', scholarships: 'Scholarships', accommodation: 'Accommodation', startDates: 'Start dates', socialProgramme: 'Social programme', boardingOptions: 'Boarding', admissions: 'Admissions', safeguarding: 'Safeguarding',
    safeguardingNote: "This describes the school's own arrangements. Happy Education does not supervise students on site and cannot guarantee another organisation's procedures.",
    rankings: 'Rankings', rankingOrg: 'Published by', rankingCategory: 'Category', rankingYear: 'Year', rankingPosition: 'Position', atAGlance: 'At a glance', city: 'City', country: 'Country', founded: 'Founded', degreeLevels: 'Degree levels', subjectAreas: 'Subject areas', intakes: 'Intakes', courseTypes: 'Course types', lessonsPerWeek: 'Lessons per week', levels: 'Levels', minimumAge: 'Minimum age', ageRange: 'Age range', curriculum: 'Curriculum', facilities: 'Facilities', accreditation: 'Accreditation', accreditationNote: "The school's accreditation, verified against the accrediting body.", officialSite: 'Official website', relatedReading: 'Related reading', keepReading: 'Worth reading next',
    considering: 'Considering this option?', askTitle: 'See how it fits your plans.', askBody: 'Tell us what you want to study and what matters to you. We can help you compare this institution with realistic alternatives.', askCta: 'Ask about this institution',
  },
  tr: {
    overview: 'Genel bakış', entryGuidance: 'Kabul koşulları', englishRequirements: 'İngilizce dil koşulları', fees: 'Ücretler', scholarships: 'Burslar', accommodation: 'Konaklama', startDates: 'Başlangıç tarihleri', socialProgramme: 'Sosyal program', boardingOptions: 'Yatılı seçenekleri', admissions: 'Başvuru süreci', safeguarding: 'Çocuk koruma', safeguardingNote: 'Bu bölüm okulun kendi uygulamalarını anlatır. Happy Education öğrencileri okulda gözetmez ve başka bir kurumun prosedürlerini garanti edemez.', rankings: 'Sıralamalar', rankingOrg: 'Yayımlayan', rankingCategory: 'Kategori', rankingYear: 'Yıl', rankingPosition: 'Sıra', atAGlance: 'Özet bilgiler', city: 'Şehir', country: 'Ülke', founded: 'Kuruluş', degreeLevels: 'Program düzeyleri', subjectAreas: 'Öne çıkan alanlar', intakes: 'Dönemler', courseTypes: 'Kurs türleri', lessonsPerWeek: 'Haftalık ders', levels: 'Seviyeler', minimumAge: 'Asgari yaş', ageRange: 'Yaş aralığı', curriculum: 'Müfredat', facilities: 'Olanaklar', accreditation: 'Akreditasyon', accreditationNote: 'Okulun akreditasyonu, ilgili kurum nezdinde doğrulanmıştır.', officialSite: 'Resmî web sitesi', relatedReading: 'İlgili yazılar', keepReading: 'Sonraki okuma',
    considering: 'Bu seçeneği düşünüyor musunuz?', askTitle: 'Planınıza nasıl uyduğunu değerlendirin.', askBody: 'Ne okumak istediğinizi ve sizin için neyin önemli olduğunu anlatın. Bu kurumu gerçekçi alternatiflerle karşılaştırmanıza yardımcı olabiliriz.', askCta: 'Bu kurum hakkında sor',
  },
} as const
