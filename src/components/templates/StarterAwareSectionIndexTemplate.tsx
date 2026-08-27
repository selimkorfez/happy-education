import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { CardGrid } from './shared'
import { SectionIndexTemplate } from './SectionIndexTemplate'
import { docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import { summerFormatSlug } from '@/lib/routing'
import { isConfigured } from '@/lib/env'
import { listStarterDestinations, listStarterProse } from '@/lib/content/starter-content'
import {
  listEnglishInstitutionShadows,
  listEnglishSummerShadows,
} from '@/lib/content/catalogue-fallback'
import {
  listEditorialArticles,
  listEditorialProse,
  listEditorialTours,
} from '@/lib/content/starter-editorial'

/**
 * Keeps every top-level preview route useful before the English Sanity tree has
 * been authored. Real CMS content always takes over once Sanity is configured.
 */
export async function StarterAwareSectionIndexTemplate({
  locale,
  section,
}: {
  locale: Locale
  section: SectionKey
}) {
  if (isConfigured.sanity()) {
    return <SectionIndexTemplate locale={locale} section={section} />
  }

  const copy = SECTION_COPY[section]
  const title = copy?.title[locale] ?? section
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: title },
  ]

  let body: React.ReactNode = null

  if (section === 'universities' || section === 'languageSchools') {
    const destinations = listStarterDestinations(locale, section)
    if (destinations.length > 0) {
      body = (
        <CardGrid
          items={destinations.map((destination) => ({
            href: docPath(locale, section, destination.slug),
            title: destination.title,
            excerpt: destination.intro,
          }))}
        />
      )
    }
  }

  if (section === 'boardingSchools' && locale === 'en') {
    const schools = listEnglishInstitutionShadows(['boardingSchool'])
    if (schools.length > 0) {
      body = (
        <CardGrid
          items={schools.map((school) => ({
            href: docPath(locale, section, school.slug),
            title: school.title,
            meta: school.city,
          }))}
        />
      )
    }
  }

  if (section === 'summerSchools' && locale === 'en') {
    const individual = listEnglishSummerShadows('individual')
    const group = listEnglishSummerShadows('group')
    if (individual.length + group.length > 0) {
      const formats = [
        {
          key: 'individual' as const,
          title: 'Individual summer schools',
          body: 'Programmes a student joins independently, with the provider responsible for its on-site supervision and welfare arrangements.',
          count: individual.length,
        },
        {
          key: 'group' as const,
          title: 'Group summer schools',
          body: 'Programmes for organised groups travelling together, with the detailed itinerary and responsibilities confirmed before booking.',
          count: group.length,
        },
      ]
      body = (
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
              <p className="mt-4 text-sm font-medium text-fg-muted">
                {format.count} catalogue {format.count === 1 ? 'programme' : 'programmes'}
              </p>
            </li>
          ))}
        </ul>
      )
    }
  }

  if (section === 'tours' && locale === 'en') {
    const tours = listEditorialTours(locale)
    if (tours.length > 0) {
      body = (
        <CardGrid
          items={tours.map((tour) => ({ href: docPath(locale, section, tour.slug), title: tour.title }))}
        />
      )
    }
  }

  if (section === 'insights' && locale === 'en') {
    const articles = listEditorialArticles(locale)
    if (articles.length > 0) {
      body = (
        <CardGrid
          items={articles.map((article) => ({
            href: docPath(locale, section, article.slug),
            title: article.title,
            meta: article.category,
            excerpt: article.excerpt,
          }))}
        />
      )
    }
  }

  if (section === 'guides' || section === 'services') {
    const type = section === 'guides' ? 'guide' : 'service'
    const docs = [...listStarterProse(locale, type), ...listEditorialProse(locale, type)]
      .filter((item, index, all) => all.findIndex((other) => other.slug === item.slug) === index)
    if (docs.length > 0) {
      body = (
        <CardGrid
          items={docs.map((doc) => ({
            href: docPath(locale, section, doc.slug),
            title: doc.title,
            excerpt: doc.summary,
          }))}
        />
      )
    }
  }

  if (!body) {
    return <SectionIndexTemplate locale={locale} section={section} />
  }

  return (
    <>
      <PageHero locale={locale} crumbs={crumbs} title={title} intro={copy?.description[locale]} />
      <Container>
        <div className="py-12">{body}</div>
      </Container>
      <ConsultationBand locale={locale} />
    </>
  )
}
