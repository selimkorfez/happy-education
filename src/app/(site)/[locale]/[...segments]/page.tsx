import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import {
  SECTIONS,
  isLocale,
  sectionFromSegment,
  type Locale,
  type SectionKey,
} from '@/lib/i18n/config'
import { resolveRoute, type ResolvedRoute } from '@/lib/routing'
import { buildRouteMetadata } from '@/lib/route-metadata'
import { renderRoute } from '@/components/templates/renderRoute'

/**
 * The single content route.
 *
 * Every public page except the locale home resolves here. A catch-all is used
 * rather than a file per template because the URL segments are LOCALISED: the same
 * template serves /en/universities/united-kingdom and /tr/universiteler/ingiltere,
 * and Next's file-based routing cannot express a segment whose literal name
 * changes per locale.
 *
 * `resolveRoute` turns the segments into a discriminated union describing what
 * should render; `renderRoute` maps that to a template. Keeping resolution
 * separate from rendering means `generateMetadata` and the page body run exactly
 * the same logic, so metadata can never describe a different page from the one
 * rendered.
 */

export const revalidate = 1800

/**
 * Pre-render the section indexes at build time. Individual documents are rendered
 * on first request and then cached by ISR, which keeps build times sane as the
 * institution count grows into the hundreds.
 */
export function generateStaticParams() {
  const sections: SectionKey[] = [
    'universities',
    'languageSchools',
    'summerSchools',
    'boardingSchools',
    'tours',
    'insights',
    'about',
    'contact',
    'consultation',
  ]
  const params: Array<{ locale: string; segments: string[] }> = []
  for (const locale of ['en', 'tr'] as const) {
    for (const section of sections) {
      params.push({
        locale,
        segments: [sectionSegmentFor(locale, section)],
      })
    }
  }
  return params
}

function sectionSegmentFor(locale: Locale, section: SectionKey): string {
  return SECTIONS[section][locale]
}

interface RouteParams {
  params: Promise<{ locale: string; segments?: string[] }>
}

async function resolve(params: RouteParams['params']): Promise<{
  locale: Locale
  route: ResolvedRoute
} | null> {
  const { locale, segments = [] } = await params
  if (!isLocale(locale)) return null

  const [first, ...rest] = segments
  if (!first) return null

  const section = sectionFromSegment(locale, first)
  if (!section) return null

  const route = await resolveRoute({ locale, section, segments: rest })
  return route ? { locale, route } : null
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const resolved = await resolve(params)
  if (!resolved) return { title: 'Not found', robots: { index: false, follow: false } }
  return buildRouteMetadata(resolved.locale, resolved.route)
}

export default async function ContentPage({ params }: RouteParams) {
  const resolved = await resolve(params)
  if (!resolved) notFound()
  return renderRoute(resolved.locale, resolved.route)
}
