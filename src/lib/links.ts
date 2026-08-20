import { docPath, homePath, type Locale, type SectionKey } from '@/lib/i18n/config'

/**
 * Link safety and resolution.
 *
 * Two jobs: turn a CMS reference into a real path, and refuse to emit an href that
 * could execute script. `javascript:` and `data:` URLs in an anchor are a stored-XSS
 * vector, and the WordPress import is exactly the kind of source that can carry one.
 */

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/**
 * Returns the href only if it uses a safe protocol, otherwise null.
 * Protocol-relative URLs (`//evil.com`) are rejected: they inherit the current
 * scheme and read as internal at a glance.
 */
export function safeExternalHref(href: string | undefined | null): string | null {
  if (!href) return null
  const trimmed = href.trim()
  if (trimmed.length === 0) return null
  if (trimmed.startsWith('//')) return null

  // A bare path or fragment is internal and safe.
  if (trimmed.startsWith('/') || trimmed.startsWith('#')) return trimmed

  try {
    const url = new URL(trimmed)
    return SAFE_PROTOCOLS.has(url.protocol) ? url.toString() : null
  } catch {
    // Not parseable as absolute; treat as unsafe rather than guessing.
    return null
  }
}

/**
 * Maps a document type to the section its URLs live under.
 * Null-prototype so a document whose `_type` happens to be "constructor" or
 * "toString" resolves to undefined rather than an inherited function.
 */
const TYPE_SECTION: Record<string, SectionKey> = Object.assign(Object.create(null), {
  destination: 'universities',
  institution: 'universities',
  languageSchool: 'languageSchools',
  boardingSchool: 'boardingSchools',
  summerProgramme: 'summerSchools',
  tour: 'tours',
  article: 'insights',
  guide: 'guides',
  service: 'services',
  legalPage: 'legal',
})

export interface ReferencedDoc {
  _type?: string
  slug?: string | { current?: string }
  locale?: string
  /** Present on destination documents; changes which section the URL sits under. */
  section?: string
  /** Parent country slug, for city pages. */
  parentSlug?: string
}

function slugOf(doc: ReferencedDoc): string | null {
  if (typeof doc.slug === 'string') return doc.slug
  return doc.slug?.current ?? null
}

/**
 * Builds the public path for a referenced document.
 * Returns null when the reference has not been dereferenced by the query, so the
 * renderer can fall back to plain text rather than emitting a broken link.
 */
export function resolveInternalHref(
  locale: Locale,
  annotation: { reference?: unknown } | ReferencedDoc | null | undefined,
): string | null {
  const doc = (
    annotation && 'reference' in annotation ? annotation.reference : annotation
  ) as ReferencedDoc | null | undefined

  if (!doc?._type) return null
  const slug = slugOf(doc)
  if (!slug) return null

  // Destinations choose their section from their own field.
  if (doc._type === 'destination') {
    const section = (doc.section as SectionKey | undefined) ?? 'universities'
    return doc.parentSlug
      ? docPath(locale, section, doc.parentSlug, slug)
      : docPath(locale, section, slug)
  }

  if (doc._type === 'page') return docPath(locale, 'about', slug)

  const section = Object.hasOwn(TYPE_SECTION, doc._type) ? TYPE_SECTION[doc._type] : undefined
  if (!section) return homePath(locale)

  return docPath(locale, section, slug)
}

/** The GROQ projection needed for `resolveInternalHref` to work on a reference. */
export const LINK_PROJECTION = /* groq */ `
  _type,
  "slug": slug.current,
  locale,
  section,
  "parentSlug": parent->slug.current
`
