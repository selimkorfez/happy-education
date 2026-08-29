import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { getLatestArticles, type ArticleCard } from '@/lib/sanity/queries/articles'
import { formatDate } from '@/lib/format'

const HEADING = {
  en: {
    kicker: 'Useful before you decide',
    title: 'Read the stuff people usually ask us about.',
    all: 'See all insights',
    read: 'Read article',
  },
  tr: {
    kicker: 'Karar vermeden önce',
    title: 'Bize en sık sorulan konuları okuyun.',
    all: 'Tüm yazılara bak',
    read: 'Yazıyı oku',
  },
} as const

export async function LatestInsights({ locale }: { locale: Locale }) {
  const articles = await getLatestArticles(locale, 5)
  if (articles.length === 0) return null

  const [lead, ...rest] = articles
  const heading = HEADING[locale]

  return (
    <section className="border-b border-border/70 bg-paper py-16 sm:py-20 lg:py-24">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-7">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-brand-strong">{heading.kicker}</p>
            <h2 className="mt-3 max-w-[17ch] text-[length:var(--text-4xl)] text-fg">{heading.title}</h2>
          </div>
          <Link
            href={sectionPath(locale, 'insights')}
            className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-5 text-sm font-bold text-fg no-underline transition hover:border-brand/35 hover:bg-brand-soft"
          >
            {heading.all} <span aria-hidden="true" className="ml-2">→</span>
          </Link>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          {lead ? (
            <article>
              <Link
                href={docPath(locale, 'insights', lead.slug)}
                className="group flex h-full flex-col overflow-hidden rounded-[1.6rem] border border-border/70 bg-white no-underline shadow-[0_12px_38px_rgba(35,35,38,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_50px_rgba(35,35,38,0.10)]"
              >
                <div className="overflow-hidden">
                  <MediaFrame
                    image={lead.image ?? null}
                    alt={lead.imageAlt ?? lead.title}
                    width={1100}
                    height={700}
                    sizes="(max-width: 1024px) 100vw, 58vw"
                    className="aspect-[16/9] w-full [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.04]"
                    placeholderLabel={`Article image: ${lead.title}`}
                  />
                </div>
                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <ArticleMeta locale={locale} article={lead} />
                  <h3 className="mt-3 max-w-[22ch] text-2xl font-bold leading-snug text-fg sm:text-3xl">{lead.title}</h3>
                  {lead.excerpt ? <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-fg-muted">{lead.excerpt}</p> : null}
                  <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-brand-strong">
                    {heading.read}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            </article>
          ) : null}

          {rest.length > 0 ? (
            <div className="grid gap-4">
              {rest.map((article, index) => (
                <article key={article.slug}>
                  <Link
                    href={docPath(locale, 'insights', article.slug)}
                    className="group flex h-full items-start gap-4 rounded-[1.25rem] border border-border/70 bg-white p-5 no-underline transition duration-250 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-[0_14px_34px_rgba(35,35,38,0.07)]"
                  >
                    <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-paper-sunk text-xs font-black tabular-nums text-fg-muted">
                      {String(index + 2).padStart(2, '0')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <ArticleMeta locale={locale} article={article} />
                      <h3 className="mt-2 text-lg font-bold leading-snug text-fg">{article.title}</h3>
                    </span>
                    <span aria-hidden="true" className="mt-2 text-brand-strong transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}

function ArticleMeta({ locale, article }: { locale: Locale; article: ArticleCard }) {
  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
      {article.category ? <span className="font-bold uppercase tracking-[0.08em] text-brand-strong">{article.category}</span> : null}
      {article.publishedAt ? <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale)}</time> : null}
      {article.readingMinutes ? <span>{article.readingMinutes} {t(locale, 'common.readingTime')}</span> : null}
    </p>
  )
}
