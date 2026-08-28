import 'server-only'
import type {
  InstitutionCard,
  InstitutionDoc,
  SummerProgrammeDoc,
} from '@/lib/sanity/queries/content'

/**
 * English catalogue shadows for records that currently exist only in Turkish.
 *
 * These expose only identity/location fields needed for discovery, add fresh
 * neutral English explanatory copy, and mark detail pages noindex. Genuine
 * English CMS documents automatically replace them.
 *
 * Any visible value copied from the Turkish catalogue passes through the controlled
 * normalisers below. If Turkish-looking UI text still remains after known
 * translations, we fail closed rather than leaking mixed-language text onto /en.
 */

export interface InstitutionShadowSource {
  _id: string
  _type: string
  title: string
  slug: string
  city?: string
  country?: string
  destination?: { title?: string; slug?: string; section?: string }
}

export interface SummerShadowSource {
  _id: string
  title: string
  slug: string
  format?: string
}

interface DestinationIdentity {
  title: string
  slug: string
}

const DESTINATIONS: Array<{ title: string; slug: string; aliases: string[] }> = [
  {
    title: 'United Kingdom',
    slug: 'united-kingdom',
    aliases: [
      'united kingdom', 'uk', 'u k', 'england', 'scotland', 'wales', 'northern ireland',
      'britain', 'great britain', 'ingiltere', 'iskocya', 'galler', 'kuzey irlanda',
      'birlesik krallik',
    ],
  },
  {
    title: 'United States',
    slug: 'united-states',
    aliases: [
      'united states', 'united states of america', 'usa', 'u s a', 'america', 'amerika',
      'abd', 'amerika birlesik devletleri',
    ],
  },
  { title: 'Canada', slug: 'canada', aliases: ['canada', 'kanada'] },
  { title: 'Ireland', slug: 'ireland', aliases: ['ireland', 'irlanda'] },
  { title: 'Australia', slug: 'australia', aliases: ['australia', 'avustralya'] },
  { title: 'New Zealand', slug: 'new-zealand', aliases: ['new zealand', 'yeni zelanda'] },
  { title: 'Malta', slug: 'malta', aliases: ['malta'] },
  { title: 'Cyprus', slug: 'cyprus', aliases: ['cyprus', 'kibris', 'kıbrıs'] },
  { title: 'Grenada', slug: 'grenada', aliases: ['grenada'] },
  {
    title: 'United Arab Emirates',
    slug: 'united-arab-emirates',
    aliases: ['united arab emirates', 'uae', 'bae', 'birlesik arap emirlikleri'],
  },
]

function normalise(value: string): string {
  return value
    .toLocaleLowerCase('en-GB')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function destinationFromValue(value?: string): DestinationIdentity | undefined {
  if (!value) return undefined
  const needle = normalise(value)
  for (const destination of DESTINATIONS) {
    if (normalise(destination.slug) === needle) return { title: destination.title, slug: destination.slug }
    if (destination.aliases.some((alias) => normalise(alias) === needle)) {
      return { title: destination.title, slug: destination.slug }
    }
  }
  return undefined
}

export function englishDestinationForSource(
  source: Pick<InstitutionShadowSource, 'country' | 'destination'>,
): DestinationIdentity | undefined {
  return (
    destinationFromValue(source.destination?.slug) ??
    destinationFromValue(source.destination?.title) ??
    destinationFromValue(source.country)
  )
}

const TURKISH_UI_WORDS = new Set([
  'abd', 'almanya', 'amerika', 'avustralya', 'batı', 'birleşik', 'bireysel', 'çekya',
  'çocuklar', 'dahil', 'dâhil', 'dil', 'doğu', 'fransa', 'galler', 'gençler', 'grup',
  'güney', 'hollanda', 'ingiltere', 'i̇ngiltere', 'irlanda', 'i̇rlanda', 'iskoçya',
  'i̇skoçya', 'ispanya', 'i̇spanya', 'isviçre', 'i̇sviçre', 'italya', 'i̇talya',
  'japonya', 'kanada', 'kıbrıs', 'kibris', 'kuzey', 'londra', 'macaristan', 'malezya',
  'okulu', 'okullar', 'öğrenci', 'öğrenciler', 'polonya', 'portekiz', 'programı',
  'programi', 'şehir', 've', 'yaz', 'yeni', 'yunanistan', 'üniversite', 'üniversitesi',
])

export function containsTurkishUiText(value?: string): boolean {
  if (!value) return false
  if (/[ĞğİıŞşÇçÖöÜü]/.test(value)) return true

  const words = value
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-zçğıöşü0-9]+/giu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  return words.some((word) => TURKISH_UI_WORDS.has(word))
}

const LABEL_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bAmerika Birleşik Devletleri\b/gi, 'United States'],
  [/\bBirleşik Arap Emirlikleri\b/gi, 'United Arab Emirates'],
  [/\bBirleşik Krallık\b/gi, 'United Kingdom'],
  [/\bKuzey İrlanda\b/gi, 'Northern Ireland'],
  [/\bBatı Avustralya\b/gi, 'Western Australia'],
  [/\bGüney Afrika\b/gi, 'South Africa'],
  [/\bGüney Kore\b/gi, 'South Korea'],
  [/\bYeni Zelanda\b/gi, 'New Zealand'],
  [/\bİngiltere\b/gi, 'England'],
  [/\bİskoçya\b/gi, 'Scotland'],
  [/\bGaller\b/gi, 'Wales'],
  [/\bİrlanda\b/gi, 'Ireland'],
  [/\bAvustralya\b/gi, 'Australia'],
  [/\bKanada\b/gi, 'Canada'],
  [/\bAmerika\b/gi, 'United States'],
  [/\bABD\b/g, 'USA'],
  [/\bBAE\b/g, 'UAE'],
  [/\bKıbrıs\b/gi, 'Cyprus'],
  [/\bAlmanya\b/gi, 'Germany'],
  [/\bFransa\b/gi, 'France'],
  [/\bHollanda\b/gi, 'Netherlands'],
  [/\bİspanya\b/gi, 'Spain'],
  [/\bİtalya\b/gi, 'Italy'],
  [/\bİsviçre\b/gi, 'Switzerland'],
  [/\bİsveç\b/gi, 'Sweden'],
  [/\bAvusturya\b/gi, 'Austria'],
  [/\bPolonya\b/gi, 'Poland'],
  [/\bMacaristan\b/gi, 'Hungary'],
  [/\bÇekya\b/gi, 'Czechia'],
  [/\bPortekiz\b/gi, 'Portugal'],
  [/\bYunanistan\b/gi, 'Greece'],
  [/\bJaponya\b/gi, 'Japan'],
  [/\bMalezya\b/gi, 'Malaysia'],
  [/\bLondra\b/gi, 'London'],
  [/\bMünih\b/gi, 'Munich'],
  [/\bKöln\b/gi, 'Cologne'],
  [/\bViyana\b/gi, 'Vienna'],
  [/\bFloransa\b/gi, 'Florence'],
  [/\bMilano\b/gi, 'Milan'],
  [/\bYaz Okulu\b/gi, 'Summer School'],
  [/\bDil Okulu\b/gi, 'Language School'],
  [/\bÜniversitesi\b/gi, 'University'],
  [/\bÜniversite\b/gi, 'University'],
  [/\bİngilizce\b/gi, 'English'],
  [/\bBireysel\b/gi, 'Individual'],
  [/\bGrup\b/gi, 'Group'],
  [/\bProgramı\b/gi, 'Programme'],
  [/\bve\b/gi, 'and'],
]

function translateKnownLabel(value: string): string {
  return LABEL_REPLACEMENTS.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
    .replace(/\s+/g, ' ')
    .replace(/\s+,/g, ',')
    .trim()
}

function titleFromSlug(slug: string): string {
  const upper = new Set(['uk', 'usa', 'uae', 'ucl', 'lse', 'mit', 'nyu', 'ielts'])
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase()
      if (upper.has(lower)) return lower.toUpperCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

/** Public so the regression suite can enforce English-only catalogue labels. */
export function englishCatalogueTitle(value: string, slug: string): string {
  const translated = translateKnownLabel(value)
  return containsTurkishUiText(translated) ? titleFromSlug(slug) : translated
}

export function englishCountryLabel(value?: string): string | undefined {
  if (!value) return undefined
  const mapped = destinationFromValue(value)
  if (mapped) return mapped.title
  const translated = translateKnownLabel(value)
  return containsTurkishUiText(translated) ? undefined : translated
}

export function englishCityLabel(value?: string): string | undefined {
  if (!value) return undefined
  const translated = translateKnownLabel(value)
  return containsTurkishUiText(translated) ? undefined : translated
}

function portableParagraphs(paragraphs: string[]) {
  return paragraphs.map((text, index) => ({
    _type: 'block',
    _key: `shadow-${index}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `shadow-text-${index}`, text, marks: [] }],
  }))
}

function institutionCopy(source: InstitutionShadowSource, title: string): string[] {
  if (source._type === 'languageSchool') {
    return [
      `Use this profile as a starting point for considering ${title}. Course types, dates, accommodation, entry conditions and prices can change, so the current details should be confirmed before a booking is made.`,
      'Happy Education can help you compare language-school options, organise the application and booking paperwork, and clarify which questions should be confirmed with the school before you commit.',
    ]
  }
  if (source._type === 'boardingSchool') {
    return [
      `Use this profile as a starting point for considering ${title}. Current admissions requirements, boarding arrangements, fees and availability should be confirmed directly before an application or payment is made.`,
      'For families considering boarding education, the shortlist should cover academic fit as well as pastoral care, accommodation, supervision and safeguarding. Happy Education can help organise the education-application side of that comparison without making guarantees on a school’s behalf.',
    ]
  }
  return [
    `Use this profile as a starting point for considering ${title}. Current courses, entry requirements, tuition fees and application deadlines can change, so the live institution information should be checked before you apply.`,
    'Happy Education can help you compare universities, organise application documents and plan the application timeline. Admission decisions remain with the university, and this page does not make a ranking, admission or visa-outcome claim.',
  ]
}

export function buildEnglishInstitutionShadow(source: InstitutionShadowSource): InstitutionDoc {
  const destination = englishDestinationForSource(source)
  const usesNestedCountryRoute = source._type !== 'boardingSchool'
  const title = englishCatalogueTitle(source.title, source.slug)
  return {
    _id: `shadow-en-${source._id}`,
    _type: source._type,
    title,
    slug: source.slug,
    locale: 'en',
    city: englishCityLabel(source.city),
    country: destination?.title ?? englishCountryLabel(source.country),
    overview: portableParagraphs(institutionCopy(source, title)),
    destination: usesNestedCountryRoute && destination
      ? {
          title: destination.title,
          slug: destination.slug,
          section: source._type === 'languageSchool' ? 'languageSchools' : 'universities',
        }
      : undefined,
    seo: { noIndex: true },
    review: { lastReviewed: '2026-08-28', timeSensitive: false },
  }
}

export function buildEnglishInstitutionCard(source: InstitutionShadowSource): InstitutionCard {
  const destination = englishDestinationForSource(source)
  return {
    _type: source._type,
    title: englishCatalogueTitle(source.title, source.slug),
    slug: source.slug,
    city: englishCityLabel(source.city),
    country: destination?.title ?? englishCountryLabel(source.country),
  }
}

export function institutionMatchesEnglishDestination(
  source: InstitutionShadowSource,
  destinationSlug?: string,
): boolean {
  if (!destinationSlug) return true
  return englishDestinationForSource(source)?.slug === destinationSlug
}

export function buildEnglishSummerShadow(source: SummerShadowSource): SummerProgrammeDoc {
  const format = source.format === 'group' ? 'group' : 'individual'
  const formatLabel = format === 'group' ? 'group summer programme' : 'individual summer programme'
  const title = englishCatalogueTitle(source.title, source.slug)
  return {
    _id: `shadow-en-${source._id}`,
    title,
    slug: source.slug,
    locale: 'en',
    format,
    overview: portableParagraphs([
      `This is an English catalogue profile for ${title}, listed as a ${formatLabel}. The current dates, age range, accommodation, supervision, activities and price should be confirmed before a booking is made.`,
      'Happy Education can help families compare the programme with other options and organise the education-booking process. For students under 18, safeguarding and supervision arrangements should be reviewed in writing with the programme provider before commitment.',
    ]),
    providerResponsibilities: portableParagraphs([
      'The programme provider is responsible for the services, supervision and safeguarding arrangements it operates on site. Ask for the current written programme and welfare information before booking.',
    ]),
    happyEducationResponsibilities: portableParagraphs([
      'Happy Education can support the comparison, placement and booking administration and can help you identify information that should be confirmed with the provider.',
    ]),
    parentalRequirements: portableParagraphs([
      'Parents or guardians should review the current programme terms, supervision arrangements, travel requirements and consent documentation before confirming a place.',
    ]),
    seo: { noIndex: true },
    review: { lastReviewed: '2026-08-28', timeSensitive: false },
  }
}

export function buildEnglishSummerCard(source: SummerShadowSource) {
  return {
    title: englishCatalogueTitle(source.title, source.slug),
    slug: source.slug,
    format: source.format === 'group' ? 'group' : 'individual',
  }
}
