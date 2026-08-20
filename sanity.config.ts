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
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? ''
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export default defineConfig({
  name: 'happy-education',
  title: 'Happy Education',
  basePath: '/studio',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure: deskStructure }),
    ...(process.env.NODE_ENV === 'production' ? [] : [visionTool()]),
  ],
  schema: { types: schemaTypes },
  document: {
    // Keep singletons out of the "create new" menu so nobody makes a second
    // site-settings document.
    newDocumentOptions: (prev) =>
      prev.filter((item) => item.templateId !== 'siteSettings'),
  },
})
