import { HREFLANG, type Locale } from '@/lib/i18n/config'
import { absoluteUrl } from '@/lib/seo/urls'
import { compact, jsonLdHtml, schemaImage } from '@/lib/seo/jsonld'
import type { MediaSource } from '@/components/ui/MediaFrame'

/**
 * Course structured data for a summer programme or a language course.
 *
 * Two constraints shape this component, and both are deliberate refusals rather
 * than omissions.
 *
 * PROVIDER. Happy Education does not teach. It is an advisory service (Companies
 * House SIC 85600, educational support services), so it must never appear as the
 * `provider` of a course, and it is never marked up as an EducationalOrganization
 * anywhere on the site. The provider is the school or university running the
 * programme. If the provider's name is not recorded, nothing is emitted at all: a
 * Course without a truthful provider is worse than no Course.
 *
 * FIT. `Course` is only correct for a taught programme with a name, a description
 * and a provider. Institution profiles, destination pages and tours are not
 * courses and must not be forced into this shape. `hasCourseInstance` is added
 * only when the delivery mode and duration are actually known, because Google
 * treats a course instance with invented values as spam.
 *
 * No rating, review or enrolment-count property is ever emitted. None of those
 * are verified for this business.
 */

export interface CourseSchemaProps {
  locale: Locale
  /** Programme name as shown on the page. */
  name: string
  /** Plain-text summary. Not the full body. */
  description: string
  /** Path to the programme page on this site. */
  path: string
  /**
   * The organisation that actually delivers the teaching. Required. Passing
   * "Happy Education" here is a mistake and is rejected below.
   */
  providerName: string
  /** The provider's own website, when recorded. */
  providerUrl?: string | null
  image?: MediaSource | null
  /** ISO 8601 duration, e.g. `P2W`. Only pass a value taken from the programme. */
  timeRequired?: string | null
  /** Delivery mode. Everything Happy Education places is taught in person. */
  courseMode?: 'onsite' | 'blended' | 'online' | null
  /** Language of instruction, as a BCP 47 tag. */
  languageOfInstruction?: string | null
  /** CEFR or similar level, exactly as published by the provider. */
  educationalLevel?: string | null
}

/** Names that must never appear as a course provider. */
const NOT_A_PROVIDER = /happy\s*education/i

export function CourseSchema({
  locale,
  name,
  description,
  path,
  providerName,
  providerUrl,
  image,
  timeRequired,
  courseMode,
  languageOfInstruction,
  educationalLevel,
}: CourseSchemaProps) {
  const provider = providerName?.trim()

  // Required-field gate. Missing any of these means the data does not fit the
  // type, so no markup is produced.
  if (!name?.trim() || !description?.trim() || !provider) return null
  if (NOT_A_PROVIDER.test(provider)) return null

  const url = absoluteUrl(path)

  const schema = compact({
    '@context': 'https://schema.org',
    '@type': 'Course',
    '@id': `${url}#course`,
    name: name.trim(),
    description: description.trim(),
    url,
    inLanguage: HREFLANG[locale],
    provider: compact({
      '@type': 'Organization',
      name: provider,
      url: providerUrl ?? undefined,
    }),
    image: schemaImage(image),
    timeRequired: timeRequired ?? undefined,
    educationalLevel: educationalLevel ?? undefined,
    // A course instance is only claimed when both facts are known. Google requires
    // courseMode plus a schedule or duration; a partial instance is not emitted.
    hasCourseInstance:
      courseMode && timeRequired
        ? compact({
            '@type': 'CourseInstance',
            courseMode,
            courseWorkload: timeRequired,
            inLanguage: languageOfInstruction ?? HREFLANG[locale],
          })
        : undefined,
  })

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonLdHtml(schema) }}
    />
  )
}
