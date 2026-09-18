type StudioRouteInput = {
  locale?: string
  type?: string
  slug?: string
  section?: string
  parentSlug?: string
  destinationSlug?: string
  pageKey?: string
  format?: string
}

const SECTION_SLUGS: Record<string, Record<'en' | 'tr', string>> = {
  universities: { en: 'universities', tr: 'universiteler' },
  languageSchools: { en: 'language-schools', tr: 'dil-okullari' },
  summerSchools: { en: 'summer-schools', tr: 'yaz-okullari' },
  boardingSchools: { en: 'boarding-schools', tr: 'yatili-okullar' },
  tours: { en: 'tours', tr: 'turlar' },
  insights: { en: 'insights', tr: 'blog' },
  guides: { en: 'student-guide', tr: 'ogrenci-rehberi' },
  services: { en: 'services', tr: 'hizmetler' },
  about: { en: 'about', tr: 'hakkimizda' },
  contact: { en: 'contact', tr: 'iletisim' },
  consultation: { en: 'free-consultation', tr: 'ucretsiz-danismanlik' },
  legal: { en: 'legal', tr: 'yasal' },
}

/** Shows editors the public path a document controls directly in every list. */
export function studioPath(input: StudioRouteInput): string {
  const locale = input.locale === 'en' ? 'en' : 'tr'
  const slug = input.slug?.trim()

  if (input.type === 'page') {
    const section = pageSection(input.pageKey)
    if (section) {
      const parts = [`/${locale}`, sectionSlug(section, locale)]
      if (input.pageKey === 'summerIndividual') parts.push(locale === 'en' ? 'individual' : 'bireysel')
      if (input.pageKey === 'summerGroup') parts.push(locale === 'en' ? 'group' : 'grup')
      return parts.join('/')
    }
  }

  const section = sectionForType(input.type, input.section)
  if (!section) return slug ? `/${locale}/${slug}` : `/${locale}`
  const parts = [`/${locale}`, sectionSlug(section, locale)]

  if (input.type === 'destination' && input.parentSlug) parts.push(input.parentSlug)
  if (['institution', 'languageSchool'].includes(input.type ?? '') && input.destinationSlug) {
    parts.push(input.destinationSlug)
  }
  if (input.type === 'summerProgramme') {
    parts.push(input.format === 'group'
      ? (locale === 'en' ? 'group' : 'grup')
      : (locale === 'en' ? 'individual' : 'bireysel'))
  }
  if (slug) parts.push(slug)
  return parts.join('/')
}

export function studioSubtitle(input: StudioRouteInput, ...details: Array<string | undefined>): string {
  return [input.locale?.toUpperCase(), studioPath(input), ...details].filter(Boolean).join(' · ')
}

function sectionForType(type?: string, explicit?: string): string | undefined {
  if (type === 'destination') return explicit
  if (type === 'institution') return 'universities'
  if (type === 'languageSchool') return 'languageSchools'
  if (type === 'boardingSchool') return 'boardingSchools'
  if (type === 'summerProgramme') return 'summerSchools'
  if (type === 'tour') return 'tours'
  if (type === 'article' || type === 'socialPost' || type === 'testimonial') return 'insights'
  if (type === 'guide') return 'guides'
  if (type === 'service') return 'services'
  if (type === 'legalPage') return 'legal'
  return undefined
}

function pageSection(pageKey?: string): string | undefined {
  if (['universities', 'languageSchools', 'summerSchools', 'tours', 'insights', 'guides', 'services', 'about', 'contact', 'consultation'].includes(pageKey ?? '')) return pageKey
  if (pageKey === 'boardingSchools') return 'boardingSchools'
  if (pageKey === 'summerSchools' || pageKey === 'summerIndividual' || pageKey === 'summerGroup') {
    return 'summerSchools'
  }
  return undefined
}

function sectionSlug(section: string, locale: 'en' | 'tr'): string {
  return SECTION_SLUGS[section]?.[locale] ?? section
}
