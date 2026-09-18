import 'server-only'
import type { MetadataRoute } from 'next'
import { sanityFetch } from '@/lib/sanity/client'
import { isConfigured } from '@/lib/env'
import { hasLocalContent, allOfType, deref, slugOf } from '@/lib/content/local-source'
import { listStarterDestinations, listStarterProse } from '@/lib/content/starter-content'
import {
  listEditorialArticles,
  listEditorialProse,
  listEditorialTours,
} from '@/lib/content/starter-editorial'
import { listTurkishStarterProse } from '@/lib/content/starter-turkish-prose'
import { summerFormatSlug } from '@/lib/routing'
import {
  LOCALES,
  docPath,
  homePath,
  isLocale,
  sectionPath,
  sectionSegment,
  type Locale,
  type SectionKey,
} from '@/lib/i18n/config'
import { absoluteUrl, hreflangAlternates, type LocalePaths } from '@/lib/seo/urls'

/**
 * Sitemap assembly.
 *
 * Both locale trees are enumerated from Sanity and merged with the static routes
 * the site always publishes. Three rules shape everything here:
 *
 *  1. A URL only appears if it genuinely resolves. Guessing a path from a document
 *     type that carries no routing information would fill the sitemap with 404s,
 *     which costs crawl budget and trust.
 *  2. `seo.noIndex` documents and the search routes are excluded. A sitemap that
 *     lists a noindex URL sends two contradictory signals.
 *  3. Sanity being unconfigured or down degrades to the static routes rather than
 *     failing the build.
 *
 * Per-URL `alternates.languages` are built from `translationGroup`: two documents
 * in the same group are the same page in two languages, so each advertises the
 * other. A document with no sibling advertises nothing.
 */

/**
 * Google accepts 50,000 URLs per sitemap file. This lower threshold is the point
 * at which the map should be split across a sitemap index; see the note on
 * `sitemapChunks` for why the split is not wired up yet.
 */
export const SITEMAP_CHUNK_SIZE = 5_000

/** Protocol hard limit. Exceeding it invalidates the whole file. */
export const SITEMAP_MAX_URLS = 50_000

export type SitemapEntry = MetadataRoute.Sitemap[number]

type ChangeFrequency = NonNullable<SitemapEntry['changeFrequency']>

interface RouteSeed {
  locale: Locale
  path: string
  lastModified?: string
  changeFrequency: ChangeFrequency
  priority: number
  /** Documents sharing a translation group are alternates of each other. */
  groupId?: string | null
}

// ---------------------------------------------------------------------------
// Sanity projections
// ---------------------------------------------------------------------------

interface DocRow {
  _type: string
  locale: string | null
  slug: string | null
  updated: string | null
  noIndex: boolean | null
  groupId: string | null
  /** destination documents only */
  section: string | null
  parentSlug: string | null
  /**
   * Country slug for a document that hangs off a destination. Cities resolve to
   * their parent country, so an institution in London still sits under the UK.
   */
  countrySlug: string | null
  /** page documents only */
  pageKey: string | null
  /** summer programme documents only */
  format: string | null
}

/**
 * One query for every routable type. Selecting explicit fields keeps the payload
 * small and stops an editor-only field ever reaching this module.
 */
const SITEMAP_QUERY = /* groq */ `
*[
  _type in [
    "destination", "institution", "languageSchool", "boardingSchool",
    "summerProgramme", "tour", "article", "guide", "service", "page", "legalPage"
  ]
  && defined(slug.current)
  && defined(locale)
  && !(_id in path("drafts.**"))
] {
  _type,
  locale,
  "slug": slug.current,
  "updated": coalesce(updatedAt, _updatedAt),
  "noIndex": seo.noIndex,
  "groupId": translationGroup._ref,
  section,
  format,
  "parentSlug": parent->slug.current,
  "countrySlug": select(
    destination->kind == "city" => destination->parent->slug.current,
    destination->slug.current
  ),
  "pageKey": pageKey
}
`

/** Which section a document type lives under. Mirrors `src/lib/links.ts`. */
const TYPE_SECTION: Record<string, SectionKey> = {
  institution: 'universities',
  languageSchool: 'languageSchools',
  boardingSchool: 'boardingSchools',
  summerProgramme: 'summerSchools',
  tour: 'tours',
  article: 'insights',
  guide: 'guides',
  service: 'services',
  legalPage: 'legal',
}

/**
 * Types whose URL nests under the destination country, per the migration's agreed
 * convention (`/tr/universiteler/ingiltere/aston-university`). A brand-level
 * record with no destination stays one level up, which is also what the legacy
 * redirect map targets.
 */
const NESTED_UNDER_COUNTRY = new Set(['institution', 'languageSchool'])

const FREQUENCY: Record<string, ChangeFrequency> = {
  destination: 'monthly',
  institution: 'monthly',
  languageSchool: 'monthly',
  boardingSchool: 'monthly',
  summerProgramme: 'weekly',
  tour: 'weekly',
  article: 'monthly',
  guide: 'monthly',
  service: 'monthly',
  page: 'monthly',
  legalPage: 'yearly',
}

const PRIORITY: Record<string, number> = {
  destination: 0.8,
  institution: 0.6,
  languageSchool: 0.6,
  boardingSchool: 0.6,
  summerProgramme: 0.7,
  tour: 0.7,
  article: 0.6,
  guide: 0.6,
  service: 0.7,
  page: 0.5,
  legalPage: 0.2,
}

/** Fixed pages the router owns. `search` is deliberately absent: it is noindex. */
const PAGE_KEY_SECTION: Record<string, SectionKey> = {
  about: 'about',
  contact: 'contact',
  consultation: 'consultation',
}

/**
 * Builds the public path for a document, or null when the document carries no
 * routing information. Returning null is the safe outcome: a missing URL costs a
 * little discovery, a wrong URL costs a 404 in the sitemap.
 */
function pathForDoc(row: DocRow, locale: Locale): string | null {
  const slug = row.slug
  if (!slug) return null

  if (row._type === 'destination') {
    const section = (row.section ?? 'universities') as SectionKey
    return row.parentSlug
      ? docPath(locale, section, row.parentSlug, slug)
      : docPath(locale, section, slug)
  }

  if (row._type === 'page') {
    // Only the fixed, code-routed pages have a derivable URL. A free-standing page
    // document has no section field, so its path cannot be reconstructed here; it
    // is left out rather than guessed. See the note in the return summary.
    const section = row.pageKey ? PAGE_KEY_SECTION[row.pageKey] : undefined
    return section ? sectionPath(locale, section) : null
  }

  const section = TYPE_SECTION[row._type]
  if (!section) return null

  // Migration index records are navigation labels, not content pages.
  if (
    (row._type === 'tour' && slug === sectionSegment(locale, 'tours'))
    || (row._type === 'institution' && ['universiteler', 'universities'].includes(slug))
  ) return null

  if (row._type === 'summerProgramme') {
    const format = row.format === 'group' ? 'group' : 'individual'
    return docPath(locale, section, summerFormatSlug(locale, format), slug)
  }

  if (NESTED_UNDER_COUNTRY.has(row._type)) {
    return row.countrySlug
      ? docPath(locale, section, row.countrySlug, slug)
      : docPath(locale, section, slug)
  }

  return docPath(locale, section, slug)
}

// ---------------------------------------------------------------------------
// Static routes
// ---------------------------------------------------------------------------

/**
 * Section indexes the site links to from its own header and footer. If the chrome
 * does not link to a section, the sitemap does not assert it either.
 *
 * Legal pages are deliberately absent: they come from `legalPage` documents like
 * everything else, so a policy that has not been written yet is not advertised.
 * The footer links the whole legal registry regardless, which is what surfaces a
 * missing document in the link checker.
 */
const CHROME_SECTIONS: SectionKey[] = [
  'universities',
  'languageSchools',
  'summerSchools',
  'boardingSchools',
  'tours',
  'insights',
  'about',
  'contact',
  'consultation',
]

/** Section indexes worth listing only once the section actually holds documents. */
const CONDITIONAL_SECTIONS: Array<{ section: SectionKey; type: string }> = [
  { section: 'guides', type: 'guide' },
  { section: 'services', type: 'service' },
]

function staticSeeds(sections: SectionKey[]): RouteSeed[] {
  const seeds: RouteSeed[] = []

  for (const locale of LOCALES) {
    seeds.push({
      locale,
      path: homePath(locale),
      changeFrequency: 'weekly',
      priority: 1,
      groupId: 'static:home',
    })

    for (const section of sections) {
      seeds.push({
        locale,
        path: sectionPath(locale, section),
        changeFrequency: section === 'insights' ? 'weekly' : 'monthly',
        priority: section === 'consultation' ? 0.8 : 0.9,
        groupId: `static:section:${section}`,
      })
    }
  }

  return seeds
}

/** Code-backed routes that remain real pages when the CMS has no matching row. */
function editorialSeeds(): RouteSeed[] {
  const seeds: RouteSeed[] = []

  for (const section of ['universities', 'languageSchools'] as const) {
    for (const destination of listStarterDestinations('en', section)) {
      seeds.push({
        locale: 'en',
        path: docPath('en', section, destination.slug),
        changeFrequency: 'monthly',
        priority: 0.8,
      })
    }
  }

  for (const article of listEditorialArticles('en')) {
    seeds.push({
      locale: 'en',
      path: docPath('en', 'insights', article.slug),
      changeFrequency: 'monthly',
      priority: 0.6,
    })
  }

  for (const type of ['guide', 'service'] as const) {
    const section = type === 'guide' ? 'guides' : 'services'
    const english = [...listStarterProse('en', type), ...listEditorialProse('en', type)]
    const turkish = [
      ...listStarterProse('tr', type),
      ...listTurkishStarterProse(type),
    ]
    for (const item of english) {
      seeds.push({
        locale: 'en',
        path: docPath('en', section, item.slug),
        changeFrequency: 'monthly',
        priority: type === 'service' ? 0.7 : 0.6,
      })
    }
    for (const item of turkish) {
      seeds.push({
        locale: 'tr',
        path: docPath('tr', section, item.slug),
        changeFrequency: 'monthly',
        priority: type === 'service' ? 0.7 : 0.6,
      })
    }
  }

  const tours = { en: listEditorialTours('en'), tr: listEditorialTours('tr') }
  for (const locale of LOCALES) {
    tours[locale].forEach((tour, index) => {
      seeds.push({
        locale,
        path: docPath(locale, 'tours', tour.slug),
        changeFrequency: 'weekly',
        priority: 0.7,
        groupId: `starter:tour:${index}`,
      })
    })
  }

  return seeds
}

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

function seedsFromDocs(rows: DocRow[]): RouteSeed[] {
  const seeds: RouteSeed[] = []

  for (const row of rows) {
    if (row.noIndex) continue
    const locale = row.locale
    if (!locale || !isLocale(locale)) continue

    const path = pathForDoc(row, locale)
    if (!path) continue
    // Belt and braces: nothing under a search segment is ever indexable.
    if (path.includes('/search') || path.includes('/arama')) continue

    seeds.push({
      locale,
      path,
      lastModified: row.updated ?? undefined,
      changeFrequency: FREQUENCY[row._type] ?? 'monthly',
      priority: PRIORITY[row._type] ?? 0.5,
      // Namespaced so a CMS group id can never collide with a static group key.
      groupId: row.groupId ? `doc:${row.groupId}` : null,
    })
  }

  return seeds
}

/** Turns seeds into sitemap entries, attaching hreflang from the translation groups. */
function toEntries(seeds: RouteSeed[]): SitemapEntry[] {
  const byGroup = new Map<string, LocalePaths>()
  for (const seed of seeds) {
    if (!seed.groupId) continue
    const existing = byGroup.get(seed.groupId) ?? {}
    existing[seed.locale] = seed.path
    byGroup.set(seed.groupId, existing)
  }

  const seen = new Set<string>()
  const entries: SitemapEntry[] = []

  for (const seed of seeds) {
    const url = absoluteUrl(seed.path)
    if (seen.has(url)) continue
    seen.add(url)

    const group = seed.groupId ? byGroup.get(seed.groupId) : undefined
    // A group of one is this page on its own: no alternate exists, so none is claimed.
    const languages = group && Object.keys(group).length > 1 ? hreflangAlternates(group) : undefined

    entries.push({
      url,
      ...(seed.lastModified ? { lastModified: seed.lastModified } : {}),
      changeFrequency: seed.changeFrequency,
      priority: seed.priority,
      ...(languages && Object.keys(languages).length > 0 ? { alternates: { languages } } : {}),
    })
  }

  return entries
}

/**
 * Every indexable URL on the site, highest priority first so that a truncation at
 * the protocol limit would drop the least important pages rather than a random
 * slice.
 */
export async function collectSitemapEntries(): Promise<SitemapEntry[]> {
  const rows =
    !isConfigured.sanity() && hasLocalContent()
      ? localRows()
      : await sanityFetch<DocRow[]>(SITEMAP_QUERY, {}, { tags: ['sitemap'], revalidate: 3600 }, [])

  const sections = [
    ...CHROME_SECTIONS,
    // The code-backed guide and service libraries guarantee useful index pages
    // even before an editor creates CMS records for these types.
    ...CONDITIONAL_SECTIONS.map(({ section }) => section),
  ]

  // CMS rows come before code-backed fallbacks so a real authored document keeps
  // its last-modified date and hreflang group when both sources share a URL.
  const seeds = [...staticSeeds(sections), ...seedsFromDocs(rows), ...editorialSeeds()]
  const entries = toEntries(seeds)

  entries.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.url.localeCompare(b.url))

  if (entries.length > SITEMAP_MAX_URLS) {
    console.warn(
      `[sitemap] ${entries.length} URLs exceeds the ${SITEMAP_MAX_URLS} protocol limit; the tail was dropped. Split the sitemap.`,
    )
    return entries.slice(0, SITEMAP_MAX_URLS)
  }

  if (entries.length > SITEMAP_CHUNK_SIZE) {
    console.warn(
      `[sitemap] ${entries.length} URLs is past the ${SITEMAP_CHUNK_SIZE} split threshold. Serve sitemapIndexXml() from /sitemap.xml and the chunks from /sitemaps/[id].xml.`,
    )
  }

  return entries
}

/**
 * Splits the entry list into files of at most `SITEMAP_CHUNK_SIZE` URLs.
 *
 * Not yet wired to a route: Next's `MetadataRoute.Sitemap` can only serialise a
 * `<urlset>`, never a `<sitemapindex>`, and using `generateSitemaps()` moves the
 * files to `/sitemap/[id].xml` while leaving `/sitemap.xml` itself unserved. The
 * split therefore needs one additional route handler, which is described in the
 * hand-off note. Until then a single file carries the whole site, which is
 * correct while the total is under the limit.
 */
export function sitemapChunks(entries: SitemapEntry[]): SitemapEntry[][] {
  if (entries.length <= SITEMAP_CHUNK_SIZE) return [entries]
  const chunks: SitemapEntry[][] = []
  for (let i = 0; i < entries.length; i += SITEMAP_CHUNK_SIZE) {
    chunks.push(entries.slice(i, i + SITEMAP_CHUNK_SIZE))
  }
  return chunks
}

/** Path a sitemap chunk is served from. */
export function sitemapChunkPath(id: number): string {
  return `/sitemaps/${id}.xml`
}

/**
 * `<sitemapindex>` XML for a given number of chunks. Ready for a route handler to
 * return with `content-type: application/xml`.
 */
export function sitemapIndexXml(chunkCount: number, lastModified = new Date()): string {
  const stamp = lastModified.toISOString()
  const items = Array.from({ length: chunkCount }, (_, id) =>
    [
      '  <sitemap>',
      `    <loc>${absoluteUrl(sitemapChunkPath(id))}</loc>`,
      `    <lastmod>${stamp}</lastmod>`,
      '  </sitemap>',
    ].join('\n'),
  )

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...items,
    '</sitemapindex>',
    '',
  ].join('\n')
}

/**
 * The same rows, read from the migrated bundle.
 *
 * Without this the sitemap lists only the static chrome routes, so 308 migrated
 * pages exist and are reachable but are never submitted to a search engine. That
 * is precisely the failure the legacy site had: its sitemap omitted all eighteen
 * genuine articles and listed four theme demo posts instead.
 *
 * Sanity takes over the moment it is configured; see src/lib/content/local-source.ts.
 */
function localRows(): DocRow[] {
  const TYPES = [
    'destination',
    'institution',
    'languageSchool',
    'boardingSchool',
    'summerProgramme',
    'tour',
    'article',
    'guide',
    'service',
    'page',
    'legalPage',
  ]

  return TYPES.flatMap((type) =>
    allOfType(type)
      .filter((doc) => slugOf(doc))
      .map((doc) => {
        const destination = deref(doc.destination)
        const parent = destination ? deref(destination.parent) : null
        // A city resolves to its parent country, so an institution in London still
        // sits under the United Kingdom in the URL.
        const country = parent ?? destination

        return {
          _type: doc._type,
          locale: doc.locale ?? null,
          slug: slugOf(doc),
          updated: typeof doc.updatedAt === 'string' ? doc.updatedAt : null,
          noIndex: (doc.seo as { noIndex?: boolean } | undefined)?.noIndex ?? null,
          groupId: (doc.translationGroup as { _ref?: string } | undefined)?._ref ?? null,
          section: typeof doc.section === 'string' ? doc.section : null,
          parentSlug: parent ? slugOf(parent) : null,
          countrySlug: country ? slugOf(country) : null,
          pageKey: typeof doc.pageKey === 'string' ? doc.pageKey : null,
          format: typeof doc.format === 'string' ? doc.format : null,
        } satisfies DocRow
      }),
  )
}
