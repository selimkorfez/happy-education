import 'server-only'

import {
  licensedMediaForDestination,
  licensedMediaForPlace,
  type LicensedExternalImage,
} from './licensed-media'

/**
 * Photography fallbacks for pages that do not yet have a cleared CMS image.
 *
 * These are deliberately documentary campus/location photographs rather than
 * pseudo-UI illustrations. A missing editorial image should still look like a
 * finished publication, while never pretending an unrelated building is the
 * subject of a specific university profile.
 */

export type EditorialMediaVariant =
  | 'about'
  | 'city'
  | 'contact'
  | 'consultation'
  | 'guides'
  | 'insights'
  | 'language'
  | 'services'
  | 'tours'
  | 'universities'
  | 'summer'
  | 'boarding'

const ENGLAND: LicensedExternalImage = {
  src: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent('Radcliffe Camera, Oxford.jpg')}?width=1800`,
  alt: 'The Radcliffe Camera in Oxford, England',
  creator: 'Mike Peel',
  sourceUrl: 'https://commons.wikimedia.org/wiki/File:Radcliffe_Camera,_Oxford.jpg',
  licence: 'CC BY-SA 4.0',
  licenceUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
  kind: 'campus',
  privacy: 'architecture-or-cityscape',
  cleared: true,
}

/** A stronger representative image for England / the United Kingdom. */
export function licensedMediaForEngland(): LicensedExternalImage {
  return ENGLAND
}

const VARIANT_FALLBACK: Record<EditorialMediaVariant, () => LicensedExternalImage | null> = {
  about: () => licensedMediaForPlace('cambridge') ?? ENGLAND,
  city: () => licensedMediaForPlace('london') ?? ENGLAND,
  contact: () => licensedMediaForPlace('london') ?? ENGLAND,
  consultation: () => ENGLAND,
  guides: () => licensedMediaForPlace('dublin') ?? ENGLAND,
  insights: () => ENGLAND,
  language: () => licensedMediaForPlace('dublin') ?? licensedMediaForPlace('london') ?? ENGLAND,
  services: () => licensedMediaForPlace('toronto') ?? ENGLAND,
  tours: () => licensedMediaForPlace('valletta') ?? licensedMediaForPlace('london') ?? ENGLAND,
  universities: () => licensedMediaForPlace('cambridge') ?? ENGLAND,
  summer: () => licensedMediaForPlace('sydney') ?? licensedMediaForPlace('valletta') ?? ENGLAND,
  boarding: () => ENGLAND,
}

export function licensedMediaForEditorialVariant(
  variant?: EditorialMediaVariant,
): LicensedExternalImage | null {
  return variant ? VARIANT_FALLBACK[variant]?.() ?? ENGLAND : ENGLAND
}

/**
 * Prefer a destination explicitly mentioned by the content. If there is no clear
 * geographic cue, pick a deterministic image from a small high-quality editorial
 * pool so article grids stay varied without changing between renders.
 */
export function licensedMediaForEditorialText(
  ...values: Array<string | undefined | null>
): LicensedExternalImage {
  const text = normalise(values.filter(Boolean).join(' '))

  if (containsAny(text, ['england', 'united kingdom', 'united-kingdom', ' uk ', 'ingiltere', 'britain', 'british'])) {
    return ENGLAND
  }

  const explicitDestinations = [
    'london', 'oxford', 'cambridge', 'birmingham', 'manchester', 'edinburgh',
    'dublin', 'ireland', 'new york', 'united states', 'usa', 'toronto', 'canada',
    'sydney', 'australia', 'auckland', 'new zealand', 'valletta', 'malta',
    'nicosia', 'cyprus', 'dubai', 'united arab emirates',
  ]

  for (const place of explicitDestinations) {
    if (!text.includes(place)) continue
    const match = licensedMediaForDestination(place) ?? licensedMediaForPlace(place)
    if (match) return match
  }

  const pool = [
    ENGLAND,
    licensedMediaForPlace('cambridge'),
    licensedMediaForPlace('london'),
    licensedMediaForPlace('dublin'),
    licensedMediaForPlace('toronto'),
    licensedMediaForPlace('sydney'),
    licensedMediaForPlace('valletta'),
  ].filter((image): image is LicensedExternalImage => Boolean(image))

  return pool[stableIndex(text, pool.length)] ?? ENGLAND
}

export function licensedMediaForDestinationEditorial(
  ...values: Array<string | undefined | null>
): LicensedExternalImage {
  const text = normalise(values.filter(Boolean).join(' '))
  if (containsAny(text, ['england', 'united kingdom', 'united-kingdom', ' uk ', 'ingiltere', 'britain'])) {
    return ENGLAND
  }

  for (const value of values) {
    if (!value) continue
    const match = licensedMediaForDestination(value) ?? licensedMediaForPlace(value)
    if (match) return match
  }

  return licensedMediaForEditorialText(...values)
}

function normalise(value: string): string {
  return ` ${value
    .toLocaleLowerCase('en-GB')
    .replace(/[’‘]/g, "'")
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9' -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()} `
}

function containsAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle))
}

function stableIndex(value: string, length: number): number {
  if (length <= 1) return 0
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0
  }
  return Math.abs(hash) % length
}
