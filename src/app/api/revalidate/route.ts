import { NextResponse, type NextRequest } from 'next/server'
import { revalidateTag } from 'next/cache'
import { parseBody } from 'next-sanity/webhook'
import { z } from 'zod'
import { serverEnv } from '@/lib/env'

/**
 * Sanity webhook: on-demand revalidation.
 *
 * Editors publish and the change appears within seconds, without a full rebuild.
 * ISR alone would leave content stale for up to its revalidate window, which is
 * unacceptable for a price or a visa statement.
 *
 * Authenticated with Sanity's signed webhook body. An unauthenticated request
 * must never be able to force cache churn.
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Document types whose changes invalidate a cache tag of the same name. */
const KNOWN_TYPES = new Set([
  'destination', 'institution', 'languageSchool', 'boardingSchool', 'summerProgramme',
  'tour', 'article', 'category', 'author', 'guide', 'service', 'page', 'legalPage',
  'socialPost', 'testimonial', 'teamMember', 'office', 'partner',
  'appointmentType', 'paymentService', 'siteSettings', 'translationGroup', 'redirect',
])

const bodySchema = z.object({
  _type: z.string().min(1),
  slug: z.union([z.string(), z.object({ current: z.string().optional() })]).optional(),
})

export async function POST(request: NextRequest) {
  const secret = serverEnv().SANITY_REVALIDATE_SECRET
  if (!secret) {
    // Not configured: refuse rather than revalidating on an unauthenticated request.
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  let parsedWebhook: Awaited<ReturnType<typeof parseBody<unknown>>>
  try {
    parsedWebhook = await parseBody<unknown>(request, secret)
  } catch {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }

  if (parsedWebhook.isValidSignature !== true) {
    console.warn('[revalidate] rejected: invalid signature')
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  const result = bodySchema.safeParse(parsedWebhook.body)
  if (!result.success) {
    return NextResponse.json({ error: 'invalid payload' }, { status: 400 })
  }
  const body = result.data

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
