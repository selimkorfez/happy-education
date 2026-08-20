import 'server-only'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { CalComProvider } from './calcom-provider'
import { ManualAvailabilityProvider } from './manual-provider'
import { addDays } from './timezone'
import type { AvailabilityResult, SchedulingProvider } from './types'

export * from './types'
export {
  DEFAULT_BUSINESS_TIMEZONE,
  detectTimeZone,
  formatDateInZone,
  formatTimeInZone,
  safeTimeZone,
  timeZoneName,
  zonedDateKey,
} from './timezone'
export { ManualAvailabilityProvider } from './manual-provider'
export { CalComProvider } from './calcom-provider'
export { getBookingStore, setBookingStore, InMemoryBookingStore } from './store'
export type { AvailabilityConfig, WorkingWindow } from './config'

/**
 * Provider selection.
 *
 * A configured external provider wins, because it is the one with the adviser's
 * real calendar in it. The manual provider is the fallback and the current default.
 * Selection happens here so that adopting a provider is a one-line change and no
 * page or component knows which one is in use.
 */
export function getSchedulingProvider(locale: Locale = DEFAULT_LOCALE): SchedulingProvider {
  const external = new CalComProvider()
  if (external.isConfigured()) return external
  return new ManualAvailabilityProvider(locale)
}

/**
 * Convenience for a page: the next `days` days of availability for one appointment
 * type, in the requested zone.
 *
 * Computed on the server and passed to the picker as props. There is no browser
 * round trip and therefore no public availability endpoint to scrape or abuse.
 */
export async function getUpcomingAvailability(options: {
  typeId: string
  locale?: Locale
  timezone: string
  days?: number
}): Promise<AvailabilityResult> {
  const provider = getSchedulingProvider(options.locale ?? DEFAULT_LOCALE)
  const now = new Date()
  return provider.getAvailability(
    options.typeId,
    now.toISOString(),
    addDays(now, options.days ?? 45).toISOString(),
    options.timezone,
  )
}
