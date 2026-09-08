import 'server-only'

import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { Locale } from '@/lib/i18n/config'
import { legalLabel, legalSlug, type LegalKey } from '@/lib/legal'
import type { ProseDoc } from '@/lib/sanity/queries/content'

/**
 * Pre-Sanity fallback for the legal drafts in content/legal/{en,tr}.
 *
 * Sanity remains the canonical publishing source. This loader only answers when a
 * legalPage is missing from Sanity, which keeps preview/staging usable before the
 * legal documents have been imported and reviewed in Studio.
 *
 * The markdown files are deliberately marked solicitorApproved:false. The legal
 * template therefore displays its draft warning and route metadata keeps the page
 * noindex until an approved Sanity document replaces the fallback.
 */

const FILE_BY_KEY: Record<LegalKey, string> = {
  privacy: 'privacy',
  cookies: 'cookies',
  terms: 'terms',
  serviceTerms: 'serviceTerms',
  paymentTerms: 'paymentTerms',
  refunds: 'refunds',
  appointments: 'appointments',
  disclaimer: 'disclaimer',
  accessibility: 'accessibility',
  complaints: 'complaints',
  safeguarding: 'safeguarding',
}

type FrontMatter = Record<string, string | boolean | string[]>

type PortableSpan = {
  _type: 'span'
  _key: string
  text: string
  marks: string[]
}

type PortableBlock = {
  _type: 'block'
  _key: string
  style: string
  markDefs: Array<{ _type: 'externalLink'; _key: string; href: string }>
  children: PortableSpan[]
  listItem?: 'bullet' | 'number'
  level?: number
}

type PortableTable = {
  _type: 'table'
  _key: string
  headers: string[]
  rows: Array<{ _type: 'row'; _key: string; cells: string[] }>
}

function keyer(prefix: string) {
  let n = 0
  return () => `${prefix}${(n++).toString(36)}`
}

function parseFrontMatter(raw: string): { data: FrontMatter; body: string } {
  if (!raw.startsWith('---\n')) return { data: {}, body: raw }
  const end = raw.indexOf('\n---', 4)
  if (end === -1) return { data: {}, body: raw }

  const head = raw.slice(4, end)
  const body = raw.slice(raw.indexOf('\n', end + 1) + 1)
  const data: FrontMatter = {}

  for (const line of head.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const colon = trimmed.indexOf(':')
    if (colon === -1) continue

    const name = trimmed.slice(0, colon).trim()
    let value: string | boolean | string[] = trimmed.slice(colon + 1).trim()

    if (typeof value === 'string' && value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter(Boolean)
    } else if (value === 'true' || value === 'false') {
      value = value === 'true'
    } else if (typeof value === 'string') {
      value = value.replace(/^['"]|['"]$/g, '')
    }

    data[name] = value
  }

  return { data, body }
}

const INLINE = /(\*\*(.+?)\*\*)|(\[(.+?)\]\((.+?)\))|(\*(.+?)\*)/g

function inlineToSpans(
  text: string,
  nextKey: () => string,
  nextDefKey: () => string,
): Pick<PortableBlock, 'children' | 'markDefs'> {
  const children: PortableSpan[] = []
  const markDefs: PortableBlock['markDefs'] = []
  let cursor = 0

  const push = (value: string, marks: string[]) => {
    if (!value) return
    children.push({ _type: 'span', _key: nextKey(), text: value, marks })
  }

  for (const match of text.matchAll(INLINE)) {
    if ((match.index ?? 0) > cursor) push(text.slice(cursor, match.index), [])

    if (match[1] !== undefined) {
      push(match[2] ?? '', ['strong'])
    } else if (match[3] !== undefined) {
      const label = match[4] ?? ''
      const href = (match[5] ?? '').trim()
      if (!/^(https?:|mailto:|tel:)/.test(href)) {
        push(label, [])
      } else {
        const defKey = nextDefKey()
        markDefs.push({ _type: 'externalLink', _key: defKey, href })
        push(label, [defKey])
      }
    } else {
      push(match[7] ?? '', ['em'])
    }

    cursor = (match.index ?? 0) + match[0].length
  }

  if (cursor < text.length) push(text.slice(cursor), [])
  if (children.length === 0) push(' ', [])
  return { children, markDefs }
}

function stripInline(text: string): string {
  return text
    .replace(/\[(.+?)\]\((.+?)\)/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .trim()
}

/** Mirrors scripts/seed-legal.mjs so fallback rendering matches Sanity import. */
function markdownToPortableText(markdown: string): Array<PortableBlock | PortableTable> {
  const blocks: Array<PortableBlock | PortableTable> = []
  const nextBlockKey = keyer('b')
  const nextSpanKey = keyer('s')
  const nextDefKey = keyer('l')
  const lines = markdown.replace(/<!--[\s\S]*?-->/g, '').split('\n')

  const textBlock = (style: string, text: string, listItem?: 'bullet' | 'number') => {
    const { children, markDefs } = inlineToSpans(text, nextSpanKey, nextDefKey)
    const block: PortableBlock = {
      _type: 'block',
      _key: nextBlockKey(),
      style,
      markDefs,
      children,
    }
    if (listItem) {
      block.listItem = listItem
      block.level = 1
    }
    blocks.push(block)
  }

  let paragraph: string[] = []
  const flushParagraph = () => {
    if (paragraph.length === 0) return
    textBlock('normal', paragraph.join(' ').trim())
    paragraph = []
  }

  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim()

    if (!trimmed) {
      flushParagraph()
      continue
    }

    if (trimmed.startsWith('|')) {
      flushParagraph()
      const rows: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(lines[i].trim())
        i += 1
      }
      i -= 1

      const cellsOf = (row: string) =>
        row
          .replace(/^\||\|$/g, '')
          .split('|')
          .map((cell) => stripInline(cell))

      const headers = cellsOf(rows[0] ?? '')
      const body = rows.slice(1).filter((row) => !/^\|[\s:|-]+\|$/.test(row))
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
      const style = depth >= 4 ? 'h4' : `h${Math.max(2, depth)}`
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

function stringValue(data: FrontMatter, key: string): string | undefined {
  const value = data[key]
  return typeof value === 'string' ? value : undefined
}

export function getLocalLegalPage(locale: Locale, key: LegalKey): ProseDoc | null {
  const fileName = FILE_BY_KEY[key]
  const filePath = path.join(process.cwd(), 'content', 'legal', locale, `${fileName}.md`)

  try {
    const raw = readFileSync(filePath, 'utf8')
    const { data, body } = parseFrontMatter(raw)
    const slug = stringValue(data, 'slug') ?? legalSlug(locale, key)
    const title = stringValue(data, 'title') ?? legalLabel(locale, key)
    const declaredLocale = stringValue(data, 'locale')
    const declaredKey = stringValue(data, 'key')

    if (declaredLocale && declaredLocale !== locale) return null
    if (declaredKey && declaredKey !== key) return null

    return {
      _id: `local-legal.${key}.${locale}`,
      title,
      slug,
      locale,
      seo: {
        description: stringValue(data, 'summary'),
        noIndex: true,
      },
      body: markdownToPortableText(body),
      effectiveDate: stringValue(data, 'effectiveDate'),
      solicitorApproved: data.solicitorApproved === true,
    }
  } catch {
    return null
  }
}
