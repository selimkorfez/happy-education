import { BUSINESS, publicValue } from '@/lib/business-facts'
import { siteUrl } from '@/lib/env'
import type { Locale } from '@/lib/i18n/config'

/**
 * Email rendering.
 *
 * Constraints that shaped this, in order of how much they cost:
 *
 *   - NO TABLES. The brief asks for a table-free layout, so the structure is
 *     stacked block-level `div`s with inline styles. Outlook's Word engine ignores
 *     `max-width`, so on Outlook desktop the content runs to the window width
 *     instead of sitting in a 560px column. That is a legibility trade, not a
 *     breakage: text, spacing and colour all survive, and there is no multi-column
 *     layout to collapse.
 *   - NO IMAGES. No logo file, no tracking pixel, no spacer. Images are blocked by
 *     default in most clients, and a tracking pixel in a transactional email is a
 *     consent problem nobody needs.
 *   - NO WEB FONTS. Fraunces and Figtree are not available in mail, so headings use
 *     Georgia and body copy uses a plain sans stack. The palette carries the brand.
 *   - INLINE STYLES ONLY. Gmail strips `<style>` blocks in several contexts.
 *
 * Every value passed in is HTML-escaped here rather than at the call site, so a
 * template cannot forget.
 */

const PALETTE = {
  page: '#F2EDE4',
  card: '#FFFFFF',
  ink: '#232326',
  body: '#1B1B1D',
  muted: '#56565C',
  accent: '#B8490A',
  accentFill: '#F47426',
  border: '#DED7CB',
} as const

const FONT_BODY =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
const FONT_HEADING = "Georgia, 'Times New Roman', serif"

export type EmailBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  /** A label/value pair, used for the details of a submitted enquiry. */
  | { type: 'detail'; label: string; value: string }
  /** A prominent link. Rendered as a bordered block anchor, never as an image button. */
  | { type: 'action'; href: string; label: string }
  /** The same URL in full, for clients that hide the anchor target. */
  | { type: 'plainUrl'; href: string }
  | { type: 'note'; text: string }
  | { type: 'divider' }

export interface EmailDocument {
  locale: Locale
  /** Shown in the inbox preview line, after the subject. */
  preheader: string
  title: string
  blocks: readonly EmailBlock[]
  /** Overrides the default legal footer text where a message needs its own. */
  footerNote?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/**
 * Only http(s) and mailto links are ever emitted. A template building a link from
 * stored content cannot turn it into `javascript:` or `data:`.
 */
function safeHref(href: string): string {
  const trimmed = href.trim()
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed) || /^tel:/i.test(trimmed)) {
    return escapeHtml(trimmed)
  }
  return escapeHtml(siteUrl)
}

/** Newlines in a submitted message must survive into the HTML part. */
function escapeMultiline(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br />')
}

function renderBlockHtml(block: EmailBlock): string {
  switch (block.type) {
    case 'heading':
      return `<h2 style="margin:28px 0 10px;font-family:${FONT_HEADING};font-size:18px;line-height:1.3;font-weight:600;color:${PALETTE.ink};">${escapeHtml(block.text)}</h2>`

    case 'paragraph':
      return `<p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:16px;line-height:1.6;color:${PALETTE.body};">${escapeMultiline(block.text)}</p>`

    case 'note':
      return `<p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:14px;line-height:1.6;color:${PALETTE.muted};">${escapeMultiline(block.text)}</p>`

    case 'detail':
      return [
        `<div style="margin:0 0 12px;padding:0 0 12px;border-bottom:1px solid ${PALETTE.border};">`,
        `<div style="font-family:${FONT_BODY};font-size:13px;line-height:1.4;font-weight:700;color:${PALETTE.muted};text-transform:uppercase;letter-spacing:0.04em;">${escapeHtml(block.label)}</div>`,
        `<div style="margin-top:4px;font-family:${FONT_BODY};font-size:16px;line-height:1.55;color:${PALETTE.body};">${escapeMultiline(block.value)}</div>`,
        `</div>`,
      ].join('')

    case 'action':
      return [
        `<div style="margin:22px 0;">`,
        `<a href="${safeHref(block.href)}" style="display:inline-block;padding:13px 22px;background-color:${PALETTE.accent};border-radius:3px;font-family:${FONT_BODY};font-size:16px;font-weight:700;color:#FFFFFF;text-decoration:none;">${escapeHtml(block.label)}</a>`,
        `</div>`,
      ].join('')

    case 'plainUrl':
      return `<p style="margin:0 0 14px;font-family:${FONT_BODY};font-size:13px;line-height:1.5;color:${PALETTE.muted};word-break:break-all;"><a href="${safeHref(block.href)}" style="color:${PALETTE.accent};">${escapeHtml(block.href)}</a></p>`

    case 'divider':
      return `<div style="margin:24px 0;border-top:1px solid ${PALETTE.border};line-height:1px;font-size:1px;">&nbsp;</div>`
  }
}

function renderBlockText(block: EmailBlock): string {
  switch (block.type) {
    case 'heading':
      return `\n${block.text.toUpperCase()}\n`
    case 'paragraph':
    case 'note':
      return block.text
    case 'detail':
      return `${block.label}: ${block.value}`
    case 'action':
      return `${block.label}: ${block.href}`
    case 'plainUrl':
      return block.href
    case 'divider':
      return '---'
  }
}

/** Company identification, required on business correspondence in the UK. */
function legalFooterLines(): string[] {
  const legalName = publicValue(BUSINESS.legalName)
  const number = publicValue(BUSINESS.companyNumber)
  const office = publicValue(BUSINESS.registeredOffice)
  const lines: string[] = []

  if (legalName && number) {
    lines.push(`${legalName}. Registered in England and Wales, company number ${number}.`)
  } else if (legalName) {
    lines.push(`${legalName}.`)
  }
  // Labelled as the registered office and never as a place to visit: it is a
  // serviced address, not a staffed office.
  if (office) lines.push(`Registered office: ${office}`)
  return lines
}

export interface RenderedEmail {
  html: string
  text: string
}

export function renderEmail(doc: EmailDocument): RenderedEmail {
  const footerLines = doc.footerNote
    ? [doc.footerNote, ...legalFooterLines()]
    : legalFooterLines()

  const body = doc.blocks.map(renderBlockHtml).join('')

  const html = [
    `<!doctype html>`,
    `<html lang="${escapeHtml(doc.locale)}"><head><meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width,initial-scale=1" />`,
    `<meta name="color-scheme" content="light" />`,
    `<title>${escapeHtml(doc.title)}</title></head>`,
    `<body style="margin:0;padding:0;background-color:${PALETTE.page};">`,
    // Preheader: shown in the inbox list, hidden in the opened message.
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;font-size:1px;line-height:1px;">${escapeHtml(doc.preheader)}</div>`,
    `<div style="padding:24px 16px;background-color:${PALETTE.page};">`,
    `<div style="max-width:560px;margin:0 auto;background-color:${PALETTE.card};border:1px solid ${PALETTE.border};border-top:4px solid ${PALETTE.accentFill};border-radius:3px;">`,
    `<div style="padding:28px 26px 8px;">`,
    `<div style="font-family:${FONT_HEADING};font-size:20px;font-weight:600;letter-spacing:-0.01em;color:${PALETTE.ink};">Happy Education</div>`,
    `<h1 style="margin:14px 0 18px;font-family:${FONT_HEADING};font-size:24px;line-height:1.25;font-weight:600;color:${PALETTE.ink};">${escapeHtml(doc.title)}</h1>`,
    body,
    `</div>`,
    `<div style="padding:18px 26px 24px;border-top:1px solid ${PALETTE.border};">`,
    ...footerLines.map(
      (line) =>
        `<p style="margin:0 0 6px;font-family:${FONT_BODY};font-size:12px;line-height:1.5;color:${PALETTE.muted};">${escapeHtml(line)}</p>`,
    ),
    `</div>`,
    `</div>`,
    `</div>`,
    `</body></html>`,
  ].join('')

  const text = [
    'Happy Education',
    '',
    doc.title,
    '',
    ...doc.blocks.map(renderBlockText),
    '',
    '---',
    ...footerLines,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

  return { html, text }
}
