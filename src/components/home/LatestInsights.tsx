import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { Reveal } from '@/components/ui/Reveal'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { licensedMediaForEditorialText } from '@/lib/media/editorial-media'
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
          {lead ? <FeaturedArticle locale={locale} article={lead} readLabel={heading.read} /> : null}

          {rest.length > 0 ? (
            <div className="grid gap-4">
              {rest.map((article, index) => (
                <Reveal key={article.slug} delay={(index + 1) * 70} className="h-full">
                  <CompactArticle locale={locale} article={article} />
                </Reveal>
              ))}
            </div>
          ) : null}
        </div>
      </Container>
    </section>
  )
}

function FeaturedArticle({ locale, article, readLabel }: { locale: Locale; article: ArticleCard; readLabel: string }) {
  const image = article.image?.licence?.cleared === true ? article.image : null
  const externalImage = image ? null : licensedMediaForEditorialText(article.title, article.category, article.excerpt)

  return (
    <Reveal className="h-full">
      <article className="he-shine-card group flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-border/70 bg-white shadow-[0_14px_42px_rgba(35,35,38,0.065)] transition duration-400 hover:-translate-y-1.5 hover:border-brand/20 hover:shadow-[0_28px_68px_rgba(35,35,38,0.11)]">
        <div className="relative overflow-hidden">
          <MediaFrame
            image={image}
            external={externalImage}
            alt={image?.alt ?? externalImage?.alt ?? article.title}
            width={1100}
            height={700}
            sizes="(max-width: 1024px) 100vw, 58vw"
            className="aspect-[16/9] w-full [&_img]:transition-transform [&_img]:duration-[1100ms] group-hover:[&_img]:scale-[1.055]"
            placeholderLabel={`Article image: ${article.title}`}
          />
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
        <Link href={docPath(locale, 'insights', article.slug)} className="flex flex-1 flex-col p-6 no-underline sm:p-8">
          <ArticleMeta locale={locale} article={article} />
          <h3 className="mt-3 max-w-[22ch] text-2xl font-bold leading-snug text-fg sm:text-3xl">{article.title}</h3>
          {article.excerpt ? <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-fg-muted">{article.excerpt}</p> : null}
          <span className="mt-7 inline-flex items-center gap-2 text-sm font-black text-brand-strong">
            {readLabel}<span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
          </span>
        </Link>
      </article>
    </Reveal>
  )
}

function CompactArticle({ locale, article }: { locale: Locale; article: ArticleCard }) {
  const image = article.image?.licence?.cleared === true ? article.image : null
  const externalImage = image ? null : licensedMediaForEditorialText(article.title, article.category, article.excerpt)

  return (
    <article className="group grid h-full min-h-[9.5rem] grid-cols-[7.5rem_minmax(0,1fr)] overflow-hidden rounded-[1.35rem] border border-border/70 bg-white/92 shadow-[0_8px_26px_rgba(35,35,38,0.04)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-brand/24 hover:bg-white hover:shadow-[0_18px_42px_rgba(35,35,38,0.08)] sm:grid-cols-[9rem_minmax(0,1fr)]">
      <MediaFrame
        image={image}
        external={externalImage}
        alt={image?.alt ?? externalImage?.alt ?? article.title}
        width={420}
        height={420}
        sizes="9rem"
        className="h-full min-h-[9.5rem] w-full [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-[1.05]"
        placeholderLabel={`Article image: ${article.title}`}
      />
      <Link href={docPath(locale, 'insights', article.slug)} className="flex min-w-0 flex-col justify-center p-5 no-underline">
        <ArticleMeta locale={locale} article={article} />
        <h3 className="mt-2 text-lg font-bold leading-snug text-fg">{article.title}</h3>
        <span aria-hidden="true" className="mt-3 text-sm font-bold text-brand-strong">→</span>
      </Link>
    </article>
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
