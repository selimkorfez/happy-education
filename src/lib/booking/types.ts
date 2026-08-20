import type { Locale } from '@/lib/i18n/config'

/**
 * Scheduling contract.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY AN ADAPTER RATHER THAN A CALENDAR
 *
 * Writing a scheduler is easy; writing a correct one is not. A mature provider
 * (Cal.com, Calendly, Nylas) has already solved the parts that quietly go wrong at
 * scale: two visitors racing for the last slot, an adviser's personal calendar
 * changing after a slot was published, DST transitions in the adviser's zone,
 * reschedule and cancellation links that survive an email client, and the ICS
 * files that make a booking show up in Outlook properly. Buying that is safer than
 * building it.
 *
 * It is not adopted today because it is a paid dependency with its own data
 * processing agreement and the business has not chosen one. So this interface
 * exists first, with a manual implementation behind it that publishes only the
 * hours the business has actually confirmed. Swapping in the real provider means
 * writing one class, not rewriting the booking flow.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * All instants in this module are UTC ISO strings. See `./timezone.ts`.
 */

export interface TimeSlot {
  /** UTC ISO 8601, e.g. "2026-09-08T13:30:00.000Z". */
  startUtc: string
  endUtc: string
}

export interface AvailabilityDay {
  /** yyyy-mm-dd in the timezone the availability was requested for. */
  date: string
  slots: TimeSlot[]
}

export interface AvailabilityResult {
  typeId: string
  /** The zone `days` are grouped in — the one that must be named in the UI. */
  timezone: string
  /** The adviser's zone. Shown alongside when it differs from the visitor's. */
  businessTimezone: string
  /**
   * False when the business has not published any working hours yet. The UI must
   * say so plainly and offer another way to get in touch. It must never invent a
   * calendar to fill the space.
   */
  configured: boolean
  days: AvailabilityDay[]
}

export interface BookingCustomer {
  name: string
  email: string
  phone?: string
}

export interface BookingRequest {
  typeId: string
  /** UTC ISO. Never a local time. */
  startUtc: string
  /** The visitor's zone, recorded so confirmations can be written in it. */
  timezone: string
  customer: BookingCustomer
  locale: Locale
  notes?: string
  /** Set when the appointment was paid for, linking booking to payment record. */
  paymentReference?: string
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'rescheduled'

export interface Booking {
  id: string
  /** Human-quotable, e.g. "HE-APT-4Q7XKD". */
  reference: string
  typeId: string
  startUtc: string
  endUtc: string
  /** The zone the visitor booked in. */
  timezone: string
  status: BookingStatus
  customerName: string
  customerEmail: string
  locale: Locale
  /** Which adapter owns this booking, so a later provider swap is traceable. */
  provider: string
  createdAt: string
  updatedAt: string
  paymentReference?: string
}

export type BookingFailure =
  /** No working hours published, or the provider has no credentials. */
  | 'not-configured'
  | 'invalid-request'
  | 'slot-in-past'
  | 'slot-unavailable'
  | 'not-found'
  | 'already-cancelled'
  | 'provider-error'

/**
 * Results are returned, not thrown. A slot being taken is an ordinary outcome of
 * a booking flow, not an exception, and modelling it as one keeps every caller
 * honest about handling it.
 */
export type BookingResult = { ok: true; booking: Booking } | { ok: false; reason: BookingFailure }

export interface SchedulingProvider {
  /** Stable id recorded on each booking, e.g. "manual" or "cal.com". */
  readonly id: string
  isConfigured(): boolean
  getAvailability(
    typeId: string,
    fromUtc: string,
    toUtc: string,
    timezone: string,
  ): Promise<AvailabilityResult>
  createBooking(request: BookingRequest): Promise<BookingResult>
  cancelBooking(bookingId: string, reason?: string): Promise<BookingResult>
  rescheduleBooking(bookingId: string, newStartUtc: string): Promise<BookingResult>
}
