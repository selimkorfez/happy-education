import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { Reveal } from '@/components/ui/Reveal'
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
    <section className="relative overflow-hidden border-b border-border/70 bg-paper py-16 sm:py-20 lg:py-24">
      <div aria-hidden="true" className="absolute -left-24 top-14 h-72 w-72 rounded-full bg-sky-soft blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-brand-soft/70 blur-3xl" />
      <Container>
        <Reveal>
          <div className="relative flex flex-wrap items-end justify-between gap-7">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-brand-strong">{heading.kicker}</p>
              <h2 className="mt-3 max-w-[17ch] text-[length:var(--text-4xl)] text-fg">{heading.title}</h2>
            </div>
            <Link
              href={sectionPath(locale, 'insights')}
              className="inline-flex min-h-11 items-center rounded-full border border-border bg-white/90 px-5 text-sm font-black text-fg no-underline shadow-[0_8px_24px_rgba(35,35,38,0.045)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-brand/35 hover:bg-brand-soft"
            >
              {heading.all} <span aria-hidden="true" className="ml-2">→</span>
            </Link>
          </div>
        </Reveal>

        <div className="relative mt-12 grid gap-5 lg:grid-cols-[1.18fr_0.82fr]">
          {lead ? (
            <article>
              <Reveal className="h-full">
                <Link
                  href={docPath(locale, 'insights', lead.slug)}
                  className="he-shine-card group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-white no-underline shadow-[0_14px_42px_rgba(35,35,38,0.065)] transition duration-400 hover:-translate-y-1.5 hover:border-brand/20 hover:shadow-[0_28px_68px_rgba(35,35,38,0.11)]"
                >
                  <div className="relative overflow-hidden">
                    <MediaFrame
                      image={lead.image ?? null}
                      alt={lead.imageAlt ?? lead.title}
                      width={1100}
                      height={700}
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="aspect-[16/9] w-full [&_img]:transition-transform [&_img]:duration-[1100ms] group-hover:[&_img]:scale-[1.055]"
                      placeholderLabel={`Article image: ${lead.title}`}
                    />
                    <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/24 via-transparent to-transparent" />
                  </div>
                  <div className="flex flex-1 flex-col p-6 sm:p-8">
                    <ArticleMeta locale={locale} article={lead} />
                    <h3 className="mt-3 max-w-[22ch] text-2xl font-bold leading-snug text-fg sm:text-3xl">{lead.title}</h3>
                    {lead.excerpt ? <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-fg-muted">{lead.excerpt}</p> : null}
                    <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-brand-strong">
                      {heading.read}<span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            </article>
          ) : null}

          {rest.length > 0 ? (
            <div className="grid gap-4">
              {rest.map((article, index) => (
                <article key={article.slug}>
                  <Reveal delay={(index + 1) * 70} className="h-full">
                    <Link
                      href={docPath(locale, 'insights', article.slug)}
                      className="group relative flex h-full min-h-[8.5rem] items-start gap-4 overflow-hidden rounded-[1.35rem] border border-border/70 bg-white/92 p-5 no-underline shadow-[0_8px_26px_rgba(35,35,38,0.04)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-brand/24 hover:bg-white hover:shadow-[0_18px_42px_rgba(35,35,38,0.08)]"
                    >
                      <div aria-hidden="true" className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-brand-soft opacity-0 blur-2xl transition duration-500 group-hover:opacity-90" />
                      <span aria-hidden="true" className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-ink-surface text-xs font-black tabular-nums text-white transition duration-300 group-hover:bg-brand group-hover:text-fg">
                        {String(index + 2).padStart(2, '0')}
                      </span>
                      <span className="relative min-w-0 flex-1">
                        <ArticleMeta locale={locale} article={article} />
                        <h3 className="mt-2 text-lg font-bold leading-snug text-fg">{article.title}</h3>
                      </span>
                      <span aria-hidden="true" className="relative mt-2 text-brand-strong transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                    </Link>
                  </Reveal>
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
      {article.category ? <span className="font-black uppercase tracking-[0.08em] text-brand-strong">{article.category}</span> : null}
      {article.publishedAt ? <time dateTime={article.publishedAt}>{formatDate(article.publishedAt, locale)}</time> : null}
      {article.readingMinutes ? <span>{article.readingMinutes} {t(locale, 'common.readingTime')}</span> : null}
    </p>
  )
}
