import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { InstitutionBrowser } from '@/components/content/InstitutionBrowser'
import { SortableCardGrid } from '@/components/content/SortableCardGrid'
import { EmptySection } from './shared'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import { summerFormatSlug } from '@/lib/routing'
import { legalLinks } from '@/lib/legal'
import { listDestinations, listInstitutions, listTours, listSummerProgrammes } from '@/lib/sanity/queries/content'
import { getArticlesByCategory } from '@/lib/sanity/queries/articles'
import { getProseIndex } from '@/lib/sanity/queries/index-lists'

export async function SectionIndexTemplate({ locale, section }: { locale: Locale; section: SectionKey }) {
  const copy = SECTION_COPY[section]
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: copy?.title[locale] ?? section },
  ]
  const body = await sectionBody(locale, section)

  return (
    <>
      <PageHero locale={locale} crumbs={crumbs} eyebrow={locale === 'tr' ? 'Keşfet' : 'Explore'} title={copy?.title[locale] ?? section} intro={copy?.description[locale]} />
      <section className="bg-paper py-10 sm:py-14 lg:py-16">
        <Container>{body}</Container>
      </section>
      <ConsultationBand locale={locale} />
    </>
  )
}

async function sectionBody(locale: Locale, section: SectionKey) {
  const contactHref = sectionPath(locale, 'contact')

  switch (section) {
    case 'universities':
    case 'languageSchools': {
      const [destinations, institutions] = await Promise.all([
        listDestinations(locale, section),
        listInstitutions(locale, section === 'universities' ? ['institution'] : ['languageSchool']),
      ])

      if (destinations.length === 0 && institutions.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />

      return (
        <div className="space-y-16 lg:space-y-20">
          {destinations.length > 0 ? (
            <section>
              <SectionHeading locale={locale} kicker={locale === 'tr' ? 'Ülke seçin' : 'Choose a destination'} title={locale === 'tr' ? 'Ülkeye göre keşfedin' : 'Explore by destination'} body={locale === 'tr' ? 'Önce ülkeyi seçip ardından kurumları, şehirleri ve ilgili seçenekleri inceleyin.' : 'Start with a country, then move into institutions, cities and the options available there.'} />
              <div className="mt-8">
                <SortableCardGrid locale={locale} items={destinations.map((d) => ({ href: docPath(locale, section, d.slug), title: d.title, excerpt: d.intro, image: d.heroImage ?? null }))} />
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
                  }))}
                />
              </div>
            </section>
          ) : null}
        </div>
      )
    }

    case 'boardingSchools': {
      const schools = await listInstitutions(locale, ['boardingSchool'])
      if (schools.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return (
        <div>
          <SectionHeading locale={locale} kicker={locale === 'tr' ? 'Okulları karşılaştırın' : 'Compare schools'} title={locale === 'tr' ? 'Yatılı okul seçeneklerini keşfedin' : 'Explore boarding-school options'} body={locale === 'tr' ? 'Akademik uyum kadar yatılı yaşam, destek ve günlük ortamı da düşünerek ilerleyin.' : 'Look beyond academics and compare boarding life, support and the day-to-day environment too.'} />
          <div className="mt-8">
            <InstitutionBrowser locale={locale} items={schools.map((s) => ({ href: docPath(locale, section, s.slug), title: s.title, city: s.city, country: s.country }))} />
          </div>
        </div>
      )
    }

    case 'summerSchools': {
      const [individual, group] = await Promise.all([
        listSummerProgrammes(locale, 'individual'),
        listSummerProgrammes(locale, 'group'),
      ])
      const formats = [
        { key: 'individual' as const, code: '01', title: locale === 'tr' ? 'Bireysel yaz okulları' : 'Individual summer schools', body: locale === 'tr' ? 'Öğrencinin tek başına katıldığı, okulun gözetiminde yürüyen programlar.' : 'Programmes a student joins independently, with the school responsible for its on-site supervision.', count: individual.length, tone: 'bg-brand-soft' },
        { key: 'group' as const, code: '02', title: locale === 'tr' ? 'Grup yaz okulları' : 'Group summer schools', body: locale === 'tr' ? 'Refakatçi eşliğinde birlikte seyahat eden gruplar için planlanan programlar.' : 'Programmes built for organised groups travelling together with a group leader.', count: group.length, tone: 'bg-sky-soft' },
      ]

      return (
        <>
          <SectionHeading locale={locale} kicker={locale === 'tr' ? 'Program türü' : 'Choose the format'} title={locale === 'tr' ? 'Yaz deneyiminizi nasıl planlıyorsunuz?' : 'How do you want the summer experience to work?'} body={locale === 'tr' ? 'Bireysel katılım ile grup seyahatinin yapısı farklıdır. Size uygun olan türden başlayın.' : 'Independent participation and organised group travel work differently. Start with the format that fits the student.'} />
          <ul className="mt-9 grid gap-5 sm:grid-cols-2">
            {formats.map((format) => (
              <li key={format.key}>
                <Link href={docPath(locale, section, summerFormatSlug(locale, format.key))} className="group relative flex min-h-[19rem] h-full flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-white p-6 no-underline shadow-[0_12px_36px_rgba(35,35,38,0.055)] transition duration-300 hover:-translate-y-1 hover:border-brand/25 hover:shadow-[0_22px_52px_rgba(35,35,38,0.09)] sm:p-7">
                  <div className={`absolute -right-14 -top-16 h-48 w-48 rounded-full ${format.tone} transition-transform duration-500 group-hover:scale-110`} />
                  <div className="relative flex items-start justify-between"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-surface text-sm font-black text-white">{format.code}</span><span className="rounded-full bg-paper-sunk px-3 py-1.5 text-xs font-bold text-fg-muted">{format.count} {locale === 'tr' ? 'program' : format.count === 1 ? 'programme' : 'programmes'}</span></div>
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
      const tours = await listTours(locale)
      if (tours.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return <SortableCardGrid locale={locale} items={tours.map((tour) => ({ href: docPath(locale, section, tour.slug), title: tour.title, image: tour.heroImage ?? null }))} />
    }

    case 'insights': {
      const articles = await getArticlesByCategory(locale, null, 60)
      if (articles.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return <SortableCardGrid locale={locale} items={articles.map((a) => ({ href: docPath(locale, section, a.slug), title: a.title, meta: a.category, excerpt: a.excerpt, image: a.image ?? null, imageAlt: a.imageAlt ?? a.title }))} />
    }

    case 'guides':
    case 'services': {
      const docs = await getProseIndex(locale, section === 'guides' ? 'guide' : 'service')
      if (docs.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return <SortableCardGrid locale={locale} items={docs.map((d) => ({ href: docPath(locale, section, d.slug), title: d.title, excerpt: d.summary }))} />
    }

    case 'legal':
      return (
        <div className="max-w-[58rem] rounded-[1.5rem] border border-border/70 bg-white p-5 shadow-[0_10px_30px_rgba(35,35,38,0.04)] sm:p-7">
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

function SectionHeading({ kicker, title, body }: { locale: Locale; kicker: string; title: string; body: string }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
      <div><p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{kicker}</p><h2 className="mt-2 max-w-[16ch] text-[length:var(--text-3xl)] font-bold text-fg">{title}</h2></div>
      <p className="max-w-[58ch] text-base leading-relaxed text-fg-muted lg:justify-self-end">{body}</p>
    </div>
  )
}

function slugifyCountry(country: string): string {
  return country.toLowerCase().replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
