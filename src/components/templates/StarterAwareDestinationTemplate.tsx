import type { Locale, SectionKey } from '@/lib/i18n/config'
import type { DestinationDoc } from '@/lib/sanity/queries/content'
import { DestinationTemplate } from './DestinationTemplate'
import { listEnglishInstitutionShadows } from '@/lib/content/catalogue-fallback'

/**
 * Enriches English starter country pages with the real institution names already
 * present in the migrated catalogue. Only identity/location fields are surfaced;
 * the individual shadow profiles remain noindex until genuine English CMS records
 * replace them.
 */
export function StarterAwareDestinationTemplate({
  locale,
  section,
  doc,
}: {
  locale: Locale
  section: SectionKey
  doc: DestinationDoc
}) {
  if (locale !== 'en' || !doc._id.startsWith('starter-')) {
    return <DestinationTemplate locale={locale} section={section} doc={doc} />
  }

  const types =
    section === 'universities'
      ? ['institution']
      : section === 'languageSchools'
        ? ['languageSchool']
        : section === 'boardingSchools'
          ? ['boardingSchool']
          : []

  const institutions = types.length
    ? listEnglishInstitutionShadows(types, doc.slug).map((item) => ({
        _type: item._type,
        title: item.title,
        slug: item.slug,
        city: item.city,
      }))
    : []

  return (
    <DestinationTemplate
      locale={locale}
      section={section}
      doc={{ ...doc, institutions }}
    />
  )
}
