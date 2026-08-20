import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { getLatestArticles, type ArticleCard } from '@/lib/sanity/queries/articles'
import { formatDate } from '@/lib/format'

/**
 * Latest insights.
 *
 * The blog is the strongest asset carried over from the legacy site: eighteen
 * substantial Turkish articles, none of which were ever in the sitemap. Giving
 * them a real position on the homepage is part of correcting that.
 *
 * The lead article gets a wide panel and the rest form a list, so this reads as a
 * publication front page rather than three identical cards.
 */

const HEADING = {
  en: { kicker: 'Insights', title: 'Guidance from our advisers', all: 'All articles' },
  tr: { kicker: 'Blog', title: 'Danışmanlarımızdan rehberler', all: 'Tüm yazılar' },
} as const

export async function LatestInsights({ locale }: { locale: Locale }) {
  const articles = await getLatestArticles(locale, 5)

  // Nothing published in this locale yet: render nothing rather than an empty
  // section with a heading and a void underneath it.
  if (articles.length === 0) return null

  const [lead, ...rest] = articles
  const heading = HEADING[locale]

  return (
    <section className="border-b border-border py-16 sm:py-20">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.08em] text-brand-strong">
              {heading.kicker}
            </p>
            <h2 className="mt-3 text-[length:var(--text-4xl)] font-semibold text-fg">
              {heading.title}
            </h2>
          </div>
          <Link
            href={sectionPath(locale, 'insights')}
            className="text-base font-semibold text-brand-strong underline underline-offset-4 hover:decoration-2"
          >
            {heading.all}
          </Link>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12 lg:gap-12">
          {lead ? (
            <article className="lg:col-span-7">
              <Link href={docPath(locale, 'insights', lead.slug)} className="group block no-underline">
                <MediaFrame
                  image={lead.image ?? null}
                  alt={lead.imageAlt ?? lead.title}
                  width={1000}
                  height={563}
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="aspect-[16/9] w-full"
                  placeholderLabel={`Article image: ${lead.title}`}
                />
                <ArticleMeta locale={locale} article={lead} className="mt-5" />
                <h3 className="mt-2.5 font-display text-2xl font-semibold leading-snug text-fg underline-offset-[6px] group-hover:underline group-hover:decoration-brand group-hover:decoration-2 sm:text-3xl">
                  {lead.title}
                </h3>
                {lead.excerpt ? (
                  <p className="mt-3 max-w-[60ch] text-base leading-relaxed text-fg-muted">
                    {lead.excerpt}
                  </p>
                ) : null}
              </Link>
            </article>
          ) : null}

          {rest.length > 0 ? (
            <div className="lg:col-span-5">
              <ul className="border-t border-border">
                {rest.map((article) => (
                  <li key={article.slug} className="border-b border-border">
                    <Link
                      href={docPath(locale, 'insights', article.slug)}
                      className="group block py-5 no-underline"
                    >
                      <ArticleMeta locale={locale} article={article} />
                      <h3 className="mt-2 font-display text-lg font-semibold leading-snug text-fg underline-offset-[6px] group-hover:underline group-hover:decoration-brand group-hover:decoration-2">
                        {article.title}
                      </h3>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}

function ArticleMeta({
  locale,
  article,
  className = '',
}: {
  locale: Locale
  article: ArticleCard
  className?: string
}) {
  return (
    <p className={`flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted ${className}`}>
      {article.category ? (
        <span className="font-semibold uppercase tracking-[0.06em] text-brand-strong">
          {article.category}
        </span>
      ) : null}
      {article.publishedAt ? (
        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale)}</time>
      ) : null}
      {article.readingMinutes ? (
        <span>
          {article.readingMinutes} {t(locale, 'common.readingTime')}
        </span>
      ) : null}
    </p>
  )
}
