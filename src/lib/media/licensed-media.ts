import 'server-only'

/**
 * Reusable documentary photography with an explicit public reuse licence.
 *
 * Rules for this registry:
 * - Source must expose a verifiable licence page.
 * - Prefer CC0 / public domain; CC BY / CC BY-SA is accepted with attribution.
 * - No scraped Google Images, university marketing-library guesses or legacy WP stock.
 * - Prefer architecture/cityscapes without identifiable people as the subject.
 * - `sourceUrl` always points to the licence/provenance page, not merely the JPEG.
 *
 * Wikimedia files are requested through Special:Redirect at a bounded width. Next's
 * image optimiser caches the result; the source page remains the legal attribution
 * target shown by MediaFrame.
 */

export type OpenLicence =
  | 'CC0 1.0'
  | 'Public domain'
  | 'CC BY 2.0'
  | 'CC BY 3.0'
  | 'CC BY 4.0'
  | 'CC BY-SA 4.0'

export interface LicensedExternalImage {
  src: string
  alt: string
  creator: string
  sourceUrl: string
  licence: OpenLicence
  licenceUrl: string
  kind: 'campus' | 'city'
  /** Human subjects are not the subject of any image admitted to this registry. */
  privacy: 'architecture-or-cityscape'
  cleared: true
}

const COMMONS = 'https://commons.wikimedia.org/wiki/File:'
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/'
const CC_BY_2 = 'https://creativecommons.org/licenses/by/2.0/'
const CC_BY_3 = 'https://creativecommons.org/licenses/by/3.0/'
const CC_BY_SA_4 = 'https://creativecommons.org/licenses/by-sa/4.0/'

function commonsImage(
  file: string,
  data: Omit<LicensedExternalImage, 'src' | 'sourceUrl' | 'privacy' | 'cleared'>,
): LicensedExternalImage {
  return {
    ...data,
    src: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}?width=1800`,
    sourceUrl: `${COMMONS}${encodeURIComponent(file).replace(/%20/g, '_')}`,
    privacy: 'architecture-or-cityscape',
    cleared: true,
  }
}

/**
 * Institution-specific photos. Keys are normalised institution names so the
 * temporary English shadow catalogue and future CMS titles can share the mapping.
 */
const INSTITUTIONS: Record<string, LicensedExternalImage> = {
  'anglia ruskin university': commonsImage('Anglia Ruskin University Cambridge Campus.jpg', {
    alt: 'The Cambridge campus of Anglia Ruskin University',
    creator: 'ARU',
    licence: 'CC BY-SA 4.0',
    licenceUrl: CC_BY_SA_4,
    kind: 'campus',
  }),
  'university of oxford': commonsImage('University Of Oxford The Bridge Of Sighs.jpg', {
    alt: 'The Bridge of Sighs at the University of Oxford',
    creator: 'Michael D Beckwith',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'campus',
  }),
  'university of cambridge': commonsImage("University of Cambridge, King's College.jpg", {
    alt: "King's College at the University of Cambridge",
    creator: 'Nine402',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'campus',
  }),
  'imperial college london': commonsImage('Imperial College London Dyson Building.jpg', {
    alt: 'The Dyson Building at Imperial College London',
    creator: 'WhisperToMe',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'campus',
  }),
  "king's college london": commonsImage("Strand Building, King's College London.jpg", {
    alt: "The Strand Building at King's College London",
    creator: 'Shadowssettle',
    licence: 'CC BY-SA 4.0',
    licenceUrl: CC_BY_SA_4,
    kind: 'campus',
  }),
  'london school of economics': commonsImage('LSE Buildings (4770697517).jpg', {
    alt: 'Buildings on the London School of Economics campus',
    creator: 'SomeDriftwood',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'campus',
  }),
  'london school of economics and political science': commonsImage('LSE Buildings (4770697517).jpg', {
    alt: 'Buildings on the London School of Economics campus',
    creator: 'SomeDriftwood',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'campus',
  }),
  'university of birmingham': commonsImage('University of Birmingham campus from the north.jpg', {
    alt: 'The University of Birmingham campus seen from the north',
    creator: 'Rcsprinter123',
    licence: 'CC BY 3.0',
    licenceUrl: CC_BY_3,
    kind: 'campus',
  }),
  'university of manchester': commonsImage('University of Manchester.jpg', {
    alt: 'Whitworth Hall at the University of Manchester',
    creator: 'Bradshaw79',
    licence: 'CC BY-SA 4.0',
    licenceUrl: CC_BY_SA_4,
    kind: 'campus',
  }),
  'university of bristol': commonsImage('University of Bristol.jpg', {
    alt: 'A University of Bristol campus sign and building',
    creator: 'Simon Cobb',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'campus',
  }),
  'university of warwick': commonsImage('The University of Warwick.jpg', {
    alt: 'University of Warwick campus signage',
    creator: 'Stamhaney88',
    licence: 'CC BY-SA 4.0',
    licenceUrl: CC_BY_SA_4,
    kind: 'campus',
  }),
  'university of edinburgh': commonsImage('University of Edinburgh.jpg', {
    alt: 'A University of Edinburgh building in Edinburgh',
    creator: 'miketnorton',
    licence: 'CC BY 2.0',
    licenceUrl: CC_BY_2,
    kind: 'campus',
  }),
}

/** City photography used as a truthful fallback when a campus photo is not verified. */
const PLACES: Record<string, LicensedExternalImage> = {
  london: commonsImage('London Skyline 2021.jpg', {
    alt: 'The London skyline seen from Greenwich Park',
    creator: 'Farbades420',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  oxford: commonsImage('University Of Oxford The Bridge Of Sighs.jpg', {
    alt: 'The Bridge of Sighs in Oxford',
    creator: 'Michael D Beckwith',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  cambridge: commonsImage("University of Cambridge, King's College.jpg", {
    alt: "King's College in Cambridge",
    creator: 'Nine402',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  manchester: commonsImage('Manchester Skyline 2018.jpg', {
    alt: 'The Manchester skyline',
    creator: 'Manc360',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  edinburgh: commonsImage('Skyline of Quartermile, Edinburgh, in June 2024.jpg', {
    alt: 'A city view across Quartermile and the Meadows in Edinburgh',
    creator: 'McPhail',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  dublin: commonsImage('River-liffey.jpg', {
    alt: 'The River Liffey and central Dublin',
    creator: 'Dave Meier',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  'new york': commonsImage('Iconic Skyline of New York City.jpg', {
    alt: 'The New York City skyline',
    creator: 'Farida Belal',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  'new york city': commonsImage('Iconic Skyline of New York City.jpg', {
    alt: 'The New York City skyline',
    creator: 'Farida Belal',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  boston: commonsImage('Boston-skyline.jpg', {
    alt: 'The Boston skyline across the harbour',
    creator: 'Joe Valentine',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  toronto: commonsImage('Toronto skyline.png', {
    alt: "The Toronto skyline viewed from Ward's Island",
    creator: 'Bpp88520',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  sydney: commonsImage('Sydney skyline (23700049033).jpg', {
    alt: 'The Sydney skyline',
    creator: 'www.Pixel.la Free Stock Photos / Ed Gregory',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  melbourne: commonsImage('City of Melbourne Skyline From Docklands.JPG', {
    alt: 'The Melbourne skyline seen from Docklands',
    creator: 'Maximus Lu',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  perth: commonsImage('Perth skyline 2024.jpg', {
    alt: 'The Perth skyline seen from South Perth',
    creator: 'GenericWikiUser1',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  auckland: commonsImage('Auckland skyline (33576959126).jpg', {
    alt: 'The Auckland skyline and harbour',
    creator: 'Bernard Spragg. NZ',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
  valletta: commonsImage('VALLETTA.jpg', {
    alt: 'A city view in Valletta, Malta',
    creator: 'August Dominus',
    licence: 'CC0 1.0',
    licenceUrl: CC0,
    kind: 'city',
  }),
}

/**
 * Country pages deliberately use a recognisable study city rather than pretending a
 * single photograph can represent an entire nation. The alt text says what is
 * actually pictured and the page heading carries the country context separately.
 */
const DESTINATION_PLACE: Record<string, keyof typeof PLACES> = {
  'united kingdom': 'london',
  'united-kingdom': 'london',
  uk: 'london',
  ingiltere: 'london',
  'united states': 'new york',
  'united-states': 'new york',
  usa: 'new york',
  amerika: 'new york',
  canada: 'toronto',
  kanada: 'toronto',
  ireland: 'dublin',
  irlanda: 'dublin',
  australia: 'sydney',
  avustralya: 'sydney',
  'new zealand': 'auckland',
  'new-zealand': 'auckland',
  'yeni zelanda': 'auckland',
  'yeni-zelanda': 'auckland',
  malta: 'valletta',
}

function normalise(value?: string): string {
  return (value ?? '')
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
    .trim()
}

export function licensedMediaForInstitution(title?: string): LicensedExternalImage | null {
  const key = normalise(title)
  return INSTITUTIONS[key] ?? null
}

/**
 * City fields in the migrated corpus often contain a region/country after a comma.
 * Match the most specific known place rather than guessing from a country label.
 */
export function licensedMediaForPlace(value?: string): LicensedExternalImage | null {
  const key = normalise(value)
  if (!key) return null
  for (const [place, image] of Object.entries(PLACES)) {
    if (key === place || key.startsWith(`${place} `) || key.includes(` ${place} `)) return image
  }
  return null
}

export function licensedMediaForDestination(value?: string): LicensedExternalImage | null {
  const key = normalise(value)
  const place = DESTINATION_PLACE[key]
  return place ? PLACES[place] : licensedMediaForPlace(value)
}

export function licensedMediaForInstitutionOrPlace(
  title?: string,
  city?: string,
): LicensedExternalImage | null {
  return licensedMediaForInstitution(title) ?? licensedMediaForPlace(city)
}

export function allLicensedExternalMedia(): LicensedExternalImage[] {
  const unique = new Map<string, LicensedExternalImage>()
  for (const image of [...Object.values(INSTITUTIONS), ...Object.values(PLACES)]) {
    unique.set(image.sourceUrl, image)
  }
  return [...unique.values()]
}
