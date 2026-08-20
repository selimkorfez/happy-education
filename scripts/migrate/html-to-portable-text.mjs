#!/usr/bin/env node
/**
 * WordPress/Elementor HTML -> Portable Text matching `sanity/schemas/objects/richText.ts`.
 *
 * WHAT COMES OUT
 *   block            style normal | h2 | h3 | h4 | blockquote, listItem bullet|number
 *   marks            strong, em; annotations internalLinkPlaceholder / externalLink
 *   table            { caption, headers[], rows[{ cells[] }] }
 *   imagePlaceholder resolved to `imageWithMeta` by import.mjs once media.mjs has
 *                    uploaded the asset. Never a live happyeducation.uk URL.
 *
 * WHAT GETS DESTROYED ON PURPOSE
 *   Elementor container/widget wrappers, inline styles, class/id/data-* attributes,
 *   <script>/<style>/<iframe>/<form>, shortcodes, the `ekit-heading__shadow-text`
 *   country label (already captured as a structured field), button chrome, and any
 *   javascript:/data:/vbscript: href.
 *
 * H1 -> H2. The page template owns the single H1; richText has no h1 style. H5/H6
 * are demoted to H4 for the same reason and every demotion is reported.
 *
 * Every `_key` is a hash of (document scope, key kind, ordinal). Re-running produces
 * byte-identical output.
 *
 * CLI
 *   node scripts/migrate/html-to-portable-text.mjs --self-test
 *   node scripts/migrate/html-to-portable-text.mjs --wp-id 12196   # convert one doc
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { parseHtml, DROP_SUBTREE, classList } from './lib/html.mjs'
import { keyer } from './lib/keys.mjs'
import { cleanTextNode, decodeEntities, detectCopyDefects, normaliseWhitespace, countWords } from './lib/text.mjs'
import { parseNdjson } from './lib/csv.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
export const REPO = path.resolve(HERE, '..', '..')

const HEADING_STYLE = { h1: 'h2', h2: 'h2', h3: 'h3', h4: 'h4', h5: 'h4', h6: 'h4' }
const DECORATORS = new Set(['strong', 'em'])

const INLINE_TAGS = new Set([
  'a', 'abbr', 'b', 'bdi', 'bdo', 'cite', 'code', 'data', 'dfn', 'em', 'font', 'i',
  'kbd', 'label', 'mark', 'q', 's', 'samp', 'small', 'span', 'strong', 'sub', 'sup',
  'time', 'u', 'var', 'ins', 'del',
])

/** Page-builder chrome. Class-token prefixes, so `elementor-button-wrapper` matches. */
const CHROME_CLASS_PREFIXES = [
  'elementor-button', 'elementor-widget-button', 'elementor-nav-menu',
  'elementskit-navbar', 'elementor-social', 'elementskit-social',
  'ekit-heading__shadow-text', 'elementor-widget-woocommerce',
  'elementor-widget-wp-widget', 'elementor-shortcode', 'elementor-menu-toggle',
  'screen-reader-text', 'sr-only', 'wp-block-button', 'wp-block-buttons',
  'wp-block-search', 'wp-block-social', 'addtoany', 'sharedaddy', 'breadcrumb',
  'elementor-icon-list', 'elementskit-menu', 'learn-press', 'woocommerce',
]

const BAD_SCHEME = /^\s*(javascript|data|vbscript|file)\s*:/i
const SITE_HOSTS = new Set(['happyeducation.uk', 'www.happyeducation.uk'])

function isChrome(node) {
  if (node.attrs?.['aria-hidden'] === 'true') return true
  if (node.attrs?.role === 'navigation') return true
  const tokens = classList(node)
  return tokens.some((t) => CHROME_CLASS_PREFIXES.some((p) => t.startsWith(p)))
}

function newNotes() {
  return {
    unresolvedEntities: [],
    mojibakeRepaired: 0,
    mojibakeUnrepairable: 0,
    shortcodes: [],
    headingsDemoted: [],
    headingCount: 0,
    droppedChrome: 0,
    droppedSubtrees: [],
    droppedLinks: [],
    internalLinks: [],
    externalLinks: [],
    images: [],
    tables: 0,
    tableLinksFlattened: 0,
    boldPseudoHeadings: 0,
    listItems: 0,
  }
}

/* ---------------------------------------------------------------- inline spans */

function mergeSpans(spans) {
  const out = []
  for (const span of spans) {
    if (!span.text) continue
    const prev = out[out.length - 1]
    if (prev && prev.marks.length === span.marks.length && prev.marks.every((m, i) => m === span.marks[i])) {
      prev.text += span.text
    } else out.push({ text: span.text, marks: [...span.marks] })
  }
  // Collapse whitespace across span boundaries, then trim the edges of the block.
  for (let i = 0; i < out.length; i += 1) {
    if (i > 0 && /\s$/.test(out[i - 1].text)) out[i].text = out[i].text.replace(/^\s+/, '')
  }
  if (out.length) {
    out[0].text = out[0].text.replace(/^\s+/, '')
    out[out.length - 1].text = out[out.length - 1].text.replace(/\s+$/, '')
  }
  return out.filter((s) => s.text.length)
}

function flush(ctx) {
  const { spans, defs } = ctx.buffer
  ctx.buffer = { spans: [], defs: [] }
  const merged = mergeSpans(spans)
  const text = merged.map((s) => s.text).join('')
  if (!text.trim()) return

  const usedKeys = new Set()
  for (const span of merged) for (const mark of span.marks) if (!DECORATORS.has(mark)) usedKeys.add(mark)
  const markDefs = defs.filter((d) => usedKeys.has(d._key))

  // A short, wholly-bold paragraph is a pseudo-heading. 157 documents build their
  // structure this way (report-5 §6). Reported, never silently promoted: promoting
  // the wrong one changes the document outline.
  if (
    ctx.style === 'normal' &&
    !ctx.listItem &&
    merged.length > 0 &&
    merged.every((s) => s.marks.includes('strong')) &&
    countWords(text) <= 12 &&
    !/[.!?]$/.test(text.trim())
  ) {
    ctx.notes.boldPseudoHeadings += 1
  }

  const block = {
    _type: 'block',
    _key: ctx.key('block'),
    style: ctx.style,
    markDefs,
    children: merged.map((s) => ({
      _type: 'span',
      _key: ctx.key('span'),
      text: s.text,
      marks: s.marks,
    })),
  }
  if (ctx.listItem) {
    block.listItem = ctx.listItem
    block.level = ctx.level
    ctx.notes.listItems += 1
  }
  if (ctx.style !== 'normal' && ctx.style !== 'blockquote') ctx.notes.headingCount += 1
  ctx.out.push(block)
}

/** Normalise an href into an internal path, an external URL, or a rejection. */
function classifyHref(rawHref) {
  const href = decodeEntities(String(rawHref ?? '').trim()).text
  if (!href) return { kind: 'drop', reason: 'empty href' }
  if (BAD_SCHEME.test(href)) return { kind: 'drop', reason: `unsafe scheme: ${href.slice(0, 40)}` }
  if (href.startsWith('#')) return { kind: 'drop', reason: 'in-page anchor only' }
  if (/^(mailto|tel):/i.test(href)) return { kind: 'external', href }

  if (/^https?:\/\//i.test(href)) {
    let url
    try {
      url = new URL(href)
    } catch {
      return { kind: 'drop', reason: `unparseable URL: ${href.slice(0, 60)}` }
    }
    if (SITE_HOSTS.has(url.hostname.toLowerCase())) {
      return { kind: 'internal', legacyPath: normaliseLegacyPath(url.pathname), rawHref: href }
    }
    return { kind: 'external', href: url.toString() }
  }
  if (href.startsWith('/')) {
    return { kind: 'internal', legacyPath: normaliseLegacyPath(href.split(/[?#]/)[0]), rawHref: href }
  }
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    return { kind: 'drop', reason: `unsupported scheme: ${href.slice(0, 40)}` }
  }
  // Protocol-relative or bare relative path.
  if (href.startsWith('//')) {
    const url = `https:${href}`
    try {
      const parsed = new URL(url)
      if (SITE_HOSTS.has(parsed.hostname.toLowerCase())) {
        return { kind: 'internal', legacyPath: normaliseLegacyPath(parsed.pathname), rawHref: href }
      }
      return { kind: 'external', href: parsed.toString() }
    } catch {
      return { kind: 'drop', reason: 'unparseable protocol-relative URL' }
    }
  }
  return { kind: 'internal', legacyPath: normaliseLegacyPath(`/${href.split(/[?#]/)[0]}`), rawHref: href }
}

/** `/Universiteler/Foo` -> `/universiteler/foo/` so it matches the inventory. */
export function normaliseLegacyPath(pathname) {
  let p = decodeURIComponent(String(pathname ?? '/')).trim()
  if (!p.startsWith('/')) p = `/${p}`
  p = p.replace(/\/{2,}/g, '/')
  if (!p.endsWith('/')) p = `${p}/`
  return p.toLowerCase()
}

/* ------------------------------------------------------------------- the walker */

function plainOf(node) {
  if (!node) return ''
  if (node.type === 'text') return decodeEntities(node.value).text
  if (DROP_SUBTREE.has(node.tag)) return ''
  return (node.children ?? []).map(plainOf).join('')
}

function cellText(node, ctx) {
  const raw = (node.children ?? []).map(plainOf).join('')
  const cleaned = normaliseWhitespace(decodeEntities(raw).text).trim()
  // Links inside table cells cannot survive: the schema's cells are plain strings.
  const links = []
  ;(function scan(n) {
    if (n.type === 'element') {
      if (n.tag === 'a' && n.attrs.href) links.push(n.attrs.href)
      ;(n.children ?? []).forEach(scan)
    }
  })(node)
  ctx.notes.tableLinksFlattened += links.length
  return cleaned
}

function buildTable(node, ctx, caption) {
  const rows = []
  ;(function scan(n) {
    if (n.type !== 'element') return
    if (n.tag === 'tr') {
      const cells = []
      ;(function scanCells(m) {
        if (m.type !== 'element') return
        if (m.tag === 'td' || m.tag === 'th') {
          cells.push({ header: m.tag === 'th', text: cellText(m, ctx) })
          return
        }
        ;(m.children ?? []).forEach(scanCells)
      })(n)
      if (cells.length) rows.push({ cells, inHead: n._inHead === true })
      return
    }
    if (n.tag === 'thead') {
      ;(n.children ?? []).forEach((c) => {
        if (c.type === 'element' && c.tag === 'tr') c._inHead = true
      })
    }
    ;(n.children ?? []).forEach(scan)
  })(node)

  if (!rows.length) return null

  let headerRow = rows.find((r) => r.inHead) ?? null
  if (!headerRow && rows[0].cells.every((c) => c.header)) headerRow = rows[0]
  if (!headerRow) headerRow = rows[0] // schema requires at least one header
  const bodyRows = rows.filter((r) => r !== headerRow)

  ctx.notes.tables += 1
  return {
    _type: 'table',
    _key: ctx.key('table'),
    ...(caption ? { caption } : {}),
    headers: headerRow.cells.map((c) => c.text),
    rows: bodyRows.map((r) => ({
      _type: 'row',
      _key: ctx.key('row'),
      cells: r.cells.map((c) => c.text),
    })),
  }
}

function walk(nodes, ctx) {
  for (const node of nodes ?? []) {
    if (node.type === 'text') {
      const text = cleanTextNode(node.value, ctx.notes)
      if (text) ctx.buffer.spans.push({ text, marks: [...ctx.marks] })
      continue
    }
    if (node.type !== 'element') continue

    const tag = node.tag
    if (DROP_SUBTREE.has(tag)) {
      ctx.notes.droppedSubtrees.push(tag)
      continue
    }
    if (isChrome(node)) {
      ctx.notes.droppedChrome += 1
      continue
    }

    if (INLINE_TAGS.has(tag)) {
      if (tag === 'a') {
        walkAnchor(node, ctx)
        continue
      }
      const add =
        tag === 'strong' || tag === 'b' ? 'strong' : tag === 'em' || tag === 'i' ? 'em' : null
      if (add && !ctx.marks.includes(add)) {
        ctx.marks.push(add)
        walk(node.children, ctx)
        ctx.marks.pop()
      } else walk(node.children, ctx)
      continue
    }

    switch (tag) {
      case 'br':
        // Elementor writes label/value pairs as one paragraph split by <br>.
        // Splitting into blocks keeps them readable instead of one run-on line.
        flush(ctx)
        break

      case 'hr':
        flush(ctx)
        break

      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        flush(ctx)
        const style = HEADING_STYLE[tag]
        if (style !== tag) {
          ctx.notes.headingsDemoted.push({ from: tag, to: style, text: normaliseWhitespace(plainOf(node)).trim().slice(0, 80) })
        }
        const prev = ctx.style
        ctx.style = style
        walk(node.children, ctx)
        flush(ctx)
        ctx.style = prev
        break
      }

      case 'blockquote': {
        flush(ctx)
        const prev = ctx.style
        ctx.style = 'blockquote'
        walk(node.children, ctx)
        flush(ctx)
        ctx.style = prev
        break
      }

      case 'ul': case 'ol': {
        flush(ctx)
        const prevItem = ctx.listItem
        const prevLevel = ctx.level
        const prevStyle = ctx.style
        ctx.listItem = tag === 'ol' ? 'number' : 'bullet'
        ctx.level = prevItem ? prevLevel + 1 : 1
        ctx.style = 'normal'
        for (const child of node.children ?? []) {
          if (child.type === 'element' && child.tag === 'li') {
            walk(child.children, ctx)
            flush(ctx)
          } else walk([child], ctx)
        }
        flush(ctx)
        ctx.listItem = prevItem
        ctx.level = prevLevel
        ctx.style = prevStyle
        break
      }

      case 'li':
        // Stray <li> outside a list.
        walk(node.children, ctx)
        flush(ctx)
        break

      case 'table': {
        flush(ctx)
        const captionNode = (node.children ?? []).find((c) => c.type === 'element' && c.tag === 'caption')
        const caption =
          normaliseWhitespace(plainOf(captionNode)).trim() || ctx.pendingCaption || ''
        const table = buildTable(node, ctx, caption)
        if (table) ctx.out.push(table)
        ctx.pendingCaption = ''
        break
      }

      case 'figure': {
        flush(ctx)
        const capNode = (node.children ?? []).find((c) => c.type === 'element' && c.tag === 'figcaption')
        ctx.pendingCaption = normaliseWhitespace(plainOf(capNode)).trim()
        walk((node.children ?? []).filter((c) => c !== capNode), ctx)
        flush(ctx)
        ctx.pendingCaption = ''
        break
      }

      case 'figcaption':
        break

      case 'img': {
        flush(ctx)
        const src = decodeEntities(node.attrs.src ?? '').text.trim()
        if (src && !BAD_SCHEME.test(src)) {
          const alt = normaliseWhitespace(decodeEntities(node.attrs.alt ?? '').text).trim()
          ctx.notes.images.push({ src, alt })
          ctx.out.push({
            _type: 'imagePlaceholder',
            _key: ctx.key('image'),
            src,
            alt,
            ...(ctx.pendingCaption ? { caption: ctx.pendingCaption } : {}),
          })
        }
        break
      }

      case 'p': case 'div': case 'section': case 'article': case 'header': case 'footer':
      case 'main': case 'aside': case 'dl': case 'dt': case 'dd': case 'address':
      case 'pre': case 'details': case 'summary': case 'fieldset': case 'legend': {
        flush(ctx)
        const prev = ctx.style
        if (tag === 'p' && ctx.style !== 'blockquote') ctx.style = 'normal'
        walk(node.children, ctx)
        flush(ctx)
        ctx.style = prev
        break
      }

      default:
        walk(node.children, ctx)
    }
  }
}

function walkAnchor(node, ctx) {
  const result = classifyHref(node.attrs.href)
  if (result.kind === 'drop') {
    ctx.notes.droppedLinks.push({ href: String(node.attrs.href ?? ''), reason: result.reason })
    walk(node.children, ctx)
    return
  }

  const defKey = ctx.key('mark')
  if (result.kind === 'internal') {
    ctx.notes.internalLinks.push({ legacyPath: result.legacyPath, rawHref: result.rawHref })
    ctx.buffer.defs.push({
      _type: 'internalLinkPlaceholder',
      _key: defKey,
      legacyPath: result.legacyPath,
      rawHref: result.rawHref,
    })
  } else {
    ctx.notes.externalLinks.push(result.href)
    ctx.buffer.defs.push({ _type: 'externalLink', _key: defKey, href: result.href })
  }
  ctx.marks.push(defKey)
  walk(node.children, ctx)
  ctx.marks.pop()
}

/* --------------------------------------------------------------------- entry point */

/**
 * @param {string} html raw `content.rendered` from the WordPress export
 * @param {{ scope: string }} options `scope` seeds the deterministic keys; use the
 *        legacy WordPress id so keys are stable across runs and unique across docs.
 */
export function htmlToPortableText(html, options) {
  const scope = options?.scope ?? 'doc'
  const ctx = {
    key: keyer(scope),
    notes: newNotes(),
    out: [],
    buffer: { spans: [], defs: [] },
    marks: [],
    style: 'normal',
    listItem: null,
    level: 1,
    pendingCaption: '',
  }

  const root = parseHtml(String(html ?? ''))
  walk(root.children, ctx)
  flush(ctx)

  const plain = blocksToPlain(ctx.out)
  const defects = detectCopyDefects(plain)

  return {
    blocks: ctx.out,
    plain,
    words: countWords(plain),
    notes: {
      ...ctx.notes,
      unresolvedEntities: [...new Set(ctx.notes.unresolvedEntities)],
      shortcodes: [...new Set(ctx.notes.shortcodes)],
      droppedSubtrees: [...new Set(ctx.notes.droppedSubtrees)],
      ...defects,
    },
  }
}

/** Plain text of a Portable Text array, used for word counts and excerpts. */
export function blocksToPlain(blocks) {
  const parts = []
  for (const block of blocks ?? []) {
    if (block._type === 'block') {
      parts.push((block.children ?? []).map((c) => c.text ?? '').join(''))
    } else if (block._type === 'table') {
      if (block.caption) parts.push(block.caption)
      parts.push((block.headers ?? []).join(' '))
      for (const row of block.rows ?? []) parts.push((row.cells ?? []).join(' '))
    } else if (block._type === 'imagePlaceholder' && block.caption) {
      parts.push(block.caption)
    }
  }
  return parts.join('\n').trim()
}

/** Heading texts, used by report.mjs to prove the outline survived. */
export function headingsOf(blocks) {
  return (blocks ?? [])
    .filter((b) => b._type === 'block' && ['h2', 'h3', 'h4'].includes(b.style))
    .map((b) => ({ style: b.style, text: (b.children ?? []).map((c) => c.text).join('').trim() }))
}

/* --------------------------------------------------------------------------- CLI */

function selfTest() {
  const checks = []
  const check = (name, condition, detail) => {
    checks.push({ name, ok: Boolean(condition), detail })
  }

  const a = htmlToPortableText(
    '<div class="elementor-widget"><h1>Başlık</h1><p><span style="font-weight: 400;">Metin</span></p></div>',
    { scope: 't1' },
  )
  check('h1 demoted to h2', a.blocks[0]?.style === 'h2', a.blocks[0]?.style)
  check('inline style span unwrapped', a.blocks[1]?.children?.[0]?.text === 'Metin', JSON.stringify(a.blocks[1]))
  check('demotion reported', a.notes.headingsDemoted.length === 1)

  const b = htmlToPortableText('<p><a href="javascript:alert(1)">tıkla</a></p>', { scope: 't2' })
  check('javascript: href dropped', b.blocks[0].markDefs.length === 0 && b.blocks[0].children[0].text === 'tıkla')
  check('drop reported', b.notes.droppedLinks.length === 1)

  const c = htmlToPortableText('<p><a href="data:text/html,x">x</a></p>', { scope: 't3' })
  check('data: href dropped', c.blocks[0].markDefs.length === 0)

  const d = htmlToPortableText(
    '<p><a href="https://happyeducation.uk/universiteler/foo/">iç</a> ve <a href="https://example.com/a">dış</a></p>',
    { scope: 't4' },
  )
  check('internal + external annotations', d.blocks[0].markDefs.length === 2)
  check(
    'internal placeholder path normalised',
    d.blocks[0].markDefs.find((m) => m._type === 'internalLinkPlaceholder')?.legacyPath ===
      '/universiteler/foo/',
  )

  const e = htmlToPortableText('<p>7 - 8 G&uuml;n &rsquo;test&#8217;</p>', { scope: 't5' })
  check('entities decoded', e.blocks[0].children[0].text === '7 - 8 Gün ’test’', e.blocks[0].children[0].text)

  const f = htmlToPortableText('<p>[learn_press_single_instructor]Metin</p>', { scope: 't6' })
  check('shortcode stripped', f.blocks[0].children[0].text === 'Metin', f.blocks[0]?.children?.[0]?.text)

  const g = htmlToPortableText(
    '<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>',
    { scope: 't7' },
  )
  check('table converted', g.blocks[0]._type === 'table' && g.blocks[0].headers.length === 2 && g.blocks[0].rows.length === 1)

  const h = htmlToPortableText('<ul><li>bir</li><li>iki<ul><li>alt</li></ul></li></ul>', { scope: 't8' })
  const items = h.blocks.filter((x) => x.listItem)
  check('list items with levels', items.length === 3 && items[2].level === 2, JSON.stringify(items.map((i) => i.level)))

  const i1 = htmlToPortableText('<p>Konum: <b>Londra</b><br />Kuruluş: <b>1837</b></p>', { scope: 't9' })
  check('br splits a paragraph', i1.blocks.length === 2, i1.blocks.length)

  const j = htmlToPortableText('<script>alert(1)</script><style>p{}</style><iframe src="x"></iframe><p>ok</p>', { scope: 't10' })
  check('script/style/iframe removed', j.blocks.length === 1 && j.blocks[0].children[0].text === 'ok')

  const k1 = htmlToPortableText('<p>Bir</p><p>İki</p>', { scope: 'stable' })
  const k2 = htmlToPortableText('<p>Bir</p><p>İki</p>', { scope: 'stable' })
  check('keys are deterministic', JSON.stringify(k1.blocks) === JSON.stringify(k2.blocks))

  const l = htmlToPortableText(
    '<div class="ekit-heading__shadow-text">Amerika</div><div class="elementor-button-wrapper"><a class="elementor-button" href="/x/">Bilgi ve Kayıt</a></div><p>gövde</p>',
    { scope: 't11' },
  )
  check('chrome dropped', l.blocks.length === 1 && l.blocks[0].children[0].text === 'gövde', JSON.stringify(l.blocks))

  const m = htmlToPortableText('<p><strong>Öne çıkan bölümler</strong></p><p>Uzun bir cümle burada yer alıyor.</p>', { scope: 't12' })
  check('bold pseudo-heading detected', m.notes.boldPseudoHeadings === 1, m.notes.boldPseudoHeadings)

  const failed = checks.filter((c) => !c.ok)
  for (const c of checks) {
    console.log(`${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.ok ? '' : ` -> ${c.detail ?? ''}`}`)
  }
  console.log(`\n${checks.length - failed.length}/${checks.length} passed`)
  process.exitCode = failed.length ? 1 : 0
}

function convertOne(wpId) {
  const files = ['pages.ndjson', 'posts.ndjson']
  for (const file of files) {
    const docs = parseNdjson(readFileSync(path.join(REPO, 'docs/audit/archive/wp', file), 'utf8'))
    const doc = docs.find((d) => String(d.id) === String(wpId))
    if (!doc) continue
    const result = htmlToPortableText(doc.content?.rendered ?? '', { scope: `wp-${doc.id}` })
    console.log(JSON.stringify({ id: doc.id, link: doc.link, words: result.words, notes: result.notes, blocks: result.blocks }, null, 2))
    return
  }
  console.error(`No WordPress document with id ${wpId}`)
  process.exitCode = 1
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2)
  if (args.includes('--self-test')) selfTest()
  else if (args.includes('--wp-id')) convertOne(args[args.indexOf('--wp-id') + 1])
  else {
    console.log('Usage: html-to-portable-text.mjs --self-test | --wp-id <wordpress id>')
  }
}
