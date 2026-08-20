import 'server-only'
import { DEFAULT_BUSINESS_TIMEZONE, safeTimeZone } from './timezone'
import type {
  AvailabilityResult,
  BookingRequest,
  BookingResult,
  SchedulingProvider,
} from './types'

/**
 * Cal.com adapter — STUB. Deliberately inert.
 *
 * This file exists to prove the interface is genuinely provider-shaped and to
 * document exactly what adopting a scheduling provider involves. It reports
 * `isConfigured(): false` and every method returns `not-configured`, so wiring it
 * up by accident degrades to "booking unavailable" rather than to a silent
 * failure. Nothing here calls a network.
 *
 * WHAT A REAL IMPLEMENTATION NEEDS
 *
 *  1. Credentials. Add `CALCOM_API_KEY` (and `CALCOM_EVENT_TYPE_ID` per appointment
 *     type) to the server schema in `src/lib/env.ts`, plus an `isConfigured.booking()`
 *     entry so the rest of the site degrades the same way it does for Stripe. The
 *     key is a server secret: it must never be prefixed `NEXT_PUBLIC_`.
 *
 *  2. Mapping. `getAvailability` calls the slots endpoint with the event type, the
 *     window and the visitor's IANA zone, and returns UTC instants — convert at the
 *     boundary, never store the provider's local strings. `createBooking` posts the
 *     attendee's name, email, zone and locale; keep OUR reference in the provider's
 *     metadata so a webhook can be matched back to a payment record.
 *
 *  3. Webhooks. The provider will send BOOKING_CANCELLED and BOOKING_RESCHEDULED
 *     when a change is made on their side (an adviser moving a meeting in their own
 *     calendar). Those must reach a signed endpoint and update the local record, or
 *     the two systems drift apart.
 *
 *  4. Data protection. A scheduling provider is a processor of visitor personal
 *     data. It needs a DPA, an entry in the record of processing activities, and a
 *     line in the privacy policy naming it and where it processes data.
 *
 *  5. Degradation. If their API is down, availability must come back empty with a
 *     visible explanation and a phone number — never a spinner, and never a
 *     cached calendar presented as live.
 */
export class CalComProvider implements SchedulingProvider {
  readonly id = 'cal.com'

  isConfigured(): boolean {
    // No credentials exist for this provider yet, by design.
    return false
  }

  async getAvailability(
    typeId: string,
    _fromUtc: string,
    _toUtc: string,
    timezone: string,
  ): Promise<AvailabilityResult> {
    return {
      typeId,
      timezone: safeTimeZone(timezone),
      businessTimezone: DEFAULT_BUSINESS_TIMEZONE,
      configured: false,
      days: [],
    }
  }

  async createBooking(_request: BookingRequest): Promise<BookingResult> {
    return { ok: false, reason: 'not-configured' }
  }

  async cancelBooking(_bookingId: string, _reason?: string): Promise<BookingResult> {
    return { ok: false, reason: 'not-configured' }
  }

  async rescheduleBooking(_bookingId: string, _newStartUtc: string): Promise<BookingResult> {
    return { ok: false, reason: 'not-configured' }
  }
}
