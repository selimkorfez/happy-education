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
  | 'CC BY-SA 2.0'
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
const CC_BY_4 = 'https://creativecommons.org/licenses/by/4.0/'
const CC_BY_SA_2 = 'https://creativecommons.org/licenses/by-sa/2.0/'
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
 * Institution-specific photos. These are used only when the file page clearly
 * identifies the institution/campus. Everything else falls back to a truthful city
 * or destination image rather than pretending a generic campus is the university.
 */
const INSTITUTIONS: Record<string, LicensedExternalImage> = {
  'anglia ruskin university': commonsImage('Anglia Ruskin University Cambridge Campus.jpg', {
    alt: 'The Cambridge campus of Anglia Ruskin University', creator: 'ARU', licence: 'CC BY-SA 4.0', licenceUrl: CC_BY_SA_4, kind: 'campus',
  }),
  'university of oxford': commonsImage('University Of Oxford The Bridge Of Sighs.jpg', {
    alt: 'The Bridge of Sighs at the University of Oxford', creator: 'Michael D Beckwith', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'campus',
  }),
  'university of cambridge': commonsImage("University of Cambridge, King's College.jpg", {
    alt: "King's College at the University of Cambridge", creator: 'Nine402', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'campus',
  }),
  'imperial college london': commonsImage('Imperial College London Dyson Building.jpg', {
    alt: 'The Dyson Building at Imperial College London', creator: 'WhisperToMe', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'campus',
  }),
  "king's college london": commonsImage("Strand Building, King's College London.jpg", {
    alt: "The Strand Building at King's College London", creator: 'Shadowssettle', licence: 'CC BY-SA 4.0', licenceUrl: CC_BY_SA_4, kind: 'campus',
  }),
  'london school of economics': commonsImage('LSE Buildings (4770697517).jpg', {
    alt: 'Buildings on the London School of Economics campus', creator: 'SomeDriftwood', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'campus',
  }),
  'london school of economics and political science': commonsImage('LSE Buildings (4770697517).jpg', {
    alt: 'Buildings on the London School of Economics campus', creator: 'SomeDriftwood', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'campus',
  }),
  'university of birmingham': commonsImage('University of Birmingham campus from the north.jpg', {
    alt: 'The University of Birmingham campus seen from the north', creator: 'Rcsprinter123', licence: 'CC BY 3.0', licenceUrl: CC_BY_3, kind: 'campus',
  }),
  'university of manchester': commonsImage('University of Manchester.jpg', {
    alt: 'Whitworth Hall at the University of Manchester', creator: 'Bradshaw79', licence: 'CC BY-SA 4.0', licenceUrl: CC_BY_SA_4, kind: 'campus',
  }),
  'university of bristol': commonsImage('University of Bristol.jpg', {
    alt: 'A University of Bristol campus sign and building', creator: 'Simon Cobb', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'campus',
  }),
  'university of warwick': commonsImage('The University of Warwick.jpg', {
    alt: 'University of Warwick campus signage', creator: 'Stamhaney88', licence: 'CC BY-SA 4.0', licenceUrl: CC_BY_SA_4, kind: 'campus',
  }),
  'university of edinburgh': commonsImage('University of Edinburgh.jpg', {
    alt: 'A University of Edinburgh building in Edinburgh', creator: 'miketnorton', licence: 'CC BY 2.0', licenceUrl: CC_BY_2, kind: 'campus',
  }),
}

/**
 * City photography. This list covers every city presented by the starter country
 * pages plus common cities in the migrated university catalogue. A city photo is
 * labelled as a location image in the UI and is never described as a campus photo.
 */
const PLACES: Record<string, LicensedExternalImage> = {
  london: commonsImage('London Skyline 2021.jpg', {
    alt: 'The London skyline seen from Greenwich Park', creator: 'Farbades420', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  oxford: commonsImage('University Of Oxford The Bridge Of Sighs.jpg', {
    alt: 'The Bridge of Sighs in Oxford', creator: 'Michael D Beckwith', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  cambridge: commonsImage("University of Cambridge, King's College.jpg", {
    alt: "King's College in Cambridge", creator: 'Nine402', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  birmingham: commonsImage('Birmingham UK skyline.jpg', {
    alt: 'The Birmingham city skyline', creator: 'newkemall', licence: 'CC BY 2.0', licenceUrl: CC_BY_2, kind: 'city',
  }),
  manchester: commonsImage('Manchester Skyline 2018.jpg', {
    alt: 'The Manchester skyline', creator: 'Manc360', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  edinburgh: commonsImage('Skyline of Quartermile, Edinburgh, in June 2024.jpg', {
    alt: 'A city view across Quartermile and the Meadows in Edinburgh', creator: 'McPhail', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  cardiff: commonsImage('Cardiff skyline - geograph.org.uk - 6839069.jpg', {
    alt: 'The Cardiff skyline', creator: 'Gareth James', licence: 'CC BY-SA 2.0', licenceUrl: CC_BY_SA_2, kind: 'city',
  }),
  bristol: commonsImage('The Bristol skyline from Cabot Tower - January 2019.jpg', {
    alt: 'The Bristol skyline seen from Cabot Tower', creator: 'Graeme Churchard', licence: 'CC BY 2.0', licenceUrl: CC_BY_2, kind: 'city',
  }),
  leicester: commonsImage('Central Leicester Skyline.jpg', {
    alt: 'The central Leicester skyline', creator: 'DougPR', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  nottingham: commonsImage('Nottingham skyline.jpg', {
    alt: 'The Nottingham skyline', creator: 'Willednic', licence: 'CC BY 3.0', licenceUrl: CC_BY_3, kind: 'city',
  }),
  sheffield: commonsImage('Sheffield Skyline from Park Hill.jpg', {
    alt: 'The Sheffield skyline seen from Park Hill', creator: 'Coolmule0', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  leeds: commonsImage('Leeds-city-skyline.png', {
    alt: 'The Leeds city skyline', creator: 'Leedsfan2', licence: 'CC BY 4.0', licenceUrl: CC_BY_4, kind: 'city',
  }),
  liverpool: commonsImage('Liverpool Skyline 2.JPG', {
    alt: 'The Liverpool skyline', creator: 'Tetrisforaliens', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  dublin: commonsImage('River-liffey.jpg', {
    alt: 'The River Liffey and central Dublin', creator: 'Dave Meier', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  cork: commonsImage('Cork city, Ireland.jpg', {
    alt: 'A city view across Cork, Ireland', creator: 'Marina Melik-Adamyan', licence: 'CC BY-SA 4.0', licenceUrl: CC_BY_SA_4, kind: 'city',
  }),
  galway: commonsImage('GALWAY.jpg', {
    alt: 'A city view in Galway, Ireland', creator: 'August Dominus', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  'new york': commonsImage('Iconic Skyline of New York City.jpg', {
    alt: 'The New York City skyline', creator: 'Farida Belal', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  boston: commonsImage('Boston-skyline.jpg', {
    alt: 'The Boston skyline across the harbour', creator: 'Joe Valentine', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  chicago: commonsImage('Chicago skyline (215488049).jpg', {
    alt: 'The Chicago skyline', creator: 'Christian Stankevitz', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  'los angeles': commonsImage('Los Angeles Skyline; August 30, 2022.jpg', {
    alt: 'The Los Angeles skyline', creator: 'ItzAPotato2009', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  'san francisco': commonsImage('San Francisco city skyline.jpg', {
    alt: 'The San Francisco skyline', creator: 'Lisafern', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  toronto: commonsImage('Toronto skyline.png', {
    alt: "The Toronto skyline viewed from Ward's Island", creator: 'Bpp88520', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  vancouver: commonsImage("Vancouver’s skyline as seen from lonsdale quay.jpg", {
    alt: 'The Vancouver skyline seen from Lonsdale Quay', creator: 'Lizardhugger92', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  montreal: commonsImage('Montreal Skyline.jpg', {
    alt: 'The Montreal skyline', creator: 'CanadianPhotographer', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  sydney: commonsImage('Sydney skyline (23700049033).jpg', {
    alt: 'The Sydney skyline', creator: 'www.Pixel.la Free Stock Photos / Ed Gregory', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  melbourne: commonsImage('City of Melbourne Skyline From Docklands.JPG', {
    alt: 'The Melbourne skyline seen from Docklands', creator: 'Maximus Lu', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  brisbane: commonsImage('Brisbane skyline.JPG', {
    alt: 'The Brisbane skyline', creator: 'Dinkum', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  perth: commonsImage('Perth skyline 2024.jpg', {
    alt: 'The Perth skyline seen from South Perth', creator: 'GenericWikiUser1', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  auckland: commonsImage('Auckland skyline (33576959126).jpg', {
    alt: 'The Auckland skyline and harbour', creator: 'Bernard Spragg. NZ', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  wellington: commonsImage('Wellington New Zealand 2006.jpg', {
    alt: 'Wellington city and harbour in New Zealand', creator: 'Phillip Capper', licence: 'CC BY 2.0', licenceUrl: CC_BY_2, kind: 'city',
  }),
  christchurch: commonsImage('Christchurch Skyline.jpg', {
    alt: 'The Christchurch skyline in New Zealand', creator: 'Francis Vallance (Heritage Warrior)', licence: 'CC BY 2.0', licenceUrl: CC_BY_2, kind: 'city',
  }),
  valletta: commonsImage('VALLETTA.jpg', {
    alt: 'A city view in Valletta, Malta', creator: 'August Dominus', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
  nicosia: commonsImage("Nicosia's Skyline.jpg", {
    alt: 'The Nicosia skyline in Cyprus', creator: 'ConstantinosTziak', licence: 'CC BY-SA 4.0', licenceUrl: CC_BY_SA_4, kind: 'city',
  }),
  "st george's": commonsImage('Grenada.jpg', {
    alt: "A city and harbour view in St George's, Grenada", creator: 'Ian Mackenzie', licence: 'CC BY 2.0', licenceUrl: CC_BY_2, kind: 'city',
  }),
  'uae desert': commonsImage('Desert in Dubai.jpg', {
    alt: 'Desert landscape in the United Arab Emirates', creator: 'Tim de Groot', licence: 'CC0 1.0', licenceUrl: CC0, kind: 'city',
  }),
}

/** Common alternate spellings/translations in the migration. */
const PLACE_ALIAS: Record<string, keyof typeof PLACES> = {
  'new york city': 'new york',
  londra: 'london',
  edinburg: 'edinburgh',
  sidney: 'sydney',
  montreal: 'montreal',
  nicosia: 'nicosia',
  lefkosa: 'nicosia',
  lefkosa: 'nicosia',
  dubai: 'uae desert',
  'abu dhabi': 'uae desert',
}

/**
 * Country pages deliberately use a recognisable study city or geographic scene
 * rather than pretending a single photograph represents an entire nation.
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
  cyprus: 'nicosia',
  kibris: 'nicosia',
  grenada: "st george's",
  'united arab emirates': 'uae desert',
  'united-arab-emirates': 'uae desert',
  uae: 'uae desert',
  bae: 'uae desert',
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
 * City fields often contain multiple campuses or a region/country after a comma.
 * Match any known city token; aliases cover translated migration labels.
 */
export function licensedMediaForPlace(value?: string): LicensedExternalImage | null {
  const key = normalise(value)
  if (!key) return null

  const alias = PLACE_ALIAS[key]
  if (alias) return PLACES[alias] ?? null

  for (const [place, image] of Object.entries(PLACES)) {
    if (key === place || key.startsWith(`${place} `) || key.includes(` ${place} `) || key.includes(`, ${place}`)) return image
  }

  for (const [candidate, target] of Object.entries(PLACE_ALIAS)) {
    if (key === candidate || key.startsWith(`${candidate} `) || key.includes(` ${candidate} `) || key.includes(`, ${candidate}`)) {
      return PLACES[target] ?? null
    }
  }

  return null
}

export function licensedMediaForDestination(value?: string): LicensedExternalImage | null {
  const key = normalise(value)
  const place = DESTINATION_PLACE[key]
  return place ? (PLACES[place] ?? null) : licensedMediaForPlace(value)
}

/**
 * Complete institution fallback hierarchy.
 *
 * 1. verified campus photo;
 * 2. verified city photo;
 * 3. verified representative destination image.
 *
 * This guarantees a real, licensed photograph for catalogue institutions whose
 * destination is known, without ever mislabelling a destination image as campus.
 */
export function licensedMediaForInstitutionOrPlace(
  title?: string,
  city?: string,
  destinationOrCountry?: string,
): LicensedExternalImage | null {
  return (
    licensedMediaForInstitution(title) ??
    licensedMediaForPlace(city) ??
    licensedMediaForDestination(destinationOrCountry)
  )
}

export function allLicensedExternalMedia(): LicensedExternalImage[] {
  const unique = new Map<string, LicensedExternalImage>()
  for (const image of [...Object.values(INSTITUTIONS), ...Object.values(PLACES)]) {
    unique.set(image.sourceUrl, image)
  }
  return [...unique.values()]
}

export function licensedCityNames(): string[] {
  return Object.keys(PLACES)
}
