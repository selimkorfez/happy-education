import { NextResponse, type NextRequest } from 'next/server'
import {
  LOCALES,
  homePath,
  isLocale,
  sectionFromSegment,
  sectionSegment,
  type Locale,
} from '@/lib/i18n/config'
import { socialContentSlug, studentStoriesSlug } from '@/lib/routing'
import { findTranslatedPath } from '@/lib/sanity/queries/translations'

/** Locale switch with graceful section-level fallback. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl

  const to = searchParams.get('to')
  const from = searchParams.get('from') ?? '/'

  if (!to || !isLocale(to)) {
    return NextResponse.redirect(new URL(homePath(LOCALES[0]), origin), 307)
  }

  const target = await resolveTarget(from, to)

  const response = NextResponse.redirect(new URL(target, origin), 307)
  response.headers.set('Cache-Control', 'no-store')
  return response
}

async function resolveTarget(from: string, to: Locale): Promise<string> {
  if (!from.startsWith('/') || from.startsWith('//') || from.includes('..')) {
    return homePath(to)
  }

  const segments = from.split('?')[0]?.split('/').filter(Boolean) ?? []
  const [sourceLocale, sectionSeg, ...rest] = segments

  if (!sourceLocale || !isLocale(sourceLocale)) return homePath(to)
  if (!sectionSeg) return homePath(to)

  const section = sectionFromSegment(sourceLocale, sectionSeg)
  if (!section) return homePath(to)

  const sectionIndex = `/${to}/${sectionSegment(to, section)}`
  if (rest.length === 0) return sectionIndex

  // These are bilingual product routes rather than CMS-authored documents, so
  // their equivalent is deterministic even before Sanity is configured.
  if (section === 'insights' && rest.length === 1) {
    if (rest[0] === socialContentSlug(sourceLocale)) {
      return `/${to}/${sectionSegment(to, 'insights')}/${socialContentSlug(to)}`
    }
    if (rest[0] === studentStoriesSlug(sourceLocale)) {
      return `/${to}/${sectionSegment(to, 'insights')}/${studentStoriesSlug(to)}`
    }
  }

  try {
    const translated = await findTranslatedPath({
      fromLocale: sourceLocale,
      toLocale: to,
      section,
      slugPath: rest,
    })
    if (translated) return translated
  } catch {
    // A CMS outage must not break the language switcher.
  }

  return sectionIndex
}
