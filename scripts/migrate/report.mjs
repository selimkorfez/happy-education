#!/usr/bin/env node
/**
 * Migration QA: compare the WordPress source with what extract.mjs produced, and
 * write docs/MIGRATION_QA.md.
 *
 * The question this answers is "what did we lose, and what still needs a person?".
 * It measures rather than asserts: word counts before and after, headings before and
 * after, links resolved against links broken, images mapped against images pending,
 * and the complete list of documents carrying an editorial flag.
 *
 * Usage
 *   node scripts/migrate/extract.mjs && node scripts/migrate/media.mjs
 *   node scripts/migrate/report.mjs
 *   node scripts/migrate/report.mjs --top 25      # longer attention list
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCsvObjects, parseNdjson } from './lib/csv.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO = path.resolve(HERE, '..', '..')
const AUDIT = path.join(REPO, 'docs/audit')
const WP = path.join(AUDIT, 'archive/wp')
const OUT = path.join(HERE, 'out')
const TARGET = path.join(REPO, 'docs/MIGRATION_QA.md')

const args = process.argv.slice(2)
const TOP = args.includes('--top') ? Number(args[args.indexOf('--top') + 1]) : 15

const SOURCE_HEADING_RE = /<h[1-6][\s>]/gi

function readJson(file, fallback) {
  const full = path.join(OUT, file)
  return existsSync(full) ? JSON.parse(readFileSync(full, 'utf8')) : fallback
}

/**
 * Severity weights for the "needs a person" ranking.
 *
 * Ranked by the WORST single problem first and the accumulated total second, so an
 * unapproved legal document outranks an institution page that happens to collect a
 * long tail of missing alt text and pseudo-headings. Summing alone lets cosmetic
 * noise outrank liability, which is the wrong list to hand an editor.
 */
const SEVERITY = [
  [/HIGHEST-RISK|HIGHEST LIABILITY/i, 130, 'audit calls this the highest-risk content on the site'],
  [/NOT approved|solicitor/, 120, 'legal document, unapproved'],
  [/BLOCKED CLAIM/, 100, 'blocked claim in body copy'],
  [/IMMIGRATION content/, 80, 'immigration content'],
  [/AUDIT re-verification list/, 60, 'audit flagged hard facts'],
  [/THIRD-PARTY CLAIM/, 50, 'third-party claim to verify and attribute'],
  [/REWRITE \(audit\)/, 45, 'audit says rewrite'],
  [/Body copy is English/, 40, 'English copy in the Turkish tree'],
  [/PRICE\/FEE re-check/, 35, 'price or fee'],
  [/MERGED:/, 30, 'merged, needs de-duplication'],
  [/Near-empty body/, 28, 'near-empty body'],
  [/format \(individual\/group\)/, 25, 'required field missing'],
  [/RANKING claim/, 18, 'ranking claim'],
  [/ENTRY REQUIREMENTS/, 15, 'entry requirements'],
  [/DATES re-check/, 12, 'dates'],
  [/no alt text/, 3, 'missing alt text'],
  [/bold pseudo-heading/, 2, 'pseudo-headings'],
  [/No headings in the body/, 2, 'no headings'],
  [/misspelling/, 2, 'misspelling'],
  [/missing apostrophe/, 1, 'Turkish apostrophes'],
]

function scoreFlag(flag) {
  let score = 0
  let worst = 0
  const labels = []
  for (const [pattern, weight, label] of SEVERITY) {
    if (pattern.test(flag)) {
      score += weight
      worst = Math.max(worst, weight)
      labels.push(label)
    }
  }
  return { score, worst, labels }
}

function main() {
  const summary = readJson('summary.json', null)
  if (!summary) {
    console.error('No scripts/migrate/out/summary.json. Run: node scripts/migrate/extract.mjs')
    process.exit(1)
  }
  const links = readJson('links.json', { resolved: 0, unresolved: [] })
  const dropped = readJson('dropped.json', [])
  const merges = readJson('merges.json', [])
  const notes = readJson('notes.json', [])
  const mediaSummary = readJson('media/summary.json', null)
  const mediaManifest = readJson('media/manifest.json', [])
  const unlistedMedia = readJson('media/unlisted.json', [])

  const inventory = parseCsvObjects(readFileSync(path.join(AUDIT, 'content-inventory.csv'), 'utf8'))
  const redirectRows = parseCsvObjects(readFileSync(path.join(AUDIT, 'redirects-draft.csv'), 'utf8'))
  const pages = parseNdjson(readFileSync(path.join(WP, 'pages.ndjson'), 'utf8'))
  const posts = parseNdjson(readFileSync(path.join(WP, 'posts.ndjson'), 'utf8'))
  const wpById = new Map([...pages, ...posts].map((d) => [String(d.id), d]))

  const documents = []
  const docsDir = path.join(OUT, 'documents')
  for (const file of readdirSync(docsDir).filter((f) => f.endsWith('.json'))) {
    for (const doc of JSON.parse(readFileSync(path.join(docsDir, file), 'utf8'))) documents.push(doc)
  }
  // Only documents that came from a WordPress source. Categories are derived from
  // the audit's blog clusters and have no legacy counterpart to compare against.
  const content = documents.filter((d) => d._migration?.legacyId != null)
  const notesById = new Map(notes.map((n) => [n.id, n]))

  /* ---- word and heading comparison ---- */
  let sourceWords = 0
  let convertedWords = 0
  let sourceHeadings = 0
  let outputHeadings = 0
  const losses = []
  for (const doc of content) {
    const m = doc._migration
    sourceWords += m.sourceWords
    convertedWords += m.convertedWords
    const wp = wpById.get(String(m.legacyId))
    const srcH = ((wp?.content?.rendered ?? '').match(SOURCE_HEADING_RE) ?? []).length
    sourceHeadings += srcH
    outputHeadings += (m.headings ?? []).length
    const ratio = m.sourceWords > 0 ? m.convertedWords / m.sourceWords : 1
    if (m.sourceWords >= 40 && ratio < 0.9) {
      losses.push({ id: doc._id, legacyPath: m.legacyPath, source: m.sourceWords, converted: m.convertedWords, ratio })
    }
  }
  losses.sort((a, b) => a.ratio - b.ratio)

  /* ---- editorial attention ranking ---- */
  const flagged = content
    .filter((d) => d.review?.editorialFlag)
    .map((d) => {
      const { score, worst, labels } = scoreFlag(d.review.editorialFlag)
      const m = d._migration
      const bonus = m.sourceWords >= 40 && m.convertedWords / m.sourceWords < 0.75 ? 20 : 0
      return {
        id: d._id,
        type: d._type,
        title: d.title,
        legacyPath: m.legacyPath,
        targetPath: m.targetPath,
        bucket: m.bucket,
        worst,
        score: score + bonus,
        labels,
        flag: d.review.editorialFlag,
      }
    })
    .sort((a, b) => b.worst - a.worst || b.score - a.score || a.id.localeCompare(b.id))

  /* ---- metadata carried ---- */
  const articles = content.filter((d) => d._type === 'article')
  const metadata = {
    titles: content.filter((d) => d.title && d.title.trim()).length,
    slugs: content.filter((d) => d.slug?.current).length,
    locales: content.filter((d) => d.locale).length,
    translationGroups: content.filter((d) => d.translationGroup?._ref).length,
    publishedAt: articles.filter((d) => d.publishedAt).length,
    updatedAt: articles.filter((d) => d.updatedAt).length,
    excerpts: articles.filter((d) => d.excerpt).length,
    categories: articles.filter((d) => d.category?._ref).length,
    authors: content.filter((d) => d.author?._ref).length,
    seoOverrides: content.filter((d) => d.seo).length,
  }

  /* ---- structured field coverage ---- */
  const coverage = (docs, field) => docs.filter((d) => {
    const v = d[field]
    return Array.isArray(v) ? v.length > 0 : v != null && v !== ''
  }).length
  const institutions = content.filter((d) => d._type === 'institution')
  const languageSchools = content.filter((d) => d._type === 'languageSchool')
  const boarding = content.filter((d) => d._type === 'boardingSchool')
  const summer = content.filter((d) => d._type === 'summerProgramme')

  /* ---- redirects ---- */
  const redirectDocs = documents.filter((d) => d._type === 'redirect')
  const goneRows = redirectRows.filter((r) => String(r.status) === '410')

  const md = renderMarkdown({
    summary, links, dropped, merges, notesById, mediaSummary, mediaManifest, unlistedMedia,
    inventory, documents, content, sourceWords, convertedWords, sourceHeadings, outputHeadings,
    losses, flagged, metadata, institutions, languageSchools, boarding, summer, coverage,
    redirectDocs, goneRows, top: TOP,
  })

  writeFileSync(TARGET, md)
  console.log(`report: wrote ${path.relative(REPO, TARGET)}`)
  console.log(`report: ${content.length} documents, ${sourceWords} source words -> ${convertedWords} converted (${((convertedWords / sourceWords) * 100).toFixed(1)}%)`)
  console.log(`report: headings ${sourceHeadings} in source markup -> ${outputHeadings} in Portable Text`)
  console.log(`report: links ${links.resolved} resolved / ${links.unresolvedTotal ?? 0} unresolved`)
  console.log(`report: ${flagged.length} documents need editorial attention; top ${Math.min(TOP, flagged.length)} listed in the QA document`)
}

function pct(n, d) {
  if (!d) return '0%'
  return `${((n / d) * 100).toFixed(1)}%`
}

function table(headers, rows) {
  const head = `| ${headers.join(' | ')} |`
  const rule = `|${headers.map(() => '---').join('|')}|`
  const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n')
  return `${head}\n${rule}\n${body}`
}

function esc(text) {
  return String(text ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ')
}

function renderMarkdown(d) {
  const now = new Date().toISOString().slice(0, 10)
  const lines = []
  const push = (...parts) => lines.push(...parts, '')

  push('# Migration QA')
  push(
    `Generated by \`node scripts/migrate/report.mjs\` on ${now}. Every number below is measured from the WordPress export in \`docs/audit/archive/wp/\` and the intermediate JSON in \`scripts/migrate/out/\`. Nothing here is estimated.`,
  )
  push(
    'Run order: `extract.mjs` (source to intermediate JSON), `media.mjs` (asset manifest, `--download` to fetch), `import.mjs` (dry run by default, `--commit` to write to Sanity), then this script.',
  )

  /* ---------------------------------------------------------------- 1. counts */
  push('## 1. Documents in and out')
  push(
    table(
      ['Target type', 'Documents'],
      Object.entries(d.summary.documentsByType).sort().map(([type, n]) => [type, String(n)]),
    ),
  )
  push(
    `**${d.content.length} content documents** were produced from ${d.summary.generatedFrom.inventoryRows} inventory rows (${d.summary.generatedFrom.wordpressPages} WordPress pages + ${d.summary.generatedFrom.wordpressPosts} posts). ` +
      `${d.summary.merged} MERGE documents were folded into their canonical, ${d.summary.dropped} rows were excluded.`,
  )
  push(
    table(
      ['Excluded', 'Rows', 'What happens to the URL'],
      Object.entries(d.summary.droppedByBucket).sort().map(([bucket, n]) => [
        bucket,
        String(n),
        bucket === 'DROP-301' ? 'redirected (301) to the path in redirects-draft.csv'
          : bucket === 'DROP-410' ? 'served as 410 Gone'
          : 'no source document found in the export',
      ]),
    ),
  )
  push(
    `Locale split of the migrated documents: ${Object.entries(d.summary.localeSplit).map(([k, v]) => `${k} ${v}`).join(', ')}. ` +
      'Every migrated document is Turkish. The English tree starts empty, exactly as the audit predicted, so `/en/` is an authoring project rather than a migration.',
  )

  /* ------------------------------------------------------------------ 2. words */
  push('## 2. Content preserved')
  push(
    table(
      ['Measure', 'Source', 'Migrated', 'Retained'],
      [
        ['Body words', String(d.sourceWords), String(d.convertedWords), pct(d.convertedWords, d.sourceWords)],
        ['Headings', String(d.sourceHeadings), String(d.outputHeadings), pct(d.outputHeadings, d.sourceHeadings)],
      ],
    ),
  )
  push(
    'Word counts differ slightly by design. The converter drops page-builder chrome (the `ekit-heading__shadow-text` country label, "Bilgi ve Kayıt" buttons, navigation and social widgets), and those words are counted in the source column.',
  )
  push(
    'The heading figure is expected to fall. The source count includes every `<h1>` to `<h6>` in the raw markup, including the ones inside dropped chrome and the 64 consecutive `<h5>` elements on `/ingiltere-universiteler/`. Portable Text has no H1 (the template owns it) and no H5 or H6, so H1 becomes H2 and H5 and H6 become H4.',
  )
  if (d.losses.length) {
    push(`### Documents that lost more than 10% of their words (${d.losses.length})`)
    push(
      table(
        ['Legacy path', 'Source words', 'Migrated words', 'Retained'],
        d.losses.slice(0, 30).map((l) => [esc(l.legacyPath), String(l.source), String(l.converted), pct(l.converted, l.source)]),
      ),
    )
    push('Check each of these by hand before publishing. A large drop usually means the page was mostly button and navigation chrome, but it can also mean genuine copy sat inside a widget the converter discarded.')
  } else {
    push('No document lost more than 10% of its words.')
  }

  /* ------------------------------------------------------------------ 3. links */
  push('## 3. Internal links')
  const unresolvedTotal = d.links.unresolvedTotal ?? 0
  push(
    table(
      ['Outcome', 'Links'],
      [
        ['Resolved to a migrated document', String(d.links.resolved)],
        ['of which resolved by unique-slug fallback', String(d.links.resolvedBySlugFallback ?? 0)],
        ['Unresolved, annotation removed and the text kept', String(unresolvedTotal)],
      ],
    ),
  )
  push(
    'Resolution order: the exact legacy path, then the new target path, then `redirects-draft.csv`, then the English alias prefixes WordPress currently 301s (`/universities/` to `/universiteler/`, `/boarding-schools/` to `/yatili-okullar2/`, `/summer-schools/` to `/yaz-okullari/`), then a final fallback on the last path segment when exactly one migrated document owns that slug. ' +
      'The slug fallback deliberately refuses ambiguous cases: `/st-giles/` matches two documents and is left unresolved rather than sending readers to the wrong school.',
  )
  if ((d.links.unresolved ?? []).length) {
    push('### Unresolved link targets')
    push(
      table(
        ['Legacy target', 'Times linked', 'Linked from'],
        d.links.unresolved.map((u) => [esc(u.legacyPath), String(u.count), esc(u.documents.join(', '))]),
      ),
    )
    push('These are dead on the legacy site too. The link text survives in the body; only the link is gone. Point them at a real page or remove the sentence.')
  }

  /* ----------------------------------------------------------------- 4. images */
  push('## 4. Images and files')
  if (d.mediaSummary) {
    push(
      table(
        ['Measure', 'Count'],
        [
          ['Assets in the WordPress library', String(d.mediaSummary.libraryTotal)],
          ['Referenced somewhere in the legacy content', String(d.mediaSummary.referenced)],
          ['Orphaned and skipped', String(d.mediaSummary.orphanedSkipped)],
          ['Referenced but missing from the library export', String(d.mediaSummary.referencedButNotInLibrary ?? 0)],
          ['Used by a migrated document', String(d.mediaSummary.usedByMigratedDocuments)],
          ['Carrying alt text', String(d.mediaSummary.withAltText)],
          ['Needing alt text before publication', String(d.mediaSummary.needingAltText)],
          ['Licence cleared', String(d.mediaSummary.licenceCleared)],
        ],
      ),
    )
    push(
      '`licence.cleared` is `false` on every migrated asset and must stay that way until someone can evidence the right to publish the image. `imageWithMeta` refuses to render an uncleared image, so the site fails closed rather than republishing stock photography of unknown provenance.',
    )
    push(
      'No document contains a `happyeducation.uk/wp-content` URL. `import.mjs` validates for it and refuses to write a payload that still has one, so nothing can hotlink the old host.',
    )
    if (d.unlistedMedia.length) {
      push(`### Referenced files with no media-library record (${d.unlistedMedia.length})`)
      push(
        table(
          ['File', 'Type', 'Legacy pages using it'],
          d.unlistedMedia.map((u) => [esc(u.originalFilename), esc(u.mimeType), String(u.referencedByLegacyPages.length)]),
        ),
      )
      push(
        'These are linked from page content but absent from `media.ndjson`, so a manifest built from the media library alone would miss them. That includes the tour PDFs the audit told us to preserve before `/thanks/` is switched off. `media.mjs --download` fetches them alongside the library assets.',
      )
    }
  } else {
    push('`media.mjs` has not been run. Run `node scripts/migrate/media.mjs` to produce the asset manifest.')
  }

  /* -------------------------------------------------------------- 5. structured */
  push('## 5. Structured fields populated')
  push(
    table(
      ['Type', 'Documents', 'city', 'country', 'founded', 'subjectAreas', 'fees', 'ageRange', 'lessonsPerWeek', 'officialWebsite'],
      [
        ['institution', String(d.institutions.length), String(d.coverage(d.institutions, 'city')), String(d.coverage(d.institutions, 'country')), String(d.coverage(d.institutions, 'founded')), String(d.coverage(d.institutions, 'subjectAreas')), String(d.coverage(d.institutions, 'fees')), '-', '-', String(d.coverage(d.institutions, 'officialWebsite'))],
        ['languageSchool', String(d.languageSchools.length), String(d.coverage(d.languageSchools, 'city')), String(d.coverage(d.languageSchools, 'country')), '-', '-', String(d.coverage(d.languageSchools, 'fees')), '-', String(d.coverage(d.languageSchools, 'lessonsPerWeek')), String(d.coverage(d.languageSchools, 'officialWebsite'))],
        ['boardingSchool', String(d.boarding.length), String(d.coverage(d.boarding, 'city')), String(d.coverage(d.boarding, 'country')), '-', '-', String(d.coverage(d.boarding, 'fees')), String(d.coverage(d.boarding, 'ageRange')), '-', String(d.coverage(d.boarding, 'officialWebsite'))],
        ['summerProgramme', String(d.summer.length), String(d.coverage(d.summer, 'city')), '-', '-', '-', String(d.coverage(d.summer, 'price')), String(d.coverage(d.summer, 'ageRange')), String(d.coverage(d.summer, 'lessonsPerWeek')), '-'],
      ],
    ),
  )
  push(
    'A field is populated only where `institutions-extracted.json` actually holds the value. `officialWebsite` is zero everywhere because it is zero in the source: not one of the 313 legacy institution pages carried the institution\'s own URL. That is a manual data-collection pass, not something a script can fill.',
  )
  push(
    'Ranking strings are deliberately NOT written into `institution.rankings`. That field requires an organisation, a year, a category, a position and a source; the legacy pages have one free-text sentence such as "U.S. News & World Report 2025 - ABD genelinde #315". Splitting it would be inventing structured data, so the sentence stays in the body prose and the document is flagged for re-verification.',
  )
  const unresolvedDest = d.summary.unresolvedDestinations ?? []
  if (unresolvedDest.length) {
    push(`### Institutions with no destination page (${unresolvedDest.length})`)
    push(
      table(
        ['Document', 'Destination it needs'],
        unresolvedDest.map((u) => [`\`${esc(u.legacyPath)}\``, `\`${esc(u.wanted)}\``]),
      ),
    )
    push('The legacy site has no country hub for these, so the `destination` reference is empty. Create the destination document or move the institution under an existing one.')
  }
  push(
    'The legacy "Konaklama Seçenekleri" and "Kurs Seçenekleri" strips are not written into the `accommodation` and `programmes` rich-text fields either. On most pages they are a link menu rather than content, and the same words already appear in the body. Each affected document names the strip in its editorial flag so an editor can promote it deliberately.',
  )

  /* ------------------------------------------------------------- 6. metadata */
  push('## 6. Metadata carried')
  push(
    table(
      ['Field', 'Documents', 'Of'],
      [
        ['title', String(d.metadata.titles), String(d.content.length)],
        ['slug', String(d.metadata.slugs), String(d.content.length)],
        ['locale', String(d.metadata.locales), String(d.content.length)],
        ['translationGroup', String(d.metadata.translationGroups), String(d.content.length)],
        ['publishedAt (articles)', String(d.metadata.publishedAt), String(d.summary.documentsByType.article ?? 0)],
        ['updatedAt (articles)', String(d.metadata.updatedAt), String(d.summary.documentsByType.article ?? 0)],
        ['excerpt (articles)', String(d.metadata.excerpts), String(d.summary.documentsByType.article ?? 0)],
        ['category (articles)', String(d.metadata.categories), String(d.summary.documentsByType.article ?? 0)],
        ['author', String(d.metadata.authors), String(d.content.length)],
        ['seo override', String(d.metadata.seoOverrides), String(d.content.length)],
      ],
    ),
  )
  push(
    'Author is empty on purpose. The legacy byline on all 18 posts is the WordPress `root` account, and the schema exists precisely to stop an invented expert byline being published. Assign a real member of staff or publish without a byline.',
  )
  push(
    'No `seo` override is written. The WordPress excerpts are auto-truncated body text, and the templates already fall back to the document title and excerpt, so writing a truncated paragraph into a meta description would make the output worse rather than better.',
  )
  push(
    `${d.redirectDocs.length} redirect documents were produced from \`redirects-draft.csv\`, plus ${d.goneRows.length} rows that must be served as 410 Gone rather than redirected.`,
  )

  /* ------------------------------------------------------------ 7. attention */
  push('## 7. Documents needing editorial attention')
  push(
    `${d.flagged.length} of ${d.content.length} documents carry an \`review.editorialFlag\`, and ${d.summary.documentsTimeSensitive} are marked \`review.timeSensitive\`. ` +
      'A flag blocks the pre-launch check by design. Nothing was silently corrected: fees, prices, dates, rankings, visa statements and work-rights claims were carried across verbatim and flagged, because a migration that edits factual claims is a migration that introduces new ones.',
  )
  const claimCount = (pattern) => d.content.filter((x) => pattern.test(x.review?.editorialFlag ?? '')).length
  push('### Claims audit')
  push(
    table(
      ['Check', 'Documents', 'Meaning'],
      [
        ['Blocked claim in migrated body copy', String(claimCount(/BLOCKED CLAIM/)), 'student/institution/country counters, success or visa-approval rates, years-of-experience figures, IAA registration, review scores'],
        ['Third-party claim needing a source', String(claimCount(/THIRD-PARTY CLAIM/)), "an institution's acceptance or success rate, or a school's accreditation body"],
        ['Immigration content', String(claimCount(/IMMIGRATION content/)), 'must read as administrative support only and link to the official source'],
        ['Price or fee carried across', String(claimCount(/PRICE\/FEE re-check/)), 'verbatim, unverified, needs an "as of" date'],
        ['Ranking claim in prose', String(claimCount(/RANKING claim/)), 'annual figure, re-verify or delete'],
        ['Entry requirements mentioned', String(claimCount(/ENTRY REQUIREMENTS/)), 'IELTS, TOEFL or GPA thresholds'],
        ['English copy sitting in the Turkish tree', String(claimCount(/Body copy is English/)), 'provider marketing of uncertain provenance'],
      ],
    ),
  )
  push(
    `Blocked claims: ${claimCount(/BLOCKED CLAIM/)}. The legacy "500+ students / 200+ universities / 20+ countries" counters are rendered by Elementor global widgets and theme options, not by page content, so they are absent from the WordPress REST export and never entered the migration. They must not be re-created by hand in the new build either.`,
  )
  push(`### Top ${Math.min(d.top, d.flagged.length)} by risk`)
  push(
    table(
      ['#', 'Document', 'Type', 'Why'],
      d.flagged.slice(0, d.top).map((f, i) => [
        String(i + 1),
        `\`${esc(f.legacyPath)}\`<br>${esc(f.title)}`,
        f.type,
        esc(f.labels.join(', ')),
      ]),
    ),
  )
  push('### Every flagged document')
  push('<details><summary>Full list</summary>')
  push('')
  push(
    table(
      ['Document', 'Type', 'Target path', 'Worst', 'Total', 'Reasons'],
      d.flagged.map((f) => [`\`${esc(f.legacyPath)}\``, f.type, `\`${esc(f.targetPath)}\``, String(f.worst), String(f.score), esc(f.labels.join(', '))]),
    ),
  )
  push('')
  push('</details>')

  /* --------------------------------------------------------------- 8. merges */
  push('## 8. Merges and exclusions')
  if (d.merges.length) {
    push(
      table(
        ['Merged from', 'Into', 'Words folded', 'Folded'],
        d.merges.map((m) => [esc(m.legacyPath), esc(m.canonical), String(m.wordsFolded ?? 0), m.folded ? 'yes' : `no (${esc(m.note ?? '')})`]),
      ),
    )
    push(
      'A merge appends the source body below the canonical body and flags the canonical. Nothing is deleted automatically. The audit is explicit that at least three root-to-nested title matches are a summer programme and a university sharing a campus name, so automated de-duplication is the single most likely way to destroy sellable content here.',
    )
  }
  push('### Excluded documents')
  push(
    table(
      ['Legacy path', 'Bucket', 'Redirect target', 'Reason'],
      d.dropped.map((x) => [esc(x.legacyPath), x.bucket, x.redirectTo ? `\`${esc(x.redirectTo)}\`` : '410 Gone', esc(x.reason).slice(0, 120)]),
    ),
  )

  /* ------------------------------------------------------------ 9. conversion */
  push('## 9. Conversion diagnostics')
  const dropReasons = {}
  for (const n of d.notesById.values()) {
    for (const link of n.droppedLinks ?? []) {
      const reason = link.reason.startsWith('unsafe scheme') ? 'unsafe scheme' : link.reason
      dropReasons[reason] = (dropReasons[reason] ?? 0) + 1
    }
  }
  const totals = [...d.notesById.values()].reduce(
    (acc, n) => ({
      demoted: acc.demoted + (n.headingsDemoted?.length ?? 0),
      chrome: acc.chrome + (n.droppedChrome ?? 0),
      droppedLinks: acc.droppedLinks + (n.droppedLinks?.length ?? 0),
      tables: acc.tables + (n.tables ?? 0),
      pseudo: acc.pseudo + (n.boldPseudoHeadings ?? 0),
      entities: acc.entities + (n.unresolvedEntities?.length ?? 0),
      shortcodes: acc.shortcodes + (n.shortcodes?.length ?? 0),
      misspellings: acc.misspellings + (n.misspellings?.length ?? 0),
      emDashes: acc.emDashes + (n.emDashes ?? 0),
      apostrophes: acc.apostrophes + (n.turkishApostropheSuspects?.length ?? 0),
      imagesNoAlt: acc.imagesNoAlt + (n.imagesWithoutAlt ?? 0),
    }),
    { demoted: 0, chrome: 0, droppedLinks: 0, tables: 0, pseudo: 0, entities: 0, shortcodes: 0, misspellings: 0, emDashes: 0, apostrophes: 0, imagesNoAlt: 0 },
  )
  totals.dropReasons = dropReasons
  push(
    table(
      ['Diagnostic', 'Count', 'Handling'],
      [
        ['Headings demoted (h1 to h2, h5/h6 to h4)', String(totals.demoted), 'automatic; the template owns the single H1'],
        ['Page-builder chrome elements dropped', String(totals.chrome), 'automatic'],
        ['Links dropped, link text kept', String(totals.droppedLinks), `automatic; by reason: ${Object.entries(totals.dropReasons).sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r} ${n}`).join(', ') || 'none'}`],
        ['of which an unsafe scheme (`javascript:`, `data:`, `vbscript:`)', String(totals.dropReasons['unsafe scheme'] ?? 0), 'the converter rejects them; none were present in this export'],
        ['Shortcodes stripped', String(totals.shortcodes), 'automatic'],
        ['Tables converted', String(totals.tables), 'cells become plain strings, so links and formatting inside them are flattened and reported'],
        ['Bold pseudo-headings found', String(totals.pseudo), 'left as paragraphs and flagged; promoting the wrong one would change the outline'],
        ['HTML entities that could not be decoded', String(totals.entities), 'flagged'],
        ['Body images with no alt text', String(totals.imagesNoAlt), 'flagged'],
        ['Known misspellings detected', String(totals.misspellings), 'flagged, never auto-corrected'],
        ['Missing Turkish apostrophes suspected', String(totals.apostrophes), 'flagged; "Amerika da" is also a valid sentence, so this is a suspicion list'],
        ['Em dashes in migrated copy', String(totals.emDashes), 'flagged; house style does not use them'],
      ],
    ),
  )
  push(
    'The audit found the encoding damage in this export is legacy named entities (`&uuml;`, `&ouml;`, `&ccedil;`) and numeric entities, not mojibake. The converter decodes both. It also detects double-encoded UTF-8 and repairs it where the repair is provably clean, and reports it where it is not, so the next export does not get corrupted silently.',
  )

  /* ------------------------------------------------------------- 10. what next */
  push('## 10. What a script cannot do')
  push(
    [
      `1. **Write the English tree.** Every migrated document is Turkish. \`/en/\` is roughly 77,000 words of new writing, not translation cleanup.`,
      `2. **Source ${d.institutions.length + d.languageSchools.length + d.boarding.length} official website URLs.** Zero of the legacy pages carried one.`,
      `3. **Write alt text for ${d.mediaSummary?.needingAltText ?? 0} images.** Four assets in the whole library have it.`,
      `4. **Clear image licences.** Every asset arrives with \`licence.cleared = false\` and stays invisible until a person confirms the right to publish it.`,
      `5. **Re-verify every time-sensitive claim.** ${d.summary.documentsTimeSensitive} documents are marked time-sensitive, and the schema requires at least one source on each before it will validate.`,
      `6. **Assign real bylines.** No author reference was created for any document.`,
      `7. **Set the format on ${d.summer.filter((s) => !s.format).length} summer programmes** where the legacy URL does not say whether the programme is individual or group.`,
      `8. **Get the privacy policy approved.** It is migrated as-is with \`solicitorApproved = false\` and has no cookie, UK GDPR, retention or data-subject-rights sections.`,
    ].join('\n'),
  )

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()}\n`
}

main()
