import { Nunito_Sans } from 'next/font/google'

/**
 * Client-approved brand typeface.
 *
 * next/font downloads and self-hosts the variable font at build time, so the
 * public site makes no request to Google Fonts. latin-ext covers the complete
 * Turkish alphabet used by the bilingual site.
 */
export const nunitoSans = Nunito_Sans({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-nunito-sans',
  style: ['normal', 'italic'],
  fallback: ['Avenir Next', 'Segoe UI', 'Helvetica Neue', 'Arial', 'sans-serif'],
  adjustFontFallback: true,
})

/** Applied to <html> so the CSS custom properties resolve document-wide. */
export const fontVariables = nunitoSans.variable
