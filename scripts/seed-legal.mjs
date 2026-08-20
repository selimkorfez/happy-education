#!/usr/bin/env node
/**
 * seed-legal.mjs
 *
 * Turns the markdown drafts in content/legal/{en,tr}/*.md into `legalPage`
 * documents for Sanity.
 *
 * These documents are DRAFTS. Nothing in content/legal has been reviewed by a
 * solicitor, so the script refuses to write a published document while
 * `solicitorApproved` is false: it writes Sanity drafts (`drafts.` prefixed ids),
 * which appear in the Studio as unpublished. That is deliberate. The register of
 * what still needs sign-off is docs/LEGAL_REVIEW.md.
 *
 * Usage:
 *   node scripts/seed-legal.mjs                 dry run, prints what it would write
 *   node scripts/seed-legal.mjs --verbose       dry run, also prints the block outline
 *   node scripts/seed-legal.mjs --out=file.ndjson   write NDJSON for `sanity dataset import`
 *   node scripts/seed-legal.mjs --apply         write Sanity drafts over the HTTP API
 *   node scripts/seed-legal.mjs --apply --publish   write PUBLISHED docs (blocked unless approved)
 *
 * --apply needs NEXT_PUBLIC_SANITY_PROJECT_ID and a write token in
 * SANITY_API_WRITE_TOKEN. Neither is required for a dry run, and no integration
 * is required for the build, so this script never runs as part of it.
 *
 * No dependencies. Node 22+.
 */

import { readFile, readdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CONTENT_DIR = path.join(ROOT, 'content', 'legal')
const LEGAL_TS = path.join(ROOT, 'src', 'lib', 'legal.ts')
const LOCALES = ['en', 'tr']
const REQUIRED_FRONT_MATTER = [
  'title',
  'key',
  'locale',
  'slug',
  'effectiveDate',
  'solicitorApproved',
  'summary',
]

/* ------------------------------------------------------------------ helpers */

const argv = process.argv.slice(2)
const hasFlag = (name) => argv.includes(`--${name}`)
const flagValue = (name) => {
  const hit = argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : null
}

const problems = []
const warnings = []
const fail = (file, message) => problems.push(`${file}: ${message}`)
const warn = (file, message) => warnings.push(`${file}: ${message}`)

/** Deterministic keys, so re-running the script does not churn the dataset. */
function keyer(prefix) {
  let n = 0
  return () => `${prefix}${(n++).toString(36)}`
}

/* ------------------------------------- read the slug registry from legal.ts */

/**
 * The TypeScript module is the single source of truth for slugs. Rather than
 * duplicating them here (where they would drift), parse the literal out of it.
 */
async function readLegalRegistry() {
  const source = await readFile(LEGAL_TS, 'utf8')
  const block = source.match(/export const LEGAL_PAGES = \[([\s\S]*?)\] as const/)
  if (!block) throw new Error('Could not find LEGAL_PAGES in src/lib/legal.ts')

  const entries = [...block[1].matchAll(
    /\{\s*key:\s*'([^']+)',\s*en:\s*'([^']+)',\s*tr:\s*'([^']+)'\s*\}/g,
  )]
  if (entries.length === 0) throw new Error('LEGAL_PAGES parsed as empty')

  return entries.map(([, key, en, tr]) => ({ key, en, tr }))
}

/* ------------------------------------------------------------ front matter */

function parseFrontMatter(raw, file) {
  if (!raw.startsWith('---\n')) {
    fail(file, 'missing YAML front matter')
    return { data: {}, body: raw }
  }
  const end = raw.indexOf('\n---', 4)
  if (end === -1) {
    fail(file, 'front matter is not terminated')
    return { data: {}, body: raw }
  }

  const head = raw.slice(4, end)
  const body = raw.slice(raw.indexOf('\n', end + 1) + 1)
  const data = {}
  let sawDraftNotice = false

  for (const line of head.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    if (trimmed.startsWith('#')) {
      // Comment lines carry the draft notice. Its presence is mandatory.
      if (/TASLAK|DRAFT/i.test(trimmed)) sawDraftNotice = true
      continue
    }
    const colon = trimmed.indexOf(':')
    if (colon === -1) continue
    const name = trimmed.slice(0, colon).trim()
    let value = trimmed.slice(colon + 1).trim()

    if (value.startsWith('[') && value.endsWith(']')) {
      data[name] = value
        .slice(1, -1)
        .split(',')
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
      continue
    }
    value = value.replace(/^['"]|['"]$/g, '')
    if (value === 'true' || value === 'false') data[name] = value === 'true'
    else data[name] = value
  }

  if (!sawDraftNotice) fail(file, 'front matter has no draft notice comment')
  return { data, body }
}

/* ------------------------------------------------- markdown to portable text */

const INLINE = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))|(\*(.+?)\*)/g

/** Returns { children, markDefs } for one line of inline markdown. */
function inlineToSpans(text, nextKey, nextDefKey) {
  const children = []
  const markDefs = []
  let cursor = 0

  const push = (value, marks) => {
    if (!value) return
    children.push({ _type: 'span', _key: nextKey(), text: value, marks })
  }

  for (const match of text.matchAll(INLINE)) {
    if (match.index > cursor) push(text.slice(cursor, match.index), [])

    if (match[1] !== undefined) {
      push(match[2], ['strong'])
    } else if (match[3] !== undefined) {
      const href = match[5].trim()
      if (!/^(https?:|mailto:|tel:)/.test(href)) {
        // The schema only accepts these schemes, so anything else would fail
        // validation on import. Keep the words, drop the link.
        push(match[4], [])
      } else {
        const defKey = nextDefKey()
        markDefs.push({ _type: 'externalLink', _key: defKey, href })
        push(match[4], [defKey])
      }
    } else {
      push(match[7], ['em'])
    }
    cursor = match.index + match[0].length
  }

  if (cursor < text.length) push(text.slice(cursor), [])
  if (children.length === 0) push('', [])
  return { children, markDefs }
}

function stripInline(text) {
  return text
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim()
}

function markdownToPortableText(markdown, file) {
  const blocks = []
  const nextBlockKey = keyer('b')
  const nextSpanKey = keyer('s')
  const nextDefKey = keyer('l')

  const lines = markdown
    .replace(/<!--[\s\S]*?-->/g, '') // strip the draft notice comment
    .split('\n')

  const textBlock = (style, text, listItem) => {
    const { children, markDefs } = inlineToSpans(text, nextSpanKey, nextDefKey)
    const block = { _type: 'block', _key: nextBlockKey(), style, markDefs, children }
    if (listItem) {
      block.listItem = listItem
      block.level = 1
    }
    blocks.push(block)
  }

  let paragraph = []
  const flushParagraph = () => {
    if (paragraph.length === 0) return
    textBlock('normal', paragraph.join(' ').trim())
    paragraph = []
  }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]
    const trimmed = line.trim()

    if (!trimmed) {
      flushParagraph()
      continue
    }

    // Table: a run of lines starting with a pipe.
    if (trimmed.startsWith('|')) {
      flushParagraph()
      const rows = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(lines[i].trim())
        i += 1
      }
      i -= 1

      const cellsOf = (row) =>
        row
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((cell) => stripInline(cell))

      const headers = cellsOf(rows[0])
      const body = rows.slice(1).filter((row) => !/^\|[\s:|-]+\|$/.test(row))
      if (headers.length === 0) fail(file, 'table with no header row')

      blocks.push({
        _type: 'table',
        _key: nextBlockKey(),
        headers,
        rows: body.map((row) => ({
          _type: 'row',
          _key: nextBlockKey(),
          cells: cellsOf(row),
        })),
      })
      continue
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      const depth = heading[1].length
      if (depth === 1) fail(file, 'body contains an H1; the page template owns the H1')
      const style = depth >= 4 ? 'h4' : `h${depth}`
      textBlock(style, heading[2].trim())
      continue
    }

    if (trimmed.startsWith('>')) {
      flushParagraph()
      const quoted = trimmed.replace(/^>\s?/, '').trim()
      if (quoted) textBlock('blockquote', quoted)
      continue
    }

    const bullet = trimmed.match(/^[-*]\s+(.*)$/)
    if (bullet) {
      flushParagraph()
      textBlock('normal', bullet[1].trim(), 'bullet')
      continue
    }

    const numbered = trimmed.match(/^\d+\.\s+(.*)$/)
    if (numbered) {
      flushParagraph()
      textBlock('normal', numbered[1].trim(), 'number')
      continue
    }

    paragraph.push(trimmed)
  }

  flushParagraph()
  return blocks
}

/* ------------------------------------------------------------- validation */

const FORBIDDEN_TEXT = [
  { pattern: /[—–]/, message: 'contains an em or en dash, which house style forbids' },
  { pattern: /\bTODO\b|\bFIXME\b|\bXXX\b/, message: 'contains an unresolved editorial marker' },
  // Negated statements ("we are NOT registered with the IAA") are exactly what
  // these documents should say, so only an affirmative claim is caught.
  { pattern: /\bIAA[- ]registered\b/i, message: 'appears to claim IAA registration' },
  { pattern: /\b(we are|happy education is)\s+registered with the (IAA|Immigration Advice Authority)\b/i, message: 'appears to claim IAA registration' },
  { pattern: /\b(IAA|Immigration Advice Authority) (nezdinde|kaydımız) (kayıtlıyız|vardır|bulunmaktadır)\b/i, message: 'appears to claim IAA registration' },
  { pattern: /\b(British Council|English UK|ICEF|BAC)[- ]accredited\b/i, message: 'appears to claim an accreditation the company does not hold' },
  { pattern: /\b\d{3,}\+?\s+(students|öğrenci|universities|üniversite)\b/i, message: 'appears to publish an unverified count' },
  // "we do not guarantee" is the correct wording, so match only the affirmative.
  { pattern: /\bwe (guarantee|promise|ensure)\s+(a |an |your )?(visa|admission|acceptance|place|scholarship)\b/i, message: 'appears to guarantee an immigration or admission outcome' },
  { pattern: /\b(vize|kabul|burs)(yi|yı|nizi)?\s+garanti (ediyoruz|ederiz|ediyor)\b/i, message: 'appears to guarantee an immigration or admission outcome' },
]

function validate(file, data, body, registry, locale) {
  for (const field of REQUIRED_FRONT_MATTER) {
    if (data[field] === undefined || data[field] === '') fail(file, `front matter is missing "${field}"`)
  }

  const entry = registry.find((e) => e.key === data.key)
  if (!entry) {
    fail(file, `key "${data.key}" is not in LEGAL_PAGES in src/lib/legal.ts`)
  } else if (data.slug !== entry[locale]) {
    fail(file, `slug "${data.slug}" does not match "${entry[locale]}" in src/lib/legal.ts`)
  }

  if (data.locale !== locale) fail(file, `front matter locale "${data.locale}" does not match its folder`)
  if (data.solicitorApproved !== false) {
    fail(file, 'solicitorApproved must be false until a solicitor has signed the document off')
  }
  if (data.effectiveDate && !/^\d{4}-\d{2}-\d{2}$/.test(String(data.effectiveDate))) {
    fail(file, 'effectiveDate must be an ISO date (YYYY-MM-DD)')
  }
  if (!/<!--[\s\S]*?-->/.test(body)) fail(file, 'body has no draft notice comment')

  const prose = body.replace(/<!--[\s\S]*?-->/g, '')
  for (const { pattern, message } of FORBIDDEN_TEXT) {
    if (pattern.test(prose)) fail(file, message)
  }
  if (!Array.isArray(data.reviewRefs) || data.reviewRefs.length === 0) {
    warn(file, 'no reviewRefs listed, so nothing links this document to docs/LEGAL_REVIEW.md')
  }
}

/* ------------------------------------------------------------ document build */

function buildDocument(data, blocks, { publish }) {
  const base = `legalPage.${data.key}.${data.locale}`
  const refs = Array.isArray(data.reviewRefs) ? data.reviewRefs : []

  return {
    _id: publish ? base : `drafts.${base}`,
    _type: 'legalPage',
    locale: data.locale,
    title: data.title,
    slug: { _type: 'slug', current: data.slug },
    key: data.key,
    body: blocks,
    effectiveDate: data.effectiveDate,
    solicitorApproved: false,
    translationGroup: { _type: 'reference', _ref: `translationGroup.legal.${data.key}` },
    seo: { _type: 'seo', description: data.summary },
    review: {
      _type: 'reviewMeta',
      lastReviewed: data.effectiveDate,
      timeSensitive: true,
      // The schema requires at least one source on time-sensitive content, and legal
      // text is time-sensitive by definition. These are the primary references the
      // drafts were written from; a reviewer will add their own.
      sources: [
        {
          _type: 'source',
          _key: 'src-ico-guide',
          label: 'ICO — Guide to UK GDPR',
          url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/',
          accessed: data.effectiveDate,
        },
        {
          _type: 'source',
          _key: 'src-legislation',
          label: 'legislation.gov.uk — UK statute',
          url: 'https://www.legislation.gov.uk/',
          accessed: data.effectiveDate,
        },
      ],
      editorialFlag: [
        'DRAFT. Not reviewed by a solicitor. Must not be published as-is.',
        refs.length ? `Open review items: ${refs.join(', ')}.` : 'No review items recorded.',
        'See docs/LEGAL_REVIEW.md.',
      ].join(' '),
    },
  }
}

function buildTranslationGroups(registry) {
  return registry.map((entry) => ({
    _id: `translationGroup.legal.${entry.key}`,
    _type: 'translationGroup',
    title: `Legal — ${entry.key}`,
  }))
}

/* --------------------------------------------------------------------- apply */

async function apply(documents) {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || '2026-08-01'
  const token = process.env.SANITY_API_WRITE_TOKEN

  if (!projectId || !token) {
    console.error(
      '\n--apply needs NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN in the environment.',
    )
    console.error('Nothing was written. Run without --apply for a dry run, or use --out to')
    console.error('produce an NDJSON file for `sanity dataset import`.\n')
    process.exitCode = 1
    return
  }

  const url = `https://${projectId}.api.sanity.io/v${apiVersion}/data/mutate/${dataset}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: JSON.stringify({ mutations: documents.map((doc) => ({ createOrReplace: doc })) }),
  })

  if (!response.ok) {
    console.error(`\nSanity rejected the mutation: ${response.status} ${response.statusText}`)
    console.error(await response.text())
    process.exitCode = 1
    return
  }
  console.log(`\nWrote ${documents.length} documents to ${projectId}/${dataset}.`)
}

/* ---------------------------------------------------------------------- main */

async function main() {
  const verbose = hasFlag('verbose')
  const publish = hasFlag('publish')
  const outPath = flagValue('out')

  if (!existsSync(CONTENT_DIR)) {
    console.error(`No drafts found at ${CONTENT_DIR}`)
    process.exitCode = 1
    return
  }

  const registry = await readLegalRegistry()
  const documents = []
  const seen = new Map()

  for (const locale of LOCALES) {
    const dir = path.join(CONTENT_DIR, locale)
    if (!existsSync(dir)) {
      problems.push(`content/legal/${locale}: directory is missing`)
      continue
    }
    const files = (await readdir(dir)).filter((f) => f.endsWith('.md')).sort()

    for (const name of files) {
      const relative = `content/legal/${locale}/${name}`
      const raw = await readFile(path.join(dir, name), 'utf8')
      const { data, body } = parseFrontMatter(raw, relative)

      validate(relative, data, body, registry, locale)
      if (!data.key) continue

      const blocks = markdownToPortableText(body, relative)
      if (blocks.length === 0) fail(relative, 'body converted to zero blocks')

      const words = body.split(/\s+/).filter(Boolean).length
      seen.set(`${data.key}.${locale}`, { relative, blocks: blocks.length, words })
      documents.push(buildDocument(data, blocks, { publish }))

      if (verbose) {
        console.log(`\n${relative}`)
        for (const block of blocks) {
          if (block._type === 'table') {
            console.log(`   [table] ${block.headers.join(' / ')} (${block.rows.length} rows)`)
          } else if (block.style?.startsWith('h')) {
            console.log(`   ${block.style}  ${block.children.map((c) => c.text).join('')}`)
          }
        }
      }
    }
  }

  // Every document must exist in both languages, or the language switcher breaks.
  for (const entry of registry) {
    for (const locale of LOCALES) {
      if (!seen.has(`${entry.key}.${locale}`)) {
        problems.push(`content/legal/${locale}/${entry.key}.md: missing`)
      }
    }
  }

  const groups = buildTranslationGroups(registry)
  const payload = [...groups, ...documents]

  console.log('\nHappy Education legal seed')
  console.log('='.repeat(64))
  console.log(`Drafts read      ${documents.length} of ${registry.length * LOCALES.length}`)
  console.log(`Translation sets ${groups.length}`)
  console.log(`Target ids       ${publish ? 'PUBLISHED' : 'drafts.legalPage.*'}`)
  console.log('')
  for (const entry of registry) {
    const en = seen.get(`${entry.key}.en`)
    const tr = seen.get(`${entry.key}.tr`)
    const cell = (v) => (v ? `${String(v.words).padStart(5)} words / ${String(v.blocks).padStart(3)} blocks` : '   missing              ')
    console.log(`  ${entry.key.padEnd(14)} en ${cell(en)}   tr ${cell(tr)}`)
  }

  if (warnings.length) {
    console.log('\nWarnings')
    for (const line of warnings) console.log(`  ! ${line}`)
  }

  if (problems.length) {
    console.log('\nProblems')
    for (const line of problems) console.log(`  x ${line}`)
    console.log('\nNothing was written. Fix the problems above and run again.')
    process.exitCode = 1
    return
  }

  if (publish) {
    console.log('\n--publish was requested, but every draft has solicitorApproved: false.')
    console.log('These documents have not been through legal review (docs/LEGAL_REVIEW.md),')
    console.log('so publishing them is refused. Seed them as Sanity drafts instead.')
    process.exitCode = 1
    return
  }

  if (outPath) {
    const target = path.isAbsolute(outPath) ? outPath : path.join(ROOT, outPath)
    await writeFile(target, payload.map((doc) => JSON.stringify(doc)).join('\n') + '\n', 'utf8')
    console.log(`\nWrote ${payload.length} documents to ${target}`)
    console.log('Import with: npx sanity dataset import <file> <dataset>')
  }

  if (hasFlag('apply')) {
    await apply(payload)
    return
  }

  if (!outPath) {
    console.log('\nDry run. Nothing was written.')
    console.log('  --out=<file>   write NDJSON for `sanity dataset import`')
    console.log('  --apply        write Sanity drafts over the HTTP API')
    console.log('  --verbose      print the heading outline of each document')
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
