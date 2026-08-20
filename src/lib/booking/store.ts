import 'server-only'
import type { Booking, BookingStatus } from './types'

/**
 * Booking storage.
 *
 * PRODUCTION NOTE: as with payments, the in-memory implementation is per-process
 * and therefore not durable on serverless. It is correct for local development and
 * tests, and it makes the contract explicit for whatever replaces it.
 *
 * The one requirement a real implementation must meet is that `create` is ATOMIC
 * with respect to the slot: two visitors submitting the same slot at the same
 * moment must produce one booking and one "slot no longer available". In SQL that
 * is a unique index on (typeId, startUtc) among non-cancelled rows. Checking
 * availability and then inserting, without a constraint, double-books under load —
 * and double-booking a family who has just paid is the worst failure this flow has.
 */

export type BookingPatch = Partial<Pick<Booking, 'status' | 'startUtc' | 'endUtc' | 'updatedAt'>>

export interface BookingStore {
  /** Returns null when the slot is already taken. */
  create(booking: Booking): Promise<Booking | null>
  findById(id: string): Promise<Booking | null>
  findByReference(reference: string): Promise<Booking | null>
  update(id: string, patch: BookingPatch): Promise<Booking | null>
  /** Confirmed bookings overlapping the window, used to hide taken slots. */
  listBetween(typeId: string, fromUtc: string, toUtc: string): Promise<Booking[]>
}

function slotKey(typeId: string, startUtc: string): string {
  return `${typeId}@${startUtc}`
}

const ACTIVE: readonly BookingStatus[] = ['confirmed', 'rescheduled']

export class InMemoryBookingStore implements BookingStore {
  private readonly byId = new Map<string, Booking>()
  private readonly takenSlots = new Set<string>()

  async create(booking: Booking): Promise<Booking | null> {
    const key = slotKey(booking.typeId, booking.startUtc)
    if (this.takenSlots.has(key)) return null
    this.takenSlots.add(key)
    this.byId.set(booking.id, booking)
    return booking
  }

  async findById(id: string): Promise<Booking | null> {
    return this.byId.get(id) ?? null
  }

  async findByReference(reference: string): Promise<Booking | null> {
    for (const booking of this.byId.values()) {
      if (booking.reference === reference) return booking
    }
    return null
  }

  async update(id: string, patch: BookingPatch): Promise<Booking | null> {
    const existing = this.byId.get(id)
    if (!existing) return null

    // Moving or cancelling frees the old slot and claims the new one, so the
    // published availability stays truthful immediately.
    if (patch.startUtc && patch.startUtc !== existing.startUtc) {
      const nextKey = slotKey(existing.typeId, patch.startUtc)
      if (this.takenSlots.has(nextKey)) return null
      this.takenSlots.delete(slotKey(existing.typeId, existing.startUtc))
      this.takenSlots.add(nextKey)
    }
    if (patch.status === 'cancelled') {
      this.takenSlots.delete(slotKey(existing.typeId, patch.startUtc ?? existing.startUtc))
    }

    const updated: Booking = { ...existing, ...patch, updatedAt: new Date().toISOString() }
    this.byId.set(id, updated)
    return updated
  }

  async listBetween(typeId: string, fromUtc: string, toUtc: string): Promise<Booking[]> {
    const from = new Date(fromUtc).getTime()
    const to = new Date(toUtc).getTime()

    return [...this.byId.values()].filter((booking) => {
      if (booking.typeId !== typeId) return false
      if (!ACTIVE.includes(booking.status)) return false
      const start = new Date(booking.startUtc).getTime()
      return start >= from && start <= to
    })
  }
}

let store: BookingStore = new InMemoryBookingStore()

export function getBookingStore(): BookingStore {
  return store
}

/** Swap in the durable implementation at boot, or a fake in tests. */
export function setBookingStore(next: BookingStore): void {
  store = next
}
