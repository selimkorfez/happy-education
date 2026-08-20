import type { Locale } from '@/lib/i18n/config'

const LOCALE_TAG: Record<Locale, string> = { en: 'en-GB', tr: 'tr-TR' }

/**
 * Dates are formatted per locale: British long form for English, Turkish
 * convention for Turkish. Always rendered from an ISO string inside a <time>
 * element so the machine-readable value survives.
 */
export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

/** Money is always shown with an explicit currency; never a bare number. */
export function formatMoney(amountMinor: number, currency: string, locale: Locale): string {
  return new Intl.NumberFormat(LOCALE_TAG[locale], {
    style: 'currency',
    currency,
  }).format(amountMinor / 100)
}

/**
 * Reading time from a word count. Uses 200 wpm, which is a reasonable average for
 * considered non-fiction. Rounded up, minimum one minute.
 */
export function readingMinutes(words: number): number {
  return Math.max(1, Math.ceil(words / 200))
}
