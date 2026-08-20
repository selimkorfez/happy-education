import fs from 'node:fs'
import path from 'node:path'

/**
 * Legacy URL map.
 *
 * `redirects.csv` at the repository root is the single source of truth for every
 * URL the WordPress site published. It is a plain CSV rather than a TypeScript
 * literal so that a non-developer can review it, diff it and hand it to Search
 * Console without reading code.
 *
 * Column contract (`old_url,new_url,status,reason`):
 *   old_url   legacy PATH, recorded exactly as WordPress served it, trailing slash
 *             included. This is the historical record, not the matcher input.
 *   new_url   destination PATH on the new site, locale-prefixed, never trailing
 *             slashed (next.config.ts sets `trailingSlash: false`). Empty for 410.
 *   status    301 or 410. Nothing else is accepted.
 *   reason    why, in prose, so a future reviewer can judge the decision.
 *
 * TRAILING SLASHES. Every legacy URL ends in `/`; the new site never does. Next
 * normalises `/foo/` to `/foo` with its own 308 before user redirects are matched,
 * so the rules emitted here are keyed on the slash-less form. A legacy hit is
 * therefore 308 then 301: two hops, both permanent, which crawlers follow without
 * loss. Emitting both variants would double the routes-manifest for no gain.
 *
 * RUNTIME. This module reads the filesystem, so it is Node-only: `next.config.ts`
 * at build time, and Node-runtime route handlers or proxy at request time. It must
 * never be imported into an Edge-runtime or client module. It deliberately has no
 * static imports from `@/*` — `next.config.ts` loads it through a relative path
 * and cannot resolve the TypeScript path alias.
 */

export type RedirectStatus = 301 | 410

export interface RedirectRow {
  /** Legacy path exactly as recorded, trailing slash and all. */
  oldUrl: string
  /** Destination path, or null for a 410. */
  newUrl: string | null
  status: RedirectStatus
  reason: string
}

/** Structurally compatible with Next's `Redirect` type without importing it. */
export interface StaticRedirect {
  source: string
  destination: string
  permanent: boolean
}

const CSV_FILENAME = 'redirects.csv'

/**
 * Minimal RFC 4180 reader. Written out rather than pulled from a dependency
 * because this runs inside `next.config.ts`, where the dependency graph should
 * stay as close to zero as possible.
 */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/** Strips a trailing slash. `/` itself is never in the table, so it needs no guard. */
function withoutTrailingSlash(value: string): string {
  return value.length > 1 ? value.replace(/\/+$/, '') : value
}

let cachedRows: RedirectRow[] | null = null

/**
 * Parses `redirects.csv`. Returns an empty table rather than throwing when the
 * file is unreadable: a missing redirect map is a degraded deploy, not a reason to
 * fail the whole build. The warning makes the degradation visible in build logs.
 */
export function loadRedirectTable(): RedirectRow[] {
  if (cachedRows) return cachedRows

  let text: string
  try {
    text = fs.readFileSync(path.join(process.cwd(), CSV_FILENAME), 'utf8')
  } catch {
    console.warn(`[redirects] ${CSV_FILENAME} could not be read; no legacy redirects are active.`)
    cachedRows = []
    return cachedRows
  }

  const [header, ...rest] = parseCsv(text)
  if (!header) {
    cachedRows = []
    return cachedRows
  }

  const index = {
    oldUrl: header.indexOf('old_url'),
    newUrl: header.indexOf('new_url'),
    status: header.indexOf('status'),
    reason: header.indexOf('reason'),
  }

  const seen = new Set<string>()
  const rows: RedirectRow[] = []

  for (const cells of rest) {
    const oldUrl = (cells[index.oldUrl] ?? '').trim()
    if (!oldUrl.startsWith('/')) continue

    const key = withoutTrailingSlash(oldUrl)
    // A duplicated source would silently shadow the later rule. Drop it loudly.
    if (seen.has(key)) {
      console.warn(`[redirects] duplicate source ignored: ${oldUrl}`)
      continue
    }
    seen.add(key)

    const status = Number.parseInt((cells[index.status] ?? '').trim(), 10)
    if (status !== 301 && status !== 410) {
      console.warn(`[redirects] unsupported status "${status}" for ${oldUrl}; row ignored.`)
      continue
    }

    const rawTarget = (cells[index.newUrl] ?? '').trim()
    const newUrl = rawTarget ? withoutTrailingSlash(rawTarget) : null

    if (status === 301 && !newUrl) {
      console.warn(`[redirects] 301 row without a destination: ${oldUrl}; row ignored.`)
      continue
    }

    rows.push({
      oldUrl,
      newUrl,
      status,
      reason: (cells[index.reason] ?? '').trim(),
    })
  }

  cachedRows = rows
  return cachedRows
}

/**
 * The static redirect rules for `next.config.ts`.
 *
 * Only 301 rows appear here. Config redirects are evaluated before the proxy, so
 * a legacy URL is resolved before locale negotiation can send it to a locale root.
 */
export function getRedirects(): StaticRedirect[] {
  return loadRedirectTable()
    .filter((row): row is RedirectRow & { newUrl: string } => row.status === 301 && row.newUrl !== null)
    .map((row) => ({
      source: withoutTrailingSlash(row.oldUrl),
      destination: row.newUrl,
      permanent: true,
    }))
}

let cachedGone: Set<string> | null = null

/**
 * Paths that must answer 410 Gone: WooCommerce and LearnPress plugin artefacts and
 * theme demo pages that never held real content. A 410 tells a crawler to drop the
 * URL immediately; a 404 leaves it retrying for months, and a redirect to a
 * plausible-looking page would be a lie about what was there.
 */
export function goneUrls(): ReadonlySet<string> {
  if (cachedGone) return cachedGone
  cachedGone = new Set(
    loadRedirectTable()
      .filter((row) => row.status === 410)
      .map((row) => withoutTrailingSlash(row.oldUrl)),
  )
  return cachedGone
}

/** Trailing-slash tolerant membership test for the 410 set. */
export function isGone(pathname: string): boolean {
  return goneUrls().has(withoutTrailingSlash(pathname))
}

export interface CmsRedirect {
  from: string
  to: string
  permanent: boolean
}

/**
 * Editor-managed redirects, from the Sanity `redirect` document type.
 *
 * Separate from the CSV on purpose: the CSV is the frozen migration record and
 * should not change again, whereas an editor renaming a slug next year needs to be
 * able to keep the old URL alive without a deploy. Resolved at request time.
 *
 * The Sanity client is imported dynamically so that `next.config.ts`, which loads
 * this module in a plain Node context, never pulls in a `server-only` module.
 */
export async function resolveCmsRedirect(pathname: string): Promise<CmsRedirect | null> {
  const candidates = [pathname, withoutTrailingSlash(pathname)]

  try {
    const { sanityFetch } = await import('@/lib/sanity/client')
    return await sanityFetch<CmsRedirect | null>(
      /* groq */ `
        *[_type == "redirect" && from in $candidates][0] {
          from,
          to,
          "permanent": coalesce(permanent, true)
        }
      `,
      { candidates },
      { tags: ['redirect'], revalidate: 300 },
      null,
    )
  } catch {
    // A CMS outage must not turn a working page into an error.
    return null
  }
}
