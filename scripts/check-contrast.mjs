/**
 * Design-system guard: verifies foreground/background pairings used by the Happy
 * Education visual system meet WCAG 2.2 AA. Decorative gradients and translucent
 * layers are never relied on for text contrast: text is paired with a known solid
 * token beneath it.
 */

const TOKENS = {
  'paper': '#FBFAF8',
  'paper-sunk': '#F4F1EB',
  'card': '#FFFFFF',
  'ink-surface': '#232326',
  'ink-surface-soft': '#313135',
  'brand-soft': '#FFF0E5',
  'sky-soft': '#EDF5FF',
  'mint-soft': '#EEF8F3',
  'lilac-soft': '#F5F0FF',

  'fg': '#1B1B1D',
  'fg-muted': '#56565C',
  'fg-on-ink': '#F5F2EC',
  'fg-muted-on-ink': '#B4B2AE',

  'brand': '#F47426',
  'brand-strong': '#B8490A',
  'brand-pressed': '#8A3706',
  'brand-on-ink': '#F79A4A',

  'success': '#1F6B45',
  'warning': '#8A5A05',
  'error': '#A32319',
  'focus': '#1F5FBF',

  'border': '#E4DED5',
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

const REQUIRED = [
  { fg: 'fg', bg: 'paper', min: 4.5, use: 'body text on page' },
  { fg: 'fg', bg: 'paper-sunk', min: 4.5, use: 'body text on sunk surface' },
  { fg: 'fg', bg: 'card', min: 4.5, use: 'body text on card' },
  { fg: 'fg-muted', bg: 'paper', min: 4.5, use: 'secondary text on page' },
  { fg: 'fg-muted', bg: 'paper-sunk', min: 4.5, use: 'secondary text on sunk surface' },
  { fg: 'fg-muted', bg: 'card', min: 4.5, use: 'secondary text on card' },

  // Soft modern surfaces used by cards and pills.
  { fg: 'fg', bg: 'brand-soft', min: 4.5, use: 'body text on warm brand tint' },
  { fg: 'fg-muted', bg: 'brand-soft', min: 4.5, use: 'secondary text on warm brand tint' },
  { fg: 'brand-strong', bg: 'brand-soft', min: 4.5, use: 'brand label on warm brand tint' },
  { fg: 'fg', bg: 'sky-soft', min: 4.5, use: 'body text on sky tint' },
  { fg: 'fg-muted', bg: 'sky-soft', min: 4.5, use: 'secondary text on sky tint' },
  { fg: 'brand-strong', bg: 'sky-soft', min: 4.5, use: 'brand label on sky tint' },
  { fg: 'fg', bg: 'mint-soft', min: 4.5, use: 'body text on mint tint' },
  { fg: 'fg-muted', bg: 'mint-soft', min: 4.5, use: 'secondary text on mint tint' },
  { fg: 'brand-strong', bg: 'mint-soft', min: 4.5, use: 'brand label on mint tint' },
  { fg: 'fg', bg: 'lilac-soft', min: 4.5, use: 'body text on lilac tint' },
  { fg: 'fg-muted', bg: 'lilac-soft', min: 4.5, use: 'secondary text on lilac tint' },
  { fg: 'brand-strong', bg: 'lilac-soft', min: 4.5, use: 'brand label on lilac tint' },

  { fg: 'fg-on-ink', bg: 'ink-surface', min: 4.5, use: 'body text on dark section' },
  { fg: 'fg-on-ink', bg: 'ink-surface-soft', min: 4.5, use: 'body text on soft dark' },
  { fg: 'fg-muted-on-ink', bg: 'ink-surface', min: 4.5, use: 'secondary text on dark' },

  { fg: 'brand-strong', bg: 'paper', min: 4.5, use: 'link text on page' },
  { fg: 'brand-strong', bg: 'paper-sunk', min: 4.5, use: 'link text on sunk surface' },
  { fg: 'brand-strong', bg: 'card', min: 4.5, use: 'link text on card' },
  { fg: 'card', bg: 'brand-strong', min: 4.5, use: 'label on primary button' },
  { fg: 'card', bg: 'brand-pressed', min: 4.5, use: 'label on pressed primary button' },
  { fg: 'brand-on-ink', bg: 'ink-surface', min: 4.5, use: 'link text on dark section' },

  { fg: 'success', bg: 'paper', min: 4.5, use: 'success message' },
  { fg: 'warning', bg: 'paper', min: 4.5, use: 'warning message' },
  { fg: 'error', bg: 'paper', min: 4.5, use: 'error message' },
  { fg: 'error', bg: 'card', min: 4.5, use: 'field error on card' },

  { fg: 'fg', bg: 'brand', min: 4.5, use: 'ink text on brand-orange panel' },

  { fg: 'focus', bg: 'paper', min: 3.0, use: 'focus ring on page' },
  { fg: 'focus', bg: 'card', min: 3.0, use: 'focus ring on card' },
  { fg: 'focus', bg: 'paper-sunk', min: 3.0, use: 'focus ring on sunk surface' },
  { fg: 'border-input', bg: 'paper', min: 3.0, use: 'input border on page' },
  { fg: 'border-input', bg: 'card', min: 3.0, use: 'input border on card' },
  { fg: 'border-input', bg: 'paper-sunk', min: 3.0, use: 'input border on sunk surface' },
]

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
