/**
 * Create the reviewed English article translations and their category records in
 * Sanity. The committed JSON files are the auditable source for this operation.
 *
 * Dry-run is the default. `--apply` uses createIfNotExists so it can never
 * overwrite an editor's later changes.
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

type SeedDoc = Record<string, unknown> & { _id: string; _type: string }

const APPLY = process.argv.includes('--apply')
const API_VERSION = '2025-02-19'
const CONTENT_DIR = path.join(process.cwd(), 'content', 'migrated')

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

function readDocs(file: string): SeedDoc[] {
  const parsed: unknown = JSON.parse(readFileSync(path.join(CONTENT_DIR, file), 'utf8'))
  if (!Array.isArray(parsed)) throw new Error(`${file} must contain an array.`)
  return parsed as SeedDoc[]
}

const articles = readDocs('article.en.json')
const categories = readDocs('category.en.json')
const groups = [...articles, ...categories]
  .map((doc) => (doc.translationGroup as { _ref?: string } | undefined)?._ref)
  .filter((id): id is string => Boolean(id))
  .map((id) => ({ _id: id, _type: 'translationGroup', title: id.replace(/^tgroup-/, '').replaceAll('-', ' ') }))
  .filter((doc, index, all) => all.findIndex((candidate) => candidate._id === doc._id) === index)

const docs: SeedDoc[] = [...groups, ...categories, ...articles]
const endpoint = `https://${projectId}.api.sanity.io/v${API_VERSION}/data`

async function query<T>(groq: string): Promise<T> {
  const url = new URL(`${endpoint}/query/${dataset}`)
  url.searchParams.set('query', groq)
  const response = await fetch(url, { headers: writeToken ? { Authorization: `Bearer ${writeToken}` } : {} })
  if (!response.ok) throw new Error(`Sanity query failed (${response.status}).`)
  const payload = await response.json() as { result: T }
  return payload.result
}

type Mutation =
  | { createIfNotExists: SeedDoc }
  | { patch: { id: string; setIfMissing: Record<string, unknown> } }

async function applyMutations(mutations: Mutation[]) {
  const response = await fetch(`${endpoint}/mutate/${dataset}?returnIds=true`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${writeToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations }),
  })
  if (!response.ok) throw new Error(`Sanity mutation failed (${response.status}): ${await response.text()}`)
}

async function main() {
  const existingIds = new Set(await query<string[]>('*[]._id'))
  const missing = docs.filter((doc) => !existingIds.has(doc._id))
  console.info(JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    articles: articles.length,
    categories: categories.length,
    translationGroups: groups.length,
    missing: missing.length,
  }, null, 2))

  if (!APPLY) return
  for (let index = 0; index < missing.length; index += 50) {
    await applyMutations(missing.slice(index, index + 50).map((doc) => ({ createIfNotExists: doc })))
  }
  const categoryPatches: Mutation[] = categories.map((category) => {
    const cluster = category._id.replace('category-en-', '')
    return {
      patch: {
        id: `category-tr-${cluster}`,
        setIfMissing: { translationGroup: { _type: 'reference', _ref: `tgroup-category-${cluster}` } },
      },
    }
  })
  await applyMutations(categoryPatches)
  const created = await query<number>(`count(*[_id in ${JSON.stringify(missing.map((doc) => doc._id))}])`)
  if (created !== missing.length) throw new Error(`Expected ${missing.length} created records; Sanity reports ${created}.`)
  const englishArticleCount = await query<number>('count(*[_type == "article" && locale == "en"])')
  const pairedCategoryCount = await query<number>(`count(*[_id in ${JSON.stringify(categoryPatches.map((mutation) => 'patch' in mutation ? mutation.patch.id : ''))} && defined(translationGroup._ref)])`)
  if (englishArticleCount < articles.length) throw new Error(`Expected at least ${articles.length} English articles; Sanity reports ${englishArticleCount}.`)
  if (pairedCategoryCount !== categories.length) throw new Error(`Expected ${categories.length} paired Turkish categories; Sanity reports ${pairedCategoryCount}.`)
  console.info(`Created ${created} missing records and verified ${englishArticleCount} English articles. Existing records were left unchanged.`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
