import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { SortableCardGrid } from '@/components/content/SortableCardGrid'
import { SectionLandingContent } from '@/components/content/SectionLandingContent'
import { EmptySection } from './shared'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { licensedMediaForPlace } from '@/lib/media/licensed-media'
import { licensedMediaForEditorialText, licensedMediaForEditorialVariant } from '@/lib/media/editorial-media'
import { getPageByKey, getProseDoc, listSummerProgrammes } from '@/lib/sanity/queries/content'
import { LEGACY_GROUP_CAMPUSES, mergeLandingContent, sectionLandingFallback } from '@/lib/content/section-landing'
import { listEnglishSummerShadows } from '@/lib/content/catalogue-fallback'
import Link from 'next/link'

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
  const [storedProgrammes, page] = await Promise.all([
    listSummerProgrammes(locale, format),
    getPageByKey(locale, format === 'individual' ? 'summerIndividual' : 'summerGroup').then((doc) => {
      if (doc || locale !== 'tr') return doc
      return getProseDoc(locale, format === 'individual' ? 'yaz-okullari' : 'grup', 'page')
    }),
  ])
  const seen = new Set(storedProgrammes.map((programme) => programme.slug))
  const programmes: Awaited<ReturnType<typeof listSummerProgrammes>> = [
    ...storedProgrammes,
    ...(locale === 'en'
      ? listEnglishSummerShadows(format).filter((programme) => !seen.has(programme.slug))
      : []),
  ]
  const landing = mergeLandingContent(sectionLandingFallback(locale, format === 'individual' ? 'summerIndividual' : 'summerGroup'), page)

  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'nav.summerSchools'), href: sectionPath(locale, 'summerSchools') },
    { label: copy.title },
  ]

  return (
    <>
      <PageHero locale={locale} crumbs={crumbs} title={copy.title} intro={copy.intro} visualVariant="summer" />
      <Container>
        <div className="space-y-14 py-12 lg:space-y-16">
          <SectionLandingContent content={landing} />
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
          {format === 'group' ? (
            <GroupCampusOptions locale={locale} programmes={programmes.map((programme) => programme.title)} options={page?.groupCampusOptions ?? [...LEGACY_GROUP_CAMPUSES]} />
          ) : null}
        </div>
      </Container>
      <ConsultationBand locale={locale} />
    </>
  )
}

function GroupCampusOptions({ locale, programmes, options }: { locale: Locale; programmes: string[]; options: string[] }) {
  const normalise = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const current = programmes.map(normalise)
  const additional = options.filter((option) => !current.some((programme) => programme.includes(normalise(option)) || normalise(option).includes(programme)))
  if (!additional.length) return null

  return (
    <section className="border-t border-border/70 pt-12">
      <div className="max-w-[48rem]">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-brand-strong">{locale === 'tr' ? 'Ek grup seçenekleri' : 'Additional group options'}</p>
        <h2 className="mt-3 text-[length:var(--text-3xl)] font-bold text-fg">{locale === 'tr' ? 'Talebe göre planlanabilen kampüsler' : 'Campuses available for group planning'}</h2>
        <p className="mt-4 text-base leading-relaxed text-fg-muted">{locale === 'tr' ? 'Bu seçenekler önceki Happy Education kataloğunda yer alıyordu. Güncel tarih, kontenjan, konaklama ve programı size teklif sunmadan önce teyit ediyoruz.' : 'These options appeared in the previous Happy Education catalogue. We confirm current dates, capacity, accommodation and the itinerary before making a proposal.'}</p>
      </div>
      <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {additional.map((option) => (
          <li key={option}>
            <Link href={`${sectionPath(locale, 'contact')}?programme=${encodeURIComponent(option)}`} className="group flex min-h-20 items-center justify-between gap-3 rounded-[1rem] border border-border/70 bg-card px-4 py-3 text-sm font-bold text-fg no-underline transition hover:border-brand/35 hover:text-brand-strong">
              <span>{option}</span><span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
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
