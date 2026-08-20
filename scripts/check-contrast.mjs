/**
 * Design-system guard: verifies every foreground/background pairing used in the
 * Happy Education design system meets WCAG 2.2 AA.
 *
 * Run: node scripts/check-contrast.mjs
 * Exits non-zero if any required pairing fails, so it can gate CI.
 */

const TOKENS = {
  // Surfaces — warm paper neutrals, never pure #ffffff as the page ground.
  'paper': '#FAF8F5',
  'paper-sunk': '#F2EDE4',
  'card': '#FFFFFF',
  'ink-surface': '#232326',
  'ink-surface-soft': '#313135',

  // Foregrounds
  'fg': '#1B1B1D',
  'fg-muted': '#56565C',
  'fg-on-ink': '#F5F2EC',
  'fg-muted-on-ink': '#B4B2AE',

  // Brand — sampled from happyedu.logo_.png (1131px original).
  // The mark sweeps #EF5D2A -> #F68E1F over a #3A3A3C wordmark.
  'brand': '#F47426', // identity/graphic use only — fails text contrast by design
  'brand-strong': '#B8490A', // interactive text + filled buttons
  'brand-pressed': '#8A3706',
  'brand-on-ink': '#F79A4A', // brand tint legible on dark surfaces

  // Status
  'success': '#1F6B45',
  'warning': '#8A5A05',
  'error': '#A32319',
  'focus': '#1F5FBF',

  // Lines
  // `border` is decorative only (hairline rules, section dividers) and carries no
  // information, so WCAG 1.4.11 does not apply to it.
  // `border-input` bounds an interactive control, so it must clear 3:1.
  'border': '#DED7CB',
  'border-input': '#8C8073',
}

function srgbToLinear(c) {
  const v = c / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

function luminance(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b)
}

function contrast(a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/**
 * @typedef {{fg: string, bg: string, min: number, use: string}} Pairing
 * `min` is the WCAG 2.2 threshold that applies:
 *   4.5 normal text, 3.0 large text (>=24px, or >=18.66px bold) and UI components/graphics.
 */
const REQUIRED = [
  // Body text on light surfaces
  { fg: 'fg', bg: 'paper', min: 4.5, use: 'body text on page' },
  { fg: 'fg', bg: 'paper-sunk', min: 4.5, use: 'body text on sunk surface' },
  { fg: 'fg', bg: 'card', min: 4.5, use: 'body text on card' },
  { fg: 'fg-muted', bg: 'paper', min: 4.5, use: 'secondary text on page' },
  { fg: 'fg-muted', bg: 'paper-sunk', min: 4.5, use: 'secondary text on sunk surface' },
  { fg: 'fg-muted', bg: 'card', min: 4.5, use: 'secondary text on card' },

  // Text on dark surfaces
  { fg: 'fg-on-ink', bg: 'ink-surface', min: 4.5, use: 'body text on dark section' },
  { fg: 'fg-on-ink', bg: 'ink-surface-soft', min: 4.5, use: 'body text on soft dark' },
  { fg: 'fg-muted-on-ink', bg: 'ink-surface', min: 4.5, use: 'secondary text on dark' },

  // Interactive
  { fg: 'brand-strong', bg: 'paper', min: 4.5, use: 'link text on page' },
  { fg: 'brand-strong', bg: 'paper-sunk', min: 4.5, use: 'link text on sunk surface' },
  { fg: 'brand-strong', bg: 'card', min: 4.5, use: 'link text on card' },
  { fg: 'card', bg: 'brand-strong', min: 4.5, use: 'label on primary button' },
  { fg: 'card', bg: 'brand-pressed', min: 4.5, use: 'label on pressed primary button' },
  { fg: 'brand-on-ink', bg: 'ink-surface', min: 4.5, use: 'link text on dark section' },

  // Status text
  { fg: 'success', bg: 'paper', min: 4.5, use: 'success message' },
  { fg: 'warning', bg: 'paper', min: 4.5, use: 'warning message' },
  { fg: 'error', bg: 'paper', min: 4.5, use: 'error message' },
  { fg: 'error', bg: 'card', min: 4.5, use: 'field error on card' },

  // Brand orange is used as a large FILL behind dark ink, never as text on paper.
  { fg: 'fg', bg: 'brand', min: 4.5, use: 'ink text on brand-orange panel' },

  // Non-text: focus ring and control boundaries must clear 3:1 (WCAG 2.2 1.4.11 / 2.4.11)
  { fg: 'focus', bg: 'paper', min: 3.0, use: 'focus ring on page' },
  { fg: 'focus', bg: 'card', min: 3.0, use: 'focus ring on card' },
  { fg: 'focus', bg: 'paper-sunk', min: 3.0, use: 'focus ring on sunk surface' },
  { fg: 'border-input', bg: 'paper', min: 3.0, use: 'input border on page' },
  { fg: 'border-input', bg: 'card', min: 3.0, use: 'input border on card' },
  { fg: 'border-input', bg: 'paper-sunk', min: 3.0, use: 'input border on sunk surface' },
]

/** Pairings we deliberately do NOT use for text. Asserted to fail, so misuse is caught. */
const FORBIDDEN_FOR_TEXT = [
  { fg: 'brand', bg: 'paper', use: 'brand orange as body text' },
  { fg: 'brand', bg: 'card', use: 'brand orange as body text on card' },
]

let failures = 0
const lines = []

lines.push('WCAG 2.2 AA — required pairings')
lines.push('-'.repeat(78))
for (const p of REQUIRED) {
  const fg = TOKENS[p.fg]
  const bg = TOKENS[p.bg]
  const ratio = contrast(fg, bg)
  const pass = ratio >= p.min
  if (!pass) failures++
  lines.push(
    `${pass ? 'PASS' : 'FAIL'}  ${ratio.toFixed(2).padStart(6)}:1  (min ${p.min.toFixed(1)})  ` +
      `${p.fg} ${fg} on ${p.bg} ${bg}  — ${p.use}`,
  )
}

lines.push('')
lines.push('Deliberately non-text pairings (expected to fail text thresholds)')
lines.push('-'.repeat(78))
for (const p of FORBIDDEN_FOR_TEXT) {
  const ratio = contrast(TOKENS[p.fg], TOKENS[p.bg])
  const correctlyFails = ratio < 4.5
  if (!correctlyFails) {
    failures++
    lines.push(`UNEXPECTED  ${ratio.toFixed(2)}:1  ${p.use} now passes — review the token intent`)
  } else {
    lines.push(`OK (unused for text)  ${ratio.toFixed(2).padStart(6)}:1  — ${p.use}`)
  }
}

lines.push('')
lines.push(failures === 0 ? `All ${REQUIRED.length} required pairings pass.` : `${failures} FAILURE(S).`)
console.log(lines.join('\n'))

process.exit(failures === 0 ? 0 : 1)
