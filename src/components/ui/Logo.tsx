import Image from 'next/image'
import logo from '../../../public/brand/happy-education-logo.png'
import mark from '../../../public/brand/happy-education-mark.png'

/**
 * The Happy Education logo, used unmodified.
 *
 * The only artwork available from the legacy site is raster (largest usable source
 * 915x384 after trimming). No vector exists anywhere in the 964-item WordPress
 * media library, so a true SVG must be requested from the client — see
 * docs/MIGRATION.md. At the sizes used here the raster source still renders at
 * 3-5x density, so this is acceptable for launch but not ideal.
 *
 * The wordmark is charcoal, so the lockup is only ever placed on light surfaces.
 * There is no reversed variant and we do not invent one by recolouring.
 */
export function Logo({
  variant = 'lockup',
  className = '',
  priority = false,
  title,
}: {
  variant?: 'lockup' | 'mark'
  className?: string
  priority?: boolean
  title: string
}) {
  const src = variant === 'mark' ? mark : logo
  return (
    <Image
      src={src}
      alt={title}
      priority={priority}
      className={className}
      // Intrinsic dimensions come from the static import, so no layout shift.
      sizes={variant === 'mark' ? '48px' : '(max-width: 640px) 150px, 190px'}
    />
  )
}
