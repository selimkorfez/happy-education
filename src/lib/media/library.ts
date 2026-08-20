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
 * These are commissioned ILLUSTRATIVE images generated with Higgsfield
 * (`soul_location`), colour-directed to the Happy Education palette: warm amber
 * light against charcoal shadow, matching the logo's orange-on-charcoal identity.
 *
 * Provenance is recorded honestly and deliberately:
 *   - every entry is `aiGenerated: true`
 *   - every scene is a PLACE or an EMPTY INTERIOR. None depicts a person as a
 *     Happy Education student, staff member or client, and none is presented as a
 *     photograph of a real Happy Education premises, cohort or event.
 *
 * That distinction is the line the brief draws. Illustrative destination imagery is
 * legitimate; a synthetic person captioned as a real student is not, and no part of
 * this library may be used for a testimonial, a team portrait or an office photo.
 *
 * For launch, genuine licensed photography of the actual destinations would carry
 * more weight with parents than any generated image. These are production-quality
 * and honest, but they are the floor, not the ceiling. See docs/MIGRATION.md.
 */

export interface BrandImage {
  src: StaticImageData
  /** Written for a screen reader: what the image shows, not what it represents. */
  alt: string
  /** True when the image adds nothing beyond decoration in its usual placement. */
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

/** Maps a destination country key to its library image, where one exists. */
export const DESTINATION_IMAGE: Partial<Record<string, BrandImageKey>> = {
  uk: 'unitedKingdom',
  ireland: 'ireland',
  usa: 'unitedStates',
  canada: 'canada',
  malta: 'malta',
  australia: 'australia',
}

export function brandImage(key: BrandImageKey): BrandImage {
  return BRAND_IMAGES[key]
}

/** Every AI-generated asset, for the provenance section of the QA report. */
export function aiGeneratedAssets(): Array<{ key: string; alt: string; generatedWith?: string }> {
  return Object.entries(BRAND_IMAGES)
    .filter(([, image]) => image.provenance.aiGenerated)
    .map(([key, image]) => ({
      key,
      alt: image.alt,
      generatedWith: image.provenance.generatedWith,
    }))
}
