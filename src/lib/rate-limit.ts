/**
 * Request rate limiting.
 *
 * ### Scope, stated plainly
 *
 * The default store is a sliding window held in the memory of ONE server instance.
 * On a single long-lived Node process that is an accurate limiter. On a serverless
 * or multi-region deployment it is not: each instance keeps its own counters, so
 * the effective limit is `limit × instances`, and a cold start resets it.
 *
 * That is a deliberate first layer, not the whole control. It costs nothing, needs
 * no network round trip on the happy path, and stops the overwhelmingly common
 * case: one script hammering one endpoint from one address. The real ceiling for a
 * distributed attack belongs at the edge (Cloudflare rate limiting rules — audit
 * report-1 M8 records that Cloudflare is not yet in front of the origin) and, for
 * exact application-level counting, in a shared store.
 *
 * ### Swapping in a shared store
 *
 * `RateLimitStore` is the seam. To move to Upstash Redis or Vercel KV, implement
 * `consume()` against `INCR` + `PEXPIRE` (or a Lua sliding-window script) and call
 * `setRateLimitStore()` once from server startup. Nothing else changes: every
 * caller already awaits `checkRateLimit`.
 *
 *   setRateLimitStore({
 *     name: 'upstash',
 *     async consume(key, { limit, windowMs }) { ... },
 *   })
 *
 * `checkRateLimit` is async purely so that swap is possible without touching call
 * sites; the in-memory implementation resolves synchronously.
 */

export interface RateLimitOptions {
  /** Maximum number of requests permitted inside the window. */
  limit: number
  /** Window length in milliseconds. */
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  /** Requests still available in the current window. Zero once blocked. */
  remaining: number
  /** Seconds until the caller may retry. Zero while allowed. */
  retryAfterSeconds: number
  /** Echoed back so a caller can set `X-RateLimit-Limit` without repeating itself. */
  limit: number
}

export interface RateLimitStore {
  readonly name: string
  consume(key: string, options: RateLimitOptions): Promise<RateLimitResult>
}

/* -------------------------------------------------------------------------- */
/* In-memory sliding window                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Timestamps of accepted hits per key. A sliding window rather than a fixed bucket,
 * because a fixed bucket lets a caller send `2 × limit` across a boundary instant.
 */
const hits = new Map<string, number[]>()

/**
 * Hard ceiling on tracked keys. Without it, a spray of unique addresses turns the
 * limiter itself into the memory-exhaustion vector it is meant to prevent.
 */
const MAX_KEYS = 20_000

/** Full sweep cadence, measured in calls rather than a timer so nothing keeps a serverless instance warm. */
const SWEEP_EVERY = 500
let callsSinceSweep = 0

function sweep(now: number): void {
  for (const [key, timestamps] of hits) {
    // A key is stale once nothing in it is newer than the longest window we use.
    // One hour is comfortably longer than any window configured in this codebase.
    const cutoff = now - 60 * 60 * 1000
    const live = timestamps.filter((t) => t > cutoff)
    if (live.length === 0) hits.delete(key)
    else hits.set(key, live)
  }
}

function evictOldest(): void {
  // Map preserves insertion order, so the first key is the least recently created.
  const oldest = hits.keys().next()
  if (!oldest.done) hits.delete(oldest.value)
}

const memoryStore: RateLimitStore = {
  name: 'memory',
  async consume(key, { limit, windowMs }) {
    const now = Date.now()

    callsSinceSweep += 1
    if (callsSinceSweep >= SWEEP_EVERY) {
      callsSinceSweep = 0
      sweep(now)
    }

    const windowStart = now - windowMs
    const previous = hits.get(key) ?? []
    const current = previous.filter((timestamp) => timestamp > windowStart)

    if (current.length >= limit) {
      // Blocked. The window clears when the OLDEST hit in it falls out.
      const oldest = current[0] ?? now
      const retryAfterMs = Math.max(0, oldest + windowMs - now)
      hits.set(key, current)
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)),
        limit,
      }
    }

    current.push(now)
    if (!hits.has(key) && hits.size >= MAX_KEYS) evictOldest()
    hits.set(key, current)

    return {
      allowed: true,
      remaining: Math.max(0, limit - current.length),
      retryAfterSeconds: 0,
      limit,
    }
  },
}

let activeStore: RateLimitStore = memoryStore

/** Replace the backing store, e.g. with Upstash Redis for a multi-instance deployment. */
export function setRateLimitStore(store: RateLimitStore): void {
  activeStore = store
}

/** Which store is currently in use. Useful in a health endpoint and in tests. */
export function rateLimitStoreName(): string {
  return activeStore.name
}

/**
 * Record one attempt against `key` and report whether it is permitted.
 *
 * `key` should combine the route with the caller identity, e.g. `enquiry:1.2.3.4`,
 * so a limit on one endpoint never starves another.
 */
/**
 * True only when an end-to-end test run has explicitly asked for the limiter to
 * stand down.
 *
 * Guarded twice: the flag must be set AND the build must not be production. A
 * production deployment therefore cannot have rate limiting switched off by an
 * environment variable, however it is configured.
 *
 * This exists because the counters are per-process and shared across a Playwright
 * run, so specs that legitimately post several times exhaust the allowance and the
 * ones after them fail for the wrong reason.
 */
function limiterDisabledForTests(): boolean {
  return process.env.NODE_ENV !== 'production' && process.env.E2E_DISABLE_RATE_LIMIT === '1'
}

export function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
  if (limiterDisabledForTests()) {
    return Promise.resolve({
      allowed: true,
      limit: options.limit,
      remaining: options.limit,
      retryAfterSeconds: 0,
    })
  }
  return activeStore.consume(key, options)
}

/** Clear all in-memory counters. Test helper; has no effect on a swapped store. */
export function resetRateLimits(): void {
  hits.clear()
  callsSinceSweep = 0
}

/**
 * Limits used by this application, kept together so they can be reviewed in one
 * place rather than discovered one route at a time.
 *
 * Enquiry allowances are generous per window because a family filling in a form,
 * mistyping an email and resubmitting must never be blocked; they are tight enough
 * that a script cannot mine the endpoint for outbound email.
 */
export const RATE_LIMITS = {
  /** Enquiry and consultation submissions. */
  enquiry: { limit: 5, windowMs: 10 * 60 * 1000 },
  /** Slower ceiling on top of the burst limit, to stop a patient script. */
  enquiryDaily: { limit: 20, windowMs: 24 * 60 * 60 * 1000 },
  /** Newsletter sign-up: each accepted request sends an email, so it is stricter. */
  newsletter: { limit: 3, windowMs: 60 * 60 * 1000 },
  /** Confirmation link clicks; loose, because a mail client may prefetch the URL. */
  newsletterConfirm: { limit: 30, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitOptions>
