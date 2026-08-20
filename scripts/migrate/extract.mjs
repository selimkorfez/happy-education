#!/usr/bin/env node
/**
 * Pass 1 of the migration: WordPress export -> normalised intermediate JSON.
 *
 * Nothing here talks to Sanity. It reads the export and the audit artefacts, applies
 * the classification the audit already made, and writes one JSON file per target
 * content type into scripts/migrate/out/documents/.
 *
 * THE RULES THIS SCRIPT ENFORCES
 *
 * 1. The inventory bucket decides what happens:
 *      KEEP / REWRITE   migrate the document
 *      MERGE            fold the body into its named canonical and flag both
 *      DROP-301         excluded; the redirect already exists in redirects-draft.csv
 *      DROP-410         excluded; recorded in out/dropped.json
 *
 * 2. A structured field is populated ONLY when institutions-extracted.json actually
 *    holds the value. There is no inference, no default and no "sensible guess".
 *    `officialWebsite` is 0/313 in the source, so it is 0/313 here.
 *
 * 3. No factual claim is altered. Fees, prices, dates, rankings, visa statements and
 *    work-rights claims are carried across verbatim, `review.timeSensitive` is set,
 *    and `review.editorialFlag` names exactly what has to be re-checked. Encoding is
 *    repaired; wording never is.
 *
 * 4. Ranking strings are NOT written into `institution.rankings`. That field requires
 *    organisation, year, category, position and a source; the legacy site has one
 *    free-text sentence. Splitting it up would be inventing structured data, so the
 *    sentence stays in the body prose and the document is flagged.
 *
 * Usage
 *   node scripts/migrate/extract.mjs                 # writes scripts/migrate/out/
 *   node scripts/migrate/extract.mjs --out <dir>
 *   node scripts/migrate/extract.mjs --quiet
 */

import { readFileSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsvObjects, parseNdjson } from './lib/csv.mjs'
import { keyer, docId, translationGroupId } from './lib/keys.mjs'
import { decodeEntities, normaliseWhitespace, slugify } from './lib/text.mjs'
import { headingsOf, htmlToPortableText, normaliseLegacyPath } from './html-to-portable-text.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..')
const AUDIT = path.join(REPO, 'docs/audit')
const WP = path.join(AUDIT, 'archive/wp')

const args = process.argv.slice(2)
const QUIET = args.includes('--quiet')
const OUT = args.includes('--out') ? path.resolve(args[args.indexOf('--out') + 1]) : path.join(HERE, 'out')

const log = (...m) => {
  if (!QUIET) console.log(...m)
}

/* ------------------------------------------------------------------ classification */

const SECTION_SEGMENTS = new Set(['universiteler', 'dil-okullari', 'yaz-okullari', 'yatili-okullar'])
const SECTION_KEY_FOR_SEGMENT = {
  universiteler: 'universities',
  'dil-okullari': 'languageSchools',
  'yaz-okullari': 'summerSchools',
  'yatili-okullar': 'boardingSchools',
}
/** Segments under a section that are a format, not a place. */
const NON_PLACE_SEGMENTS = new Set(['grup', 'bireysel'])

const PAGE_KEYS = { iletisim: 'contact', hakkimizda: 'about' }

function segmentsOf(targetPath) {
  return String(targetPath ?? '').split('/').filter(Boolean).slice(1) // drop the locale
}

function localeOf(targetPath) {
  const first = String(targetPath ?? '').split('/').filter(Boolean)[0]
  return first === 'en' ? 'en' : 'tr'
}

/** Map an inventory row to a Sanity document type, or null if it is not migrated. */
function targetTypeOf(row) {
  switch (row.target_content_type) {
    case 'article': return 'article'
    case 'tour': return 'tour'
    case 'legalPage': return 'legalPage'
    case 'summerProgramme': return 'summerProgramme'
    case 'institution/university': return 'institution'
    case 'institution/languageSchool':
    case 'languageSchool': return 'languageSchool'
    case 'institution/boardingSchool': return 'boardingSchool'
    case 'page': {
      const segs = segmentsOf(row.target_path)
      if (segs.length >= 2 && SECTION_SEGMENTS.has(segs[0]) && !NON_PLACE_SEGMENTS.has(segs[1])) {
        return 'destination'
      }
      return 'page'
    }
    default: return null
  }
}

/* ------------------------------------------------- time-sensitive / blocked claims */

const MONEY_RE = /(£|€|\$|₺)\s?\d|\b\d[\d.,]*\s?(GBP|EUR|USD|TRY|TL)\b/i
const VISA_RE =
  /\b(vize|vizesi|visa|UKVI|Home Office|Tier\s?4|Student Visa|Graduate Visa|Short-Term Study|Standard Visitor|çalışma izni|oturum izni|work rights|OPT|PGWP|IRCC|USCIS|INIS|göçmenlik)\b/i
const RANKING_RE =
  /\b(sıralama|sıralamas|ranking|QS World|QS Dünya|Times Higher|U\.?S\.?\s?News|#\s?\d+|\d+\.\s?sıra)/i
const DATED_RE = /\b20(2[3-9]|3\d)\b/
const REQUIREMENT_RE = /\b(IELTS|TOEFL|GPA|PTE|Duolingo|kabul koşul|başvuru koşul|entry requirement)\b/i

/**
 * Claims that must never be published (src/lib/business-facts.ts BLOCKED_CLAIMS).
 *
 * Deliberately narrow. "Yaklaşık 11,300 öğrencisi bulunan üniversite" is the
 * UNIVERSITY's enrolment and is fine; "500+ öğrenci" on the About page is Happy
 * Education's own unverifiable counter and is not. Matching on the `+` counter form
 * and on first-person possessives keeps the flag meaningful instead of firing on
 * every institution page.
 */
const BLOCKED_PATTERNS = [
  [/\b\d{2,}\s?\+\s*(öğrenci|student|ülke|countr|üniversite|universit|okul|school)/i, 'legacy counter claim (students / countries / institutions)'],
  [/\b(öğrencimiz|öğrencimize|öğrencilerimiz|yerleştirdiğimiz)\b[^.]{0,60}\b\d{3,}/i, 'student/applicant count attributed to Happy Education'],
  [/%\s?\d+\s*(başarı|vize onay)|vize (onay|başvuru)\s*oran[ıi]|visa (approval|success) rate/i, 'success or visa-approval rate'],
  [/\b\d+\s*(yıl|yıllık|year|years)\s*(deneyim|tecrübe|experience)|\b\d+\s*yıllık\s*(bilgi|birikim)/i, 'years-of-experience figure'],
  [/\b(OISC|IAA)\b[^.]{0,30}(kayıt|registered|regulated)|göçmenlik danışman/i, 'immigration-advice registration claim'],
  [/Trustpilot|yıldız puan|review score/i, 'review score'],
]

/**
 * Claims about a THIRD PARTY, not about Happy Education. An institution's
 * acceptance rate or a language school's British Council accreditation is not a
 * blocked claim, but it is still an assertion the site would be publishing, so it
 * needs a source and clear attribution to the school. Separating the two keeps the
 * blocked-claim flag meaningful.
 */
const THIRD_PARTY_PATTERNS = [
  [/kabul oran[ıi]|acceptance rate/i, 'institution acceptance rate'],
  [/başarı oran[ıi]|success rate/i, 'institution success rate'],
  [/British Council|English UK|\bICEF\b|Eaquals|FELTOM|\bACELS\b|Languages Canada|\bALTO\b|BAC accredit/i, 'school accreditation body named'],
]

/**
 * Build the `review` object. Never rewrites content; only describes what a person
 * must check before this document is published.
 */
function buildReview({ bucket, reason, plain, extracted, language, structural }) {
  const flags = []
  let timeSensitive = false

  if (bucket === 'REWRITE') flags.push(`REWRITE (audit): ${reason}`)

  const money = plain.match(MONEY_RE)
  if (money || extracted?.fees || (extracted?.moneyMentions ?? []).length) {
    timeSensitive = true
    const values = [extracted?.fees, ...(extracted?.moneyMentions ?? [])].filter(Boolean)
    flags.push(
      `PRICE/FEE re-check: carried across verbatim from the legacy site${values.length ? ` (${[...new Set(values)].slice(0, 4).join(', ')})` : ''}. Confirm with the provider, add a source and an "as of" date, or remove.`,
    )
  }
  if (VISA_RE.test(plain)) {
    timeSensitive = true
    flags.push(
      'IMMIGRATION content: Happy Education holds no IAA (ex-OISC) registration, so this must read as administrative/application support only, state that the decision rests with the relevant government authority, link to the official source, and promise no outcome. Re-verify every route name and condition against the issuing authority.',
    )
  }
  if (RANKING_RE.test(plain) || extracted?.ranking) {
    timeSensitive = true
    flags.push(
      `RANKING claim in body text${extracted?.ranking ? `: "${extracted.ranking}"` : ''}. Rankings are annual. Re-verify against the ranking organisation, or delete. Not written into the structured rankings field because the legacy page has no organisation/year/category/source breakdown.`,
    )
  }
  if (extracted?.dates) {
    timeSensitive = true
    flags.push(`DATES re-check: "${extracted.dates}" carried across verbatim. Confirm for the current season.`)
  }
  if (REQUIREMENT_RE.test(plain)) {
    timeSensitive = true
    flags.push('ENTRY REQUIREMENTS mentioned (IELTS/TOEFL/GPA). Re-verify against the institution and cite it.')
  }
  if (DATED_RE.test(plain) && !timeSensitive) {
    timeSensitive = true
    flags.push('Contains a year reference; confirm it is still current.')
  }

  for (const [pattern, label] of BLOCKED_PATTERNS) {
    if (pattern.test(plain)) {
      flags.push(`BLOCKED CLAIM present in body copy (${label}). See src/lib/business-facts.ts BLOCKED_CLAIMS. Must be removed or evidenced in writing before publication.`)
    }
  }
  for (const [pattern, label] of THIRD_PARTY_PATTERNS) {
    const match = plain.match(pattern)
    if (match) {
      timeSensitive = true
      flags.push(`THIRD-PARTY CLAIM in body copy (${label}: "${match[0]}"). This is an assertion about the institution, not about Happy Education. Verify it against the institution or the accrediting body, attribute it explicitly, and cite the source. Language schools have a dedicated accreditations field with a verified flag; use it rather than leaving the claim in prose.`)
    }
  }

  if (language === 'EN' || language === 'MIXED') {
    flags.push(
      'Body copy is English but this document sits in the Turkish tree. The audit found the legacy English pages are provider marketing material of uncertain provenance (report-5 §4). Rewrite in Turkish and check copyright before publishing.',
    )
  }
  if (structural?.words != null && structural.words < 20) {
    flags.push(`Near-empty body (${structural.words} words). Needs authoring, not migration.`)
  }
  if (structural?.headings === 0 && (structural?.words ?? 0) >= 60) {
    flags.push('No headings in the body. Add a real heading outline.')
  }
  if (structural?.boldPseudoHeadings) {
    flags.push(`${structural.boldPseudoHeadings} bold pseudo-heading(s) carried across as paragraphs. Promote them to real headings in the Studio.`)
  }
  if (structural?.imagesWithoutAlt) {
    flags.push(`${structural.imagesWithoutAlt} image(s) with no alt text. Alt text must be written before publication.`)
  }
  if (structural?.misspellings?.length) {
    flags.push(`Known misspelling(s) in body copy: ${structural.misspellings.join(', ')}.`)
  }
  if (structural?.turkishApostropheSuspects?.length) {
    flags.push(`Possible missing apostrophe before a Turkish case suffix: ${structural.turkishApostropheSuspects.slice(0, 5).join('; ')}.`)
  }
  if (structural?.emDashes) {
    flags.push(`${structural.emDashes} em dash(es) in body copy; house style does not use them.`)
  }
  if (structural?.unresolvedEntities?.length) {
    flags.push(`Could not decode HTML entities: ${structural.unresolvedEntities.join(' ')}. Check the source text.`)
  }
  if (structural?.mojibakeUnrepairable) {
    flags.push(`${structural.mojibakeUnrepairable} text run(s) look double-encoded and could not be repaired automatically.`)
  }

  const review = {}
  if (timeSensitive) review.timeSensitive = true
  if (flags.length) review.editorialFlag = flags.join('\n')
  return review
}

/* ------------------------------------------------------------------------ helpers */

function sourcedFact(key, label, value, note) {
  return { _type: 'sourcedFact', _key: key, label, value, ...(note ? { note } : {}) }
}

function paragraph(key, text) {
  return {
    _type: 'block',
    _key: key,
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: `${key}s`, text, marks: [] }],
  }
}

const TURKISH_COURSE_TYPES = {
  'genel ingilizce': 'General English',
  'yogun ingilizce': 'Intensive English',
  'ielts hazirlik': 'IELTS preparation',
  'is ingilizcesi': 'Business English',
  'akademik ingilizce': 'Academic English',
  'cambridge hazirlik': 'Cambridge exam preparation',
  'birebir': 'One-to-one',
  'bire bir': 'One-to-one',
}

const CURRICULUM_TOKENS = [
  [/\bGCSE\b/i, 'GCSE'],
  [/\bA[- ]?Level\b/i, 'A Level'],
  [/\bIB\b|International Baccalaureate/i, 'IB'],
  [/\bBTEC\b/i, 'BTEC'],
  [/Foundation/i, 'Foundation'],
]

/** Normalise either an absolute URL or a bare path to a comparable path. */
function pathOf(value) {
  const raw = String(value ?? '').trim()
  if (!raw) return '/'
  if (/^https?:\/\//i.test(raw)) {
    try {
      return normaliseLegacyPath(new URL(raw).pathname)
    } catch {
      return normaliseLegacyPath(raw.replace(/^https?:\/\/[^/]+/i, ''))
    }
  }
  return normaliseLegacyPath(raw)
}

/** Split a legacy pipe- or comma-separated field and drop the CTA item. */
function splitList(value, separator) {
  return String(value ?? '')
    .split(separator)
    .map((s) => normaliseWhitespace(s).trim())
    .filter(Boolean)
    .filter((s) => !/^(bilgi ve kay[ıi]t|apply now|daha fazla)/i.test(s))
}

/* --------------------------------------------------------------------------- main */

function main() {
  const inventory = parseCsvObjects(readFileSync(path.join(AUDIT, 'content-inventory.csv'), 'utf8'))
  const redirectRows = parseCsvObjects(readFileSync(path.join(AUDIT, 'redirects-draft.csv'), 'utf8'))
  const institutions = JSON.parse(readFileSync(path.join(AUDIT, 'institutions-extracted.json'), 'utf8'))
  const blogPosts = JSON.parse(readFileSync(path.join(AUDIT, 'blog-posts.json'), 'utf8'))
  const pages = parseNdjson(readFileSync(path.join(WP, 'pages.ndjson'), 'utf8'))
  const posts = parseNdjson(readFileSync(path.join(WP, 'posts.ndjson'), 'utf8'))

  const wpById = new Map()
  for (const doc of [...pages, ...posts]) wpById.set(String(doc.id), doc)

  const extractedByPath = new Map()
  for (const rec of institutions) extractedByPath.set(normaliseLegacyPath(rec.path), rec)

  const blogByWpId = new Map()
  for (const post of blogPosts) blogByWpId.set(String(post.wpId), post)

  const rowByPath = new Map()
  for (const row of inventory) rowByPath.set(normaliseLegacyPath(row.old_path), row)

  /* ---- categories, derived from the audit's blog clusters ---- */
  const CLUSTER_TITLES = {
    'pre-departure': 'Yola çıkmadan önce',
    'destination-comparison': 'Ülke karşılaştırmaları',
    'language-study-value': 'Dil eğitimi',
    'consultancy-and-process': 'Danışmanlık süreci',
    'parents-and-safeguarding': 'Veliler için',
    'visa-and-immigration': 'Vize ve başvuru süreçleri',
    'summer-schools': 'Yaz okulları',
    'university-admissions': 'Üniversite başvuruları',
  }
  const usedClusters = [...new Set(blogPosts.map((p) => p.cluster))].filter(Boolean).sort()
  const categories = usedClusters.map((cluster) => ({
    _id: `category-tr-${slugify(cluster)}`,
    _type: 'category',
    locale: 'tr',
    title: CLUSTER_TITLES[cluster] ?? cluster,
    slug: { _type: 'slug', current: slugify(CLUSTER_TITLES[cluster] ?? cluster) },
    _migration: { source: 'docs/audit/blog-posts.json cluster', cluster },
  }))
  const categoryIdByCluster = new Map(usedClusters.map((c) => [c, `category-tr-${slugify(c)}`]))

  /* ---- build documents ---- */
  const documents = []
  const byLegacyPath = new Map()
  const byTargetPath = new Map()
  const dropped = []
  const merges = []
  const perDocNotes = new Map()
  const mediaRefs = new Map()

  const noteMedia = (url, usage, legacyPath) => {
    if (!url) return
    const key = String(url)
    if (!mediaRefs.has(key)) mediaRefs.set(key, { url: key, usages: [] })
    mediaRefs.get(key).usages.push({ usage, legacyPath })
  }

  for (const row of inventory) {
    const legacyPath = normaliseLegacyPath(row.old_path)

    if (row.bucket === 'DROP-410' || row.bucket === 'DROP-301') {
      dropped.push({
        legacyPath,
        wpId: row.wp_id || null,
        bucket: row.bucket,
        redirectTo: row.target_path || null,
        reason: row.reason,
      })
      continue
    }
    if (row.type === 'sitemap-only') {
      dropped.push({ legacyPath, wpId: null, bucket: row.bucket, redirectTo: row.target_path || null, reason: `${row.reason} (absent from the WordPress export)` })
      continue
    }
    if (row.bucket === 'MERGE') {
      merges.push({
        legacyPath,
        wpId: row.wp_id,
        canonical: normaliseLegacyPath(row.merge_canonical),
        reason: row.reason,
      })
      continue
    }

    const wp = wpById.get(String(row.wp_id))
    if (!wp) {
      dropped.push({ legacyPath, wpId: row.wp_id, bucket: 'MISSING-SOURCE', redirectTo: null, reason: 'Row in the inventory has no matching document in the WordPress export' })
      continue
    }

    const type = targetTypeOf(row)
    if (!type) {
      dropped.push({ legacyPath, wpId: row.wp_id, bucket: 'UNMAPPED', redirectTo: null, reason: `No target content type in the inventory (bucket ${row.bucket})` })
      continue
    }

    const built = buildDocument({ row, wp, type, legacyPath, extractedByPath, blogByWpId, categoryIdByCluster, noteMedia })
    documents.push(built.doc)
    perDocNotes.set(built.doc._id, built.notes)
    byLegacyPath.set(legacyPath, built.doc)
    byTargetPath.set(normaliseLegacyPath(built.doc._migration.targetPath), built.doc)
  }

  /* ---- fold MERGE documents into their canonical ---- */
  const mergeResults = []
  for (const merge of merges) {
    const canonical = byLegacyPath.get(merge.canonical)
    const wp = wpById.get(String(merge.wpId))
    if (!canonical || !wp) {
      mergeResults.push({ ...merge, folded: false, note: canonical ? 'source document missing from the export' : 'canonical document was not migrated' })
      continue
    }
    const converted = htmlToPortableText(wp.content?.rendered ?? '', { scope: `wp-merge-${merge.wpId}` })
    const bodyField = BODY_FIELD[canonical._type]
    const words = converted.words
    if (words > 0 && bodyField) {
      canonical[bodyField] = [...(canonical[bodyField] ?? []), ...converted.blocks]
      canonical.review = canonical.review ?? {}
      canonical.review.editorialFlag = [
        canonical.review.editorialFlag,
        `MERGED: the body of ${merge.legacyPath} (${words} words) was appended below. De-duplicate the two versions by hand; nothing was deleted automatically. Audit reason: ${merge.reason}`,
      ].filter(Boolean).join('\n')
      canonical._migration.mergedFrom = [...(canonical._migration.mergedFrom ?? []), merge.legacyPath]
      for (const image of converted.notes.images) noteMedia(image.src, 'body', merge.legacyPath)
    }
    byLegacyPath.set(merge.legacyPath, canonical)
    mergeResults.push({ ...merge, folded: words > 0, wordsFolded: words, canonicalId: canonical._id })
  }

  /* ---- destination references ---- */
  const destinationByKey = new Map()
  for (const doc of documents) {
    if (doc._type !== 'destination') continue
    const segs = segmentsOf(doc._migration.targetPath)
    destinationByKey.set(`${segs[0]}/${segs.slice(1).join('/')}`, doc._id)
  }
  const unresolvedDestinations = []
  for (const doc of documents) {
    const want = doc._migration.destinationKey
    if (!want) continue
    const ref = destinationByKey.get(want)
    if (ref) doc.destination = { _type: 'reference', _ref: ref }
    else unresolvedDestinations.push({ document: doc._id, legacyPath: doc._migration.legacyPath, wanted: want })
  }
  // City destinations point at their parent country destination.
  for (const doc of documents) {
    if (doc._type !== 'destination' || doc.kind !== 'city') continue
    const segs = segmentsOf(doc._migration.targetPath)
    const parent = destinationByKey.get(`${segs[0]}/${segs[1]}`)
    if (parent) doc.parent = { _type: 'reference', _ref: parent }
    else unresolvedDestinations.push({ document: doc._id, legacyPath: doc._migration.legacyPath, wanted: `${segs[0]}/${segs[1]}` })
  }

  /* ---- pass 2: resolve internal links ---- */
  const redirectByOldPath = new Map()
  for (const row of redirectRows) {
    if (!row.old_url || !row.new_url) continue
    redirectByOldPath.set(pathOf(row.old_url), pathOf(row.new_url))
  }

  // Last resort: the legacy site links to /stafford-house/ when the page actually
  // lives at /dil-okullari/stafford-house/. Matching on the final slug recovers
  // those, but only when exactly one document owns that slug — the audit found 7
  // exact slug collisions, and guessing between them would send readers to the
  // wrong institution.
  const bySlug = new Map()
  for (const doc of documents) {
    const slug = doc.slug.current
    if (!bySlug.has(slug)) bySlug.set(slug, [])
    bySlug.get(slug).push(doc)
  }
  const uniqueBySlug = new Map([...bySlug.entries()].filter(([, v]) => v.length === 1).map(([k, v]) => [k, v[0]]))

  const linkReport = { resolved: 0, resolvedBySlug: [], unresolved: [], byPath: new Map() }
  for (const doc of documents) {
    resolveLinks(doc, { byLegacyPath, byTargetPath, redirectByOldPath, uniqueBySlug, linkReport })
  }

  const unresolvedLinks = [...linkReport.byPath.entries()]
    .map(([legacyPath, info]) => ({ legacyPath, count: info.count, documents: [...info.documents].sort() }))
    .sort((a, b) => b.count - a.count)

  /* ---- translation groups ---- */
  const translationGroups = documents.map((doc) => ({
    _id: doc.translationGroup._ref,
    _type: 'translationGroup',
    title: `${doc._type} — ${doc.title}`,
  }))

  /* ---- redirects ---- */
  const redirects = []
  for (const row of redirectRows) {
    const status = Number(row.status || 301)
    if (!row.new_url) continue // 410s are not redirects
    const from = pathOf(row.old_url).replace(/\/$/, '') || '/'
    const to = pathOf(row.new_url).replace(/\/$/, '') || '/'
    redirects.push({
      _id: `redirect-${slugify(from) || 'root'}`,
      _type: 'redirect',
      from,
      to,
      permanent: status === 301,
      reason: row.reason.slice(0, 200),
    })
  }
  const seenRedirect = new Set()
  const uniqueRedirects = redirects.filter((r) => {
    if (seenRedirect.has(r._id)) return false
    seenRedirect.add(r._id)
    return true
  })

  /* ---- write ---- */
  rmSync(path.join(OUT, 'documents'), { recursive: true, force: true })
  mkdirSync(path.join(OUT, 'documents'), { recursive: true })

  const grouped = new Map()
  for (const doc of documents) {
    if (!grouped.has(doc._type)) grouped.set(doc._type, [])
    grouped.get(doc._type).push(doc)
  }
  const counts = {}
  for (const [type, docs] of [...grouped.entries()].sort()) {
    docs.sort((a, b) => a._id.localeCompare(b._id))
    writeFileSync(path.join(OUT, 'documents', `${type}.json`), `${JSON.stringify(docs, null, 2)}\n`)
    counts[type] = docs.length
  }
  writeFileSync(path.join(OUT, 'documents', 'category.json'), `${JSON.stringify(categories, null, 2)}\n`)
  counts.category = categories.length
  writeFileSync(path.join(OUT, 'documents', 'translationGroup.json'), `${JSON.stringify(translationGroups, null, 2)}\n`)
  counts.translationGroup = translationGroups.length
  writeFileSync(path.join(OUT, 'documents', 'redirect.json'), `${JSON.stringify(uniqueRedirects, null, 2)}\n`)
  counts.redirect = uniqueRedirects.length

  writeFileSync(path.join(OUT, 'dropped.json'), `${JSON.stringify(dropped, null, 2)}\n`)
  writeFileSync(path.join(OUT, 'merges.json'), `${JSON.stringify(mergeResults, null, 2)}\n`)
  writeFileSync(
    path.join(OUT, 'links.json'),
    `${JSON.stringify(
      {
        resolved: linkReport.resolved,
        resolvedBySlugFallback: linkReport.resolvedBySlug.length,
        unresolvedTotal: unresolvedLinks.reduce((n, u) => n + u.count, 0),
        slugFallbacks: linkReport.resolvedBySlug,
        unresolved: unresolvedLinks,
      },
      null,
      2,
    )}\n`,
  )
  writeFileSync(path.join(OUT, 'media-references.json'), `${JSON.stringify([...mediaRefs.values()], null, 2)}\n`)
  writeFileSync(
    path.join(OUT, 'notes.json'),
    `${JSON.stringify([...perDocNotes.entries()].map(([id, notes]) => ({ id, ...notes })), null, 2)}\n`,
  )

  const summary = {
    generatedFrom: {
      inventoryRows: inventory.length,
      wordpressPages: pages.length,
      wordpressPosts: posts.length,
      institutionRecords: institutions.length,
    },
    documentsByType: counts,
    documentsTotal: documents.length,
    merged: mergeResults.filter((m) => m.folded).length,
    mergesNotFolded: mergeResults.filter((m) => !m.folded).length,
    dropped: dropped.length,
    droppedByBucket: dropped.reduce((acc, d) => ({ ...acc, [d.bucket]: (acc[d.bucket] ?? 0) + 1 }), {}),
    internalLinksResolved: linkReport.resolved,
    internalLinksUnresolved: unresolvedLinks.reduce((n, u) => n + u.count, 0),
    unresolvedLinkTargets: unresolvedLinks.length,
    unresolvedDestinationRefs: unresolvedDestinations.length,
    documentsWithEditorialFlag: documents.filter((d) => d.review?.editorialFlag).length,
    documentsTimeSensitive: documents.filter((d) => d.review?.timeSensitive).length,
    distinctMediaReferenced: mediaRefs.size,
    localeSplit: documents.reduce((acc, d) => ({ ...acc, [d.locale]: (acc[d.locale] ?? 0) + 1 }), {}),
  }
  writeFileSync(path.join(OUT, 'summary.json'), `${JSON.stringify({ ...summary, unresolvedDestinations }, null, 2)}\n`)

  log('extract: documents by type')
  for (const [type, n] of Object.entries(counts).sort()) log(`  ${type.padEnd(20)} ${n}`)
  log(`extract: ${documents.length} documents, ${summary.dropped} dropped, ${summary.merged} merged`)
  log(`extract: internal links ${linkReport.resolved} resolved / ${summary.internalLinksUnresolved} unresolved (${unresolvedLinks.length} distinct targets)`)
  log(`extract: ${summary.documentsWithEditorialFlag} documents carry an editorial flag, ${summary.documentsTimeSensitive} are time-sensitive`)
  log(`extract: wrote ${OUT}`)
}

/** Which richText field carries the legacy body, per type. */
const BODY_FIELD = {
  institution: 'overview',
  languageSchool: 'overview',
  boardingSchool: 'overview',
  summerProgramme: 'overview',
  destination: 'whyStudyHere',
  page: 'body',
  article: 'body',
  service: 'body',
  guide: 'body',
  tour: 'overview',
  legalPage: 'body',
}

function buildDocument({ row, wp, type, legacyPath, extractedByPath, blogByWpId, categoryIdByCluster, noteMedia }) {
  const legacyId = String(wp.id)
  const key = keyer(`wp-${legacyId}:fields`)
  const converted = htmlToPortableText(wp.content?.rendered ?? '', { scope: `wp-${legacyId}` })
  const extracted = extractedByPath.get(legacyPath) ?? null
  const locale = localeOf(row.target_path)
  const segs = segmentsOf(row.target_path)
  const slug = segs.length ? segs[segs.length - 1] : 'anasayfa'
  const title = normaliseWhitespace(decodeEntities(wp.title?.rendered ?? '').text).trim() || slug

  const headings = headingsOf(converted.blocks)
  const imagesWithoutAlt = converted.notes.images.filter((i) => !i.alt).length

  const doc = {
    _id: docId(type, locale, legacyId),
    _type: type,
    locale,
    title,
    slug: { _type: 'slug', current: slug },
    translationGroup: { _type: 'reference', _ref: translationGroupId(type, legacyId) },
  }

  const bodyField = BODY_FIELD[type]
  let body = converted.blocks

  /* ---------------------------------------------------- per-type structured fields */

  if (type === 'destination') {
    doc.kind = segs.length >= 3 ? 'city' : 'country'
    doc.section = SECTION_KEY_FOR_SEGMENT[segs[0]] ?? 'universities'
  }

  if (type === 'page') {
    const pageKey = PAGE_KEYS[slug]
    if (pageKey) doc.pageKey = pageKey
  }

  if (type === 'legalPage') {
    doc.key = 'privacy'
    doc.solicitorApproved = false
  }

  if (type === 'summerProgramme') {
    /*
     * Format is required (it decides the URL: /yaz-okullari/{format}/{slug}).
     *
     * The legacy site's own taxonomy is the evidence: group programmes were filed
     * under /yaz-okullari/grup-yaz-okullari/, individual ones under
     * /yaz-okullari/bireysel-yaz-okullari/. The ~30 root-level pages sat outside
     * both, so the site never marketed them as group departures.
     *
     * Those default to 'individual' and are flagged as INFERRED rather than left
     * without a format. Leaving the field empty would fail Studio validation and
     * make the document unpublishable, which is a worse outcome than a clearly
     * flagged default an editor can correct in one click.
     */
    if (legacyPath.includes('bireysel-yaz-okullari')) doc.format = 'individual'
    else if (legacyPath.includes('grup-yaz-okullari')) doc.format = 'group'
    else {
      doc.format = 'individual'
      doc._formatInferred = true
    }
    if (extracted?.city) doc.city = extracted.city
    if (extracted?.ageRange) doc.ageRange = String(extracted.ageRange)
    if (extracted?.lessonsPerWeek != null) doc.lessonsPerWeek = String(extracted.lessonsPerWeek)
    if (extracted?.dates) doc.dates = [paragraph(key('dates'), String(extracted.dates))]
    if (extracted?.fees) {
      doc.price = [sourcedFact(key('price'), 'Legacy site price', String(extracted.fees), 'Carried across from the legacy site. Not confirmed for the current season.')]
    }
  }

  if (type === 'institution' || type === 'languageSchool' || type === 'boardingSchool') {
    if (extracted?.city) doc.city = extracted.city
    if (extracted?.country) doc.country = extracted.country
    // officialWebsite stays empty: 0 of 313 legacy pages carry one (report-5 §3).
    if (extracted?.fees) {
      doc.fees = [sourcedFact(key('fee'), 'Legacy site fee', String(extracted.fees), 'Carried across from the legacy site. Needs confirmation and an "as of" date.')]
    }
    const destSeg = segs.length >= 3 ? `${segs[0]}/${segs[1]}` : null
    if (destSeg) doc._destinationKey = destSeg
  }

  if (type === 'institution') {
    if (extracted?.founded) doc.founded = String(extracted.founded)
    if (extracted?.departments) {
      const areas = splitList(extracted.departments, ',')
      if (areas.length) doc.subjectAreas = areas
    }
  }

  if (type === 'languageSchool') {
    if (extracted?.lessonsPerWeek != null) doc.lessonsPerWeek = String(extracted.lessonsPerWeek)
    if (extracted?.programmes) {
      const raw = splitList(extracted.programmes, '|')
      const mapped = []
      const unmapped = []
      for (const item of raw) {
        const normalised = slugify(item).replace(/-/g, ' ')
        const hit = TURKISH_COURSE_TYPES[normalised]
        if (hit) mapped.push(hit)
        else unmapped.push(item)
      }
      if (mapped.length) doc.courseTypes = [...new Set(mapped)]
      if (unmapped.length) converted.notes.unmappedCourseTypes = unmapped
    }
  }

  if (type === 'boardingSchool') {
    if (extracted?.ageRange) doc.ageRange = String(extracted.ageRange)
    const source = `${extracted?.programmes ?? ''} ${converted.plain}`
    const curriculum = CURRICULUM_TOKENS.filter(([re]) => re.test(source)).map(([, label]) => label)
    if (curriculum.length) doc.curriculum = curriculum
  }

  if (type === 'article') {
    const meta = blogByWpId.get(legacyId)
    doc.publishedAt = wp.date_gmt ? `${wp.date_gmt}Z` : new Date(wp.date).toISOString()
    if (wp.modified_gmt && wp.modified_gmt !== wp.date_gmt) doc.updatedAt = `${wp.modified_gmt}Z`
    const excerpt = normaliseWhitespace(
      decodeEntities(String(wp.excerpt?.rendered ?? '').replace(/<[^>]+>/g, ' ')).text,
    ).trim().replace(/\s*\[?…\]?\s*$/, '').slice(0, 300)
    if (excerpt) doc.excerpt = excerpt
    doc.readingMinutes = Math.max(1, Math.ceil(converted.words / 200))
    doc.showTableOfContents = headings.filter((h) => h.style === 'h2').length >= 4
    if (meta?.cluster && categoryIdByCluster.has(meta.cluster)) {
      doc.category = { _type: 'reference', _ref: categoryIdByCluster.get(meta.cluster) }
      doc.tags = [meta.cluster]
    }
    // Author is deliberately empty. The legacy byline is the WordPress `root`
    // account, and inventing an expert byline is exactly what the schema forbids.
    const faq = extractFaqs(body, key)
    if (faq.faqs.length >= 2) {
      doc.faqs = faq.faqs
      body = faq.body
    }
  }

  /* ------------------------------------------------------------------- body + media */

  if (bodyField) doc[bodyField] = body

  const heroField = type === 'article' ? 'leadImage' : 'heroImage'
  if (extracted?.heroImage) {
    doc[`_${heroField}Source`] = extracted.heroImage
    noteMedia(extracted.heroImage, heroField, legacyPath)
  }
  if (extracted?.logoImage && (type === 'institution' || type === 'languageSchool' || type === 'boardingSchool')) {
    doc._logoSource = extracted.logoImage
    noteMedia(extracted.logoImage, 'logo', legacyPath)
  }
  for (const image of converted.notes.images) noteMedia(image.src, 'body', legacyPath)

  /* --------------------------------------------------------------------- editorial */

  const meta = type === 'article' ? blogByWpId.get(legacyId) : null
  const review = buildReview({
    bucket: row.bucket,
    reason: row.reason,
    plain: converted.plain,
    extracted,
    language: row.language,
    structural: {
      words: converted.words,
      headings: headings.length,
      boldPseudoHeadings: converted.notes.boldPseudoHeadings,
      imagesWithoutAlt,
      misspellings: converted.notes.misspellings,
      turkishApostropheSuspects: converted.notes.turkishApostropheSuspects,
      emDashes: converted.notes.emDashes,
      unresolvedEntities: converted.notes.unresolvedEntities,
      mojibakeUnrepairable: converted.notes.mojibakeUnrepairable,
    },
  })

  const extraFlags = []
  if (meta?.timeSensitiveClaimsToReverify?.length) {
    extraFlags.push(`AUDIT re-verification list for this post:\n- ${meta.timeSensitiveClaimsToReverify.join('\n- ')}`)
  }
  if (type === 'article') {
    extraFlags.push('Byline required: the legacy author is the WordPress "root" account, so no author reference was created. Assign a real member of staff or leave the byline off.')
    if (!extracted?.heroImage) extraFlags.push('No lead image: all 18 legacy posts have featured_media 0.')
  }
  if (converted.notes.unmappedCourseTypes?.length) {
    extraFlags.push(`Course types not in the schema list, left unmapped: ${converted.notes.unmappedCourseTypes.join(', ')}.`)
  }
  if (extracted?.accommodation) {
    extraFlags.push(`Legacy accommodation strip found ("${String(extracted.accommodation).slice(0, 120)}"). Not written to the accommodation field because on most pages it is a link menu rather than content; the text remains in the body.`)
  }
  if (extracted?.programmes && type !== 'languageSchool') {
    extraFlags.push(`Legacy programme strip found ("${String(extracted.programmes).slice(0, 120)}"). Left in the body rather than duplicated into a structured field.`)
  }
  if (type === 'summerProgramme' && doc._formatInferred) {
    extraFlags.push(
      'FORMAT INFERRED, PLEASE CONFIRM: this page sat at the root of the legacy site rather than under /yaz-okullari/grup-yaz-okullari/, so it has been imported as an INDIVIDUAL programme. If it is actually a group departure, change the format field, which also changes the page URL.',
    )
    delete doc._formatInferred
  }
  if (type === 'legalPage') {
    extraFlags.push('This privacy policy is migrated as-is and is NOT approved. The audit found it pastes a Companies House URL where the website URL belongs, and it has no cookie, UK GDPR/DPA 2018, retention or data-subject-rights sections. Do not publish before a solicitor or privacy professional signs it off.')
  }
  if (converted.notes.tables) {
    extraFlags.push(`${converted.notes.tables} table(s) converted; cell contents are plain strings, so ${converted.notes.tableLinksFlattened} link(s) and any cell formatting inside them were flattened.`)
  }
  if (converted.notes.droppedLinks.length) {
    extraFlags.push(`${converted.notes.droppedLinks.length} link(s) dropped during conversion: ${converted.notes.droppedLinks.slice(0, 3).map((l) => `${l.href.slice(0, 40)} (${l.reason})`).join('; ')}.`)
  }

  if (extraFlags.length) {
    review.editorialFlag = [review.editorialFlag, ...extraFlags].filter(Boolean).join('\n')
  }
  if (Object.keys(review).length) doc.review = review

  doc._migration = {
    legacyId: Number(legacyId),
    legacyPath,
    legacyUrl: wp.link,
    targetPath: row.target_path,
    bucket: row.bucket,
    inventoryReason: row.reason,
    sourceLanguage: row.language,
    sourceWords: Number(row.words || 0),
    convertedWords: converted.words,
    headings,
    destinationKey: doc._destinationKey ?? null,
    heroImageSource: extracted?.heroImage ?? null,
    logoImageSource: extracted?.logoImage ?? null,
    proposedEnPath: meta?.proposedEnSlug ?? null,
    hasFieldProvenance: extracted?.fieldProvenance ?? null,
  }
  delete doc._destinationKey

  return {
    doc,
    notes: {
      legacyPath,
      type,
      sourceWords: Number(row.words || 0),
      convertedWords: converted.words,
      headings: headings.length,
      images: converted.notes.images.length,
      imagesWithoutAlt,
      tables: converted.notes.tables,
      internalLinks: converted.notes.internalLinks.length,
      externalLinks: converted.notes.externalLinks.length,
      droppedLinks: converted.notes.droppedLinks,
      droppedChrome: converted.notes.droppedChrome,
      headingsDemoted: converted.notes.headingsDemoted,
      boldPseudoHeadings: converted.notes.boldPseudoHeadings,
      unresolvedEntities: converted.notes.unresolvedEntities,
      shortcodes: converted.notes.shortcodes,
      misspellings: converted.notes.misspellings,
      emDashes: converted.notes.emDashes,
      turkishApostropheSuspects: converted.notes.turkishApostropheSuspects,
    },
  }
}

/**
 * Pull a trailing "Sıkça Sorulan Sorular" section into `faqs`.
 * Conservative by construction: the question must be a wholly-bold paragraph ending
 * in a question mark, and the section is only lifted when at least two pairs are
 * found, so a false positive cannot silently swallow body copy.
 */
function extractFaqs(blocks, key) {
  const headingIndex = blocks.findIndex(
    (b) =>
      b._type === 'block' &&
      ['h2', 'h3'].includes(b.style) &&
      /s[ıi]k[çc]a sorulan|(\(|\b)sss(\)|\b)|\bfaq\b/i.test((b.children ?? []).map((c) => c.text).join('')),
  )
  if (headingIndex === -1) return { faqs: [], body: blocks }

  const tail = blocks.slice(headingIndex + 1)
  const faqs = []
  let current = null
  for (const block of tail) {
    if (block._type !== 'block' || block.listItem) {
      if (current) current.answer.push(block)
      continue
    }
    const text = (block.children ?? []).map((c) => c.text).join('').trim()
    const allBold = (block.children ?? []).length > 0 && block.children.every((c) => (c.marks ?? []).includes('strong'))
    if (allBold && /\?$/.test(text)) {
      if (current) faqs.push(current)
      current = { question: text.replace(/^\d+[.)]\s*/, ''), answer: [] }
      continue
    }
    if (current) current.answer.push(block)
    else return { faqs: [], body: blocks } // content before the first question: bail out
  }
  if (current) faqs.push(current)

  const usable = faqs.filter((f) => f.answer.length > 0)
  if (usable.length < 2) return { faqs: [], body: blocks }

  return {
    faqs: usable.map((f) => ({
      _type: 'faqItem',
      _key: key('faq'),
      question: f.question,
      answer: f.answer,
    })),
    body: blocks.slice(0, headingIndex),
  }
}

/** Walk every richText field and turn internalLinkPlaceholder into a reference. */
function resolveLinks(doc, { byLegacyPath, byTargetPath, redirectByOldPath, uniqueBySlug, linkReport }) {
  const visit = (value) => {
    if (Array.isArray(value)) {
      value.forEach(visit)
      return
    }
    if (!value || typeof value !== 'object') return
    if (Array.isArray(value.markDefs)) {
      value.markDefs = value.markDefs.map((def) => {
        if (def._type !== 'internalLinkPlaceholder') return def
        let target = resolveTarget(def.legacyPath, { byLegacyPath, byTargetPath, redirectByOldPath })
        if (!target) {
          const slug = def.legacyPath.split('/').filter(Boolean).pop()
          const hit = slug ? uniqueBySlug.get(slug) : null
          if (hit) {
            target = hit
            linkReport.resolvedBySlug.push({ from: doc._migration.legacyPath, legacyPath: def.legacyPath, to: hit._id })
          }
        }
        if (target && target._id !== doc._id) {
          linkReport.resolved += 1
          return { _type: 'internalLink', _key: def._key, reference: { _type: 'reference', _ref: target._id } }
        }
        if (target && target._id === doc._id) {
          // A self-link is a no-op; keep the text, drop the annotation.
          return { _type: 'unresolvedLink', _key: def._key, legacyPath: def.legacyPath, reason: 'self-reference' }
        }
        const entry = linkReport.byPath.get(def.legacyPath) ?? { count: 0, documents: new Set() }
        entry.count += 1
        entry.documents.add(doc._migration.legacyPath)
        linkReport.byPath.set(def.legacyPath, entry)
        return { _type: 'unresolvedLink', _key: def._key, legacyPath: def.legacyPath, reason: 'no migrated document at this path' }
      })
    }
    for (const child of Object.values(value)) visit(child)
  }
  visit(doc)
}

/**
 * The English-segment aliases WordPress currently 301s. They are linked from the
 * site's own hub pages and die the moment WordPress is switched off (report-5 §7,
 * decision 15). `/universities/university-of-greenwich/` resolves to the UNIVERSITY,
 * not to the same-named summer programme at the root — which is exactly why the
 * prefix matters and a bare title match would be wrong.
 */
const ALIAS_PREFIXES = [
  ['/summer-schools/group-summer-schools/', '/yaz-okullari/grup-yaz-okullari/'],
  ['/summer-schools/individual-summer-schools/', '/yaz-okullari/bireysel-yaz-okullari/'],
  ['/summer-schools/', '/yaz-okullari/'],
  ['/universities/', '/universiteler/'],
  ['/boarding-schools/', '/yatili-okullar2/'],
  ['/language-schools/', '/dil-okullari/'],
]

function resolveTarget(legacyPath, ctx) {
  const { byLegacyPath, byTargetPath, redirectByOldPath, depth = 0 } = ctx
  if (depth > 4) return null
  const direct = byLegacyPath.get(legacyPath)
  if (direct) return direct
  const viaTarget = byTargetPath.get(legacyPath)
  if (viaTarget) return viaTarget
  const redirected = redirectByOldPath.get(legacyPath)
  if (redirected && redirected !== legacyPath) {
    const hit = resolveTarget(redirected, { ...ctx, depth: depth + 1 })
    if (hit) return hit
  }
  for (const [from, to] of ALIAS_PREFIXES) {
    if (legacyPath.startsWith(from)) {
      const rewritten = `${to}${legacyPath.slice(from.length)}`
      if (rewritten === legacyPath) continue
      const hit = resolveTarget(rewritten, { ...ctx, depth: depth + 1 })
      if (hit) return hit
    }
  }
  return null
}

main()
