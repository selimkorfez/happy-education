import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'
import { deskStructure } from './sanity/lib/structure'

/**
 * Sanity Studio.
 *
 * Mounted at /studio inside the Next.js app so there is one deployment and one
 * domain to secure. Access is controlled by Sanity project membership — there is
 * no public registration and no self-service sign-up. Enable SSO and enforce 2FA
 * on the Sanity organisation; see docs/SECURITY.md.
 *
 * Vision (the GROQ playground) is loaded only outside production, so the query
 * console is not shipped to a live editor session.
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'q1voz8ji'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const basePath =
  process.env.SANITY_STUDIO_STANDALONE === 'true' ? '/' : '/studio'

const localisedTypes = [
  'institution', 'languageSchool', 'boardingSchool', 'tour', 'article', 'guide',
  'service', 'socialPost', 'testimonial', 'category', 'legalPage',
] as const
const locales = ['en', 'tr'] as const
const destinationSections = [
  'universities', 'languageSchools', 'boardingSchools', 'summerSchools',
] as const
const pageKeys = [
  'universities', 'languageSchools', 'summerSchools', 'boardingSchools',
  'tours', 'insights', 'guides', 'services',
  'about', 'contact', 'consultation', 'search',
  'summerIndividual', 'summerGroup',
] as const

export default defineConfig({
  name: 'happy-education',
  title: 'Happy Education',
  basePath,
  projectId,
  dataset,
  plugins: [
    structureTool({ structure: deskStructure }),
    ...(process.env.NODE_ENV === 'production' ? [] : [visionTool()]),
  ],
  schema: {
    types: schemaTypes,
    templates: (previous) => [
      ...previous,
      ...localisedTypes.flatMap((schemaType) => locales.map((locale) => ({
        id: `${schemaType}-${locale}`,
        title: `New ${schemaType} (${locale.toUpperCase()})`,
        schemaType,
        value: { locale },
      }))),
      ...destinationSections.flatMap((section) => locales.map((locale) => ({
        id: `destination-${section}-${locale}`,
        title: `New ${section} destination (${locale.toUpperCase()})`,
        schemaType: 'destination',
        value: { locale, section, kind: 'country' },
      }))),
      ...locales.flatMap((locale) => (['individual', 'group'] as const).map((format) => ({
        id: `summerProgramme-${format}-${locale}`,
        title: `New ${format} summer programme (${locale.toUpperCase()})`,
        schemaType: 'summerProgramme',
        value: { locale, format },
      }))),
      ...pageKeys.flatMap((pageKey) => locales.map((locale) => ({
        id: `page-${pageKey}-${locale}`,
        title: `New ${pageKey} page (${locale.toUpperCase()})`,
        schemaType: 'page',
        value: { locale, pageKey },
      }))),
    ],
  },
  document: {
    // Keep singletons out of the "create new" menu so nobody makes a second
    // site-settings document.
    newDocumentOptions: (prev) =>
      prev.filter((item) => item.templateId !== 'siteSettings'),
  },
})
