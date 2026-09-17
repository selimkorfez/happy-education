import type { StaticImageData } from 'next/image'

import heroLondon from '../../../public/media/hero-london.jpg'
import libraryInterior from '../../../public/media/library-interior.jpg'
import destUk from '../../../public/media/destination-united-kingdom.jpg'
import destIreland from '../../../public/media/destination-ireland.jpg'
import destUsa from '../../../public/media/destination-united-states.jpg'
import destCanada from '../../../public/media/destination-canada.jpg'
import destMalta from '../../../public/media/destination-malta.jpg'
import destAustralia from '../../../public/media/destination-australia.jpg'

/**
 * Brand image library.
 *
 * These are commissioned illustrative images generated with Higgsfield
 * (`soul_location`) and colour-directed to the Happy Education palette.
 * They are explicitly non-documentary and may be used as visual fallbacks when a
 * migrated WordPress image cannot be republished because its licence is unknown.
 */

export interface BrandImage {
  src: StaticImageData
  alt: string
  decorativeByDefault: boolean
  provenance: {
    holder: string
    terms: string
    aiGenerated: boolean
    generatedWith?: string
    cleared: boolean
  }
}

const COMMISSIONED = {
  holder: 'Happy Education',
  terms:
    'Commissioned illustrative image generated with Higgsfield soul_location. Not documentary. Does not depict real students, staff or premises.',
  aiGenerated: true,
  generatedWith: 'Higgsfield soul_location',
  cleared: true,
} as const

export const BRAND_IMAGES = {
  heroLondon: {
    src: heroLondon,
    alt: 'A London street in warm late-afternoon light, with Georgian terraces, autumn plane trees and a red double-decker bus',
    decorativeByDefault: false,
    provenance: COMMISSIONED,
  },
  libraryInterior: {
    src: libraryInterior,
    alt: 'A university library reading room with dark timber shelving, long study tables and afternoon light through tall windows',
    decorativeByDefault: false,
    provenance: COMMISSIONED,
  },
  unitedKingdom: {
    src: destUk,
    alt: 'A historic British university quadrangle in honey-coloured stone, with bicycles leaning against the wall',
    decorativeByDefault: true,
    provenance: COMMISSIONED,
  },
  ireland: {
    src: destIreland,
    alt: 'A Dublin street of Georgian townhouses with brightly painted doors',
    decorativeByDefault: true,
    provenance: COMMISSIONED,
  },
  unitedStates: {
    src: destUsa,
    alt: 'An American university campus in early autumn, with red brick buildings and a tree-lined walkway',
    decorativeByDefault: true,
    provenance: COMMISSIONED,
  },
  canada: {
    src: destCanada,
    alt: 'Stone collegiate architecture in Toronto with modern glass towers behind and maple trees in autumn colour',
    decorativeByDefault: true,
    provenance: COMMISSIONED,
  },
  malta: {
    src: destMalta,
    alt: 'A limestone street in Valletta stepping down towards the Mediterranean, with traditional enclosed wooden balconies',
    decorativeByDefault: true,
    provenance: COMMISSIONED,
  },
  australia: {
    src: destAustralia,
    alt: 'A sandstone university cloister in Sydney with subtropical trees in bright southern light',
    decorativeByDefault: true,
    provenance: COMMISSIONED,
  },
} as const satisfies Record<string, BrandImage>

export type BrandImageKey = keyof typeof BRAND_IMAGES

export const DESTINATION_IMAGE: Partial<Record<string, BrandImageKey>> = {
  uk: 'unitedKingdom',
  ireland: 'ireland',
  usa: 'unitedStates',
  canada: 'canada',
  malta: 'malta',
  australia: 'australia',
}

const DESTINATION_SLUG_IMAGE: Partial<Record<string, BrandImageKey>> = {
  'united-kingdom': 'unitedKingdom',
  ingiltere: 'unitedKingdom',
  ireland: 'ireland',
  irlanda: 'ireland',
  'united-states': 'unitedStates',
  amerika: 'unitedStates',
  abd: 'unitedStates',
  canada: 'canada',
  kanada: 'canada',
  malta: 'malta',
  australia: 'australia',
  avustralya: 'australia',
}

export function brandImage(key: BrandImageKey): BrandImage {
  return BRAND_IMAGES[key]
}

/**
 * Returns a commissioned AI illustration for a destination slug. Unknown
 * destinations deliberately fall back to the neutral library interior rather than
 * a copyrighted WordPress asset or an empty placeholder.
 */
export function illustrativeImageForDestination(slug?: string): BrandImage {
  const key = slug ? DESTINATION_SLUG_IMAGE[slug.toLowerCase()] : undefined
  return key ? BRAND_IMAGES[key] : BRAND_IMAGES.libraryInterior
}

export function aiGeneratedAssets(): Array<{ key: string; alt: string; generatedWith?: string }> {
  return Object.entries(BRAND_IMAGES)
    .filter(([, image]) => image.provenance.aiGenerated)
    .map(([key, image]) => ({
      key,
      alt: image.alt,
      generatedWith: image.provenance.generatedWith,
    }))
}
