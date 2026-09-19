/**
 * Materialise the safe English catalogue fallbacks as editable Sanity records.
 *
 * The script is deliberately non-destructive:
 * - dry-run is the default;
 * - apply uses createIfNotExists, so an editor's record is never overwritten;
 * - every generated page stays noindex and carries an editorial flag;
 * - Turkish source records and translation groups are never mutated.
 *
 * Usage:
 *   npm run sanity:seed-english
 *   npm run sanity:seed-english -- --apply
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import {
  buildEnglishInstitutionShadow,
  buildEnglishSummerShadow,
  englishCityLabel,
  englishDestinationForValue,
  type InstitutionShadowSource,
  type SummerShadowSource,
} from '../src/lib/content/shadow-content'
import { listStarterDestinations } from '../src/lib/content/starter-content'
import { getEditorialTour, listEditorialTours } from '../src/lib/content/starter-editorial'

type Reference = { _type: 'reference'; _ref: string }
type SourceDoc = {
  _id: string
  _type: string
  locale: 'tr'
  title: string
  slug: { current?: string } | string
  kind?: 'country' | 'city'
  section?: 'universities' | 'languageSchools' | 'boardingSchools' | 'summerSchools'
  parent?: Reference
  destination?: Reference
  translationGroup?: Reference
  city?: string
  country?: string
  format?: string
}

type GeneratedDoc = Record<string, unknown> & {
  _id: string
  _type: string
  locale: 'en'
  title: string
  slug: { _type: 'slug'; current: string }
  translationGroup: Reference
}

type SeedDoc = Record<string, unknown> & { _id: string; _type: string }

const API_VERSION = '2025-02-19'
const SOURCE_TYPES = ['destination', 'institution', 'languageSchool', 'boardingSchool', 'summerProgramme'] as const
const CONTENT_DIR = path.join(process.cwd(), 'content', 'migrated')
const APPLY = process.argv.includes('--apply')

function loadEnv(file: string) {
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/)
    if (!match) continue
    const key = match[1]
    const rawValue = match[2]
    if (!key || rawValue === undefined || process.env[key]) continue
    let value = rawValue.trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value.replace(/\\n/g, '\n')
  }
}

loadEnv(path.join(process.cwd(), '.env.preview.local'))
loadEnv(path.join(process.cwd(), '.env.local'))

const projectId = process.env.SANITY_API_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_API_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const writeToken = process.env.SANITY_API_WRITE_TOKEN

if (!projectId) throw new Error('Missing Sanity project id.')
if (APPLY && !writeToken) throw new Error('Missing SANITY_API_WRITE_TOKEN; refusing to write.')

function readSource(type: typeof SOURCE_TYPES[number]): SourceDoc[] {
  const file = path.join(CONTENT_DIR, `${type}.json`)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as SourceDoc[]
  return parsed.filter((doc) => doc.locale === 'tr')
}

function slugOf(doc: SourceDoc): string {
  return typeof doc.slug === 'string' ? doc.slug : (doc.slug.current ?? '')
}

function englishId(sourceId: string): string {
  return sourceId.includes('-tr-') ? sourceId.replace('-tr-', '-en-') : `en-${sourceId}`
}

function slugify(value: string): string {
  return value
    .toLocaleLowerCase('en-GB')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ref(id: string): Reference {
  return { _type: 'reference', _ref: id }
}

function richText(paragraphs: string[], prefix: string) {
  return paragraphs.map((text, index) => ({
    _type: 'block',
    _key: `${prefix}-${index}`,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${prefix}-text-${index}`, text, marks: [] }],
  }))
}

function groupFor(source: SourceDoc): Reference {
  if (!source.translationGroup?._ref) {
    throw new Error(`${source._id} has no translation group.`)
  }
  return ref(source.translationGroup._ref)
}

const sources = new Map<string, SourceDoc>()
for (const type of SOURCE_TYPES) {
  for (const doc of readSource(type)) sources.set(doc._id, doc)
}

function destinationIdentity(source: SourceDoc) {
  const mapped = englishDestinationForValue(slugOf(source)) ?? englishDestinationForValue(source.title)
  if (mapped) return mapped
  const title = englishCityLabel(source.title) ?? source.title
  return { title, slug: slugify(title) }
}

const starterDestinations = [
  ...listStarterDestinations('en', 'universities'),
  ...listStarterDestinations('en', 'languageSchools'),
]

function generateDestination(source: SourceDoc): GeneratedDoc {
  if (!source.kind || !source.section) throw new Error(`${source._id} is missing destination routing fields.`)
  const identity = destinationIdentity(source)
  const starter = starterDestinations.find(
    (doc) => doc.section === source.section && doc.slug === identity.slug,
  )
  const parent = source.parent?._ref ? sources.get(source.parent._ref) : undefined
  const location = identity.title
  const university = source.section === 'universities'
  const title = starter?.title ?? (university ? `Study in ${location}` : `Language schools in ${location}`)
  const intro = starter?.intro ?? (
    university
      ? `Explore university study in ${location} and compare courses, institutions, entry requirements and the practical application plan before building a shortlist.`
      : `Explore language-study options in ${location} and compare course formats, locations, accommodation and current booking conditions before choosing a school.`
  )

  return {
    _id: englishId(source._id),
    _type: 'destination',
    locale: 'en',
    title,
    slug: { _type: 'slug', current: identity.slug },
    kind: source.kind,
    section: source.section,
    ...(parent ? { parent: ref(englishId(parent._id)) } : {}),
    intro,
    whyStudyHere: starter?.whyStudyHere ?? richText([
      `The right option in ${location} depends on academic or language goals, preferred setting, budget and the support needed during the programme.`,
    ], `why-${identity.slug}`),
    applicationJourney: starter?.applicationJourney ?? richText([
      'Build a shortlist first, confirm current requirements with each provider, then organise documents and deadlines around the applications or bookings you decide to make.',
    ], `journey-${identity.slug}`),
    ...(starter?.keyCities ? { keyCities: starter.keyCities } : {}),
    translationGroup: groupFor(source),
    seo: { noIndex: true },
    review: {
      lastReviewed: '2026-09-19',
      timeSensitive: false,
      editorialFlag: 'English starter profile. Verify and expand this page before removing noindex.',
    },
  }
}

function institutionSource(source: SourceDoc): InstitutionShadowSource {
  const destination = source.destination?._ref ? sources.get(source.destination._ref) : undefined
  return {
    _id: source._id,
    _type: source._type,
    title: source.title,
    slug: slugOf(source),
    city: source.city,
    country: source.country,
    destination: destination
      ? {
          title: destination.title,
          slug: slugOf(destination),
          section: destination.section,
        }
      : undefined,
  }
}

function generateInstitution(source: SourceDoc): GeneratedDoc {
  const shadow = buildEnglishInstitutionShadow(institutionSource(source))
  const destination = source.destination?._ref ? sources.get(source.destination._ref) : undefined
  return {
    ...shadow,
    _id: englishId(source._id),
    _type: source._type,
    locale: 'en',
    slug: { _type: 'slug', current: shadow.slug },
    ...(destination ? { destination: ref(englishId(destination._id)) } : {}),
    translationGroup: groupFor(source),
    seo: { ...shadow.seo, noIndex: true },
    review: {
      ...shadow.review,
      lastReviewed: '2026-09-19',
      editorialFlag: 'English starter profile. Verify current provider details and expand this page before removing noindex.',
    },
  }
}

function generateSummer(source: SourceDoc): GeneratedDoc {
  const shadow = buildEnglishSummerShadow({
    _id: source._id,
    title: source.title,
    slug: slugOf(source),
    format: source.format,
  } satisfies SummerShadowSource)
  const destination = source.destination?._ref ? sources.get(source.destination._ref) : undefined
  return {
    ...shadow,
    _id: englishId(source._id),
    _type: 'summerProgramme',
    locale: 'en',
    slug: { _type: 'slug', current: shadow.slug },
    ...(destination ? { destination: ref(englishId(destination._id)) } : {}),
    translationGroup: groupFor(source),
    seo: { ...shadow.seo, noIndex: true },
    review: {
      ...shadow.review,
      lastReviewed: '2026-09-19',
      editorialFlag: 'English starter profile. Verify dates, ages, safeguarding, inclusions and price before removing noindex.',
    },
  }
}

const generated: SeedDoc[] = []
for (const source of sources.values()) {
  if (!slugOf(source)) continue
  if (source._type === 'destination') generated.push(generateDestination(source))
  else if (source._type === 'summerProgramme') generated.push(generateSummer(source))
  else generated.push(generateInstitution(source))
}

const englishTours = listEditorialTours('en')
const turkishTours = listEditorialTours('tr')
if (englishTours.length !== turkishTours.length) throw new Error('Editorial tour language lists are out of sync.')

for (const [index, englishCard] of englishTours.entries()) {
  const turkishCard = turkishTours[index]
  if (!turkishCard) throw new Error(`Missing Turkish tour for ${englishCard.slug}.`)
  const english = getEditorialTour('en', englishCard.slug)
  const turkish = getEditorialTour('tr', turkishCard.slug)
  if (!english || !turkish) throw new Error(`Missing editorial tour content for ${englishCard.slug}.`)
  const groupId = `tgroup-tour-editorial-${englishCard.slug}`
  generated.push({
    _id: groupId,
    _type: 'translationGroup',
    title: `Tour — ${english.title} / ${turkish.title}`,
  })
  for (const tour of [english, turkish]) {
    generated.push({
      ...tour,
      _id: `tour-${tour.locale}-editorial-${tour.slug}`,
      _type: 'tour',
      slug: { _type: 'slug', current: tour.slug },
      translationGroup: ref(groupId),
      seo: { ...tour.seo, noIndex: true },
      review: {
        ...tour.review,
        lastReviewed: '2026-09-19',
        editorialFlag: 'Confirm current dates, operator, accommodation, inclusions and price before removing noindex.',
      },
    })
  }
}

const duplicateIds = generated.filter((doc, index) => generated.findIndex((candidate) => candidate._id === doc._id) !== index)
if (duplicateIds.length) throw new Error(`Duplicate generated ids: ${duplicateIds.map((doc) => doc._id).join(', ')}`)

const endpoint = `https://${projectId}.api.sanity.io/v${API_VERSION}/data`

async function query<T>(groq: string): Promise<T> {
  const url = new URL(`${endpoint}/query/${dataset}`)
  url.searchParams.set('query', groq)
  const response = await fetch(url, { headers: writeToken ? { Authorization: `Bearer ${writeToken}` } : {} })
  if (!response.ok) throw new Error(`Sanity query failed (${response.status}).`)
  const payload = await response.json() as { result: T }
  return payload.result
}

async function applyBatch(batch: SeedDoc[]) {
  const response = await fetch(`${endpoint}/mutate/${dataset}?returnIds=true`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${writeToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mutations: batch.map((doc) => ({ createIfNotExists: doc })) }),
  })
  if (!response.ok) throw new Error(`Sanity mutation failed (${response.status}): ${await response.text()}`)
}

async function main() {
  const existingIds = new Set(await query<string[]>('*[]._id'))
  const missing = generated.filter((doc) => !existingIds.has(doc._id))
  const counts = Object.fromEntries(
    [...SOURCE_TYPES, 'tour', 'translationGroup'].map((type) => [type, generated.filter((doc) => doc._type === type).length]),
  )

  console.info(JSON.stringify({ mode: APPLY ? 'apply' : 'dry-run', generated: generated.length, missing: missing.length, existing: generated.length - missing.length, counts }, null, 2))

  if (!APPLY) {
    console.info('Dry run complete. Re-run with --apply to create missing records without overwriting existing records.')
    return
  }

  for (let index = 0; index < missing.length; index += 50) {
    await applyBatch(missing.slice(index, index + 50))
  }

  const created = await query<number>(`count(*[_id in ${JSON.stringify(missing.map((doc) => doc._id))}])`)
  if (created !== missing.length) throw new Error(`Expected ${missing.length} created records; Sanity reports ${created}.`)
  console.info(`Created ${created} missing editable CMS records. Existing records were left unchanged.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
