/**
 * Text repair for the WordPress export.
 *
 * The audit (docs/audit/report-5.md §6) found the encoding damage is NOT mojibake:
 * it is legacy named HTML entities (`&uuml; &ouml; &ccedil;` — 205 occurrences in 7
 * documents, 40 of them on /turlar/ alone) plus heavy numeric entities (`&#8217;`)
 * in 8 documents including 5 blog posts. A converter that does not decode entities
 * carries them through as literal text.
 *
 * Everything here is lossless repair of *encoding*. It never rewrites a word. The
 * Turkish apostrophe defects, the misspellings and the em dashes are DETECTED and
 * reported so an editor can fix them in the Studio, because silently rewriting body
 * copy during a migration is how factual claims get changed by accident.
 */

/** Latin-1 named entities, built rather than typed out. */
const LATIN1 = [
  'nbsp', 'iexcl', 'cent', 'pound', 'curren', 'yen', 'brvbar', 'sect', 'uml', 'copy',
  'ordf', 'laquo', 'not', 'shy', 'reg', 'macr', 'deg', 'plusmn', 'sup2', 'sup3',
  'acute', 'micro', 'para', 'middot', 'cedil', 'sup1', 'ordm', 'raquo', 'frac14',
  'frac12', 'frac34', 'iquest', 'Agrave', 'Aacute', 'Acirc', 'Atilde', 'Auml',
  'Aring', 'AElig', 'Ccedil', 'Egrave', 'Eacute', 'Ecirc', 'Euml', 'Igrave',
  'Iacute', 'Icirc', 'Iuml', 'ETH', 'Ntilde', 'Ograve', 'Oacute', 'Ocirc', 'Otilde',
  'Ouml', 'times', 'Oslash', 'Ugrave', 'Uacute', 'Ucirc', 'Uuml', 'Yacute', 'THORN',
  'szlig', 'agrave', 'aacute', 'acirc', 'atilde', 'auml', 'aring', 'aelig', 'ccedil',
  'egrave', 'eacute', 'ecirc', 'euml', 'igrave', 'iacute', 'icirc', 'iuml', 'eth',
  'ntilde', 'ograve', 'oacute', 'ocirc', 'otilde', 'ouml', 'divide', 'oslash',
  'ugrave', 'uacute', 'ucirc', 'uuml', 'yacute', 'thorn', 'yuml',
]

/** @type {Record<string, string>} */
const NAMED = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", '#39': "'",
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’',
  sbquo: '‚', ldquo: '“', rdquo: '”', bdquo: '„',
  dagger: '†', Dagger: '‡', bull: '•', hellip: '…',
  permil: '‰', lsaquo: '‹', rsaquo: '›', euro: '€',
  trade: '™', minus: '−', prime: '′', Prime: '″',
  larr: '←', uarr: '↑', rarr: '→', darr: '↓',
  harr: '↔', ensp: ' ', emsp: ' ', thinsp: ' ', zwnj: '', zwj: '',
  oelig: 'œ', OElig: 'Œ', scaron: 'š', Scaron: 'Š',
  circ: 'ˆ', tilde: '˜', fnof: 'ƒ', Alpha: 'Α',
  nbsp: ' ',
}
for (let i = 0; i < LATIN1.length; i += 1) NAMED[LATIN1[i]] = String.fromCharCode(160 + i)

/** Windows-1252 code points that WordPress writes as `&#128;`-`&#159;`. */
const CP1252 = {
  128: '€', 130: '‚', 131: 'ƒ', 132: '„', 133: '…',
  134: '†', 135: '‡', 136: 'ˆ', 137: '‰', 138: 'Š',
  139: '‹', 140: 'Œ', 142: 'Ž', 145: '‘', 146: '’',
  147: '“', 148: '”', 149: '•', 150: '–', 151: '—',
  152: '˜', 153: '™', 154: 'š', 155: '›', 156: 'œ',
  158: 'ž', 159: 'Ÿ',
}

const ENTITY_RE = /&(#[0-9]+|#[xX][0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]{1,31});/g

/**
 * Decode HTML entities. Unknown named entities are left verbatim and returned in
 * `unresolved` so the QA report can name the document that still contains them.
 *
 * @param {string} input
 * @returns {{ text: string, unresolved: string[], decoded: number }}
 */
export function decodeEntities(input) {
  if (!input || input.indexOf('&') === -1) return { text: input ?? '', unresolved: [], decoded: 0 }
  const unresolved = []
  let decoded = 0
  const text = input.replace(ENTITY_RE, (whole, body) => {
    if (body[0] === '#') {
      const code =
        body[1] === 'x' || body[1] === 'X'
          ? Number.parseInt(body.slice(2), 16)
          : Number.parseInt(body.slice(1), 10)
      if (!Number.isFinite(code)) {
        unresolved.push(whole)
        return whole
      }
      decoded += 1
      if (CP1252[code]) return CP1252[code]
      if (code === 0 || code > 0x10ffff) return ''
      return String.fromCodePoint(code)
    }
    if (Object.prototype.hasOwnProperty.call(NAMED, body)) {
      decoded += 1
      return NAMED[body]
    }
    unresolved.push(whole)
    return whole
  })
  return { text, unresolved, decoded }
}

/** Patterns that only appear when UTF-8 bytes were read as Latin-1/CP1252. */
const MOJIBAKE_RE = /Ã[-¿]|Å[x-ž]|Ä[±]|â€[]|Â[ -¿]/

/**
 * Repair double-encoded UTF-8 where it is safe to do so. The audit found zero
 * occurrences in this export, but a converter that assumes clean input is a
 * converter that silently corrupts the next export.
 *
 * @param {string} input
 * @returns {{ text: string, repaired: boolean, unrepairable: boolean }}
 */
export function repairMojibake(input) {
  if (!input || !MOJIBAKE_RE.test(input)) {
    return { text: input ?? '', repaired: false, unrepairable: false }
  }
  let candidate
  try {
    candidate = Buffer.from(input, 'latin1').toString('utf8')
  } catch {
    return { text: input, repaired: false, unrepairable: true }
  }
  // A correct repair removes the pattern and introduces no replacement characters.
  if (candidate.includes('�') || MOJIBAKE_RE.test(candidate)) {
    return { text: input, repaired: false, unrepairable: true }
  }
  return { text: candidate, repaired: true, unrepairable: false }
}

/** WordPress/Elementor shortcodes: `[learn_press_single_instructor]`, `[/vc_row]`. */
const SHORTCODE_RE = /\[\/?[a-z][a-z0-9_-]*(?:\s[^\]\n]{0,300})?\]/gi

/** @param {string} input */
export function stripShortcodes(input) {
  const found = input.match(SHORTCODE_RE) ?? []
  return { text: found.length ? input.replace(SHORTCODE_RE, '') : input, found }
}

/** Turkish proper nouns the audit found written without their apostrophe. */
const TR_PROPER = [
  'Kanada', 'Amerika', 'ABD', 'Teksas', 'Manchester', 'İngiltere', 'Malta', 'İrlanda',
  'Avustralya', 'Londra', 'Oxford', 'Cambridge', 'Dublin', 'Brighton', 'Birmingham',
  'Toronto', 'Vancouver', 'Sydney', 'Melbourne', 'Dubai', 'Kıbrıs', 'Happy Education',
  'Türkiye', 'Avrupa', 'Yeni Zelanda', 'Güney Afrika', 'İskoçya', 'Galler',
]
const TR_SUFFIX =
  '(?:n[ıiuü]n|[ıiuü]n|d[ae]|t[ae]|d[ae]n|t[ae]n|y[ae]|[ae]|y[ıiuü]|[ıiuü]|l[ıi]|l[ae]r|ya|ye)'
const TR_APOSTROPHE_RE = new RegExp(
  `\\b(${TR_PROPER.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\s+(${TR_SUFFIX})\\b`,
  'g',
)

/** Misspellings the audit confirmed across the corpus. Detected, never auto-fixed. */
const MISSPELLINGS = [
  'Avusturalya', 'Cambdrige', 'Chercheston', 'Sir Micheal', 'New Zeland',
]

/**
 * Copy defects that must be fixed by a person, not by a script. Returned as notes
 * so `extract.mjs` can attach a specific `review.editorialFlag`.
 *
 * @param {string} plain plain text of the whole document
 */
export function detectCopyDefects(plain) {
  const apostrophe = []
  for (const match of plain.matchAll(TR_APOSTROPHE_RE)) {
    // "Amerika da" is also a legitimate sentence ("in America too"), so this is a
    // suspicion list for an editor, not an instruction.
    apostrophe.push(match[0])
  }
  const misspellings = MISSPELLINGS.filter((word) => plain.includes(word))
  const emDashes = (plain.match(/—/g) ?? []).length
  return {
    turkishApostropheSuspects: [...new Set(apostrophe)],
    misspellings,
    emDashes,
  }
}

/** Collapse runs of whitespace, drop zero-width characters, normalise NBSP. */
export function normaliseWhitespace(input) {
  return (input ?? '')
    .replace(/[​-‍﻿]/g, '')
    .replace(/ /g, ' ')
    .replace(/[ \t\r\n\f\v]+/g, ' ')
}

/**
 * Full text pipeline for a single text node.
 * @param {string} raw
 * @param {{ unresolvedEntities: string[], mojibakeRepaired: number, mojibakeUnrepairable: number, shortcodes: string[] }} notes
 */
export function cleanTextNode(raw, notes) {
  const shortcoded = stripShortcodes(raw)
  if (shortcoded.found.length) notes.shortcodes.push(...shortcoded.found)
  const entities = decodeEntities(shortcoded.text)
  if (entities.unresolved.length) notes.unresolvedEntities.push(...entities.unresolved)
  const moji = repairMojibake(entities.text)
  if (moji.repaired) notes.mojibakeRepaired += 1
  if (moji.unrepairable) notes.mojibakeUnrepairable += 1
  return normaliseWhitespace(moji.text)
}

/** Word count on plain text, used for the content-loss check in report.mjs. */
export function countWords(plain) {
  const trimmed = (plain ?? '').trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

/** ASCII slug that matches `slugField()` in sanity/schemas/shared.ts exactly. */
export function slugify(input) {
  return (input ?? '')
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/İ/g, 'i')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'g')
    .replace(/ş/g, 's').replace(/Ş/g, 's')
    .replace(/ç/g, 'c').replace(/Ç/g, 'c')
    .replace(/ö/g, 'o').replace(/Ö/g, 'o')
    .replace(/ü/g, 'u').replace(/Ü/g, 'u')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96)
}
