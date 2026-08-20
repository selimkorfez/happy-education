import createImageUrlBuilder from '@sanity/image-url'
import type { Image as SanityImage } from 'sanity'
import { publicEnv } from '@/lib/env'

/**
 * Responsive image URLs from Sanity assets.
 *
 * Always goes through the transformation API rather than serving originals, so a
 * 4000px editor upload never reaches a phone. Format negotiation is left to Sanity
 * (`auto('format')`), which serves AVIF or WebP based on the Accept header.
 */

const builder = publicEnv.NEXT_PUBLIC_SANITY_PROJECT_ID
  ? createImageUrlBuilder({
      projectId: publicEnv.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset: publicEnv.NEXT_PUBLIC_SANITY_DATASET,
    })
  : null

export interface ImageWithMeta {
  asset?: { _ref?: string; _type?: string }
  hotspot?: { x: number; y: number }
  crop?: { top: number; bottom: number; left: number; right: number }
  alt?: string
  caption?: string
  attribution?: string
}

export function imageUrl(source: SanityImage | ImageWithMeta, width: number, height?: number) {
  if (!builder) return null
  let url = builder.image(source as SanityImage).width(width).auto('format').quality(78)
  if (height) url = url.height(height).fit('crop')
  // Respects the editor's chosen focal point when cropping.
  return url.url()
}

/** Blur placeholder for above-the-fold imagery. Tiny by design. */
export function blurDataUrl(source: SanityImage | ImageWithMeta) {
  if (!builder) return undefined
  return builder.image(source as SanityImage).width(20).quality(20).blur(30).url()
}
