import { formatDate } from '@/lib/format'
import { safeExternalHref } from '@/lib/links'
import { t } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/config'

export interface ReviewData {
  lastReviewed?: string
  reviewedBy?: { name?: string; role?: string }
  timeSensitive?: boolean
  sources?: Array<{ label?: string; url?: string; accessed?: string }>
}

/**
 * Publication and review provenance.
 *
 * Shown wherever content covers fees, visas, deadlines or entry requirements, so a
 * reader can judge how current it is. The reviewer is only named when a real
 * person is recorded against the document — an unearned reviewer credit is a false
 * E-E-A-T signal, so there is no fallback name.
 */
export function ReviewMeta({
  locale,
  review,
  published,
  updated,
  className = '',
}: {
  locale: Locale
  review?: ReviewData | null
  published?: string
  updated?: string
  className?: string
}) {
  const sources = (review?.sources ?? []).filter((s) => s.url)
  const hasDates = published || updated || review?.lastReviewed
  if (!hasDates && sources.length === 0) return null

  return (
    <section className={`border-t border-border pt-5 text-sm text-fg-muted ${className}`}>
      <dl className="flex flex-wrap gap-x-6 gap-y-1.5">
        {published ? (
          <div className="flex gap-1.5">
            <dt>{t(locale, 'common.published')}:</dt>
            <dd>
              <time dateTime={published}>{formatDate(published, locale)}</time>
            </dd>
          </div>
        ) : null}
        {updated ? (
          <div className="flex gap-1.5">
            <dt>{t(locale, 'common.updated')}:</dt>
            <dd>
              <time dateTime={updated}>{formatDate(updated, locale)}</time>
            </dd>
          </div>
        ) : null}
        {review?.lastReviewed ? (
          <div className="flex gap-1.5">
            <dt>{t(locale, 'common.lastReviewed')}:</dt>
            <dd>
              <time dateTime={review.lastReviewed}>{formatDate(review.lastReviewed, locale)}</time>
            </dd>
          </div>
        ) : null}
        {review?.reviewedBy?.name ? (
          <div className="flex gap-1.5">
            <dt>{t(locale, 'common.reviewedBy')}:</dt>
            <dd>
              {review.reviewedBy.name}
              {review.reviewedBy.role ? `, ${review.reviewedBy.role}` : ''}
            </dd>
          </div>
        ) : null}
      </dl>

      {sources.length > 0 ? (
        <div className="mt-4">
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-fg">
            {t(locale, 'common.sources')}
          </h2>
          <ul className="mt-2 space-y-1">
            {sources.map((source, index) => {
              const href = safeExternalHref(source.url)
              if (!href) return null
              return (
                <li key={index}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-strong underline underline-offset-4"
                  >
                    {source.label ?? href}
                  </a>
                  {source.accessed ? (
                    <span className="ml-1.5 text-fg-muted">({source.accessed})</span>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
