import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { serverEnv } from '@/lib/env'

/**
 * Sanity webhook: on-demand revalidation.
 *
 * Editors publish and the change appears within seconds, without a full rebuild.
 * ISR alone would leave content stale for up to its revalidate window, which is
 * unacceptable for a price or a visa statement.
 *
 * Authenticated with a shared secret in the `sanity-webhook-secret` header,
 * compared in constant time. An unauthenticated request must never be able to
 * force cache churn.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Document types whose changes invalidate a cache tag of the same name. */
const KNOWN_TYPES = new Set([
  'destination', 'institution', 'languageSchool', 'boardingSchool', 'summerProgramme',
  'tour', 'article', 'category', 'author', 'guide', 'service', 'page', 'legalPage',
  'siteSettings', 'translationGroup', 'redirect',
])

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return mismatch === 0
}

export async function POST(request: NextRequest) {
  const secret = serverEnv().SANITY_REVALIDATE_SECRET
  if (!secret) {
    // Not configured: refuse rather than revalidating on an unauthenticated request.
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  const provided = request.headers.get('sanity-webhook-secret') ?? ''
  if (!timingSafeEqual(provided, secret)) {
    console.warn('[revalidate] rejected: bad secret')
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  let body: { _type?: string; slug?: { current?: string } | string }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  const type = body._type
  if (!type || !KNOWN_TYPES.has(type)) {
    return NextResponse.json({ error: 'unknown type' }, { status: 400 })
  }

  const slug = typeof body.slug === 'string' ? body.slug : body.slug?.current

  const tags = [type, 'routes', 'search']
  if (slug) tags.push(`${type}:${slug}`)
  // A translation change affects the language switcher on both trees.
  if (type === 'translationGroup') tags.push('translation')

  // Next 16 requires a cache-life profile. `max` expires the entry immediately on
  // the next request rather than waiting out its remaining window, which is the
  // behaviour an editor expects after pressing publish.
  for (const tag of tags) revalidateTag(tag, 'max')

  console.info('[revalidate] ok', { type, tagCount: tags.length })
  return NextResponse.json({ revalidated: true, tags })
}
