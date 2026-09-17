const COMMONS_API = 'https://commons.wikimedia.org/w/api.php'
const MAX_FILE_SIZE = 25 * 1024 * 1024
const MIN_WIDTH = 900

type MetadataField = { value?: string }

interface WikimediaImageInfo {
  url?: string
  thumburl?: string
  width?: number
  height?: number
  size?: number
  mime?: string
  extmetadata?: Record<string, MetadataField>
}

interface WikimediaPage {
  pageid?: number
  title?: string
  fullurl?: string
  imageinfo?: WikimediaImageInfo[]
}

export interface WikimediaResponse {
  query?: { pages?: WikimediaPage[] }
}

export interface LicensedImageSuggestion {
  id: string
  filename: string
  title: string
  description: string
  alt: string
  creator: string
  licence: string
  licenceUrl?: string
  sourceUrl: string
  originalUrl: string
  thumbnailUrl: string
  width: number
  height: number
  fileSize: number
}

/**
 * Builds a Commons API request that returns a small set of bitmap files plus the
 * machine-readable credit and licence metadata required for editorial review.
 */
export function wikimediaSearchUrl(query: string): string {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    origin: '*',
    generator: 'search',
    gsrsearch: query.trim(),
    gsrnamespace: '6',
    gsrlimit: '18',
    prop: 'info|imageinfo',
    inprop: 'url',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '640',
    iiextmetadatalanguage: 'en',
    iiextmetadatafilter:
      'ObjectName|ImageDescription|Artist|Credit|LicenseShortName|LicenseUrl|UsageTerms|AttributionRequired|Copyrighted',
  })

  return `${COMMONS_API}?${params.toString()}`
}

export async function searchWikimedia(
  query: string,
  signal?: AbortSignal,
): Promise<LicensedImageSuggestion[]> {
  const response = await fetch(wikimediaSearchUrl(query), { signal })
  if (!response.ok) throw new Error(`Wikimedia search failed (${response.status}).`)
  return parseWikimediaResponse((await response.json()) as WikimediaResponse)
}

/**
 * Filters out SVG/PDF files, very small originals, oversized downloads and
 * licences that restrict commercial reuse or modifications. The editor still
 * performs the final source-page check before clearing publication.
 */
export function parseWikimediaResponse(
  response: WikimediaResponse,
): LicensedImageSuggestion[] {
  return (response.query?.pages ?? []).flatMap((page) => {
    const info = page.imageinfo?.[0]
    const metadata = info?.extmetadata
    if (!info?.url || !info.thumburl || !metadata || !page.fullurl) return []
    if (!isSupportedBitmap(info.mime)) return []

    const width = info.width ?? 0
    const height = info.height ?? 0
    const fileSize = info.size ?? 0
    if (width < MIN_WIDTH || height === 0 || fileSize > MAX_FILE_SIZE) return []

    const licence = plainMetadata(metadata.LicenseShortName) || plainMetadata(metadata.UsageTerms)
    if (!isAllowedLicence(licence)) return []

    const title = plainMetadata(metadata.ObjectName) || cleanFilename(page.title)
    const description = plainMetadata(metadata.ImageDescription) || title
    const creator =
      plainMetadata(metadata.Artist) || plainMetadata(metadata.Credit) || 'Wikimedia Commons contributor'
    const licenceUrl = safeHttpsUrl(plainMetadata(metadata.LicenseUrl))

    return [{
      id: String(page.pageid ?? page.title ?? info.url),
      filename: cleanFilename(page.title),
      title,
      description,
      alt: conciseAlt(description || title),
      creator,
      licence,
      ...(licenceUrl ? { licenceUrl } : {}),
      sourceUrl: page.fullurl,
      originalUrl: info.url,
      thumbnailUrl: info.thumburl,
      width,
      height,
      fileSize,
    }]
  })
}

export function isAllowedLicence(value: string): boolean {
  const licence = value
    .toUpperCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!licence || /\b(?:NC|ND)\b/.test(licence)) return false
  if (licence.includes('PUBLIC DOMAIN') || licence.includes('PUBLIC DOMAIN MARK')) return true
  if (/\bCC0(?:\s+1\.0)?\b/.test(licence)) return true
  return /^CC BY(?: SA)?(?: \d(?:\.\d)?)?$/.test(licence)
}

/**
 * Uses the current document and the image's parent object to give editors a
 * useful first query, while leaving the search box editable for judgement calls.
 */
export function imageSearchSeed(
  document: Record<string, unknown> | undefined,
  path: Path,
): string {
  if (!document) return 'international education students'

  const parent = valueAtPath(document, path.slice(0, -1))
  const type = stringValue(document._type)
  const routeKey = isRecord(parent) ? stringValue(parent.key) : ''
  const typeHint = routeKey ? ROUTE_HINTS[routeKey] : TYPE_HINTS[type]

  const candidates = [
    ...titleValues(isRecord(parent) ? parent.title : undefined),
    ...titleValues(document.title),
    stringValue(document.city),
    stringValue(document.country),
    typeHint,
  ]

  if (type === 'siteSettings' && candidates.every((item) => !item)) {
    candidates.push('international students university campus United Kingdom')
  }

  const presentCandidates = candidates.filter((item): item is string => Boolean(item))

  return [...new Set(presentCandidates.flatMap(words))].slice(0, 10).join(' ')
    || 'international education students'
}

export function isBrandArtworkPath(path: Path): boolean {
  const names = path.filter((segment): segment is string => typeof segment === 'string')
  const final = names.at(-1)
  return Boolean(
    names.includes('brand')
      || ['logo', 'logoOnLight', 'logoOnDark', 'logoMark', 'chatIcon', 'favicon'].includes(final ?? ''),
  )
}

const TYPE_HINTS: Record<string, string> = {
  institution: 'university campus',
  languageSchool: 'language school classroom',
  boardingSchool: 'boarding school campus',
  summerProgramme: 'summer school campus students',
  tour: 'educational group travel',
  destination: 'city landmark education',
  article: 'international education',
  guide: 'student study abroad',
  service: 'education adviser student',
  page: 'international education',
  siteSettings: 'study abroad university campus United Kingdom',
}

const ROUTE_HINTS: Record<string, string> = {
  universities: 'university campus',
  languageSchools: 'English language classroom',
  summerSchools: 'summer school campus students',
  boardingSchools: 'boarding school campus',
  tours: 'educational group travel',
  applications: 'university application study desk',
}

function plainMetadata(field: MetadataField | undefined): string {
  return stripHtml(field?.value ?? '')
}

function stripHtml(value: string): string {
  return value
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, ' ')
    .trim()
}

function conciseAlt(value: string): string {
  const sentence = value.split(/(?<=[.!?])\s/)[0]?.trim() || value.trim()
  return sentence.length <= 180 ? sentence : `${sentence.slice(0, 177).trimEnd()}...`
}

function cleanFilename(value: string | undefined): string {
  return (value ?? 'commons-image.jpg').replace(/^File:/i, '').trim()
}

function isSupportedBitmap(mime: string | undefined): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(mime ?? '')
}

function safeHttpsUrl(value: string): string | undefined {
  if (!value) return undefined
  try {
    const url = new URL(value)
    return url.protocol === 'https:' ? url.toString() : undefined
  } catch {
    return undefined
  }
}

function titleValues(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (!isRecord(value)) return []
  return [stringValue(value.en), stringValue(value.tr)].filter(Boolean)
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function words(value: string): string[] {
  return value.split(/\s+/).filter((item) => item.length > 1)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function valueAtPath(value: unknown, path: Path): unknown {
  return path.reduce<unknown>((current, segment) => {
    if (Array.isArray(segment)) return undefined
    if (typeof segment === 'number') {
      return Array.isArray(current) ? current[segment] : undefined
    }
    if (typeof segment === 'object') {
      return Array.isArray(current)
        ? current.find((item) => isRecord(item) && item._key === segment._key)
        : undefined
    }
    return isRecord(current) ? current[segment] : undefined
  }, value)
}
import type { Path } from 'sanity'
