import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { Breadcrumbs } from '@/components/shared/Breadcrumbs'
import { SectionVisual } from '@/components/shared/SectionVisual'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { PortableText, extractHeadings } from '@/components/content/PortableText'
import { FaqSection } from '@/components/shared/FaqSection'
import { ReviewMeta } from '@/components/shared/ReviewMeta'
import { ConsultationBand } from '@/components/shared/ConsultationBand'
import { CardGrid } from './shared'
import { ArticleSchema } from '@/components/seo/ArticleSchema'
import { sectionPath, docPath, type Locale } from '@/lib/i18n/config'
import { t } from '@/lib/i18n/dictionary'
import { formatDate } from '@/lib/format'
import type { ArticleDoc } from '@/lib/sanity/queries/content'

export function ArticleTemplate({ locale, doc }: { locale: Locale; doc: ArticleDoc }) {
  const copy = COPY[locale]
  const headings = doc.showTableOfContents ? extractHeadings(doc.body) : []
  const showAuthor = Boolean(doc.author?.name && doc.author.consentOnFile)

  const crumbs = [
    { label: t(locale, 'brand.name'), href: `/${locale}` },
    { label: t(locale, 'nav.insights'), href: sectionPath(locale, 'insights') },
    { label: doc.title },
  ]

  return (
    <>
      <ArticleSchema locale={locale} doc={doc} />

      <article>
        <header className="he-gradient-wash border-b border-border/70 pb-10 sm:pb-14">
          <Container>
            <Breadcrumbs locale={locale} crumbs={crumbs} />
            <div className="grid items-end gap-8 pt-4 lg:grid-cols-[1fr_0.42fr] lg:gap-12">
              <div>
                {doc.category ? (
                  <span className="he-pill text-brand-strong">{doc.category.title}</span>
                ) : null}
                <h1 className="mt-5 max-w-[18ch] text-[length:var(--text-5xl)] font-bold leading-tight text-fg">{doc.title}</h1>
                {doc.excerpt ? <p className="mt-6 max-w-[62ch] text-lg leading-relaxed text-fg-muted">{doc.excerpt}</p> : null}
              </div>

              <div className="space-y-4">
                {!doc.leadImage ? (
                  <div className="overflow-hidden rounded-[1.35rem] border border-white/70 bg-white p-2 shadow-[0_18px_45px_rgba(35,35,38,0.08)]">
                    <SectionVisual variant="insights" label={`${doc.title} editorial illustration`} />
                  </div>
                ) : null}
                <div className="rounded-[1.25rem] border border-border/70 bg-white/75 p-5 text-sm text-fg-muted shadow-[0_10px_28px_rgba(35,35,38,0.05)] backdrop-blur-sm">
                  <p className="text-xs font-bold uppercase tracking-[0.09em] text-brand-strong">{copy.articleDetails}</p>
                  <div className="mt-3 space-y-2">
                    {showAuthor ? <p className="font-semibold text-fg">{doc.author?.name}{doc.author?.role ? `, ${doc.author.role}` : ''}</p> : null}
                    {doc.publishedAt ? <p><time dateTime={doc.publishedAt}>{formatDate(doc.publishedAt, locale)}</time></p> : null}
                    {doc.readingMinutes ? <p>{doc.readingMinutes} {t(locale, 'common.readingTime')}</p> : null}
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </header>

        {doc.leadImage ? (
          <div className="bg-paper pt-8 sm:pt-10">
            <Container width="wide">
              <div className="overflow-hidden rounded-[1.75rem] bg-white p-2 shadow-[0_22px_60px_rgba(35,35,38,0.10)] sm:p-3">
                <MediaFrame
                  image={doc.leadImage}
                  alt={doc.leadImage.alt ?? doc.title}
                  width={1600}
                  height={900}
                  priority
                  sizes="(max-width: 1024px) 100vw, 78rem"
                  className="aspect-[16/9] w-full overflow-hidden rounded-[1.35rem]"
                  placeholderLabel={`Article lead image: ${doc.title}`}
                />
              </div>
            </Container>
          </div>
        ) : null}

        <section className="bg-paper py-8 sm:py-12 lg:py-16">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-14">
              <div className="min-w-0 rounded-[1.5rem] border border-border/60 bg-white p-6 shadow-[0_12px_36px_rgba(35,35,38,0.045)] sm:p-8 lg:p-10">
                <PortableText value={doc.body} locale={locale} />

                {doc.tags && doc.tags.length > 0 ? (
                  <ul className="mt-10 flex flex-wrap gap-2 border-t border-border/70 pt-6">
                    {doc.tags.map((tag) => (
                      <li key={tag} className="rounded-full bg-paper-sunk px-3 py-1.5 text-xs font-semibold text-fg-muted">{tag}</li>
                    ))}
                  </ul>
                ) : null}

                <ReviewMeta locale={locale} review={doc.review} published={doc.publishedAt} updated={doc.updatedAt} className="mt-10" />
              </div>

              <aside>
                <div className="sticky top-32 space-y-5">
                  {headings.length > 2 ? (
                    <nav aria-labelledby="toc-heading" className="rounded-[1.3rem] border border-border/70 bg-white p-5 shadow-[0_10px_28px_rgba(35,35,38,0.045)]">
                      <p className="text-xs font-bold uppercase tracking-[0.09em] text-brand-strong">{copy.jumpTo}</p>
                      <h2 id="toc-heading" className="mt-2 text-lg font-bold text-fg">{copy.contents}</h2>
                      <ol className="mt-4 space-y-2.5 text-sm">
                        {headings.map((heading, index) => (
                          <li key={heading.id}>
                            <a href={`#${heading.id}`} className="group flex gap-3 text-fg-muted no-underline transition hover:text-fg">
                              <span className="font-bold tabular-nums text-brand-strong">{String(index + 1).padStart(2, '0')}</span>
                              <span className="leading-snug group-hover:underline group-hover:underline-offset-4">{heading.text}</span>
                            </a>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  ) : null}

                  <div className="rounded-[1.3rem] border border-border/70 bg-brand-soft/70 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.09em] text-brand-strong">{copy.question}</p>
                    <p className="mt-2 text-sm font-semibold leading-relaxed text-fg">{copy.questionBody}</p>
                    <Link href={sectionPath(locale, 'contact')} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-brand-strong underline underline-offset-4">{copy.askUs} →</Link>
                  </div>
                </div>
              </aside>
            </div>
          </Container>
        </section>
      </article>

      <FaqSection locale={locale} faqs={doc.faqs ?? []} />

      {doc.relatedDestinations && doc.relatedDestinations.length > 0 ? (
        <section className="border-t border-border/70 bg-white py-10 sm:py-12">
          <Container>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{copy.explore}</p>
            <h2 className="mt-2 text-2xl font-bold text-fg">{copy.relatedDestinations}</h2>
            <ul className="mt-5 flex flex-wrap gap-2 text-sm">
              {doc.relatedDestinations.map((dest) => (
                <li key={dest.slug}>
                  <Link href={docPath(locale, 'universities', dest.slug)} className="inline-flex min-h-11 items-center rounded-full border border-border bg-paper px-4 font-bold text-fg no-underline transition hover:border-brand/30 hover:bg-brand-soft">{dest.title} <span aria-hidden="true" className="ml-2">→</span></Link>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {doc.relatedArticles && doc.relatedArticles.length > 0 ? (
        <section className="border-t border-border/70 bg-paper py-14 sm:py-16">
          <Container>
            <p className="text-sm font-bold uppercase tracking-[0.1em] text-brand-strong">{copy.next}</p>
            <h2 className="mt-2 text-[length:var(--text-3xl)] font-bold text-fg">{copy.keepReading}</h2>
            <div className="mt-8">
              <CardGrid items={doc.relatedArticles.map((a) => ({ href: docPath(locale, 'insights', a.slug), title: a.title, excerpt: a.excerpt, image: a.leadImage ?? null }))} />
            </div>
          </Container>
        </section>
      ) : null}

      <ConsultationBand locale={locale} />
    </>
  )
}

const COPY = {
  en: { contents: 'On this page', jumpTo: 'Jump to', keepReading: 'Keep reading', next: 'Up next', relatedDestinations: 'Related destinations', explore: 'Explore places', articleDetails: 'Article details', question: 'Got a question?', questionBody: 'If this article raised something specific about your plans, send us the question rather than trying to fit your situation into a generic answer.', askUs: 'Ask us' },
  tr: { contents: 'Bu sayfada', jumpTo: 'Bölüme git', keepReading: 'Okumaya devam edin', next: 'Sıradaki', relatedDestinations: 'İlgili ülkeler', explore: 'Ülkeleri keşfet', articleDetails: 'Yazı bilgileri', question: 'Bir sorunuz mu var?', questionBody: 'Bu yazı kendi planınızla ilgili belirli bir soru oluşturduysa, durumunuzu genel bir cevaba uydurmaya çalışmak yerine bize sorun.', askUs: 'Bize sorun' },
} as const
