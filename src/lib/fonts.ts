import { Fraunces, Figtree } from 'next/font/google'

/**
 * Typography.
 *
 * Pairing rationale: the Happy Education mark is a rounded, warm, slightly soft
 * wordmark. A neutral grotesque fights it and a high-contrast Didone would feel
 * corporate. Fraunces is a soft "old-style" serif with real personality that sits
 * naturally beside the logo, and Figtree is a humanist geometric sans whose round
 * bowls echo the mark without imitating it.
 *
 * Explicitly NOT used anywhere in this project: Inter, Geist, Space Grotesk.
 *
 * Both families are self-hosted by next/font (no requests to fonts.googleapis.com,
 * which also keeps the CSP font-src limited to 'self'). The `latin` and `latin-ext`
 * subsets together cover the full Turkish set: ğĞ ıI İi şŞ çÇ öÖ üÜ.
 * `latin` carries U+0131 (ı) and the ç/ö/ü range; `latin-ext` carries U+0100-02BA,
 * which includes İ, Ğ, ğ, Ş and ş.
 */

export const fraunces = Fraunces({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-fraunces',
  // Loaded as a variable font: `weight` is omitted so the whole 100-900 range is
  // available from one file, and the extra axes can be declared. Next.js rejects
  // `axes` alongside an explicit weight list.
  style: ['normal'],
  // Fraunces ships optical-size plus "softness" and "wonk" axes. Declared here so
  // headlines can be tuned in CSS via font-variation-settings; defaults are used
  // unless a component asks for something else.
  axes: ['SOFT', 'WONK', 'opsz'],
  fallback: ['Iowan Old Style', 'Palatino Linotype', 'Georgia', 'serif'],
  adjustFontFallback: true,
})

export const figtree = Figtree({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-figtree',
  // Variable font: the full weight range ships in a single file.
  style: ['normal'],
  fallback: ['system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: true,
})

/** Applied to <html> so the CSS custom properties resolve document-wide. */
export const fontVariables = `${fraunces.variable} ${figtree.variable}`
