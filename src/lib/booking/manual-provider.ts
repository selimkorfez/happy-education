import 'server-only'
import { randomUUID } from 'node:crypto'
import { isProduction } from '@/lib/env'
import { DEFAULT_LOCALE, type Locale } from '@/lib/i18n/config'
import { loadAvailabilityConfig, PUBLISHED_AVAILABILITY, type AvailabilityConfig } from './config'
import { getBookingStore } from './store'
import {
  DEFAULT_BUSINESS_TIMEZONE,
  addDays,
  addMinutes,
  minutesOfDay,
  safeTimeZone,
  toTimeString,
  zonedDateKey,
  zonedTimeToUtc,
  zonedWeekday,
} from './timezone'
import type {
  AvailabilityDay,
  AvailabilityResult,
  Booking,
  BookingRequest,
  BookingResult,
  SchedulingProvider,
  TimeSlot,
} from './types'

/**
 * Availability generated from the business's own working hours.
 *
 * Slots are derived, never stored: a published slot is simply "a working window
 * minus what is already booked minus the minimum notice period". That means an
 * hours change takes effect immediately and there is no stale calendar to clean up.
 *
 * The provider never invents availability. When no hours are published it reports
 * `configured: false` and the interface says so — see the header of `./config.ts`.
 */
export class ManualAvailabilityProvider implements SchedulingProvider {
  readonly id = 'manual'

  constructor(private readonly locale: Locale = DEFAULT_LOCALE) {}

  isConfigured(): boolean {
    // In development the fixture hours stand in; in production only real,
    // published hours count.
    return PUBLISHED_AVAILABILITY.published || !isProduction
  }

  async getAvailability(
    typeId: string,
    fromUtc: string,
    toUtc: string,
    timezone: string,
  ): Promise<AvailabilityResult> {
    const display = safeTimeZone(timezone)
    const config = await loadAvailabilityConfig(typeId, this.locale)

    if (!config) {
      return {
        typeId,
        timezone: display,
        businessTimezone: DEFAULT_BUSINESS_TIMEZONE,
        configured: false,
        days: [],
      }
    }

    const slots = await this.generateSlots(typeId, config, fromUtc, toUtc)

    return {
      typeId,
      timezone: display,
      businessTimezone: config.timezone,
      configured: true,
      days: groupByDay(slots, display),
    }
  }

  async createBooking(request: BookingRequest): Promise<BookingResult> {
    const start = new Date(request.startUtc)
    if (Number.isNaN(start.getTime())) return { ok: false, reason: 'invalid-request' }
    if (!request.customer.name.trim() || !request.customer.email.trim()) {
      return { ok: false, reason: 'invalid-request' }
    }

    const config = await loadAvailabilityConfig(request.typeId, request.locale)
    if (!config) return { ok: false, reason: 'not-configured' }

    if (start.getTime() <= Date.now()) return { ok: false, reason: 'slot-in-past' }

    // Re-derive availability around the requested instant rather than trusting the
    // page that submitted it. The slot list the visitor saw may be minutes old, and
    // it came from the browser.
    const offered = await this.isOffered(request.typeId, config, start)
    if (!offered) return { ok: false, reason: 'slot-unavailable' }

    const end = addMinutes(start, config.slotMinutes)
    const now = new Date().toISOString()
    const id = randomUUID()

    const booking: Booking = {
      id,
      reference: bookingReference(id),
      typeId: request.typeId,
      startUtc: start.toISOString(),
      endUtc: end.toISOString(),
      timezone: safeTimeZone(request.timezone),
      status: 'confirmed',
      customerName: request.customer.name.trim(),
      customerEmail: request.customer.email.trim().toLowerCase(),
      locale: request.locale,
      provider: this.id,
      createdAt: now,
      updatedAt: now,
      ...(request.paymentReference ? { paymentReference: request.paymentReference } : {}),
    }

    // The store owns the race. A null result means another visitor won the slot
    // between the availability check and this write.
    const created = await getBookingStore().create(booking)
    if (!created) return { ok: false, reason: 'slot-unavailable' }

    return { ok: true, booking: created }
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<BookingResult> {
    const store = getBookingStore()
    const booking = await store.findById(bookingId)
    if (!booking) return { ok: false, reason: 'not-found' }
    if (booking.status === 'cancelled') return { ok: false, reason: 'already-cancelled' }

    const updated = await store.update(bookingId, { status: 'cancelled' })
    if (!updated) return { ok: false, reason: 'provider-error' }

    // The reason is operational context for the adviser, not part of the public
    // record, so it is logged rather than stored on the booking.
    console.info('[booking] cancelled', {
      reference: updated.reference,
      reason: reason ? 'given' : 'none',
    })
    return { ok: true, booking: updated }
  }

  async rescheduleBooking(bookingId: string, newStartUtc: string): Promise<BookingResult> {
    const store = getBookingStore()
    const booking = await store.findById(bookingId)
    if (!booking) return { ok: false, reason: 'not-found' }
    if (booking.status === 'cancelled') return { ok: false, reason: 'already-cancelled' }

    const start = new Date(newStartUtc)
    if (Number.isNaN(start.getTime())) return { ok: false, reason: 'invalid-request' }
    if (start.getTime() <= Date.now()) return { ok: false, reason: 'slot-in-past' }

    const config = await loadAvailabilityConfig(booking.typeId, booking.locale)
    if (!config) return { ok: false, reason: 'not-configured' }

    const offered = await this.isOffered(booking.typeId, config, start)
    if (!offered) return { ok: false, reason: 'slot-unavailable' }

    const updated = await store.update(bookingId, {
      startUtc: start.toISOString(),
      endUtc: addMinutes(start, config.slotMinutes).toISOString(),
      status: 'rescheduled',
    })
    if (!updated) return { ok: false, reason: 'slot-unavailable' }

    return { ok: true, booking: updated }
  }

  /** True when the instant is one this provider is currently publishing. */
  private async isOffered(
    typeId: string,
    config: AvailabilityConfig,
    start: Date,
  ): Promise<boolean> {
    const window = 60 * 1000
    const slots = await this.generateSlots(
      typeId,
      config,
      new Date(start.getTime() - window).toISOString(),
      new Date(start.getTime() + window).toISOString(),
    )
    const target = start.toISOString()
    return slots.some((slot) => slot.startUtc === target)
  }

  private async generateSlots(
    typeId: string,
    config: AvailabilityConfig,
    fromUtc: string,
    toUtc: string,
  ): Promise<TimeSlot[]> {
    const requestedFrom = new Date(fromUtc)
    const requestedTo = new Date(toUtc)
    if (Number.isNaN(requestedFrom.getTime()) || Number.isNaN(requestedTo.getTime())) return []

    const now = new Date()
    const earliest = new Date(
      Math.max(requestedFrom.getTime(), now.getTime() + config.minimumNoticeHours * 3_600_000),
    )
    const latest = new Date(
      Math.min(requestedTo.getTime(), addDays(now, config.horizonDays).getTime()),
    )
    if (latest.getTime() <= earliest.getTime()) return []

    const booked = new Set(
      (
        await getBookingStore().listBetween(typeId, earliest.toISOString(), latest.toISOString())
      ).map((booking) => booking.startUtc),
    )

    const blocked = new Set(config.blockedDates)
    const step = config.slotMinutes + config.bufferMinutes
    const spanDays = Math.ceil((latest.getTime() - earliest.getTime()) / 86_400_000)
    // Bounded so a bad `toUtc` cannot spin here. The horizon already caps this.
    const dayCount = Math.min(spanDays + 2, 400)

    const seenDates = new Set<string>()
    const slots = new Map<string, TimeSlot>()

    for (let offset = -1; offset <= dayCount; offset += 1) {
      const cursor = addDays(earliest, offset)
      const dateKey = zonedDateKey(cursor, config.timezone)
      if (seenDates.has(dateKey)) continue
      seenDates.add(dateKey)
      if (blocked.has(dateKey)) continue

      const windows = config.weeklyHours[zonedWeekday(cursor, config.timezone)] ?? []

      for (const window of windows) {
        const windowStart = minutesOfDay(window.start)
        const windowEnd = minutesOfDay(window.end)
        if (windowStart === null || windowEnd === null) continue

        for (
          let minute = windowStart;
          minute + config.slotMinutes <= windowEnd;
          minute += step
        ) {
          const start = zonedTimeToUtc(dateKey, toTimeString(minute), config.timezone)
          if (!start) continue
          if (start.getTime() < earliest.getTime()) continue
          if (start.getTime() > latest.getTime()) continue

          const startUtc = start.toISOString()
          if (booked.has(startUtc)) continue

          slots.set(startUtc, {
            startUtc,
            endUtc: addMinutes(start, config.slotMinutes).toISOString(),
          })
        }
      }
    }

    return [...slots.values()].sort((a, b) => a.startUtc.localeCompare(b.startUtc))
  }
}

/** Groups slots into calendar days as the DISPLAY timezone sees them. */
export function groupByDay(slots: TimeSlot[], timezone: string): AvailabilityDay[] {
  const days = new Map<string, TimeSlot[]>()
  for (const slot of slots) {
    const key = zonedDateKey(new Date(slot.startUtc), timezone)
    const bucket = days.get(key)
    if (bucket) bucket.push(slot)
    else days.set(key, [slot])
  }
  return [...days.entries()]
    .map(([date, daySlots]) => ({ date, slots: daySlots }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

const REFERENCE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** Readable over the phone: no I, O, 0 or 1. */
function bookingReference(seed: string): string {
  const hex = seed.replace(/-/g, '')
  let suffix = ''
  for (let index = 0; index < 6; index += 1) {
    const value = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16)
    suffix += REFERENCE_ALPHABET[value % REFERENCE_ALPHABET.length]
  }
  return `HE-APT-${suffix}`
}
