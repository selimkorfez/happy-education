import 'server-only'
import { isProduction } from '@/lib/env'
import { sanityFetch } from '@/lib/sanity/client'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { DEFAULT_BUSINESS_TIMEZONE, isValidTimeZone, minutesOfDay } from './timezone'

/**
 * Working-hours configuration for the manual scheduler.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NOTHING HERE IS INVENTED.
 *
 * When an adviser is available is a fact about the business, and this project does
 * not publish facts nobody has confirmed. `PUBLISHED_AVAILABILITY.published` is
 * therefore `false` and the weekly hours are empty: until the business supplies its
 * real hours, the picker shows no times and says so, offering the phone number and
 * the enquiry form instead. An empty calendar is honest. A plausible-looking
 * Monday-to-Friday nine-to-five that nobody agreed to is not, and it produces
 * appointments no one turns up to.
 *
 * TO GO LIVE: replace `weeklyHours`, confirm `timezone`, and set `published: true`.
 * Hours belong in the CMS eventually — a `bookingHours` field on `appointmentType`
 * or `siteSettings` — at which point `loadAvailabilityConfig` reads them from
 * Sanity and this constant becomes the fallback only.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Wall-clock window in the business timezone, 24-hour "HH:MM". */
export interface WorkingWindow {
  start: string
  end: string
}

export interface AvailabilityConfig {
  /** False means: publish no times at all. */
  published: boolean
  /** IANA zone the working hours are expressed in. */
  timezone: string
  /** Appointment length. Overridden by the CMS value for the appointment type. */
  slotMinutes: number
  /** Gap left after each appointment, so back-to-back slots are not published. */
  bufferMinutes: number
  /** How far ahead a visitor must book. Stops a slot ten minutes from now. */
  minimumNoticeHours: number
  /** How far ahead the calendar is published. */
  horizonDays: number
  /** 0 = Sunday … 6 = Saturday. A missing day means no availability that day. */
  weeklyHours: Record<number, WorkingWindow[]>
  /** yyyy-mm-dd in the business timezone: holidays, leave, closures. */
  blockedDates: string[]
}

export const PUBLISHED_AVAILABILITY: AvailabilityConfig = {
  published: false,
  timezone: DEFAULT_BUSINESS_TIMEZONE,
  slotMinutes: 30,
  bufferMinutes: 10,
  minimumNoticeHours: 24,
  horizonDays: 45,
  weeklyHours: {},
  blockedDates: [],
}

/**
 * Development fixture so the picker can be built and tested locally. Never used in
 * production — a real visitor would otherwise be offered a slot invented by this
 * file.
 */
const DEVELOPMENT_AVAILABILITY: AvailabilityConfig = {
  published: true,
  timezone: DEFAULT_BUSINESS_TIMEZONE,
  slotMinutes: 30,
  bufferMinutes: 10,
  minimumNoticeHours: 24,
  horizonDays: 45,
  weeklyHours: {
    1: [{ start: '10:00', end: '12:30' }, { start: '14:00', end: '17:00' }],
    2: [{ start: '10:00', end: '12:30' }, { start: '14:00', end: '17:00' }],
    3: [{ start: '10:00', end: '12:30' }],
    4: [{ start: '10:00', end: '12:30' }, { start: '14:00', end: '17:00' }],
    5: [{ start: '10:00', end: '13:00' }],
  },
  blockedDates: [],
}

/** Rejects a config that would generate nonsense slots. */
function isUsable(config: AvailabilityConfig): boolean {
  if (!config.published) return false
  if (!isValidTimeZone(config.timezone)) return false
  if (config.slotMinutes < 5 || config.slotMinutes > 480) return false
  if (config.horizonDays < 1 || config.horizonDays > 365) return false

  for (const windows of Object.values(config.weeklyHours)) {
    for (const window of windows) {
      const start = minutesOfDay(window.start)
      const end = minutesOfDay(window.end)
      if (start === null || end === null || end <= start) return false
    }
  }
  return Object.keys(config.weeklyHours).length > 0
}

interface AppointmentTypeRow {
  durationMinutes?: number
}

/**
 * Appointment length from the CMS, which is where an editor changes it. Falls back
 * to the configured slot length when the document is missing or the value is
 * implausible.
 */
async function durationForType(typeId: string, locale: Locale): Promise<number | null> {
  const row = await sanityFetch<AppointmentTypeRow | null>(
    /* groq */ `
      *[_type == "appointmentType"
        && locale == $locale
        && slug.current == $typeId
        && active == true
        && !(_id in path("drafts.**"))][0]{ durationMinutes }
    `,
    { locale, typeId },
    { tags: ['appointmentType'], revalidate: 300 },
    null,
  )

  const minutes = row?.durationMinutes
  if (typeof minutes !== 'number' || !Number.isFinite(minutes)) return null
  if (minutes < 5 || minutes > 480) return null
  return Math.round(minutes)
}

/**
 * Resolves the configuration for one appointment type.
 *
 * Returns null when nothing publishable exists, which the provider reports as
 * `configured: false` rather than as an empty week — the two mean different things
 * to a visitor and the interface says which one it is.
 */
export async function loadAvailabilityConfig(
  typeId: string,
  locale: Locale = DEFAULT_LOCALE,
): Promise<AvailabilityConfig | null> {
  const base = isUsable(PUBLISHED_AVAILABILITY)
    ? PUBLISHED_AVAILABILITY
    : !isProduction && isUsable(DEVELOPMENT_AVAILABILITY)
      ? DEVELOPMENT_AVAILABILITY
      : null

  if (!base) return null

  const duration = await durationForType(typeId, locale)
  return duration ? { ...base, slotMinutes: duration } : base
}
