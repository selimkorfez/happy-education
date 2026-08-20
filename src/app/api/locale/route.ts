import { NextResponse, type NextRequest } from 'next/server'
import {
  LOCALES,
  homePath,
  isLocale,
  sectionFromSegment,
  sectionSegment,
  type Locale,
} from '@/lib/i18n/config'
import { findTranslatedPath } from '@/lib/sanity/queries/translations'

/**
 * Locale switch.
 *
 * The two editorial trees use different slugs, so /en/universities/united-kingdom
 * and /tr/universiteler/ingiltere share no path segment. Resolving the equivalent
 * page therefore needs the CMS, which is why this is a server route rather than a
 * client-side segment swap.
 *
 * Degrades in explicit steps, best to worst:
 *   1. the linked translation of this exact document
 *   2. the same section's index page in the target locale
 *   3. the target locale's home page
 *
 * Step 3 is the last resort only. Sending every switch to the homepage is the
 * behaviour this route exists to avoid.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  const to = searchParams.get('to')
  const from = searchParams.get('from') ?? '/'

  if (!to || !isLocale(to)) {
    return NextResponse.redirect(new URL(homePath(LOCALES[0]), origin), 307)
  }

  const target = await resolveTarget(from, to)

  const response = NextResponse.redirect(new URL(target, origin), 307)
  // A language switch is a per-visitor action, never a shared cache entry.
  response.headers.set('Cache-Control', 'no-store')
  return response
}

async function resolveTarget(from: string, to: Locale): Promise<string> {
  // Only accept an internal, absolute path. Anything else (protocol-relative,
  // absolute URL, traversal) is discarded so this cannot be used as an open redirect.
  if (!from.startsWith('/') || from.startsWith('//') || from.includes('..')) {
    return homePath(to)
  }

  const segments = from.split('?')[0]?.split('/').filter(Boolean) ?? []
  const [sourceLocale, sectionSeg, ...rest] = segments

  if (!sourceLocale || !isLocale(sourceLocale)) return homePath(to)

  // Locale home.
  if (!sectionSeg) return homePath(to)

  const section = sectionFromSegment(sourceLocale, sectionSeg)
  if (!section) return homePath(to)

  const sectionIndex = `/${to}/${sectionSegment(to, section)}`

  // Section index itself.
  if (rest.length === 0) return sectionIndex

  // A document: ask the CMS for its linked translation.
  try {
    const translated = await findTranslatedPath({
      fromLocale: sourceLocale,
      toLocale: to,
      section,
      slugPath: rest,
    })
    if (translated) return translated
  } catch {
    // A CMS outage must not break the language switcher; fall through to the
    // section index, which is still a useful destination.
  }

  return sectionIndex
}
