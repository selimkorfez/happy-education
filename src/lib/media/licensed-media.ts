import 'server-only'

/**
 * Documentary photography allowed on Happy Education pages.
 *
 * Admission rules:
 * - the source page must state a public reuse licence;
 * - CC0/Public Domain is preferred, CC BY/CC BY-SA is accepted with attribution;
 * - no Google Images, legacy WordPress stock, guessed university marketing rights,
 *   social-media downloads or images whose main subject is an identifiable person;
 * - source/creator/licence metadata travels with every image and is rendered by the UI.
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
  privacy: 'architecture-or-cityscape'
  cleared: true
}

const LICENCE_URL: Record<OpenLicence, string> = {
  'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'Public domain': 'https://creativecommons.org/publicdomain/mark/1.0/',
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
}

function commons(
  file: string,
  alt: string,
  creator: string,
  licence: OpenLicence,
  kind: 'campus' | 'city' = 'city',
): LicensedExternalImage {
  return {
    src: `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(file)}?width=1800`,
    alt,
    creator,
    sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replace(/%20/g, '_')}`,
    licence,
    licenceUrl: LICENCE_URL[licence],
    kind,
    privacy: 'architecture-or-cityscape',
    cleared: true,
  }
}

/** Campus files used only where the source page clearly identifies the institution. */
const INSTITUTIONS: Record<string, LicensedExternalImage> = {
  'anglia ruskin university': commons('Anglia Ruskin University Cambridge Campus.jpg', 'The Cambridge campus of Anglia Ruskin University', 'ARU', 'CC BY-SA 4.0', 'campus'),
  'university of oxford': commons('University Of Oxford The Bridge Of Sighs.jpg', 'The Bridge of Sighs at the University of Oxford', 'Michael D Beckwith', 'CC0 1.0', 'campus'),
  'university of cambridge': commons("University of Cambridge, King's College.jpg", "King's College at the University of Cambridge", 'Nine402', 'CC0 1.0', 'campus'),
  'imperial college london': commons('Imperial College London Dyson Building.jpg', 'The Dyson Building at Imperial College London', 'WhisperToMe', 'CC0 1.0', 'campus'),
  "king's college london": commons("Strand Building, King's College London.jpg", "The Strand Building at King's College London", 'Shadowssettle', 'CC BY-SA 4.0', 'campus'),
  'london school of economics': commons('LSE Buildings (4770697517).jpg', 'Buildings on the London School of Economics campus', 'SomeDriftwood', 'CC0 1.0', 'campus'),
  'london school of economics and political science': commons('LSE Buildings (4770697517).jpg', 'Buildings on the London School of Economics campus', 'SomeDriftwood', 'CC0 1.0', 'campus'),
  'university of birmingham': commons('University of Birmingham campus from the north.jpg', 'The University of Birmingham campus seen from the north', 'Rcsprinter123', 'CC BY 3.0', 'campus'),
  'university of manchester': commons('University of Manchester.jpg', 'Whitworth Hall at the University of Manchester', 'Bradshaw79', 'CC BY-SA 4.0', 'campus'),
  'university of bristol': commons('University of Bristol.jpg', 'A University of Bristol campus sign and building', 'Simon Cobb', 'CC0 1.0', 'campus'),
  'university of warwick': commons('The University of Warwick.jpg', 'University of Warwick campus signage', 'Stamhaney88', 'CC BY-SA 4.0', 'campus'),
  'university of edinburgh': commons('University of Edinburgh.jpg', 'A University of Edinburgh building in Edinburgh', 'miketnorton', 'CC BY 2.0', 'campus'),
}

/**
 * City/location files. This covers every city exposed by the current English country
 * previews and the most common locations in the migrated university catalogue.
 */
const PLACES: Record<string, LicensedExternalImage> = {
  london: commons('London Skyline 2021.jpg', 'The London skyline seen from Greenwich Park', 'Farbades420', 'CC0 1.0'),
  oxford: commons('University Of Oxford The Bridge Of Sighs.jpg', 'The Bridge of Sighs in Oxford', 'Michael D Beckwith', 'CC0 1.0'),
  cambridge: commons("University of Cambridge, King's College.jpg", "King's College in Cambridge", 'Nine402', 'CC0 1.0'),
  birmingham: commons('Birmingham UK skyline.jpg', 'The Birmingham city skyline', 'newkemall', 'CC BY 2.0'),
  manchester: commons('Manchester Skyline 2018.jpg', 'The Manchester skyline', 'Manc360', 'CC0 1.0'),
  edinburgh: commons('Skyline of Quartermile, Edinburgh, in June 2024.jpg', 'A city view across Quartermile and the Meadows in Edinburgh', 'McPhail', 'CC0 1.0'),
  cardiff: commons('Cardiff skyline - geograph.org.uk - 6839069.jpg', 'The Cardiff skyline', 'Gareth James', 'CC BY-SA 2.0'),
  bristol: commons('The Bristol skyline from Cabot Tower - January 2019.jpg', 'The Bristol skyline seen from Cabot Tower', 'Graeme Churchard', 'CC BY 2.0'),
  leicester: commons('Central Leicester Skyline.jpg', 'The central Leicester skyline', 'DougPR', 'CC0 1.0'),
  nottingham: commons('Nottingham skyline.jpg', 'The Nottingham skyline', 'Willednic', 'CC BY 3.0'),
  sheffield: commons('Sheffield Skyline from Park Hill.jpg', 'The Sheffield skyline seen from Park Hill', 'Coolmule0', 'CC0 1.0'),
  leeds: commons('Leeds-city-skyline.png', 'The Leeds city skyline', 'Leedsfan2', 'CC BY 4.0'),
  liverpool: commons('Liverpool Skyline 2.JPG', 'The Liverpool skyline', 'Tetrisforaliens', 'CC0 1.0'),
  dublin: commons('River-liffey.jpg', 'The River Liffey and central Dublin', 'Dave Meier', 'CC0 1.0'),
  cork: commons('Cork city, Ireland.jpg', 'A city view across Cork, Ireland', 'Marina Melik-Adamyan', 'CC BY-SA 4.0'),
  galway: commons('GALWAY.jpg', 'A city view in Galway, Ireland', 'August Dominus', 'CC0 1.0'),
  'new york': commons('Iconic Skyline of New York City.jpg', 'The New York City skyline', 'Farida Belal', 'CC0 1.0'),
  boston: commons('Boston-skyline.jpg', 'The Boston skyline across the harbour', 'Joe Valentine', 'CC0 1.0'),
  chicago: commons('Chicago skyline (215488049).jpg', 'The Chicago skyline', 'Christian Stankevitz', 'CC0 1.0'),
  'los angeles': commons('Los Angeles Skyline; August 30, 2022.jpg', 'The Los Angeles skyline', 'ItzAPotato2009', 'CC0 1.0'),
  'san francisco': commons('San Francisco city skyline.jpg', 'The San Francisco skyline', 'Lisafern', 'CC0 1.0'),
  toronto: commons('Toronto skyline.png', "The Toronto skyline viewed from Ward's Island", 'Bpp88520', 'CC0 1.0'),
  vancouver: commons("Vancouver’s skyline as seen from lonsdale quay.jpg", 'The Vancouver skyline seen from Lonsdale Quay', 'Lizardhugger92', 'CC0 1.0'),
  montreal: commons('Montreal Skyline.jpg', 'The Montreal skyline', 'CanadianPhotographer', 'CC0 1.0'),
  sydney: commons('Sydney skyline (23700049033).jpg', 'The Sydney skyline', 'www.Pixel.la Free Stock Photos / Ed Gregory', 'CC0 1.0'),
  melbourne: commons('City of Melbourne Skyline From Docklands.JPG', 'The Melbourne skyline seen from Docklands', 'Maximus Lu', 'CC0 1.0'),
  brisbane: commons('Brisbane skyline.JPG', 'The Brisbane skyline', 'Dinkum', 'CC0 1.0'),
  perth: commons('Perth skyline 2024.jpg', 'The Perth skyline seen from South Perth', 'GenericWikiUser1', 'CC0 1.0'),
  auckland: commons('Auckland skyline (33576959126).jpg', 'The Auckland skyline and harbour', 'Bernard Spragg. NZ', 'CC0 1.0'),
  wellington: commons('Wellington New Zealand 2006.jpg', 'Wellington city and harbour in New Zealand', 'Phillip Capper', 'CC BY 2.0'),
  christchurch: commons('Christchurch Skyline.jpg', 'The Christchurch skyline in New Zealand', 'Francis Vallance (Heritage Warrior)', 'CC BY 2.0'),
  valletta: commons('VALLETTA.jpg', 'A city view in Valletta, Malta', 'August Dominus', 'CC0 1.0'),
  nicosia: commons("Nicosia's Skyline.jpg", 'The Nicosia skyline in Cyprus', 'ConstantinosTziak', 'CC BY-SA 4.0'),
  "st george's": commons('Grenada.jpg', "A city and harbour view in St George's, Grenada", 'Ian Mackenzie', 'CC BY 2.0'),
  'uae desert': commons('Desert in Dubai.jpg', 'Desert landscape in the United Arab Emirates', 'Tim de Groot', 'CC0 1.0'),
}

const PLACE_ALIAS: Record<string, keyof typeof PLACES> = {
  'new york city': 'new york',
  londra: 'london',
  edinburg: 'edinburgh',
  sidney: 'sydney',
  lefkosa: 'nicosia',
  dubai: 'uae desert',
  'abu dhabi': 'uae desert',
}

const DESTINATION_PLACE: Record<string, keyof typeof PLACES> = {
  'united kingdom': 'london', 'united-kingdom': 'london', uk: 'london', ingiltere: 'london',
  'united states': 'new york', 'united-states': 'new york', usa: 'new york', amerika: 'new york',
  canada: 'toronto', kanada: 'toronto',
  ireland: 'dublin', irlanda: 'dublin',
  australia: 'sydney', avustralya: 'sydney',
  'new zealand': 'auckland', 'new-zealand': 'auckland', 'yeni zelanda': 'auckland', 'yeni-zelanda': 'auckland',
  malta: 'valletta',
  cyprus: 'nicosia', kibris: 'nicosia',
  grenada: "st george's",
  'united arab emirates': 'uae desert', 'united-arab-emirates': 'uae desert', uae: 'uae desert', bae: 'uae desert',
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
  return INSTITUTIONS[normalise(title)] ?? null
}

export function licensedMediaForPlace(value?: string): LicensedExternalImage | null {
  const key = normalise(value)
  if (!key) return null

  const directAlias = PLACE_ALIAS[key]
  if (directAlias) return PLACES[directAlias] ?? null

  for (const [place, image] of Object.entries(PLACES)) {
    if (key === place || key.startsWith(`${place} `) || key.includes(` ${place} `) || key.includes(`, ${place}`)) return image
  }

  for (const [alias, target] of Object.entries(PLACE_ALIAS)) {
    if (key === alias || key.startsWith(`${alias} `) || key.includes(` ${alias} `) || key.includes(`, ${alias}`)) {
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

/** Campus -> exact city -> representative destination. */
export function licensedMediaForInstitutionOrPlace(
  title?: string,
  city?: string,
  destinationOrCountry?: string,
): LicensedExternalImage | null {
  return licensedMediaForInstitution(title)
    ?? licensedMediaForPlace(city)
    ?? licensedMediaForDestination(destinationOrCountry)
}

export function allLicensedExternalMedia(): LicensedExternalImage[] {
  const unique = new Map<string, LicensedExternalImage>()
  for (const image of [...Object.values(INSTITUTIONS), ...Object.values(PLACES)]) unique.set(image.sourceUrl, image)
  return [...unique.values()]
}

export function licensedCityNames(): string[] {
  return Object.keys(PLACES)
}
