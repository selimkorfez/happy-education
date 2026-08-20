import Link from 'next/link'
import { headers } from 'next/headers'
import { docPath, sectionPath, type Locale, type SectionKey } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { searchContent, type SearchResult } from '@/lib/sanity/queries/search'
import { summerFormatSlug } from '@/lib/routing'

/**
 * Renders search results server-side.
 *
 * Reads the query from the request URL rather than a prop, because the search page
 * is reached through the catch-all route which does not thread searchParams down.
 * Results are grouped by type so a query like "London" does not bury the London
 * destination page under twenty institutions.
 */
export async function SearchResults({ locale }: { locale: Locale }) {
  const requestHeaders = await headers()
  const url = requestHeaders.get('x-url') ?? ''
  const query = extractQuery(url)

  if (!query) {
    return (
      <p className="max-w-[60ch] text-base text-fg-muted">
        {locale === 'tr'
          ? 'Üniversite, dil okulu, yaz programı, ülke rehberi ve blog yazılarında arama yapabilirsiniz.'
          : 'Search across universities, language schools, summer programmes, destination guides and articles.'}
      </p>
    )
  }

  const results = await searchContent(locale, query)

  if (results.length === 0) {
    return (
      <div className="max-w-[60ch]">
        <h2 className="font-display text-xl font-semibold text-fg">{t(locale, 'search.noResults')}</h2>
        <p className="mt-3 text-base leading-relaxed text-fg-muted">
          {locale === 'tr'
            ? 'Farklı bir kelime deneyin ya da bölümlere göz atın. Aradığınızı bulamazsanız bize sorun.'
            : 'Try a different word, or browse the sections. If you cannot find what you need, just ask us.'}
        </p>
        <Link
          href={sectionPath(locale, 'contact')}
          className="mt-5 inline-flex min-h-11 items-center rounded-[3px] bg-brand-strong px-6 text-base font-semibold text-white no-underline hover:bg-brand-pressed"
        >
          {locale === 'tr' ? 'Bize sorun' : 'Ask us'}
        </Link>
      </div>
    )
  }

  const groups = groupResults(results)

  return (
    <div>
      <h2 className="text-base text-fg-muted">
        {t(locale, 'search.resultsFor')}{' '}
        <span className="font-semibold text-fg">&ldquo;{query}&rdquo;</span> ({results.length})
      </h2>

      <div className="mt-8 space-y-10">
        {groups.map((group) => (
          <section key={group.key}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.06em] text-brand-strong">
              {GROUP_LABEL[group.key][locale]}
            </h3>
            <ul className="mt-4 border-t border-border">
              {group.items.map((item) => (
                <li key={`${item._type}-${item.slug}`} className="border-b border-border">
                  <Link href={resultHref(locale, item)} className="group block py-4 no-underline">
                    <span className="block font-display text-lg font-semibold text-fg underline-offset-[6px] group-hover:underline group-hover:decoration-brand group-hover:decoration-2">
                      {item.title}
                    </span>
                    {item.excerpt ? (
                      <span className="mt-1 block max-w-[70ch] text-base leading-relaxed text-fg-muted">
                        {truncate(item.excerpt, 180)}
                      </span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function extractQuery(url: string): string {
  try {
    const parsed = new URL(url, 'http://localhost')
    return (parsed.searchParams.get('q') ?? '').trim().slice(0, 80)
  } catch {
    return ''
  }
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max).trimEnd()}…`
}

const GROUP_ORDER = ['destination', 'institution', 'languageSchool', 'boardingSchool', 'summerProgramme', 'tour', 'article', 'guide', 'service'] as const
type GroupKey = (typeof GROUP_ORDER)[number]

const GROUP_LABEL: Record<GroupKey, Record<Locale, string>> = {
  destination: { en: 'Destinations', tr: 'Ülkeler' },
  institution: { en: 'Universities', tr: 'Üniversiteler' },
  languageSchool: { en: 'Language schools', tr: 'Dil okulları' },
  boardingSchool: { en: 'Boarding schools', tr: 'Yatılı okullar' },
  summerProgramme: { en: 'Summer programmes', tr: 'Yaz okulları' },
  tour: { en: 'Tours', tr: 'Turlar' },
  article: { en: 'Articles', tr: 'Blog yazıları' },
  guide: { en: 'Student guides', tr: 'Öğrenci rehberleri' },
  service: { en: 'Services', tr: 'Hizmetler' },
}

function groupResults(results: SearchResult[]) {
  return GROUP_ORDER.map((key) => ({
    key,
    items: results.filter((r) => r._type === key),
  })).filter((group) => group.items.length > 0)
}

function resultHref(locale: Locale, item: SearchResult): string {
  switch (item._type) {
    case 'destination':
      return docPath(locale, (item.section as SectionKey) ?? 'universities', item.slug)
    case 'institution':
      return item.destinationSlug
        ? docPath(locale, 'universities', item.destinationSlug, item.slug)
        : docPath(locale, 'universities', item.slug)
    case 'languageSchool':
      return item.destinationSlug
        ? docPath(locale, 'languageSchools', item.destinationSlug, item.slug)
        : docPath(locale, 'languageSchools', item.slug)
    case 'boardingSchool':
      return docPath(locale, 'boardingSchools', item.slug)
    case 'summerProgramme':
      return docPath(
        locale,
        'summerSchools',
        summerFormatSlug(locale, item.format === 'group' ? 'group' : 'individual'),
        item.slug,
      )
    case 'tour':
      return docPath(locale, 'tours', item.slug)
    case 'article':
      return docPath(locale, 'insights', item.slug)
    case 'guide':
      return docPath(locale, 'guides', item.slug)
    case 'service':
      return docPath(locale, 'services', item.slug)
    default:
      return `/${locale}`
  }
}
