import Image from 'next/image'
import { imageUrl } from '@/lib/sanity/image'
import type { BrandAssets } from '@/lib/sanity/queries/settings'

/**
 * Official vector logo variants supplied in the 2026 brand pack. Optional Sanity
 * replacements remain fail-closed until their publication licence is cleared.
 */
export function Logo({
  variant = 'lockup',
  surface = 'auto',
  brand,
  className = '',
  priority = false,
  title,
}: {
  variant?: 'lockup' | 'mark' | 'favicon'
  surface?: 'auto' | 'light' | 'dark'
  brand?: BrandAssets | null
  className?: string
  priority?: boolean
  title: string
}) {
  const width = variant === 'lockup' ? 690 : variant === 'mark' ? 268 : 206
  const height = variant === 'favicon' ? 206 : 322
  const cmsLight = variant === 'lockup' ? brand?.logoOnLight : variant === 'mark' ? brand?.logoMark : brand?.chatIcon
  const cmsDark = variant === 'lockup' ? brand?.logoOnDark : variant === 'mark' ? brand?.logoMark : brand?.chatIcon
  const fallbackLight = variant === 'lockup'
    ? '/brand/official/logo-color.svg'
    : variant === 'mark' ? '/brand/official/mark-color.svg' : '/brand/official/favicon-color.svg'
  const fallbackDark = variant === 'lockup'
    ? '/brand/official/logo-white.svg'
    : variant === 'mark' ? '/brand/official/mark-white.svg' : '/brand/official/favicon-color.svg'
  const light = clearedUrl(cmsLight, width) ?? fallbackLight
  const dark = clearedUrl(cmsDark, width) ?? fallbackDark
  const sizes = variant === 'lockup' ? '(max-width: 640px) 150px, 190px' : variant === 'mark' ? '48px' : '64px'

  if (surface !== 'auto') {
    const src = surface === 'dark' ? dark : light
    return (
      <Image
        src={src}
        alt={title}
        width={width}
        height={height}
        priority={priority}
        className={className}
        sizes={sizes}
        unoptimized={src.endsWith('.svg')}
      />
    )
  }

  return (
    <span className={`relative inline-grid ${className}`}>
      <Image src={light} alt={title} width={width} height={height} priority={priority} sizes={sizes} unoptimized={light.endsWith('.svg')} className="he-logo-on-light col-start-1 row-start-1 h-full w-auto" />
      <Image src={dark} alt="" width={width} height={height} priority={priority} sizes={sizes} unoptimized={dark.endsWith('.svg')} className="he-logo-on-dark col-start-1 row-start-1 hidden h-full w-auto" />
    </span>
  )
}

function clearedUrl(image: BrandAssets[keyof BrandAssets] | undefined, width: number): string | null {
  return image?.licence?.cleared === true ? imageUrl(image, width) : null
}
