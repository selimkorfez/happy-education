/**
 * Deterministic identifiers.
 *
 * Re-running the migration must produce byte-identical output, otherwise every
 * re-run rewrites every document in Sanity, blows away editor changes and makes the
 * QA diff useless. So no `Math.random()`, no `Date.now()`, and no array index that
 * shifts when an unrelated block is added: keys are hashes of a stable path.
 */
import { createHash } from 'node:crypto'

export function sha1(input) {
  return createHash('sha1').update(String(input), 'utf8').digest('hex')
}

/**
 * A per-document key factory. `keyer('doc:12196')` then `k('block')` returns a
 * stable key that depends only on the document and the ordinal of that key kind.
 * @param {string} scope
 */
export function keyer(scope) {
  const counters = new Map()
  return function key(kind) {
    const n = (counters.get(kind) ?? 0) + 1
    counters.set(kind, n)
    // Sanity `_key` values must be short and URL-safe.
    return sha1(`${scope}|${kind}|${n}`).slice(0, 12)
  }
}

/**
 * Sanity document ids derived from the legacy WordPress id, so `createOrReplace`
 * is idempotent across runs. Must match /^[a-zA-Z0-9._-]+$/ and must not begin
 * with `drafts.`.
 */
export function docId(type, locale, legacyId) {
  return `${type}-${locale}-${legacyId}`
}

/** Translation-group id shared by the locale variants of one logical page. */
export function translationGroupId(type, legacyId) {
  return `tgroup-${type}-${legacyId}`
}
