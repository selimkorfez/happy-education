import 'server-only'

/**
 * Webhook idempotency.
 *
 * Stripe guarantees at-least-once delivery, not exactly-once. The same event will
 * arrive twice after a timeout, a retry, or a redelivery from the dashboard, and a
 * handler that books a slot or sends an email must run once per event, not once
 * per delivery. Every handler is therefore gated on this store.
 *
 * PRODUCTION NOTE: the in-memory implementation is per-process. On serverless it
 * gives no protection across instances or cold starts, so before launch this must
 * be backed by something durable and atomic — a unique constraint on the event id
 * in Postgres, or a conditional write to a KV store. The `reserve()` shape is
 * designed for that: it must be an atomic test-and-set, so two instances handling
 * the same delivery cannot both win.
 */
export interface ProcessedEventStore {
  /**
   * Atomically claims an event id. Returns true when the caller is the first to
   * claim it and should process the event; false when it has already been handled.
   */
  reserve(eventId: string): Promise<boolean>
  /**
   * Releases a claim after a handler failed, so Stripe's retry can be processed
   * rather than being swallowed as a duplicate.
   */
  release(eventId: string): Promise<void>
}

/** Bounded so a long-lived instance cannot grow this without limit. */
const MAX_TRACKED_EVENTS = 10_000

export class InMemoryProcessedEventStore implements ProcessedEventStore {
  private readonly seen = new Set<string>()
  private readonly order: string[] = []

  async reserve(eventId: string): Promise<boolean> {
    if (this.seen.has(eventId)) return false
    this.seen.add(eventId)
    this.order.push(eventId)
    if (this.order.length > MAX_TRACKED_EVENTS) {
      const oldest = this.order.shift()
      if (oldest) this.seen.delete(oldest)
    }
    return true
  }

  async release(eventId: string): Promise<void> {
    this.seen.delete(eventId)
    const index = this.order.indexOf(eventId)
    if (index >= 0) this.order.splice(index, 1)
  }
}

let store: ProcessedEventStore = new InMemoryProcessedEventStore()

export function getProcessedEventStore(): ProcessedEventStore {
  return store
}

/** Swap in the durable implementation at boot, or a fake in tests. */
export function setProcessedEventStore(next: ProcessedEventStore): void {
  store = next
}
