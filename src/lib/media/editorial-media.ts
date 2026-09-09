import 'server-only'

import { EDITORIAL_PHOTOS as PHOTO } from './editorial-photos'

import {
  licensedMediaForDestination,
  licensedMediaForPlace,
  type LicensedExternalImage,
} from './licensed-media'

/**
 * Photography fallbacks for pages that do not yet have a cleared CMS image.
 *
 * Documentary campus/location views and neutral study/travel photography give
 * unfinished CMS records a considered editorial image. Exact institution photos
 * remain in the institution registry; generic advice never invents a campus.
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

/** Each section has its own art direction; the homepage photo is never pooled. */
const VARIANT_FALLBACK: Record<EditorialMediaVariant, LicensedExternalImage> = {
  about: PHOTO['reading-hall'],
  city: PHOTO['travel-planning'],
  contact: PHOTO.workspace,
  consultation: PHOTO['planning-desk'],
  guides: PHOTO['course-books'],
  insights: PHOTO['reading-notes'],
  language: PHOTO.bookshelves,
  services: PHOTO.notebook,
  tours: PHOTO['travel-planning'],
  universities: PHOTO['bright-library'],
  summer: PHOTO['reading-break'],
  boarding: PHOTO['heritage-library'],
}

const TOPICS = [
  { words: ['visa', 'vize', 'departure', 'travel', 'seyahat', 'tour', 'gezi'], images: [PHOTO['travel-planning'], PHOTO['planning-desk'], PHOTO.notebook] },
  { words: ['budget', 'cost', 'costs', 'fee', 'fees', 'funding', 'scholarship', 'scholarships', 'butce', 'maliyet', 'ucret', 'ucretleri', 'burs', 'burslari'], images: [PHOTO['planning-desk'], PHOTO.notebook, PHOTO.workspace] },
  { words: ['accommodation', 'housing', 'konaklama', 'yurt'], images: [PHOTO['shared-lounge'], PHOTO.workspace, PHOTO['study-desk']] },
  { words: ['application', 'applications', 'admission', 'admissions', 'document', 'documents', 'checklist', 'timeline', 'basvuru', 'basvurulari', 'belge', 'belgeler', 'kabul', 'takvim'], images: [PHOTO.notebook, PHOTO['planning-desk'], PHOTO['study-desk'], PHOTO.workspace] },
  { words: ['language', 'english', 'ielts', 'toefl', 'dil', 'ingilizce'], images: [PHOTO['course-books'], PHOTO.bookshelves, PHOTO['open-book'], PHOTO['reading-notes']] },
  { words: ['summer', 'yaz'], images: [PHOTO['reading-break'], PHOTO['bright-library'], PHOTO['travel-planning'], PHOTO['open-book']] },
  { words: ['boarding', 'parent', 'family', 'yatili', 'aile', 'ebeveyn'], images: [PHOTO['heritage-library'], PHOTO['shared-lounge'], PHOTO['bright-library'], PHOTO['reading-break']] },
  { words: ['university', 'universities', 'course', 'courses', 'degree', 'universite', 'universiteler', 'universiteleri', 'bolum', 'lisans'], images: [PHOTO['bright-library'], PHOTO['reading-hall'], PHOTO['study-desk'], PHOTO['reading-notes'], PHOTO.bookshelves] },
] as const

const NEUTRAL = [
  PHOTO.notebook, PHOTO['course-books'], PHOTO['study-desk'], PHOTO['planning-desk'],
  PHOTO['open-book'], PHOTO['reading-break'], PHOTO['reading-notes'], PHOTO.bookshelves,
  PHOTO.workspace, PHOTO['bright-library'], PHOTO['reading-hall'],
]

/** Deliberate choices for the launch collection keep adjacent cards distinct. */
const CURATED_TITLES: Record<string, LicensedExternalImage> = {
  'how to choose a university abroad': PHOTO['bright-library'],
  'university application timeline': PHOTO['planning-desk'],
  'how to compare language schools': PHOTO.bookshelves,
  'summer school guide for families': PHOTO['reading-break'],
  'boarding school shortlist guide': PHOTO['heritage-library'],
  'planning a study abroad budget': PHOTO.notebook,
  'student accommodation guide': PHOTO['shared-lounge'],
  'university application support': PHOTO.workspace,
  'language school placement': PHOTO['course-books'],
  'summer school placement': PHOTO['open-book'],
  'boarding school application support': PHOTO['reading-hall'],
  'application document review': PHOTO['study-desk'],
  'pre departure support': PHOTO['travel-planning'],
  'choose course fit before chasing a university ranking': PHOTO['bright-library'],
  'a simple university application checklist': PHOTO.notebook,
  'how to compare language courses without looking only at price': PHOTO['course-books'],
  'questions parents should ask before booking a summer school': PHOTO['reading-break'],
  'what belongs on a boarding school shortlist': PHOTO['heritage-library'],
  'build a realistic study abroad budget before you commit': PHOTO['planning-desk'],
}

const CITIES: Record<string, string[]> = {
  london: ['london', 'londra'], oxford: ['oxford'], cambridge: ['cambridge'],
  birmingham: ['birmingham'], manchester: ['manchester'], edinburgh: ['edinburgh', 'edinburg'],
  cardiff: ['cardiff'], bristol: ['bristol'], leicester: ['leicester'], nottingham: ['nottingham'],
  sheffield: ['sheffield'], leeds: ['leeds'], liverpool: ['liverpool'],
  dublin: ['dublin'], cork: ['cork'], galway: ['galway'],
  'new york': ['new york'], boston: ['boston'], chicago: ['chicago'],
  'los angeles': ['los angeles'], 'san francisco': ['san francisco'],
  toronto: ['toronto'], vancouver: ['vancouver'], montreal: ['montreal'],
  sydney: ['sydney', 'sidney'], melbourne: ['melbourne'], brisbane: ['brisbane'], perth: ['perth'],
  auckland: ['auckland'], wellington: ['wellington'], christchurch: ['christchurch'],
  valletta: ['valletta'], sliema: ['sliema'], "st julian's": ["st julian's", 'st julians'],
  nicosia: ['nicosia', 'lefkosa'],
}

const COUNTRIES = [
  { names: ['uk', 'england', 'united kingdom', 'britain', 'british', 'ingiltere', 'birlesik krallik'], places: ['oxford', 'cambridge', 'london', 'edinburgh', 'manchester', 'bristol'] },
  { names: ['ireland', 'irish', 'irlanda'], places: ['dublin', 'cork', 'galway'] },
  { names: ['united states', 'usa', 'america', 'american', 'amerika', 'abd'], places: ['new york', 'boston', 'chicago', 'san francisco'] },
  { names: ['canada', 'canadian', 'kanada'], places: ['toronto', 'vancouver', 'montreal'] },
  { names: ['australia', 'australian', 'avustralya'], places: ['sydney', 'melbourne', 'brisbane', 'perth'] },
  { names: ['new zealand', 'yeni zelanda'], places: ['auckland', 'wellington', 'christchurch'] },
  { names: ['malta', 'maltese'], places: ['valletta', 'sliema', "st julian's"] },
  { names: ['cyprus', 'kibris'], places: ['nicosia'] },
  { names: ['grenada'], places: ["st george's"] },
  { names: ['dubai', 'uae', 'united arab emirates', 'bae'], places: ['uae desert'] },
] as const

export function licensedMediaForEditorialVariant(
  variant?: EditorialMediaVariant,
  ...values: Array<string | undefined | null>
): LicensedExternalImage {
  // Interior detail pages get their own title-based selection, not a category-wide image.
  return values.some((value) => value?.trim())
    ? licensedMediaForEditorialText(...values)
    : variant ? VARIANT_FALLBACK[variant] : PHOTO['reading-notes']
}

export function licensedMediaForEditorialText(
  ...values: Array<string | undefined | null>
): LicensedExternalImage {
  const seed = normalise(values.find((value) => value?.trim()) ?? '')
  return selectForText(values) ?? pick(NEUTRAL, seed)
}

function selectForText(values: Array<string | undefined | null>): LicensedExternalImage | null {
  const texts = values.filter((value): value is string => Boolean(value?.trim())).map(normalise)
  const seed = texts[0] ?? ''
  const curated = CURATED_TITLES[seed]
  if (curated) return curated

  // The title wins over incidental examples in an excerpt or broad category tags.
  for (const text of texts) {
    const cities = Object.entries(CITIES).filter(([, aliases]) => aliases.some((alias) => mentions(text, alias)))
    const countries = COUNTRIES.filter(({ names }) => names.some((name) => mentions(text, name)))
    const topic = TOPICS.find(({ words }) => words.some((word) => mentions(text, word)))
    // Comparison pages must not accidentally advertise just the first country/city.
    if (cities.length > 1 || countries.length > 1) return pick(topic?.images ?? NEUTRAL, seed)
    // Practical advice stays useful visually even when many articles name the
    // same city. Reserve the documentary city image for location-led content.
    if (topic && TOPICS.slice(0, 4).some((practical) => practical === topic)) return pick(topic.images, seed)
    const [city] = cities
    if (city) return licensedMediaForPlace(city[0])
    // A budgeting or application guide benefits more from study/planning imagery
    // than an arbitrary building, even when it names a country.
    if (topic) return pick(topic.images, seed)
    const [country] = countries
    if (country) {
      const pool = country.places.map(licensedMediaForPlace).filter((image): image is LicensedExternalImage => image !== null)
      return pick(pool, seed)
    }
  }
  return null
}

/** Country/city landing pages keep documentary geography ahead of generic topics. */
export function licensedMediaForDestinationEditorial(
  ...values: Array<string | undefined | null>
): LicensedExternalImage {
  for (const value of values) {
    if (!value) continue
    const text = normalise(value)
    const city = Object.entries(CITIES).find(([, aliases]) => aliases.some((alias) => mentions(text, alias)))
    if (city) return licensedMediaForPlace(city[0]) ?? licensedMediaForEditorialText(...values)
  }
  for (const value of values) {
    if (!value) continue
    const text = normalise(value)
    if (COUNTRIES[0].names.some((name) => mentions(text, name))) return ENGLAND
    const match = licensedMediaForDestination(value)
    if (match) return match
  }
  return licensedMediaForEditorialText(...values)
}

function normalise(value: string): string {
  return value.toLocaleLowerCase('en-GB').replace(/[’‘]/g, "'")
    .replace(/ı/g, 'i').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9']+/g, ' ').trim()
}

function mentions(text: string, phrase: string): boolean {
  // Whole phrases prevent accidental matches such as “uk” inside Turkish words.
  // Apostrophes permit Turkish place inflections such as “İngiltere’de”.
  return (` ${text} `).includes(` ${phrase} `) || (` ${text} `).includes(` ${phrase}'`)
}

function pick(pool: readonly LicensedExternalImage[], seed: string): LicensedExternalImage {
  let hash = 2166136261
  for (const char of seed) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0
  return pool[hash % pool.length] ?? PHOTO.notebook
}
