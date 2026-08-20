import { describe, expect, it } from 'vitest'
import { formatDate, formatMoney, readingMinutes } from '@/lib/format'

/**
 * Dates and money are locale-formatted rather than hand-assembled, so the risk is
 * not the arithmetic, it is a locale silently falling back to US conventions or an
 * invalid date rendering as "Invalid Date" on a live page.
 */

describe('formatDate', () => {
  it('uses the British long form in English', () => {
    expect(formatDate('2026-08-20', 'en')).toBe('20 August 2026')
    expect(formatDate('2026-01-05', 'en')).toBe('5 January 2026')
  })

  it('uses Turkish month names in Turkish', () => {
    expect(formatDate('2026-08-20', 'tr')).toBe('20 Ağustos 2026')
    expect(formatDate('2026-01-05', 'tr')).toBe('5 Ocak 2026')
  })

  it('never renders the American month-first order', () => {
    for (const locale of ['en', 'tr'] as const) {
      expect(formatDate('2026-08-20', locale)).not.toMatch(/^August|^Ağustos/)
    }
  })

  it('pins the timezone to UTC so a late-evening ISO stamp does not shift the day', () => {
    expect(formatDate('2026-01-05T23:30:00.000Z', 'en')).toBe('5 January 2026')
    expect(formatDate('2026-01-05T00:30:00.000Z', 'en')).toBe('5 January 2026')
  })

  it('renders nothing at all for an unparseable date', () => {
    for (const value of ['', 'not-a-date', 'tomorrow', '2026-13-45']) {
      expect(formatDate(value, 'en'), value).toBe('')
      expect(formatDate(value, 'tr'), value).toBe('')
    }
  })
})

describe('formatMoney', () => {
  it('formats minor units as major units with an explicit currency symbol', () => {
    expect(formatMoney(125000, 'GBP', 'en')).toBe('£1,250.00')
    expect(formatMoney(50, 'EUR', 'en')).toBe('€0.50')
    expect(formatMoney(0, 'GBP', 'en')).toBe('£0.00')
  })

  it('uses Turkish grouping and decimal separators in the Turkish tree', () => {
    expect(formatMoney(125000, 'GBP', 'tr')).toBe('£1.250,00')
    expect(formatMoney(99900, 'TRY', 'tr')).toBe('₺999,00')
  })

  it('never renders a bare number', () => {
    for (const locale of ['en', 'tr'] as const) {
      expect(formatMoney(1000, 'GBP', locale)).toMatch(/[£$€₺]|GBP/)
    }
  })

  it('keeps two decimal places, including for a round amount', () => {
    expect(formatMoney(100000, 'GBP', 'en')).toBe('£1,000.00')
    expect(formatMoney(1, 'GBP', 'en')).toBe('£0.01')
  })

  it('formats a refund as a negative amount rather than dropping the sign', () => {
    expect(formatMoney(-5000, 'GBP', 'en')).toMatch(/-.*50\.00/)
  })
})

describe('readingMinutes', () => {
  it('rounds up to the nearest minute at 200 words per minute', () => {
    expect(readingMinutes(200)).toBe(1)
    expect(readingMinutes(201)).toBe(2)
    expect(readingMinutes(400)).toBe(2)
    expect(readingMinutes(401)).toBe(3)
    expect(readingMinutes(1000)).toBe(5)
  })

  it('never returns less than one minute', () => {
    expect(readingMinutes(0)).toBe(1)
    expect(readingMinutes(1)).toBe(1)
    expect(readingMinutes(199)).toBe(1)
    expect(readingMinutes(-100)).toBe(1)
  })

  it('returns a whole number for any input', () => {
    for (const words of [0, 1, 37, 199, 200, 201, 999, 5000]) {
      expect(Number.isInteger(readingMinutes(words)), String(words)).toBe(true)
    }
  })
})
