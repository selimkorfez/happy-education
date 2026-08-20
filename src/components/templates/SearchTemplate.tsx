import { Container } from '@/components/ui/Container'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { SearchForm } from '@/components/search/SearchForm'
import { SearchResults } from '@/components/search/SearchResults'
import { type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'

/**
 * Search page.
 *
 * The query comes from the URL rather than component state, so a result page is
 * linkable and works with the browser's back button. The form is a real GET form:
 * it functions with JavaScript disabled and needs no client-side fetch.
 *
 * These pages are noindex (set in proxy.ts and in the route metadata) because they
 * are thin and effectively infinite.
 */
export function SearchTemplate({ locale }: { locale: Locale }) {
  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'search.label') },
  ]

  return (
    <>
      <Container>
        <Breadcrumbs locale={locale} crumbs={crumbs} />
      </Container>

      <Container>
        <div className="max-w-[46rem] pb-10">
          <h1 className="font-display text-[length:var(--text-4xl)] font-semibold text-fg">
            {t(locale, 'search.label')}
          </h1>
          <div className="mt-6">
            <SearchForm locale={locale} />
          </div>
        </div>
      </Container>

      <Container>
        <div className="pb-16">
          <SearchResults locale={locale} />
        </div>
      </Container>
    </>
  )
}
