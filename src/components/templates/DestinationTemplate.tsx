import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { FaqSection } from '@/components/shared/FaqSection'
import { ReviewMeta } from '@/components/shared/ReviewMeta'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { InstitutionBrowser } from '@/components/content/InstitutionBrowser'
import { ProseSection, FactTable, CardGrid } from './shared'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import { illustrativeImageForDestination } from '@/lib/media/library'
import {
  licensedMediaForDestination,
  licensedMediaForInstitutionOrPlace,
} from '@/lib/media/licensed-media'
import type { DestinationDoc } from '@/lib/sanity/queries/content'

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
  const cmsImageCleared = doc.heroImage?.licence?.cleared === true
  const documentaryImage = cmsImageCleared
    ? null
    : licensedMediaForDestination(doc.slug) ?? licensedMediaForDestination(doc.title)
  const fallbackImage = illustrativeImageForDestination(doc.parentSlug ?? doc.slug)
  const useEditorialVisual = !cmsImageCleared && !documentaryImage && (Boolean(doc.parentSlug) || section === 'languageSchools')
  const pageLinks: Array<{ href: string; label: string }> = []
  if (doc.whyStudyHere) pageLinks.push({ href: '#why', label: labels.whyStudyHere })
  if (doc.applicationJourney) pageLinks.push({ href: '#applying', label: labels.applicationJourney })
  if (doc.entryRequirements) pageLinks.push({ href: '#entry', label: labels.entryRequirements })
  if (doc.accommodation) pageLinks.push({ href: '#accommodation', label: labels.accommodation })
  if (doc.visaOverview) pageLinks.push({ href: '#visa', label: labels.visa })

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={sectionCopy?.title[locale]}
        title={doc.title}
        intro={doc.intro}
        image={cmsImageCleared ? doc.heroImage : null}
        externalImage={documentaryImage}
        localImage={cmsImageCleared || documentaryImage || useEditorialVisual ? undefined : fallbackImage.src}
        imageAlt={cmsImageCleared ? doc.heroImage?.alt : documentaryImage?.alt ?? fallbackImage.alt}
        visualVariant={useEditorialVisual ? (doc.parentSlug ? 'city' : 'language') : undefined}
      />

      {pageLinks.length > 1 ? (
        <div className="border-b border-border/70 bg-white">
          <Container>
            <nav aria-label={labels.onThisPage} className="scroll-x py-4">
              <ul className="flex w-max gap-2">
                {pageLinks.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="inline-flex min-h-11 items-center rounded-full border border-border bg-paper px-4 text-sm font-bold text-fg no-underline transition hover:border-brand/35 hover:bg-brand-soft"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </Container>
        </div>
      ) : null}

      <section className="bg-paper">
        <Container>
          <div className="grid gap-10 py-6 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14 lg:py-10">
            <div className="min-w-0 rounded-[1.5rem] border border-border/60 bg-white px-5 shadow-[0_12px_36px_rgba(35,35,38,0.045)] sm:px-8 lg:px-10">
              <ProseSection locale={locale} title={labels.whyStudyHere} body={doc.whyStudyHere} id="why" />
              <ProseSection locale={locale} title={labels.educationSystem} body={doc.educationSystem} id="education-system" />
              <ProseSection locale={locale} title={labels.applicationJourney} body={doc.applicationJourney} id="applying" />
              <ProseSection locale={locale} title={labels.entryRequirements} body={doc.entryRequirements} id="entry" />
              <FactTable locale={locale} title={labels.englishRequirements} facts={doc.englishRequirements} />
              <FactTable locale={locale} title={labels.costs} facts={doc.costs} />
              <ProseSection locale={locale} title={labels.scholarships} body={doc.scholarships} id="funding" />
              <ProseSection locale={locale} title={labels.accommodation} body={doc.accommodation} id="accommodation" />

              {doc.visaOverview ? (
                <section id="visa" className="scroll-mt-28 border-t border-border/70 py-10 sm:py-12">
                  <h2 className="text-[length:var(--text-2xl)] font-bold text-fg">{labels.visa}</h2>
                  <div className="mt-5 rounded-[1.15rem] border border-amber-200/80 bg-[#fff7dd] p-5">
                    <p className="text-sm font-semibold leading-relaxed text-fg-muted">{labels.visaDisclaimer}</p>
                  </div>
                  <div className="mt-2">
                    <ProseSection locale={locale} title="" body={doc.visaOverview} />
                  </div>
                </section>
              ) : null}

              <ReviewMeta locale={locale} review={doc.review} className="my-10" />
            </div>

            <aside>
              <div className="sticky top-32 space-y-5">
                {doc.keyCities && doc.keyCities.length > 0 ? (
                  <nav aria-labelledby="key-cities" className="rounded-[1.3rem] border border-border/70 bg-sky-soft/65 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.09em] text-brand-strong">{labels.explore}</p>
                    <h2 id="key-cities" className="mt-2 text-lg font-bold text-fg">{labels.keyCities}</h2>
                    <ul className="mt-4 space-y-2 text-sm">
                      {doc.keyCities.map((city) => (
                        <li key={city.slug}>
                          <a
                            href={docPath(locale, section, doc.slug, city.slug)}
                            className="group flex min-h-11 items-center justify-between rounded-xl bg-white/70 px-3 font-bold text-fg no-underline transition hover:bg-white"
                          >
                            {city.title}
                            <span aria-hidden="true" className="text-brand-strong transition-transform group-hover:translate-x-1">→</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ) : null}

                <div className="rounded-[1.3rem] border border-border/70 bg-brand-soft/70 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.09em] text-brand-strong">{labels.needHelp}</p>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-fg">{labels.needHelpBody}</p>
                  <a href={sectionPath(locale, 'consultation')} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-brand-strong underline underline-offset-4">
                    {labels.talkToUs} →
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </Container>
      </section>

      {doc.institutions && doc.institutions.length > 0 ? (
        <section className="border-t border-border/70 bg-white py-14 sm:py-16 lg:py-20">
          <Container>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{labels.browse}</p>
                <h2 className="mt-2 max-w-[17ch] text-[length:var(--text-3xl)] font-bold text-fg">{labels.institutions}</h2>
              </div>
              <p className="max-w-[48ch] text-sm leading-relaxed text-fg-muted">{labels.institutionIntro}</p>
            </div>
            <div className="mt-9">
              <InstitutionBrowser
                locale={locale}
                items={doc.institutions.map((inst) => ({
                  href: docPath(locale, section, doc.slug, inst.slug),
                  title: inst.title,
                  city: inst.city,
                  image: licensedMediaForInstitutionOrPlace(inst.title, inst.city),
                }))}
              />
            </div>
          </Container>
        </section>
      ) : null}

      <FaqSection locale={locale} faqs={doc.faqs ?? []} />

      {doc.relatedArticles && doc.relatedArticles.length > 0 ? (
        <section className="border-t border-border/70 bg-paper py-14 sm:py-16">
          <Container>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{labels.keepReading}</p>
            <h2 className="mt-2 text-[length:var(--text-3xl)] font-bold text-fg">{labels.relatedReading}</h2>
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
    onThisPage: 'On this page', whyStudyHere: 'Why study here', educationSystem: 'How the education system works', applicationJourney: 'The application journey', entryRequirements: 'Entry requirements', englishRequirements: 'English language requirements', costs: 'Fees and living costs', scholarships: 'Scholarships and funding', accommodation: 'Accommodation', visa: 'Student visa overview',
    visaDisclaimer: 'This is a general overview of the process, not immigration advice. Requirements change, and the decision on any application rests with the relevant government authority. Always check the official guidance, and speak to a regulated immigration adviser if you need advice on your own circumstances.',
    explore: 'Explore the destination', keyCities: 'Key student cities', browse: 'Browse your options', institutions: 'Institutions to explore here', institutionIntro: 'Search the catalogue by institution or city, then open a profile when you want more detail.', relatedReading: 'Related reading', keepReading: 'Keep exploring', needHelp: 'Need a shortlist?', needHelpBody: 'Tell us what you want to study and what matters most. We can help narrow the options into something manageable.', talkToUs: 'Talk to an adviser',
  },
  tr: {
    onThisPage: 'Bu sayfada', whyStudyHere: 'Neden burada okumalı?', educationSystem: 'Eğitim sistemi nasıl işliyor?', applicationJourney: 'Başvuru süreci', entryRequirements: 'Kabul koşulları', englishRequirements: 'İngilizce dil koşulları', costs: 'Öğrenim ücretleri ve yaşam maliyeti', scholarships: 'Burslar ve finansman', accommodation: 'Konaklama', visa: 'Öğrenci vizesine genel bakış',
    visaDisclaimer: 'Bu bölüm sürecin genel bir özetidir; göçmenlik danışmanlığı değildir. Koşullar değişebilir ve her başvuruya ilişkin karar ilgili ülkenin yetkili makamına aittir. Resmî kaynakları mutlaka kontrol edin; kendi durumunuza özel danışmanlık gerekiyorsa yetkili bir göçmenlik danışmanına başvurun.',
    explore: 'Ülkeyi keşfet', keyCities: 'Öne çıkan öğrenci şehirleri', browse: 'Seçeneklere göz atın', institutions: 'Bu ülkedeki kurumları keşfedin', institutionIntro: 'Kurum veya şehir adına göre arayın; daha fazla bilgi için ilgili profili açın.', relatedReading: 'İlgili yazılar', keepReading: 'Keşfetmeye devam edin', needHelp: 'Kısa liste mi lazım?', needHelpBody: 'Ne okumak istediğinizi ve sizin için neyin önemli olduğunu anlatın. Seçenekleri daha yönetilebilir bir listeye indirebiliriz.', talkToUs: 'Danışmanla konuş',
  },
} as const
