import { NextResponse, type NextRequest } from 'next/server'
import { draftMode } from 'next/headers'
import { serverEnv } from '@/lib/env'
import { isLocale, homePath } from '@/lib/i18n/config'

/**
 * Draft preview.
 *
 * Enabling draft mode sets an HttpOnly cookie; only requests carrying it see
 * unpublished content, and the draft-aware Sanity client is the only path that
 * reads drafts. A public visitor cannot reach unpublished data by any route.
 *
 * GET  /api/preview?secret=…&path=/en/insights/slug   enter preview
 * GET  /api/preview?exit=1                            leave preview
 */
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let mismatch = 0
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return mismatch === 0
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const draft = await draftMode()

  if (searchParams.get('exit')) {
    draft.disable()
    const back = safePath(searchParams.get('path')) ?? homePath('en')
    return NextResponse.redirect(new URL(back, origin), 307)
  }

  const secret = serverEnv().SANITY_PREVIEW_SECRET
  if (!secret) return NextResponse.json({ error: 'not configured' }, { status: 503 })

  const provided = searchParams.get('secret') ?? ''
  if (!timingSafeEqual(provided, secret)) {
    console.warn('[preview] rejected: bad secret')
    return NextResponse.json({ error: 'unauthorised' }, { status: 401 })
  }

  const target = safePath(searchParams.get('path'))
  if (!target) return NextResponse.json({ error: 'invalid path' }, { status: 400 })

  draft.enable()

  const response = NextResponse.redirect(new URL(target, origin), 307)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

/**
 * Only internal absolute paths beginning with a known locale are accepted, so this
 * route cannot be used as an open redirect.
 */
function safePath(value: string | null): string | null {
  if (!value) return null
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('..')) return null
  const first = value.split('/')[1] ?? ''
  return isLocale(first) ? value : null
}
