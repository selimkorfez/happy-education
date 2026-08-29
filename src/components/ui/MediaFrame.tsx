import Image, { type StaticImageData } from 'next/image'
import { imageUrl, blurDataUrl, type ImageWithMeta } from '@/lib/sanity/image'
import type { LicensedExternalImage } from '@/lib/media/licensed-media'
import { isProduction } from '@/lib/env'

/**
 * Every photograph on this site goes through here.
 *
 * CMS photography is fail-closed unless its licence has been cleared. Verified
 * public reuse photography is supplied through `external`; each entry carries its
 * creator/source/licence record and the component renders that attribution with the
 * image. Local commissioned brand assets keep their provenance in media/library.ts.
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
  /** Verified external documentary photo with a public reuse licence. */
  external?: LicensedExternalImage | null
  /**
   * A statically imported asset from the brand library. Takes precedence over
   * `image`, and is used for built-in brand imagery whose provenance is recorded
   * in src/lib/media/library.ts.
   */
  local?: StaticImageData | null
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
  external,
  local,
  alt,
  decorative = false,
  width,
  height,
  sizes,
  priority = false,
  className = '',
  placeholderLabel,
}: MediaFrameProps) {
  if (external?.cleared) {
    return (
      <figure className={`group/media relative overflow-hidden ${className}`}>
        <Image
          src={external.src}
          alt={decorative ? '' : alt || external.alt}
          width={width}
          height={height}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          className="h-full w-full object-cover"
        />
        <figcaption className="absolute bottom-2 right-2 max-w-[88%] rounded-lg bg-black/70 px-2.5 py-1.5 text-[0.65rem] leading-snug text-white shadow-sm backdrop-blur-sm transition-opacity sm:opacity-80 sm:group-hover/media:opacity-100 sm:group-focus-within/media:opacity-100">
          Photo: 
          <a
            href={external.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline decoration-white/70 underline-offset-2"
          >
            {external.creator}
          </a>{' '}
          ·{' '}
          <a
            href={external.licenceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-white underline decoration-white/70 underline-offset-2"
          >
            {external.licence}
          </a>
        </figcaption>
      </figure>
    )
  }

  // Local brand assets carry their provenance in the library and need no CMS
  // licence gate. Next generates AVIF/WebP variants and the blur placeholder from
  // the static import, so there is no layout shift and no oversized original.
  if (local) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image
          src={local}
          alt={decorative ? '' : alt}
          sizes={sizes}
          priority={priority}
          loading={priority ? undefined : 'lazy'}
          placeholder="blur"
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

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
        <figcaption className="absolute bottom-2 right-2 max-w-[88%] rounded-lg bg-black/70 px-2.5 py-1.5 text-[0.65rem] leading-snug text-white backdrop-blur-sm">
          {image.caption}
          {image.attribution ? <span className="ml-1">({image.attribution})</span> : null}
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
      <div aria-hidden="true" className="absolute inset-0 bg-brand opacity-[0.13]" />
      <div aria-hidden="true" className="absolute inset-y-0 right-0 w-1/3 border-l border-brand/25" />
      {!isProduction ? (
        <p className="relative m-4 max-w-[36ch] bg-fg px-3 py-2 text-xs leading-snug text-paper">
          {blocked ? 'Image withheld: licence not cleared. ' : 'Photography placeholder (development only). '}
          {label}
        </p>
      ) : null}
    </div>
  )
}
