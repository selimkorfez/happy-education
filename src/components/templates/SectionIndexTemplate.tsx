import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import type { SectionVisualVariant } from '@/components/shared/SectionVisual'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { InstitutionBrowser } from '@/components/content/InstitutionBrowser'
import { SortableCardGrid } from '@/components/content/SortableCardGrid'
import { SectionLandingContent } from '@/components/content/SectionLandingContent'
import { PortableText } from '@/components/content/PortableText'
import { EmptySection } from './shared'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import { summerFormatSlug } from '@/lib/routing'
import { legalLinks } from '@/lib/legal'
import { licensedMediaForInstitutionOrPlace } from '@/lib/media/licensed-media'
import {
  licensedMediaForDestinationEditorial,
  licensedMediaForEditorialText,
  licensedMediaForEditorialVariant,
} from '@/lib/media/editorial-media'
import { getPageByKey, getProseDoc, listDestinations, listInstitutions, listTours, listSummerProgrammes } from '@/lib/sanity/queries/content'
import { listEditorialTours } from '@/lib/content/starter-editorial'
import {
  listEditorialArticles,
  listEditorialProse,
} from '@/lib/content/starter-editorial'
import { listStarterDestinations, listStarterProse } from '@/lib/content/starter-content'
import { listTurkishStarterProse } from '@/lib/content/starter-turkish-prose'
import {
  listEnglishInstitutionShadows,
  listEnglishSummerShadows,
} from '@/lib/content/catalogue-fallback'
import { mergeLandingContent, sectionLandingFallback } from '@/lib/content/section-landing'
import { getArticlesByCategory } from '@/lib/sanity/queries/articles'
import { getProseIndex } from '@/lib/sanity/queries/index-lists'

export async function SectionIndexTemplate({ locale, section }: { locale: Locale; section: SectionKey }) {
  const copy = SECTION_COPY[section]
  const pagePromise = section === 'legal'
    ? Promise.resolve(null)
    : getPageByKey(locale, section)
  const [page, body] = await Promise.all([
    pagePromise,
    sectionBody(locale, section, pagePromise),
  ])
  const title = page?.title ?? copy?.title[locale] ?? section
  const intro = page?.intro ?? copy?.description[locale]
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: title },
  ]
  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        eyebrow={locale === 'tr' ? 'Keşfet' : 'Explore'}
        title={title}
        intro={intro}
        image={page?.heroImage ?? null}
        imageAlt={page?.heroImage?.alt ?? title}
        visualVariant={visualForSection(section)}
      />
      <section className="bg-paper py-10 sm:py-14 lg:py-16">
        <Container>
          {page?.body && section !== 'boardingSchools'
            ? <PortableText value={page.body} locale={locale} className="mb-12 lg:mb-16" />
            : null}
          {body}
        </Container>
      </section>
      <ConsultationBand locale={locale} />
    </>
  )
}

async function sectionBody(
  locale: Locale,
  section: SectionKey,
  pagePromise: Promise<Awaited<ReturnType<typeof getPageByKey>>>,
) {
  const contactHref = sectionPath(locale, 'contact')

  switch (section) {
    case 'universities':
    case 'languageSchools': {
      const [storedDestinations, storedInstitutions] = await Promise.all([
        listDestinations(locale, section),
        listInstitutions(locale, section === 'universities' ? ['institution'] : ['languageSchool']),
      ])
      const destinations = mergeBySlug(
        storedDestinations,
        locale === 'en' ? listStarterDestinations(locale, section) : [],
      )
      const institutions = mergeBySlug(
        storedInstitutions,
        locale === 'en'
          ? listEnglishInstitutionShadows(section === 'universities' ? ['institution'] : ['languageSchool'])
          : [],
      )

      if (destinations.length === 0 && institutions.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />

      return (
        <div className="space-y-16 lg:space-y-20">
          {destinations.length > 0 ? (
            <section>
              <SectionHeading locale={locale} kicker={locale === 'tr' ? 'Ülke seçin' : 'Choose a destination'} title={locale === 'tr' ? 'Ülkeye göre keşfedin' : 'Explore by destination'} body={locale === 'tr' ? 'Önce ülkeyi seçip ardından kurumları, şehirleri ve ilgili seçenekleri inceleyin.' : 'Start with a country, then move into institutions, cities and the options available there.'} />
              <div className="mt-8">
                <SortableCardGrid
                  locale={locale}
                  items={destinations.map((destination) => {
                    const clearedCmsImage = destination.heroImage?.licence?.cleared === true
                    return {
                      href: docPath(locale, section, destination.slug),
                      title: destination.title,
                      excerpt: destination.intro,
                      image: clearedCmsImage ? destination.heroImage : undefined,
                      externalImage: clearedCmsImage ? null : licensedMediaForDestinationEditorial(destination.slug, destination.title),
                      imageAlt: destination.heroImage?.alt ?? destination.title,
                    }
                  })}
                />
              </div>
            </section>
          ) : null}

          {institutions.length > 0 ? (
            <section className="border-t border-border/70 pt-12 sm:pt-14">
              <SectionHeading locale={locale} kicker={locale === 'tr' ? 'Doğrudan ara' : 'Browse directly'} title={locale === 'tr' ? 'Tüm kurumlar' : 'All institutions'} body={locale === 'tr' ? 'Aklınızda bir kurum veya şehir varsa kataloğu doğrudan arayın.' : 'Already have an institution or city in mind? Search the catalogue directly.'} />
              <div className="mt-8">
                <InstitutionBrowser
                  locale={locale}
                  items={institutions.map((inst) => ({
                    href: inst.country ? docPath(locale, section, slugifyCountry(inst.country), inst.slug) : docPath(locale, section, inst.slug),
                    title: inst.title,
                    city: inst.city,
                    country: inst.country,
                    image: licensedMediaForInstitutionOrPlace(inst.title, inst.city, inst.country),
                  }))}
                />
              </div>
            </section>
          ) : null}
        </div>
      )
    }

    case 'boardingSchools': {
      const [storedSchools, landingPage] = await Promise.all([
        listInstitutions(locale, ['boardingSchool']),
        pagePromise.then((page) => (
          page || locale !== 'tr'
            ? page
            : getProseDoc(locale, 'yatili-okullar', 'page')
        )),
      ])
      const schools = mergeBySlug(
        storedSchools,
        locale === 'en' ? listEnglishInstitutionShadows(['boardingSchool']) : [],
      )
      if (schools.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      const landing = mergeLandingContent(sectionLandingFallback(locale, 'boardingSchools'), landingPage)
      return (
        <div className="space-y-14 lg:space-y-16">
          <SectionLandingContent content={landing} />
          <section>
            <SectionHeading locale={locale} kicker={locale === 'tr' ? 'Okulları karşılaştırın' : 'Compare schools'} title={locale === 'tr' ? 'Yatılı okul seçeneklerini keşfedin' : 'Explore boarding-school options'} body={locale === 'tr' ? 'Akademik uyum kadar yatılı yaşam, destek ve günlük ortamı da düşünerek ilerleyin.' : 'Look beyond academics and compare boarding life, support and the day-to-day environment too.'} />
            <div className="mt-8">
            <InstitutionBrowser locale={locale} items={schools.map((s) => ({ href: docPath(locale, section, s.slug), title: s.title, city: s.city, country: s.country, image: licensedMediaForInstitutionOrPlace(s.title, s.city, s.country) }))} />
            </div>
          </section>
        </div>
      )
    }

    case 'summerSchools': {
      const [storedIndividual, storedGroup] = await Promise.all([
        listSummerProgrammes(locale, 'individual'),
        listSummerProgrammes(locale, 'group'),
      ])
      const individual = mergeBySlug(
        storedIndividual,
        locale === 'en' ? listEnglishSummerShadows('individual') : [],
      )
      const group = mergeBySlug(
        storedGroup,
        locale === 'en' ? listEnglishSummerShadows('group') : [],
      )
      const formats = [
        { key: 'individual' as const, label: locale === 'tr' ? 'Bireysel katılım' : 'Independent study', title: locale === 'tr' ? 'Bireysel yaz okulları' : 'Individual summer schools', body: locale === 'tr' ? 'Öğrencinin tek başına katıldığı, okulun gözetiminde yürüyen programlar.' : 'Programmes a student joins independently, with the school responsible for its on-site supervision.', count: individual.length, tone: 'bg-brand-soft' },
        { key: 'group' as const, label: locale === 'tr' ? 'Grup katılımı' : 'Group travel', title: locale === 'tr' ? 'Grup yaz okulları' : 'Group summer schools', body: locale === 'tr' ? 'Refakatçi eşliğinde birlikte seyahat eden gruplar için planlanan programlar.' : 'Programmes built for organised groups travelling together with a group leader.', count: group.length, tone: 'bg-sky-soft' },
      ]

      return (
        <>
          <SectionHeading locale={locale} kicker={locale === 'tr' ? 'Program türü' : 'Choose the format'} title={locale === 'tr' ? 'Yaz deneyiminizi nasıl planlıyorsunuz?' : 'How do you want the summer experience to work?'} body={locale === 'tr' ? 'Bireysel katılım ile grup seyahatinin yapısı farklıdır. Size uygun olan türden başlayın.' : 'Independent participation and organised group travel work differently. Start with the format that fits the student.'} />
          <ul className="mt-9 grid gap-5 sm:grid-cols-2">
            {formats.map((format) => (
              <li key={format.key}>
                <Link href={docPath(locale, section, summerFormatSlug(locale, format.key))} className="group relative flex min-h-[19rem] h-full flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-card p-6 no-underline shadow-[0_12px_36px_rgba(35,35,38,0.055)] transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_22px_52px_rgba(35,35,38,0.09)] sm:p-7">
                  <div aria-hidden="true" className={`absolute -right-14 -top-16 h-48 w-48 rounded-full ${format.tone} transition-transform duration-500 group-hover:scale-110`} />
                  <div className="relative flex items-start justify-between gap-4"><span className="text-xs font-black uppercase tracking-[0.1em] text-brand-strong">{format.label}</span><span className="rounded-full bg-paper-sunk px-3 py-1.5 text-xs font-bold text-fg-muted">{format.count} {locale === 'tr' ? 'program' : format.count === 1 ? 'programme' : 'programmes'}</span></div>
                  <div className="relative mt-auto pt-12"><h2 className="text-2xl font-bold text-fg">{format.title}</h2><p className="mt-3 max-w-[45ch] text-base leading-relaxed text-fg-muted">{format.body}</p><span className="mt-6 inline-flex text-sm font-bold text-brand-strong">{locale === 'tr' ? 'Programları gör' : 'View programmes'} <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">→</span></span></div>
                </Link>
              </li>
            ))}
          </ul>
          {individual.length === 0 && group.length === 0 ? <div className="mt-12"><EmptySection locale={locale} contactHref={contactHref} /></div> : null}
        </>
      )
    }

    case 'tours': {
      const storedTours = (await listTours(locale)).filter((tour) => tour.slug !== 'turlar' && tour.slug !== 'tours')
      const fallbackTours = listEditorialTours(locale)
      const tours = [
        ...storedTours,
        ...fallbackTours.filter((fallback) => !storedTours.some((tour) => tour.slug === fallback.slug)),
      ]
      if (tours.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return (
        <SortableCardGrid
          locale={locale}
          items={tours.map((tour) => {
            const clearedCmsImage = tour.heroImage?.licence?.cleared === true
            return {
              href: docPath(locale, section, tour.slug),
              title: tour.title,
              image: clearedCmsImage ? tour.heroImage : undefined,
              externalImage: clearedCmsImage ? null : licensedMediaForEditorialText(tour.title, 'educational tour'),
            }
          })}
        />
      )
    }

    case 'insights': {
      const articles = mergeBySlug(
        await getArticlesByCategory(locale, null, 60),
        listEditorialArticles(locale),
      )
      if (articles.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return (
        <SortableCardGrid
          locale={locale}
          items={articles.map((article) => {
            const clearedCmsImage = article.image?.licence?.cleared === true
            return {
              href: docPath(locale, section, article.slug),
              title: article.title,
              meta: article.category,
              excerpt: article.excerpt,
              image: clearedCmsImage ? article.image : undefined,
              externalImage: clearedCmsImage ? null : licensedMediaForEditorialText(article.title, article.category, article.excerpt),
              imageAlt: article.imageAlt ?? article.title,
            }
          })}
        />
      )
    }

    case 'guides':
    case 'services': {
      const type = section === 'guides' ? 'guide' : 'service'
      const fallbackDocs = [
        ...listStarterProse(locale, type),
        ...(locale === 'tr' ? listTurkishStarterProse(type) : listEditorialProse(locale, type)),
      ]
      const docs = mergeBySlug(await getProseIndex(locale, type), fallbackDocs)
      if (docs.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      const variant = section === 'guides' ? 'guides' : 'services'
      return (
        <SortableCardGrid
          locale={locale}
          items={docs.map((doc) => ({
            href: docPath(locale, section, doc.slug),
            title: doc.title,
            excerpt: doc.summary,
            externalImage: licensedMediaForEditorialText(doc.title, doc.summary) ?? licensedMediaForEditorialVariant(variant),
          }))}
        />
      )
    }

    case 'legal':
      return (
        <div className="max-w-[58rem] rounded-[1.5rem] border border-border/70 bg-card p-5 shadow-[0_10px_30px_rgba(35,35,38,0.04)] sm:p-7">
          <ul className="divide-y divide-border/70">
            {legalLinks(locale).map((link) => (
              <li key={link.key}><Link href={link.href} className="group flex min-h-14 items-center justify-between py-3 text-base font-bold text-fg no-underline transition hover:text-brand-strong">{link.label}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></Link></li>
            ))}
          </ul>
        </div>
      )

    default:
      return <EmptySection locale={locale} contactHref={contactHref} />
  }
}

/**
 * CMS records win, while the reviewed starter catalogue fills only missing
 * routes. Connecting Sanity must never make a previously complete section empty.
 */
function mergeBySlug<T extends { slug: string }>(stored: T[], fallback: T[]): T[] {
  const seen = new Set(stored.map((item) => item.slug))
  return [...stored, ...fallback.filter((item) => !seen.has(item.slug))]
}

function SectionHeading({ kicker, title, body }: { locale: Locale; kicker: string; title: string; body: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
      <div><p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{kicker}</p><h2 className="mt-2 max-w-[16ch] text-[length:var(--text-3xl)] font-bold text-fg">{title}</h2></div>
      <p className="max-w-[58ch] text-base leading-relaxed text-fg-muted lg:justify-self-end">{body}</p>
    </div>
  )
}

function visualForSection(section: SectionKey): SectionVisualVariant | undefined {
  switch (section) {
    case 'universities': return 'universities'
    case 'languageSchools': return 'language'
    case 'boardingSchools': return 'boarding'
    case 'summerSchools': return 'summer'
    case 'tours': return 'tours'
    case 'insights': return 'insights'
    case 'guides': return 'guides'
    case 'services': return 'services'
    default: return undefined
  }
}

function slugifyCountry(country: string): string {
  return country.toLowerCase().replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
