#!/usr/bin/env node
/**
 * Pass 3: load scripts/migrate/out/ into Sanity.
 *
 * IDEMPOTENT BY CONSTRUCTION
 *   Every `_id` is derived from the legacy WordPress id (`institution-tr-12196`),
 *   so `createOrReplace` on a second run overwrites the same document instead of
 *   creating a duplicate. Re-running a failed import is safe.
 *
 * TWO PASSES
 *   1. translationGroup and category documents, then every content document with
 *      all references stripped out. A reference to a document that does not exist
 *      yet is rejected by the API, and ordering 300 documents by dependency is
 *      fragile, so nothing is referenced on the first pass.
 *   2. Patch the references back in: translationGroup, destination, parent,
 *      category, and every `internalLink` annotation inside rich text.
 *
 * CREDENTIALS
 *   Write token is read from the environment variable SANITY_API_WRITE_TOKEN. It is
 *   never hard-coded, never logged, and never written to the output directory.
 *   Create one at https://sanity.io/manage -> API -> Tokens with Editor rights, then:
 *
 *     export SANITY_API_WRITE_TOKEN='sk...'
 *     node scripts/migrate/import.mjs --commit
 *
 *   Project and dataset come from NEXT_PUBLIC_SANITY_PROJECT_ID and
 *   NEXT_PUBLIC_SANITY_DATASET (the same values the app uses; .env.local is read if
 *   present). NEXT_PUBLIC_* values are public by design — the token is not, which is
 *   why it has no NEXT_PUBLIC_ prefix.
 *
 * SAFETY
 *   --dry-run is the default and does not open a network connection. The script
 *   refuses to write anything unless --commit is passed explicitly.
 *   It also refuses to write a payload that still contains a happyeducation.uk
 *   media URL, so no document can end up hotlinking the old host.
 *
 * Usage
 *   node scripts/migrate/import.mjs                       # dry run (default)
 *   node scripts/migrate/import.mjs --commit
 *   node scripts/migrate/import.mjs --commit --with-media # upload downloaded files first
 *   node scripts/migrate/import.mjs --commit --types article,page
 *   node scripts/migrate/import.mjs --dataset staging --commit
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, createReadStream } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..')
const OUT = path.join(HERE, 'out')
const DOCS_DIR = path.join(OUT, 'documents')
const MEDIA_MANIFEST = path.join(OUT, 'media', 'manifest.json')

const args = process.argv.slice(2)
const COMMIT = args.includes('--commit')
const WITH_MEDIA = args.includes('--with-media')
const TYPES = args.includes('--types') ? new Set(args[args.indexOf('--types') + 1].split(',')) : null
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity
const BATCH = 40

/** Documents must exist before anything references them. */
const ORDER = [
  'translationGroup', 'category', 'destination', 'institution', 'languageSchool',
  'boardingSchool', 'summerProgramme', 'tour', 'page', 'guide', 'service',
  'article', 'legalPage', 'redirect',
]

/** Fields that hold a reference and must be deferred to pass 2. */
const REFERENCE_FIELDS = ['translationGroup', 'destination', 'parent', 'category', 'author', 'reviewedBy']

const HOTLINK_RE = /happyeducation\.uk\/wp-content/i

/* --------------------------------------------------------------------------- env */

function loadEnvLocal() {
  const file = path.join(REPO, '.env.local')
  if (!existsSync(file)) return
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!match) continue
    const value = match[2].replace(/^['"]|['"]$/g, '')
    if (process.env[match[1]] === undefined) process.env[match[1]] = value
  }
}

function sanityConfig() {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = args.includes('--dataset')
    ? args[args.indexOf('--dataset') + 1]
    : process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-01'
  const token = process.env.SANITY_API_WRITE_TOKEN
  return { projectId, dataset, apiVersion, token }
}

/* ------------------------------------------------------------------- preparation */

function loadDocuments() {
  if (!existsSync(DOCS_DIR)) {
    console.error(`No documents in ${DOCS_DIR}. Run: node scripts/migrate/extract.mjs`)
    process.exit(1)
  }
  const byType = new Map()
  for (const file of readdirSync(DOCS_DIR).filter((f) => f.endsWith('.json'))) {
    const type = path.basename(file, '.json')
    byType.set(type, JSON.parse(readFileSync(path.join(DOCS_DIR, file), 'utf8')))
  }
  return byType
}

function loadMediaAssets() {
  if (!existsSync(MEDIA_MANIFEST)) return new Map()
  const manifest = JSON.parse(readFileSync(MEDIA_MANIFEST, 'utf8'))
  const byKey = new Map()
  for (const entry of manifest) {
    if (entry.targetAssetId) byKey.set(entry.assetKey, entry)
  }
  return byKey
}

function assetKeyOf(url) {
  const file = String(url ?? '').split(/[?#]/)[0].split('/').pop() ?? ''
  return file
    .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, '')
    .replace(/-[a-z0-9]{25,}(?=\.[a-z0-9]+$)/i, '')
    .replace(/-scaled(?=\.[a-z0-9]+$)/i, '')
    .toLowerCase()
}

/**
 * Turn the intermediate document into what actually gets written.
 * Returns the pass-1 payload and the pass-2 reference patch.
 */
function prepare(doc, mediaByKey, stats) {
  const clone = structuredClone(doc)
  delete clone._migration
  const refs = {}

  for (const field of REFERENCE_FIELDS) {
    if (clone[field]?._ref) {
      refs[field] = clone[field]
      delete clone[field]
    }
  }

  // Hero, lead and logo images.
  for (const [sourceField, targetField] of [
    ['_heroImageSource', doc._type === 'article' ? 'leadImage' : 'heroImage'],
    ['_logoSource', 'logo'],
  ]) {
    const source = clone[sourceField]
    delete clone[sourceField]
    if (!source) continue
    const asset = mediaByKey.get(assetKeyOf(source))
    if (!asset) {
      stats.imagesPendingUpload += 1
      continue
    }
    clone[targetField] = imageValue(asset)
    stats.imagesAttached += 1
  }

  // Rich text: resolve image placeholders, strip unresolved links.
  const richTextFields = []
  const visit = (value, ownerKey) => {
    if (Array.isArray(value)) {
      const before = value.length
      const mapped = []
      for (const item of value) {
        if (item && typeof item === 'object' && item._type === 'imagePlaceholder') {
          const asset = mediaByKey.get(assetKeyOf(item.src))
          if (asset) {
            mapped.push({ ...imageValue(asset), _key: item._key, ...(item.caption ? { caption: item.caption } : {}) })
            stats.imagesAttached += 1
          } else {
            stats.inlineImagesDropped += 1
          }
          continue
        }
        visit(item, ownerKey)
        mapped.push(item)
      }
      if (mapped.length !== before) {
        value.length = 0
        value.push(...mapped)
      }
      return
    }
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value.markDefs)) {
      const drop = new Set()
      value.markDefs = value.markDefs.filter((def) => {
        if (def._type === 'unresolvedLink' || def._type === 'internalLinkPlaceholder') {
          drop.add(def._key)
          stats.linksUnlinked += 1
          return false
        }
        if (def._type === 'internalLink') stats.internalLinks += 1
        if (def._type === 'externalLink') stats.externalLinks += 1
        return true
      })
      if (drop.size) {
        for (const child of value.children ?? []) {
          child.marks = (child.marks ?? []).filter((m) => !drop.has(m))
        }
      }
    }
    for (const [key, child] of Object.entries(value)) visit(child, key)
  }
  visit(clone, null)

  // Which rich-text fields carry an internalLink, so pass 2 knows what to re-set.
  for (const [field, value] of Object.entries(clone)) {
    if (Array.isArray(value) && JSON.stringify(value).includes('"internalLink"')) richTextFields.push(field)
  }

  delete clone._migration
  for (const key of Object.keys(clone)) {
    if (key.startsWith('_') && !['_id', '_type', '_key'].includes(key)) delete clone[key]
  }

  // Pass 1 must not carry the internalLink references either.
  const pass1 = structuredClone(clone)
  stripInternalLinks(pass1)

  const patch = { ...refs }
  for (const field of richTextFields) patch[field] = clone[field]

  return { pass1, patch: Object.keys(patch).length ? patch : null, final: clone }
}

function stripInternalLinks(value) {
  if (Array.isArray(value)) {
    value.forEach(stripInternalLinks)
    return
  }
  if (!value || typeof value !== 'object') return
  if (Array.isArray(value.markDefs)) {
    const drop = new Set()
    value.markDefs = value.markDefs.filter((def) => {
      if (def._type === 'internalLink') {
        drop.add(def._key)
        return false
      }
      return true
    })
    if (drop.size) {
      for (const child of value.children ?? []) child.marks = (child.marks ?? []).filter((m) => !drop.has(m))
    }
  }
  for (const child of Object.values(value)) stripInternalLinks(child)
}

function imageValue(asset) {
  return {
    _type: 'imageWithMeta',
    asset: { _type: 'reference', _ref: asset.targetAssetId },
    // Alt text is copied only where the legacy library actually had it (4 of 588
    // referenced assets). Nothing is invented.
    ...(asset.alt ? { alt: asset.alt } : {}),
    decorative: false,
    // Never true out of a migration. The front end refuses uncleared images and
    // that is the point: an image nobody can prove we own does not get published.
    licence: { cleared: false },
  }
}

/* ------------------------------------------------------------------- validation */

const REQUIRED = {
  destination: ['locale', 'title', 'slug', 'kind', 'section'],
  institution: ['locale', 'title', 'slug'],
  languageSchool: ['locale', 'title', 'slug'],
  boardingSchool: ['locale', 'title', 'slug'],
  summerProgramme: ['locale', 'title', 'slug', 'format'],
  tour: ['locale', 'title', 'slug'],
  article: ['locale', 'title', 'slug', 'publishedAt'],
  page: ['locale', 'title', 'slug'],
  legalPage: ['locale', 'title', 'slug', 'key'],
  category: ['locale', 'title', 'slug'],
  translationGroup: ['title'],
  redirect: ['from', 'to'],
}

function validate(doc) {
  const problems = []
  for (const field of REQUIRED[doc._type] ?? []) {
    const value = doc[field]
    const empty = value == null || (typeof value === 'object' && !Array.isArray(value) && field === 'slug' && !value.current)
    if (empty) problems.push(`missing required field: ${field}`)
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(doc._id)) problems.push(`invalid _id: ${doc._id}`)
  if (doc._id.startsWith('drafts.')) problems.push('_id must not start with "drafts."')
  if (HOTLINK_RE.test(JSON.stringify(doc))) {
    problems.push('payload still contains a happyeducation.uk/wp-content URL')
  }
  // The richText schema requires at least one header on every table block.
  const walkTables = (value) => {
    if (Array.isArray(value)) return value.forEach(walkTables)
    if (!value || typeof value !== 'object') return
    if (value._type === 'table' && (!Array.isArray(value.headers) || value.headers.length === 0)) {
      problems.push('table block with no headers')
    }
    Object.values(value).forEach(walkTables)
  }
  walkTables(doc)
  return problems
}

/* -------------------------------------------------------------------------- main */

async function main() {
  loadEnvLocal()
  const config = sanityConfig()
  const byType = loadDocuments()
  const mediaByKey = loadMediaAssets()

  const stats = {
    imagesAttached: 0,
    imagesPendingUpload: 0,
    inlineImagesDropped: 0,
    internalLinks: 0,
    externalLinks: 0,
    linksUnlinked: 0,
  }

  const plan = []
  const problems = []
  for (const type of [...ORDER, ...[...byType.keys()].filter((t) => !ORDER.includes(t))]) {
    const docs = byType.get(type)
    if (!docs) continue
    if (TYPES && !TYPES.has(type)) continue
    let n = 0
    for (const doc of docs) {
      if (n >= LIMIT) break
      n += 1
      const prepared = prepare(doc, mediaByKey, stats)
      const issues = validate(prepared.final)
      if (issues.length) problems.push({ id: doc._id, type, issues })
      plan.push({ type, id: doc._id, pass1: prepared.pass1, patch: prepared.patch })
    }
  }

  const counts = plan.reduce((acc, p) => ({ ...acc, [p.type]: (acc[p.type] ?? 0) + 1 }), {})
  const patches = plan.filter((p) => p.patch).length

  console.log(`import: ${COMMIT ? 'COMMIT' : 'DRY RUN (default; pass --commit to write)'}`)
  console.log(`import: project ${config.projectId ?? '(NEXT_PUBLIC_SANITY_PROJECT_ID not set)'} dataset ${config.dataset}`)
  console.log('import: documents to createOrReplace')
  for (const [type, n] of Object.entries(counts).sort()) console.log(`  ${type.padEnd(20)} ${n}`)
  console.log(`import: ${plan.length} documents, ${patches} reference patches in pass 2`)
  console.log(`import: images attached ${stats.imagesAttached}, hero/lead awaiting upload ${stats.imagesPendingUpload}, inline images dropped ${stats.inlineImagesDropped}`)
  console.log(`import: internalLink annotations ${stats.internalLinks}, externalLink ${stats.externalLinks}, unlinked (unresolved) ${stats.linksUnlinked}`)

  if (problems.length) {
    console.log(`import: ${problems.length} document(s) would fail Studio validation:`)
    const byIssue = new Map()
    for (const p of problems) {
      for (const issue of p.issues) {
        if (!byIssue.has(issue)) byIssue.set(issue, [])
        byIssue.get(issue).push(p.id)
      }
    }
    for (const [issue, ids] of [...byIssue.entries()].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`  ${String(ids.length).padStart(4)}  ${issue}  e.g. ${ids.slice(0, 3).join(', ')}`)
    }
  } else {
    console.log('import: no local validation problems')
  }

  writeFileSync(
    path.join(OUT, 'import-plan.json'),
    `${JSON.stringify({ committed: COMMIT, counts, patches, stats, problems }, null, 2)}\n`,
  )

  if (!COMMIT) {
    console.log('import: nothing written. Re-run with --commit once SANITY_API_WRITE_TOKEN is set.')
    return
  }

  /* ------------------------------------------------------------------ committing */

  if (!config.projectId) {
    console.error('import: NEXT_PUBLIC_SANITY_PROJECT_ID is not set. Refusing to run.')
    process.exit(1)
  }
  if (!config.token) {
    console.error('import: SANITY_API_WRITE_TOKEN is not set. Refusing to run.')
    process.exit(1)
  }
  if (problems.some((p) => p.issues.some((i) => i.includes('happyeducation.uk')))) {
    console.error('import: a payload still contains a legacy media URL. Refusing to run.')
    process.exit(1)
  }

  let createClient
  try {
    ;({ createClient } = await import('@sanity/client'))
  } catch {
    console.error('import: @sanity/client is not installed. Run `npm install` first.')
    process.exit(1)
  }

  const client = createClient({
    projectId: config.projectId,
    dataset: config.dataset,
    apiVersion: config.apiVersion,
    token: config.token,
    useCdn: false,
  })

  if (WITH_MEDIA) await uploadMedia(client)

  console.log('import: pass 1 — documents')
  await runBatches(client, plan, (tx, item) => tx.createOrReplace(item.pass1))

  console.log('import: pass 2 — references')
  const withPatch = plan.filter((p) => p.patch)
  await runBatches(client, withPatch, (tx, item) => tx.patch(item.id, { set: item.patch }))

  console.log(`import: done. ${plan.length} documents, ${withPatch.length} patched.`)
}

async function runBatches(client, items, apply) {
  for (let i = 0; i < items.length; i += BATCH) {
    const slice = items.slice(i, i + BATCH)
    const tx = client.transaction()
    for (const item of slice) apply(tx, item)
    await tx.commit({ visibility: 'async' })
    process.stdout.write(`\r  ${Math.min(i + BATCH, items.length)}/${items.length}`)
  }
  process.stdout.write('\n')
}

/**
 * Upload the files media.mjs downloaded and write the returned asset ids back into
 * the manifest, so a re-run skips anything already uploaded.
 */
async function uploadMedia(client) {
  if (!existsSync(MEDIA_MANIFEST)) {
    console.warn('import: no media manifest. Run `node scripts/migrate/media.mjs --download` first.')
    return
  }
  const manifest = JSON.parse(readFileSync(MEDIA_MANIFEST, 'utf8'))
  let uploaded = 0
  let skipped = 0
  for (const entry of manifest) {
    if (entry.targetAssetId) {
      skipped += 1
      continue
    }
    const local = entry.download?.localPath ? path.join(REPO, entry.download.localPath) : null
    if (!local || !existsSync(local)) continue
    const asset = await client.assets.upload('image', createReadStream(local), {
      filename: entry.originalFilename,
      // Sanity's own title/description; the editorial alt text lives on the field.
      title: entry.originalFilename,
    })
    entry.targetAssetId = asset._id
    uploaded += 1
    if (uploaded % 25 === 0) writeFileSync(MEDIA_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  }
  writeFileSync(MEDIA_MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
  console.log(`import: media uploaded ${uploaded}, already present ${skipped}`)
}

main().catch((error) => {
  console.error('import failed:', error?.message ?? error)
  process.exit(1)
})
