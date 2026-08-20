import type { Locale } from '@/lib/i18n/config'

/**
 * Timezone arithmetic, built on `Intl` alone.
 *
 * THE RULE: every instant is stored and transmitted as UTC (an ISO string ending
 * in Z). A timezone is a presentation concern and is applied at the edges — when
 * generating slots from the business's working hours, and when displaying a time
 * to a visitor. Nothing in between stores a local time, because "10:00" without a
 * zone is not a moment in time, and a family in Istanbul booking a London slot is
 * exactly the case that breaks when it is treated as one.
 *
 * The zone is always NAMED in the interface. "10:00" is ambiguous; "10:00 (British
 * Summer Time)" is a promise both sides can keep.
 *
 * No date library is used. `Intl.DateTimeFormat` with a `timeZone` carries the full
 * IANA database, including historical and future DST transitions, and it is already
 * in the runtime — a dependency here would add weight without adding correctness.
 */

const LOCALE_TAG: Record<Locale, string> = { en: 'en-GB', tr: 'tr-TR' }

/** London, unless a caller states otherwise. The business is UK-registered. */
export const DEFAULT_BUSINESS_TIMEZONE = 'Europe/London'

export function isValidTimeZone(timeZone: string): boolean {
  if (!timeZone) return false
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone })
    return true
  } catch {
    return false
  }
}

/** Falls back to the business zone rather than throwing on a nonsense input. */
export function safeTimeZone(timeZone: string | null | undefined): string {
  return timeZone && isValidTimeZone(timeZone) ? timeZone : DEFAULT_BUSINESS_TIMEZONE
}

const partsCache = new Map<string, Intl.DateTimeFormat>()

function partsFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = partsCache.get(timeZone)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
  })
  partsCache.set(timeZone, formatter)
  return formatter
}

interface ZonedParts {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  weekday: number
}

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
}

/** The wall-clock reading in `timeZone` at a given instant. */
export function zonedParts(instant: Date, timeZone: string): ZonedParts {
  const parts = partsFormatter(timeZone).formatToParts(instant)
  const lookup = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? '0'

  return {
    year: Number(lookup('year')),
    month: Number(lookup('month')),
    day: Number(lookup('day')),
    hour: Number(lookup('hour')),
    minute: Number(lookup('minute')),
    second: Number(lookup('second')),
    weekday: WEEKDAY_INDEX[lookup('weekday')] ?? 0,
  }
}

/** Offset from UTC in minutes at this instant, positive east of Greenwich. */
export function offsetMinutes(instant: Date, timeZone: string): number {
  const parts = zonedParts(instant, timeZone)
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  )
  return (asUtc - instant.getTime()) / 60_000
}

/** Calendar date in a zone, as yyyy-mm-dd. */
export function zonedDateKey(instant: Date, timeZone: string): string {
  const { year, month, day } = zonedParts(instant, timeZone)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Day of week in a zone, 0 = Sunday. */
export function zonedWeekday(instant: Date, timeZone: string): number {
  return zonedParts(instant, timeZone).weekday
}

/**
 * Turns a wall-clock date and time in a zone into the UTC instant it names.
 *
 * The offset depends on the answer, so the two plausible offsets around the
 * instant are tried and each candidate is checked by reading it back in the zone.
 *
 *   AMBIGUOUS times — the hour that happens twice when clocks go back — have two
 *   valid answers. The EARLIER one is chosen, which is the conventional scheduler
 *   behaviour: an appointment at 01:30 on the day the clocks change means the
 *   first 01:30, and the visitor sees the offset spelled out either way.
 *
 *   NON-EXISTENT times — the hour skipped when clocks go forward — have no valid
 *   answer. The instant immediately after the gap is returned rather than null, so
 *   a working window that straddles the transition still produces usable slots.
 */
export function zonedTimeToUtc(dateKey: string, time: string, timeZone: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey)
  const timeMatch = /^(\d{2}):(\d{2})$/.exec(time)
  if (!dateMatch || !timeMatch) return null

  const year = Number(dateMatch[1])
  const month = Number(dateMatch[2])
  const day = Number(dateMatch[3])
  const hour = Number(timeMatch[1])
  const minute = Number(timeMatch[2])
  if (hour > 23 || minute > 59) return null

  const naive = Date.UTC(year, month - 1, day, hour, minute)

  const matchesWallClock = (candidate: number): boolean => {
    const parts = zonedParts(new Date(candidate), timeZone)
    return (
      parts.year === year &&
      parts.month === month &&
      parts.day === day &&
      parts.hour === hour &&
      parts.minute === minute
    )
  }

  // The offsets a day either side bracket any transition that could apply.
  const before = offsetMinutes(new Date(naive - 86_400_000), timeZone)
  const after = offsetMinutes(new Date(naive + 86_400_000), timeZone)

  const valid = [naive - before * 60_000, naive - after * 60_000]
    .filter(matchesWallClock)
    .sort((a, b) => a - b)

  const chosen = valid[0] ?? naive - after * 60_000

  const result = new Date(chosen)
  return Number.isNaN(result.getTime()) ? null : result
}

/** Minutes since midnight for an HH:MM string, or null if malformed. */
export function minutesOfDay(time: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(time)
  if (!match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return null
  return hour * 60 + minute
}

export function toTimeString(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

/** Time of day as the visitor's locale writes it, e.g. "14:30". */
export function formatTimeInZone(iso: string, timeZone: string, locale: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

/** Full date in a zone, e.g. "Tuesday 8 September 2026". */
export function formatDateInZone(iso: string, timeZone: string, locale: Locale): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

/**
 * A zone written out for a human: "British Summer Time" rather than
 * "Europe/London". The IANA id is appended by the interface so there is no
 * ambiguity for a visitor whose zone shares a name with another.
 */
export function timeZoneName(timeZone: string, locale: Locale, at: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat(LOCALE_TAG[locale], {
      timeZone,
      timeZoneName: 'long',
    }).formatToParts(at)
    return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone
  } catch {
    return timeZone
  }
}

/** The visitor's own zone. Returns null on the server, where there is no visitor. */
export function detectTimeZone(): string | null {
  try {
    const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone
    return resolved && isValidTimeZone(resolved) ? resolved : null
  } catch {
    return null
  }
}

export function addDays(instant: Date, days: number): Date {
  return new Date(instant.getTime() + days * 24 * 60 * 60 * 1000)
}

export function addMinutes(instant: Date, minutes: number): Date {
  return new Date(instant.getTime() + minutes * 60 * 1000)
}
