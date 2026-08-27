import { Container } from '@/components/ui/Container'
import { PageHero } from '@/components/shared/PageHero'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { CardGrid } from './shared'
import { SectionIndexTemplate } from './SectionIndexTemplate'
import { docPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { SECTION_COPY } from '@/lib/route-metadata'
import { isConfigured } from '@/lib/env'
import { listStarterDestinations, listStarterProse } from '@/lib/content/starter-content'

/**
 * Keeps preview navigation useful before the English Sanity tree has been
 * authored. As soon as Sanity is configured, the normal CMS-backed section index
 * is used without any starter-content involvement.
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

  const destinations =
    section === 'universities' || section === 'languageSchools'
      ? listStarterDestinations(locale, section)
      : []
  const prose = section === 'guides' || section === 'services'
    ? listStarterProse(locale, section === 'guides' ? 'guide' : 'service')
    : []

  if (destinations.length === 0 && prose.length === 0) {
    return <SectionIndexTemplate locale={locale} section={section} />
  }

  const copy = SECTION_COPY[section]
  const title = copy?.title[locale] ?? section
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: title },
  ]

  const items = destinations.length > 0
    ? destinations.map((destination) => ({
        href: docPath(locale, section, destination.slug),
        title: destination.title,
        excerpt: destination.intro,
      }))
    : prose.map((doc) => ({
        href: docPath(locale, section, doc.slug),
        title: doc.title,
        excerpt: doc.summary,
      }))

  return (
    <>
      <PageHero
        locale={locale}
        crumbs={crumbs}
        title={title}
        intro={copy?.description[locale]}
      />
      <Container>
        <div className="py-12">
          <CardGrid items={items} />
        </div>
      </Container>
      <ConsultationBand locale={locale} />
    </>
  )
}
