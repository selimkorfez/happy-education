import Link from 'next/link'
import { t } from '@/lib/i18n/dictionary'
import { siteUrl } from '@/lib/env'
import type { Locale } from '@/lib/i18n/config'

export interface Crumb {
  label: string
  href?: string
}

/**
 * Breadcrumb trail plus its BreadcrumbList structured data.
 *
 * The final crumb is the current page and is not a link; it carries
 * aria-current="page". On narrow screens the trail scrolls horizontally rather
 * than wrapping into an unreadable stack, which matters because Turkish
 * institution names are long.
 */
export function Breadcrumbs({
  locale,
  crumbs,
  tone = 'light',
}: {
  locale: Locale
  crumbs: Crumb[]
  tone?: 'light' | 'dark'
}) {
  if (crumbs.length === 0) return null

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      ...(crumb.href ? { item: `${siteUrl}${crumb.href}` } : {}),
    })),
  }

  return (
    <>
      <nav aria-label={t(locale, 'a11y.breadcrumb')} className="scroll-x">
        <ol className="flex w-max items-center gap-2 py-4 text-sm">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1
            return (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-2">
                {index > 0 ? (
                  <span aria-hidden="true" className={tone === 'dark' ? 'text-white/35' : 'text-border-input'}>
                    /
                  </span>
                ) : null}
                {crumb.href && !isLast ? (
                  <Link
                    href={crumb.href}
                    className={`whitespace-nowrap no-underline hover:underline ${tone === 'dark' ? 'text-white/65 hover:text-white' : 'text-fg-muted hover:text-fg'}`}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className={`whitespace-nowrap font-medium ${tone === 'dark' ? 'text-white' : 'text-fg'}`}>
                    {crumb.label}
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
    </>
  )
}
