import 'server-only'
import { createClient, type SanityClient } from 'next-sanity'
import { publicEnv, isConfigured, serverEnv } from '@/lib/env'

/**
 * Sanity clients.
 *
 * Two are exported deliberately:
 *   `cdnClient`    published content, served from Sanity's edge cache. Used for
 *                  every public page render.
 *   `previewClient` drafts included, authenticated with a read token. Only ever
 *                  used inside an authenticated draft-mode request.
 *
 * `getClient()` returns null when the project is not configured, so pages can
 * render an honest empty state instead of the whole site failing to build.
 */

let cdn: SanityClient | null = null
let preview: SanityClient | null = null

function baseConfig() {
  const projectId = publicEnv.NEXT_PUBLIC_SANITY_PROJECT_ID
  if (!projectId) return null
  return {
    projectId,
    dataset: publicEnv.NEXT_PUBLIC_SANITY_DATASET,
    apiVersion: publicEnv.NEXT_PUBLIC_SANITY_API_VERSION,
  }
}

/** Published-content client. */
export function getClient(): SanityClient | null {
  if (cdn) return cdn
  const config = baseConfig()
  if (!config) return null
  cdn = createClient({ ...config, useCdn: true, perspective: 'published' })
  return cdn
}

/** Draft-aware client. Requires SANITY_API_READ_TOKEN. */
export function getPreviewClient(): SanityClient | null {
  if (preview) return preview
  const config = baseConfig()
  if (!config) return null
  const token = serverEnv().SANITY_API_READ_TOKEN
  if (!token) return null
  preview = createClient({
    ...config,
    useCdn: false,
    perspective: 'drafts',
    token,
    stega: false,
  })
  return preview
}

export interface FetchOptions {
  /** Cache tags for on-demand revalidation from the Sanity webhook. */
  tags?: string[]
  /** Seconds. Defaults to one hour; time-sensitive content should pass less. */
  revalidate?: number
  draft?: boolean
}

/**
 * Typed fetch wrapper. Returns `fallback` when Sanity is not configured or the
 * query fails, so a CMS outage degrades the page rather than 500-ing the site.
 */
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  options: FetchOptions = {},
  fallback: T,
): Promise<T> {
  if (!isConfigured.sanity()) return fallback

  const client = options.draft ? getPreviewClient() : getClient()
  if (!client) return fallback

  try {
    return await client.fetch<T>(query, params, {
      next: {
        revalidate: options.draft ? 0 : (options.revalidate ?? 3600),
        tags: options.tags ?? [],
      },
    })
  } catch (error) {
    // Logged without the query parameters, which can contain visitor input.
    console.error('[sanity] query failed', {
      message: error instanceof Error ? error.message : 'unknown',
    })
    return fallback
  }
}
