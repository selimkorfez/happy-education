import 'server-only'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import type { Locale } from '@/lib/i18n/config'

/**
 * Local content source: the migrated WordPress corpus, read from disk.
 *
 * WHAT THIS IS FOR
 * The 300 documents produced by `scripts/migrate/extract.mjs` are Sanity-shaped
 * and ready to import, but until a Sanity project exists there is nowhere to put
 * them. Without this, every destination, institution, programme and article route
 * returns 404 and the site cannot be reviewed at all.
 *
 * WHAT THIS IS NOT
 * It is not a second CMS and it is not the production content path. Sanity always
 * wins: `isConfigured.sanity()` is checked first, and the moment a project id is
 * present this source is never consulted. It exists so the client can read the
 * migrated content in situ, on the real templates, and correct it BEFORE it is
 * committed to the CMS — which is the right order for a corpus where 300 documents
 * carry an editorial flag and 255 contain time-sensitive claims.
 *
 * It is read-only, has no draft model, and is excluded from the Studio entirely.
 * Delete `content/migrated/` after the import and this source goes quiet on its own.
 */

const CONTENT_DIR = path.join(process.cwd(), 'content', 'migrated')

export interface LocalDoc {
  _id: string
  _type: string
  locale: Locale
  title: string
  slug?: { current?: string } | string
  [key: string]: unknown
}

interface Store {
  byId: Map<string, LocalDoc>
  byType: Map<string, LocalDoc[]>
}

let cache: Store | null = null

const TYPES = [
  'destination',
  'institution',
  'languageSchool',
  'boardingSchool',
  'summerProgramme',
  'tour',
  'article',
  'category',
  'page',
  'legalPage',
]

function load(): Store {
  if (cache) return cache

  const byId = new Map<string, LocalDoc>()
  const byType = new Map<string, LocalDoc[]>()

  for (const type of TYPES) {
    const file = path.join(CONTENT_DIR, `${type}.json`)
    if (!existsSync(file)) {
      byType.set(type, [])
      continue
    }
    try {
      const parsed: unknown = JSON.parse(readFileSync(file, 'utf8'))
      const docs = Array.isArray(parsed) ? (parsed as LocalDoc[]) : []
      byType.set(type, docs)
      for (const doc of docs) byId.set(doc._id, doc)
    } catch (error) {
      // A malformed bundle must not take the site down; the section simply reads
      // as empty, which is the same state as before the migration ran.
      console.error('[local-content] failed to read', type, {
        message: error instanceof Error ? error.message : 'unknown',
      })
      byType.set(type, [])
    }
  }

  cache = { byId, byType }
  return cache
}

/** True when a migrated bundle is present on disk. */
export function hasLocalContent(): boolean {
  return existsSync(path.join(CONTENT_DIR, 'article.json'))
}

export function slugOf(doc: LocalDoc | undefined | null): string | null {
  if (!doc?.slug) return null
  return typeof doc.slug === 'string' ? doc.slug : (doc.slug.current ?? null)
}

/** Follows a `{_type:'reference',_ref:'…'}` value to the document it names. */
export function deref(value: unknown): LocalDoc | null {
  if (!value || typeof value !== 'object') return null
  const ref = (value as { _ref?: string })._ref
  if (!ref) return null
  return load().byId.get(ref) ?? null
}

/** Follows an array of references, dropping any that do not resolve. */
export function derefAll(value: unknown): LocalDoc[] {
  if (!Array.isArray(value)) return []
  return value.map(deref).filter((d): d is LocalDoc => d !== null)
}

export function allOfType(type: string, locale?: Locale): LocalDoc[] {
  const docs = load().byType.get(type) ?? []
  return locale ? docs.filter((d) => d.locale === locale) : docs
}

export function findBySlug(types: string[], locale: Locale, slug: string): LocalDoc | null {
  for (const type of types) {
    const match = allOfType(type, locale).find((d) => slugOf(d) === slug)
    if (match) return match
  }
  return null
}

export function findById(id: string): LocalDoc | null {
  return load().byId.get(id) ?? null
}

/**
 * The sibling of a document in the other locale, via the shared translation group.
 * This is what lets the language switcher work off the local source too.
 */
export function findTranslation(doc: LocalDoc, target: Locale): LocalDoc | null {
  const groupRef = (doc.translationGroup as { _ref?: string } | undefined)?._ref
  if (!groupRef) return null

  for (const type of TYPES) {
    const sibling = allOfType(type, target).find(
      (d) => (d.translationGroup as { _ref?: string } | undefined)?._ref === groupRef,
    )
    if (sibling) return sibling
  }
  return null
}

/** Naive substring search across the fields the site exposes. Locale-scoped. */
export function searchLocal(locale: Locale, query: string, types: string[]): LocalDoc[] {
  const needle = query.trim().toLowerCase()
  if (needle.length < 2) return []

  const results: LocalDoc[] = []
  for (const type of types) {
    for (const doc of allOfType(type, locale)) {
      const haystack = [
        doc.title,
        doc.excerpt,
        doc.intro,
        doc.summary,
        doc.city,
        doc.country,
        blocksToText(doc.overview),
        blocksToText(doc.body),
      ]
        .filter((v): v is string => typeof v === 'string')
        .join(' ')
        .toLowerCase()

      if (haystack.includes(needle)) results.push(doc)
    }
  }
  return results.slice(0, 40)
}

/** Flattens Portable Text to a plain string, for searching only. */
export function blocksToText(value: unknown): string {
  if (!Array.isArray(value)) return ''
  return value
    .map((block: unknown) => {
      const b = block as { _type?: string; children?: Array<{ text?: string }> }
      if (b?._type !== 'block') return ''
      return (b.children ?? []).map((c) => c.text ?? '').join('')
    })
    .join(' ')
}
