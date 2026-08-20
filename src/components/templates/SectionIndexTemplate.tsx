import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { CardGrid, EmptySection } from './shared'
import { sectionPath, docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import { summerFormatSlug } from '@/lib/routing'
import { legalLinks } from '@/lib/legal'
import {
  listDestinations,
  listInstitutions,
  listTours,
  listSummerProgrammes,
} from '@/lib/sanity/queries/content'
import { getArticlesByCategory } from '@/lib/sanity/queries/articles'
import { getProseIndex } from '@/lib/sanity/queries/index-lists'

/**
 * Section index pages.
 *
 * One template covering every top-level section, because they share a shape: hero,
 * a list of what is inside, then a consultation prompt. What is listed differs per
 * section, which is the switch below.
 *
 * A section index always resolves even on an empty dataset, so navigation never
 * points at a 404 before content is imported. When there is nothing to list it
 * shows a composed empty state rather than a heading over a void.
 */
export async function SectionIndexTemplate({
  locale,
  section,
}: {
  locale: Locale
  section: SectionKey
}) {
  const copy = SECTION_COPY[section]
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: copy?.title[locale] ?? section },
  ]

  const body = await sectionBody(locale, section)

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        title={copy?.title[locale] ?? section}
        intro={copy?.description[locale]}
      />
      <Container>
        <div className="py-12">{body}</div>
      </Container>
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

      if (destinations.length === 0 && institutions.length === 0) {
        return <EmptySection locale={locale} contactHref={contactHref} />
      }

      return (
        <>
          {destinations.length > 0 ? (
            <section>
              <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">
                {locale === 'tr' ? 'Ülkeye göre' : 'By destination'}
              </h2>
              <div className="mt-8">
                <CardGrid
                  items={destinations.map((d) => ({
                    href: docPath(locale, section, d.slug),
                    title: d.title,
                    excerpt: d.intro,
                    image: d.heroImage ?? null,
                  }))}
                />
              </div>
            </section>
          ) : null}

          {institutions.length > 0 ? (
            <section className="mt-16 border-t border-border pt-12">
              <h2 className="font-display text-[length:var(--text-2xl)] font-semibold text-fg">
                {locale === 'tr' ? 'Tüm kurumlar' : 'All institutions'}
              </h2>
              <ul className="mt-6 grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
                {institutions.map((inst) => (
                  <li key={inst.slug} className="border-b border-border">
                    <Link
                      href={
                        inst.country
                          ? docPath(locale, section, slugifyCountry(inst.country), inst.slug)
                          : docPath(locale, section, inst.slug)
                      }
                      className="block py-3 text-base text-fg no-underline hover:text-brand-strong hover:underline"
                    >
                      {inst.title}
                      {inst.city ? <span className="block text-sm text-fg-muted">{inst.city}</span> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      )
    }

    case 'boardingSchools': {
      const schools = await listInstitutions(locale, ['boardingSchool'])
      if (schools.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return (
        <CardGrid
          items={schools.map((s) => ({
            href: docPath(locale, section, s.slug),
            title: s.title,
            meta: s.city,
            image: s.heroImage ?? null,
          }))}
        />
      )
    }

    case 'summerSchools': {
      const [individual, group] = await Promise.all([
        listSummerProgrammes(locale, 'individual'),
        listSummerProgrammes(locale, 'group'),
      ])

      const formats = [
        {
          key: 'individual' as const,
          title: locale === 'tr' ? 'Bireysel yaz okulları' : 'Individual summer schools',
          body:
            locale === 'tr'
              ? 'Öğrencinin tek başına katıldığı, okulun gözetiminde yürüyen programlar.'
              : 'Programmes a student joins on their own, supervised by the school.',
          count: individual.length,
        },
        {
          key: 'group' as const,
          title: locale === 'tr' ? 'Grup yaz okulları' : 'Group summer schools',
          body:
            locale === 'tr'
              ? 'Türkiye’den refakatçi eşliğinde giden gruplar için düzenlenen programlar.'
              : 'Programmes for groups travelling together with a group leader.',
          count: group.length,
        },
      ]

      return (
        <>
          <ul className="grid gap-6 sm:grid-cols-2">
            {formats.map((format) => (
              <li key={format.key} className="border border-border p-6">
                <h2 className="font-display text-xl font-semibold text-fg">
                  <Link
                    href={docPath(locale, section, summerFormatSlug(locale, format.key))}
                    className="text-fg no-underline hover:text-brand-strong hover:underline"
                  >
                    {format.title}
                  </Link>
                </h2>
                <p className="mt-2 text-base leading-relaxed text-fg-muted">{format.body}</p>
              </li>
            ))}
          </ul>
          {individual.length === 0 && group.length === 0 ? (
            <div className="mt-12">
              <EmptySection locale={locale} contactHref={contactHref} />
            </div>
          ) : null}
        </>
      )
    }

    case 'tours': {
      const tours = await listTours(locale)
      if (tours.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return (
        <CardGrid
          items={tours.map((tour) => ({
            href: docPath(locale, section, tour.slug),
            title: tour.title,
            image: tour.heroImage ?? null,
          }))}
        />
      )
    }

    case 'insights': {
      const articles = await getArticlesByCategory(locale, null, 60)
      if (articles.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return (
        <CardGrid
          items={articles.map((a) => ({
            href: docPath(locale, section, a.slug),
            title: a.title,
            meta: a.category,
            excerpt: a.excerpt,
            image: a.image ?? null,
            imageAlt: a.imageAlt ?? a.title,
          }))}
        />
      )
    }

    case 'guides':
    case 'services': {
      const docs = await getProseIndex(locale, section === 'guides' ? 'guide' : 'service')
      if (docs.length === 0) return <EmptySection locale={locale} contactHref={contactHref} />
      return (
        <CardGrid
          items={docs.map((d) => ({
            href: docPath(locale, section, d.slug),
            title: d.title,
            excerpt: d.summary,
          }))}
        />
      )
    }

    case 'legal': {
      return (
        <ul className="max-w-[52rem] border-t border-border">
          {legalLinks(locale).map((link) => (
            <li key={link.key} className="border-b border-border">
              <Link
                href={link.href}
                className="block py-4 text-lg text-fg no-underline hover:text-brand-strong hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      )
    }

    default:
      return <EmptySection locale={locale} contactHref={contactHref} />
  }
}

/**
 * Falls back to a slugified country when an institution has no destination
 * reference, so the link still resolves rather than pointing at a broken path.
 */
function slugifyCountry(country: string): string {
  return country
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/İ/g, 'i').replace(/ğ/g, 'g')
    .replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ö/g, 'o').replace(/ü/g, 'u')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}
