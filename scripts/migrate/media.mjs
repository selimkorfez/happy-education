#!/usr/bin/env node
/**
 * Media pass: work out which of the 964 legacy assets are actually referenced,
 * fetch them once, resize them, and emit an upload manifest for import.mjs.
 *
 * NON-NEGOTIABLES
 *
 *   licence.cleared = false on EVERY migrated image, without exception.
 *     The legacy library is stock photography and scraped institution logos of
 *     unknown provenance (report-4). `imageWithMeta` refuses to render an uncleared
 *     image, so the site fails closed: a picture nobody can prove we own simply does
 *     not appear. Clearing an image is a human decision made in the Studio.
 *
 *   Never hotlink happyeducation.uk.
 *     `sourceUrl` in the manifest exists so a person can audit where a file came
 *     from. It is never written into a document; import.mjs refuses to write any
 *     payload still containing a happyeducation.uk/wp-content URL.
 *
 *   Alt text is recorded, never invented.
 *     12 of 964 assets have alt text. The other 952 are marked needsAltText so they
 *     surface in the QA report and in the pre-launch check.
 *
 * Usage
 *   node scripts/migrate/media.mjs                  # manifest only, no network
 *   node scripts/migrate/media.mjs --download       # fetch the referenced files
 *   node scripts/migrate/media.mjs --download --limit 20
 *   node scripts/migrate/media.mjs --download --max-width 1600
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseNdjson } from './lib/csv.mjs'
import { decodeEntities, normaliseWhitespace } from './lib/text.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..')
const AUDIT = path.join(REPO, 'docs/audit')
const WP = path.join(AUDIT, 'archive/wp')
const OUT = path.join(HERE, 'out')
const FILES = path.join(OUT, 'media', 'files')

const args = process.argv.slice(2)
const DOWNLOAD = args.includes('--download')
const LIMIT = args.includes('--limit') ? Number(args[args.indexOf('--limit') + 1]) : Infinity
const MAX_WIDTH = args.includes('--max-width') ? Number(args[args.indexOf('--max-width') + 1]) : 2000
/** Above this, re-encoding is worth the effort even if the pixel width is fine. */
const MAX_BYTES = 500 * 1024

const UPLOADS_RE = /https?:\/\/(?:www\.)?happyeducation\.uk\/wp-content\/uploads\/[^\s"'<>)\\]+/gi

/**
 * `foo-768x576.jpg`, `foo-scaled.jpg`, `foo-<40 char hash>.jpg` and `foo.jpg` are
 * all the same upload as far as "is this asset used anywhere" is concerned.
 */
function assetKey(url) {
  const clean = decodeEntities(String(url ?? '')).text.replace(/\\\//g, '/').split(/[?#]/)[0]
  const file = clean.split('/').pop() ?? ''
  return file
    .replace(/-\d{2,4}x\d{2,4}(?=\.[a-z0-9]+$)/i, '')
    .replace(/-[a-z0-9]{25,}(?=\.[a-z0-9]+$)/i, '')
    .replace(/-scaled(?=\.[a-z0-9]+$)/i, '')
    .toLowerCase()
}

function guessMime(filename) {
  const ext = path.extname(filename).toLowerCase()
  const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.pdf': 'application/pdf' }
  return map[ext] ?? 'application/octet-stream'
}

function sniffExtension(mime, filename) {
  const fromName = path.extname(filename || '').toLowerCase()
  if (fromName) return fromName
  const map = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg', 'application/pdf': '.pdf' }
  return map[mime] ?? ''
}

function main() {
  const media = parseNdjson(readFileSync(path.join(WP, 'media.ndjson'), 'utf8'))
  const pages = parseNdjson(readFileSync(path.join(WP, 'pages.ndjson'), 'utf8'))
  const posts = parseNdjson(readFileSync(path.join(WP, 'posts.ndjson'), 'utf8'))
  const institutions = JSON.parse(readFileSync(path.join(AUDIT, 'institutions-extracted.json'), 'utf8'))

  /* ---- every uploads URL that appears anywhere in the legacy content ---- */
  const referencedKeys = new Map() // assetKey -> Set of legacy paths
  const referenceUrlsByKey = new Map() // assetKey -> Set of the URLs seen
  const noteRef = (url, where) => {
    const key = assetKey(url)
    if (!key) return
    if (!referencedKeys.has(key)) referencedKeys.set(key, new Set())
    referencedKeys.get(key).add(where)
    if (!referenceUrlsByKey.has(key)) referenceUrlsByKey.set(key, new Set())
    referenceUrlsByKey.get(key).add(decodeEntities(String(url)).text.replace(/\\\//g, '/').split(/[?#]/)[0])
  }

  for (const doc of [...pages, ...posts]) {
    // Elementor stores image URLs inside JSON in `data-settings`, entity-encoded
    // and with escaped slashes, so the raw HTML has to be unpicked first.
    const html = decodeEntities(String(doc.content?.rendered ?? '')).text.replace(/\\\//g, '/')
    for (const url of html.match(UPLOADS_RE) ?? []) noteRef(url, doc.link ?? String(doc.id))
    if (doc.featured_media) {
      const asset = media.find((m) => m.id === doc.featured_media)
      if (asset?.source_url) noteRef(asset.source_url, doc.link ?? String(doc.id))
    }
  }
  for (const rec of institutions) {
    if (rec.heroImage) noteRef(rec.heroImage, rec.path)
    if (rec.logoImage) noteRef(rec.logoImage, rec.path)
  }

  /* ---- what the MIGRATED documents still point at, if extract.mjs has run ---- */
  const migratedRefsPath = path.join(OUT, 'media-references.json')
  const migratedKeys = new Map()
  if (existsSync(migratedRefsPath)) {
    for (const ref of JSON.parse(readFileSync(migratedRefsPath, 'utf8'))) {
      const key = assetKey(ref.url)
      if (!migratedKeys.has(key)) migratedKeys.set(key, [])
      migratedKeys.get(key).push(...ref.usages)
    }
  }

  /* ---- split the library ---- */
  const manifest = []
  const orphans = []

  for (const asset of media) {
    const key = assetKey(asset.source_url)
    const referencedBy = referencedKeys.get(key)
    const alt = normaliseWhitespace(decodeEntities(asset.alt_text ?? '').text).trim()
    const details = asset.media_details ?? {}
    const originalFilename = (details.file ?? asset.source_url ?? '').split('/').pop() ?? ''

    const entry = {
      legacyId: asset.id,
      assetKey: key,
      originalFilename,
      // Provenance only. Never written into a Sanity document.
      sourceUrl: asset.source_url,
      mimeType: asset.mime_type,
      width: details.width ?? null,
      height: details.height ?? null,
      uploadedAt: asset.date ?? null,
      alt: alt || null,
      needsAltText: !alt,
      referencedByLegacyPages: referencedBy ? [...referencedBy].sort() : [],
      usedByMigratedDocuments: migratedKeys.get(key) ?? [],
      licence: { holder: null, terms: null, cleared: false },
      licenceNote:
        'Provenance unknown. Migrated from the legacy WordPress library, which mixes stock photography with institution logos. Do not tick "cleared" until Happy Education can evidence the right to publish this image.',
      download: null,
    }

    if (!referencedBy) {
      orphans.push({ legacyId: asset.id, originalFilename, sourceUrl: asset.source_url, mimeType: asset.mime_type })
      continue
    }
    manifest.push(entry)
  }

  manifest.sort((a, b) => a.legacyId - b.legacyId)

  /**
   * Files linked from page content that have NO record in the media library export.
   * The three tour PDFs the audit told us to preserve before killing /thanks/ are in
   * exactly this state, so they would be invisible to a manifest built from
   * media.ndjson alone.
   */
  const libraryKeys = new Set(media.map((m) => assetKey(m.source_url)))
  const unlisted = []
  for (const [key, pagesUsing] of referencedKeys) {
    if (libraryKeys.has(key)) continue
    const sampleUrl = [...(referenceUrlsByKey.get(key) ?? [])][0] ?? null
    unlisted.push({
      legacyId: null,
      assetKey: key,
      originalFilename: key,
      sourceUrl: sampleUrl,
      mimeType: guessMime(key),
      alt: null,
      needsAltText: true,
      referencedByLegacyPages: [...pagesUsing].sort(),
      usedByMigratedDocuments: migratedKeys.get(key) ?? [],
      licence: { holder: null, terms: null, cleared: false },
      licenceNote: 'Referenced by the legacy site but absent from the media-library export. Provenance unknown.',
      note: 'Not present in media.ndjson. Must be fetched directly and re-hosted before the old host is switched off.',
      download: null,
    })
  }
  unlisted.sort((a, b) => a.assetKey.localeCompare(b.assetKey))

  /* ---- fetch + resize ---- */
  const stats = { attempted: 0, downloaded: 0, cached: 0, failed: 0, resized: 0, resizeUnavailable: 0 }
  if (DOWNLOAD) {
    mkdirSync(FILES, { recursive: true })
    const resizer = detectResizer()
    if (!resizer) console.warn('media: no image processor found (sips or magick). Files will be uploaded at their original size and flagged.')
    let n = 0
    for (const entry of [...manifest, ...unlisted]) {
      if (n >= LIMIT) break
      if (!entry.sourceUrl) continue
      n += 1
      stats.attempted += 1
      const ext = sniffExtension(entry.mimeType, entry.originalFilename)
      const local = path.join(FILES, `${entry.legacyId ?? `unlisted-${entry.assetKey.replace(/[^a-z0-9.-]/gi, '_')}`}${entry.legacyId ? ext : ''}`)
      const result = fetchAsset(entry, local, stats)
      if (!result) continue
      entry.download = result
      // A cached file has already been through the resizer. Re-encoding it on every
      // run would quietly degrade it, so only freshly downloaded bytes are resized.
      if (resizer && result.bytes != null && !result.cached) {
        const resized = resizeInPlace(resizer, local, entry, stats)
        entry.download = { ...entry.download, ...resized }
      } else if (!resizer) {
        entry.download.needsManualResize = (entry.width ?? 0) > MAX_WIDTH || (result.bytes ?? 0) > MAX_BYTES
        if (entry.download.needsManualResize) stats.resizeUnavailable += 1
      }
    }
  }

  mkdirSync(path.join(OUT, 'media'), { recursive: true })
  writeFileSync(path.join(OUT, 'media', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  writeFileSync(path.join(OUT, 'media', 'orphans.json'), `${JSON.stringify(orphans, null, 2)}\n`)
  writeFileSync(path.join(OUT, 'media', 'unlisted.json'), `${JSON.stringify(unlisted, null, 2)}\n`)

  const summary = {
    libraryTotal: media.length,
    referenced: manifest.length,
    orphanedSkipped: orphans.length,
    referencedButNotInLibrary: unlisted.length,
    documentsOnlyAssets: unlisted.filter((u) => u.mimeType === 'application/pdf').map((u) => u.originalFilename),
    withAltText: manifest.filter((m) => m.alt).length,
    needingAltText: manifest.filter((m) => m.needsAltText).length,
    usedByMigratedDocuments: manifest.filter((m) => m.usedByMigratedDocuments.length).length,
    overOneMegabyteAtSource: manifest.filter((m) => (m.width ?? 0) >= 2000).length,
    licenceCleared: manifest.filter((m) => m.licence.cleared).length,
    byMimeType: manifest.reduce((acc, m) => ({ ...acc, [m.mimeType]: (acc[m.mimeType] ?? 0) + 1 }), {}),
    download: DOWNLOAD ? stats : 'not run (pass --download)',
  }
  writeFileSync(path.join(OUT, 'media', 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)

  console.log(`media: library ${summary.libraryTotal}, referenced ${summary.referenced}, orphaned and skipped ${summary.orphanedSkipped}`)
  console.log(`media: alt text present on ${summary.withAltText}, missing on ${summary.needingAltText}`)
  console.log(`media: licence.cleared=true on ${summary.licenceCleared} assets (must stay 0 out of migration)`)
  if (DOWNLOAD) console.log(`media: download ${JSON.stringify(stats)}`)
  else console.log('media: manifest only. Re-run with --download to fetch the files.')
}

/* ------------------------------------------------------------------------ fetching */

function fetchAsset(entry, local, stats) {
  if (existsSync(local)) {
    const buf = readFileSync(local)
    stats.cached += 1
    return { localPath: path.relative(REPO, local), bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex'), cached: true }
  }
  try {
    // Node 22 has global fetch; the migration runs once, so serial is fine and is
    // gentler on the origin than a burst of parallel requests.
    const response = execFetch(entry.sourceUrl)
    if (!response) {
      stats.failed += 1
      return { error: 'download failed' }
    }
    writeFileSync(local, response)
    stats.downloaded += 1
    return { localPath: path.relative(REPO, local), bytes: response.length, sha256: createHash('sha256').update(response).digest('hex'), cached: false }
  } catch (error) {
    stats.failed += 1
    return { error: String(error?.message ?? error) }
  }
}

/** Synchronous fetch via curl keeps this script a single sequential pass. */
function execFetch(url) {
  try {
    return execFileSync(
      'curl',
      ['-sSL', '--fail', '--max-time', '60', '-A', 'HappyEducation-migration/1.0', url],
      { maxBuffer: 64 * 1024 * 1024 },
    )
  } catch {
    return null
  }
}

/* ------------------------------------------------------------------------ resizing */

function detectResizer() {
  if (process.platform === 'darwin') {
    try {
      execFileSync('sips', ['--version'], { stdio: 'ignore' })
      return 'sips'
    } catch {
      /* fall through */
    }
  }
  try {
    execFileSync('magick', ['-version'], { stdio: 'ignore' })
    return 'magick'
  } catch {
    return null
  }
}

function resizeInPlace(resizer, file, entry, stats) {
  const before = statSync(file).size
  const tooWide = (entry.width ?? 0) > MAX_WIDTH
  if (!tooWide && before <= MAX_BYTES) return { resized: false, bytes: before }
  if (entry.mimeType === 'image/gif' || entry.mimeType === 'image/svg+xml') {
    return { resized: false, bytes: before, note: 'animated/vector asset left untouched' }
  }
  try {
    if (resizer === 'sips') execFileSync('sips', ['--resampleWidth', String(MAX_WIDTH), file, '--out', file], { stdio: 'ignore' })
    else execFileSync('magick', [file, '-resize', `${MAX_WIDTH}x>`, '-quality', '82', file], { stdio: 'ignore' })
    const after = statSync(file).size
    stats.resized += 1
    return { resized: true, bytes: after, bytesBefore: before, maxWidth: MAX_WIDTH, sha256: createHash('sha256').update(readFileSync(file)).digest('hex') }
  } catch (error) {
    stats.resizeUnavailable += 1
    return { resized: false, bytes: before, needsManualResize: true, resizeError: String(error?.message ?? error) }
  }
}

main()
