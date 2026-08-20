import Image from 'next/image'
import { imageUrl, blurDataUrl, type ImageWithMeta } from '@/lib/sanity/image'
import { isProduction } from '@/lib/env'

/**
 * Every photograph on this site goes through here.
 *
 * Two things it enforces:
 *
 * 1. Provenance. A CMS image is only rendered when it carries a licence record.
 *    The legacy WordPress library is full of commercial stock whose licence status
 *    is unknown (the homepage banner is a studio stock shot; one partner logo is
 *    literally named "png-clipart-…"). Rendering those on a rebuilt site would
 *    carry the same exposure forward, so an image without provenance does not ship.
 *
 * 2. Alt text. `alt` is required by the type. Decorative images must opt in
 *    explicitly with `decorative`, which emits alt="" — there is no way to
 *    accidentally omit it.
 *
 * With no image supplied it renders a plain brand panel. That is a deliberate,
 * composed state rather than a broken one, and outside production it is labelled
 * so nobody mistakes it for finished work.
 */

export interface MediaSource extends ImageWithMeta {
  /** Required before an image renders in production. */
  licence?: {
    holder: string
    terms: string
    /** True once someone has confirmed we hold the right to publish it. */
    cleared: boolean
  }
}

interface MediaFrameProps {
  image?: MediaSource | null
  alt: string
  /** Emits alt="" for imagery that adds nothing a screen reader needs. */
  decorative?: boolean
  width: number
  height: number
  sizes: string
  priority?: boolean
  className?: string
  /** Shown in the placeholder so an unfilled slot is self-describing. */
  placeholderLabel?: string
}

export function MediaFrame({
  image,
  alt,
  decorative = false,
  width,
  height,
  sizes,
  priority = false,
  className = '',
  placeholderLabel,
}: MediaFrameProps) {
  const cleared = image?.licence?.cleared === true
  const src = image && cleared ? imageUrl(image, width, height) : null

  if (!image || !cleared || !src) {
    return (
      <PhotographyPlaceholder
        className={className}
        label={placeholderLabel ?? alt}
        blocked={Boolean(image) && !cleared}
      />
    )
  }

  return (
    <figure className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={decorative ? '' : alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        placeholder={priority ? 'blur' : undefined}
        blurDataURL={priority ? blurDataUrl(image) : undefined}
        className="h-full w-full object-cover"
      />
      {image.caption || image.attribution ? (
        <figcaption className="mt-2 text-xs text-fg-muted">
          {image.caption}
          {image.attribution ? (
            <span className="ml-1 text-fg-muted">({image.attribution})</span>
          ) : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

/**
 * Composed empty state. A flat brand panel with the mark ghosted into it reads as
 * a deliberate graphic block rather than a missing asset, so pages remain
 * presentable while photography is being licensed.
 */
function PhotographyPlaceholder({
  className,
  label,
  blocked,
}: {
  className: string
  label: string
  blocked: boolean
}) {
  return (
    <div
      className={`relative flex items-end overflow-hidden bg-paper-sunk ${className}`}
      role="presentation"
    >
      {/* A single flat brand block, no gradient, no glow. */}
      <div aria-hidden="true" className="absolute inset-0 bg-brand opacity-[0.13]" />
      <div
        aria-hidden="true"
        className="absolute inset-y-0 right-0 w-1/3 border-l border-brand/25"
      />
      {!isProduction ? (
        <p className="relative m-4 max-w-[36ch] bg-fg px-3 py-2 text-xs leading-snug text-paper">
          {blocked
            ? 'Image withheld: licence not cleared. '
            : 'Photography placeholder (development only). '}
          {label}
        </p>
      ) : null}
    </div>
  )
}
