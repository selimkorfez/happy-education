import type { ReactNode } from 'react'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import type { SectionVisualVariant } from '@/components/shared/SectionVisual'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { InstitutionBrowser } from '@/components/content/InstitutionBrowser'
import { SortableCardGrid } from '@/components/content/SortableCardGrid'
import { SectionIndexTemplate } from './SectionIndexTemplate'
import { docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import { summerFormatSlug } from '@/lib/routing'
import { isConfigured } from '@/lib/env'
import { listStarterDestinations, listStarterProse } from '@/lib/content/starter-content'
import { listEnglishInstitutionShadows, listEnglishSummerShadows } from '@/lib/content/catalogue-fallback'
import { listEditorialArticles, listEditorialProse, listEditorialTours } from '@/lib/content/starter-editorial'
import { listTurkishStarterProse } from '@/lib/content/starter-turkish-prose'
import {
  licensedMediaForDestination,
  licensedMediaForInstitutionOrPlace,
} from '@/lib/media/licensed-media'

/** Keeps top-level routes useful and visually complete before the CMS tree is live. */
export async function StarterAwareSectionIndexTemplate({ locale, section }: { locale: Locale; section: SectionKey }) {
  if (isConfigured.sanity()) return <SectionIndexTemplate locale={locale} section={section} />

  const copy = SECTION_COPY[section]
  const title = copy?.title[locale] ?? section
  const crumbs = [{ label: t(locale, 'brand.name'), href: `/${locale}` }, { label: title }]
  let body: ReactNode = null

  if (section === 'universities' || section === 'languageSchools') {
    const destinations = listStarterDestinations(locale, section)
    const institutions = locale === 'en'
      ? listEnglishInstitutionShadows(section === 'universities' ? ['institution'] : ['languageSchool'])
      : []

    if (destinations.length > 0 || institutions.length > 0) {
      body = (
        <div className="space-y-16 lg:space-y-20">
          {destinations.length > 0 ? (
            <BrowseBlock
              kicker={locale === 'tr' ? 'Ülke seçin' : 'Choose a destination'}
              title={locale === 'tr' ? 'Önce nereye gitmek istediğinize bakın.' : 'Start with where this could take you.'}
              body={locale === 'tr' ? 'Ülke sayfalarında kurumları, şehirleri ve pratik sonraki adımları tek yerde inceleyin.' : 'Open a destination to browse institutions, cities and practical next steps in one place.'}
            >
              <SortableCardGrid
                locale={locale}
                items={destinations.map((destination) => ({
                  href: docPath(locale, section, destination.slug),
                  title: destination.title,
                  excerpt: destination.intro,
                  externalImage: licensedMediaForDestination(destination.slug),
                }))}
              />
            </BrowseBlock>
          ) : null}

          {institutions.length > 0 ? (
            <section className="border-t border-border/70 pt-12 sm:pt-14">
              <BrowseBlock
                kicker={section === 'universities' ? 'Browse universities' : 'Browse schools'}
                title={section === 'universities' ? 'All universities in one place.' : 'All language schools in one place.'}
                body={section === 'universities'
                  ? 'Start with the curated Popular order, switch to A–Z, or search directly by university, city or country.'
                  : 'Start with the curated Popular order, switch to A–Z, or search directly by school, city or country.'}
              >
                <InstitutionBrowser
                  locale={locale}
                  items={institutions.map((institution) => ({
                    href: institution.country
                      ? docPath(locale, section, slugifyCountry(institution.country), institution.slug)
                      : docPath(locale, section, institution.slug),
                    title: institution.title,
                    city: institution.city,
                    country: institution.country,
                    image: licensedMediaForInstitutionOrPlace(institution.title, institution.city, institution.country),
                  }))}
                />
              </BrowseBlock>
            </section>
          ) : null}
        </div>
      )
    }
  }

  if (section === 'boardingSchools' && locale === 'en') {
    const schools = listEnglishInstitutionShadows(['boardingSchool'])
    if (schools.length > 0) {
      body = (
        <BrowseBlock kicker="Compare schools" title="Look beyond the prospectus." body="Browse the current catalogue by school and location, then open a profile to start comparing academic fit, boarding life and support.">
          <InstitutionBrowser
            locale={locale}
            items={schools.map((school) => ({
              href: docPath(locale, section, school.slug),
              title: school.title,
              city: school.city,
              country: school.country,
              image: licensedMediaForInstitutionOrPlace(school.title, school.city, school.country),
            }))}
          />
        </BrowseBlock>
      )
    }
  }

  if (section === 'summerSchools' && locale === 'en') {
    const individual = listEnglishSummerShadows('individual')
    const group = listEnglishSummerShadows('group')
    const formats = [
      { key: 'individual' as const, code: '01', title: 'Individual summer schools', body: 'Programmes a student joins independently, with the provider responsible for its on-site supervision and welfare arrangements.', count: individual.length, tone: 'bg-brand-soft' },
      { key: 'group' as const, code: '02', title: 'Group summer schools', body: 'Programmes for organised groups travelling together, with the detailed itinerary and responsibilities confirmed before booking.', count: group.length, tone: 'bg-sky-soft' },
    ]
    if (individual.length + group.length > 0) {
      body = (
        <BrowseBlock kicker="Choose the format" title="How should the summer experience work?" body="Independent participation and organised group travel work differently. Start with the format that fits the student and the level of support you want.">
          <ul className="grid gap-5 sm:grid-cols-2">
            {formats.map((format) => (
              <li key={format.key}>
                <Link href={docPath(locale, section, summerFormatSlug(locale, format.key))} className="group relative flex min-h-[19rem] h-full flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-white p-6 no-underline shadow-[0_12px_36px_rgba(35,35,38,0.055)] transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_22px_52px_rgba(35,35,38,0.09)] sm:p-7">
                  <div className={`absolute -right-14 -top-16 h-48 w-48 rounded-full ${format.tone} transition-transform duration-500 group-hover:scale-110`} />
                  <div className="relative flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-surface text-sm font-black text-white">{format.code}</span><span className="rounded-full bg-paper-sunk px-3 py-1.5 text-xs font-bold text-fg-muted">{format.count} catalogue {format.count === 1 ? 'programme' : 'programmes'}</span></div>
                  <div className="relative mt-auto pt-12"><h2 className="text-2xl font-bold text-fg">{format.title}</h2><p className="mt-3 max-w-[45ch] text-base leading-relaxed text-fg-muted">{format.body}</p><span className="mt-6 inline-flex text-sm font-bold text-brand-strong">View programmes <span aria-hidden="true" className="ml-2 transition-transform group-hover:translate-x-1">→</span></span></div>
                </Link>
              </li>
            ))}
          </ul>
        </BrowseBlock>
      )
    }
  }

  if (section === 'tours' && locale === 'en') {
    const tours = listEditorialTours(locale)
    if (tours.length > 0) {
      body = <BrowseBlock kicker="Travel with purpose" title="Learning does not have to stay in a classroom." body="Explore enquiry-led educational group travel designed around a clear itinerary and practical coordination."><SortableCardGrid locale={locale} items={tours.map((tour) => ({ href: docPath(locale, section, tour.slug), title: tour.title }))} /></BrowseBlock>
    }
  }

  if (section === 'insights' && locale === 'en') {
    const articles = listEditorialArticles(locale)
    if (articles.length > 0) {
      body = <BrowseBlock kicker="Useful before you decide" title="Practical reads for the questions behind the decision." body="Short, useful guides to help you compare options and know what to ask before committing."><SortableCardGrid locale={locale} items={articles.map((article) => ({ href: docPath(locale, section, article.slug), title: article.title, meta: article.category, excerpt: article.excerpt }))} /></BrowseBlock>
    }
  }

  if (section === 'guides' || section === 'services') {
    const type = section === 'guides' ? 'guide' : 'service'
    const extra = locale === 'tr' ? listTurkishStarterProse(type) : listEditorialProse(locale, type)
    const docs = [...listStarterProse(locale, type), ...extra].filter((item, index, all) => all.findIndex((other) => other.slug === item.slug) === index)
    if (docs.length > 0) {
      body = (
        <BrowseBlock
          kicker={locale === 'tr' ? 'Pratik destek' : 'Practical support'}
          title={section === 'guides' ? (locale === 'tr' ? 'Süreci daha anlaşılır hâle getirin.' : 'Make the process easier to understand.') : (locale === 'tr' ? 'İhtiyacınız olan desteği bulun.' : 'Find the support that fits the next step.')}
          body={locale === 'tr' ? 'Uzun açıklamalar yerine ihtiyacınız olan konuya doğrudan gidin.' : 'Go straight to the part of the process you are trying to work out rather than reading one giant wall of information.'}
        >
          <SortableCardGrid locale={locale} items={docs.map((doc) => ({ href: docPath(locale, section, doc.slug), title: doc.title, excerpt: doc.summary }))} />
        </BrowseBlock>
      )
    }
  }

  if (!body) return <SectionIndexTemplate locale={locale} section={section} />

  return (
    <>
      <PageHero locale={locale} crumbs={crumbs} eyebrow={locale === 'tr' ? 'Keşfet' : 'Explore'} title={title} intro={copy?.description[locale]} visualVariant={visualForSection(section)} />
      <section className="bg-paper py-10 sm:py-14 lg:py-16"><Container>{body}</Container></section>
      <ConsultationBand locale={locale} />
    </>
  )
}

function BrowseBlock({ kicker, title, body, children }: { kicker: string; title: string; body: string; children: ReactNode }) {
  return (
    <div>
      <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
        <div><p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{kicker}</p><h2 className="mt-2 max-w-[16ch] text-[length:var(--text-3xl)] font-bold text-fg">{title}</h2></div>
        <p className="max-w-[58ch] text-base leading-relaxed text-fg-muted lg:justify-self-end">{body}</p>
      </div>
      <div className="mt-8">{children}</div>
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
