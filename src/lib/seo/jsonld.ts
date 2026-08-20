import { siteUrl } from '@/lib/env'
import { imageUrl } from '@/lib/sanity/image'
import type { MediaSource } from '@/components/ui/MediaFrame'

/**
 * JSON-LD plumbing.
 *
 * Structured data is the one place on the site where a wrong fact travels
 * furthest: it is machine-read, cached by third parties and reproduced in search
 * results without a human ever seeing the page. Two rules follow from that.
 *
 *  1. Nothing is asserted that the page does not itself show. Every builder here
 *     drops a field rather than substituting a plausible default.
 *  2. Escaping is centralised. `</script>` inside a JSON string would terminate
 *     the block and hand an attacker markup, so `<` is always escaped.
 */

/** Stable @id for the Organization node emitted once per page by OrganizationSchema. */
export const ORGANIZATION_ID = `${siteUrl}/#organization`

/**
 * Serialises a schema object for `dangerouslySetInnerHTML`.
 *
 * `JSON.stringify` already escapes quotes and backslashes; escaping `<` closes the
 * remaining hole, which is a `</script>` sequence inside a string value.
 */
export function jsonLdHtml(schema: unknown): string {
  return JSON.stringify(schema).replace(/</g, '\\u003c')
}

/** Removes null/undefined/empty values so no empty property is ever asserted. */
export function compact<T extends Record<string, unknown>>(input: T): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value === null || value === undefined) continue
    if (typeof value === 'string' && value.trim().length === 0) continue
    if (Array.isArray(value) && value.length === 0) continue
    out[key] = value
  }
  return out
}

export interface SchemaImage {
  '@type': 'ImageObject'
  url: string
  width: number
  height: number
}

/**
 * An `ImageObject` for a CMS image, or undefined.
 *
 * Applies the same licence gate as `MediaFrame`: an image whose rights have not
 * been cleared never renders on the page, so it must never be published through
 * structured data either. Google fetches these URLs, and a schema reference is
 * publication.
 */
export function schemaImage(
  image: MediaSource | null | undefined,
  width = 1200,
  height = 630,
): SchemaImage | undefined {
  if (!image || image.licence?.cleared !== true) return undefined
  const url = imageUrl(image, width, height)
  if (!url) return undefined
  return { '@type': 'ImageObject', url, width, height }
}
