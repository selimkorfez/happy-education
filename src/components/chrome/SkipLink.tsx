import { t } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/config'

/**
 * First focusable element on every page (WCAG 2.4.1). Visually hidden until
 * focused, then rendered as a solid block over the header.
 */
export function SkipLink({ locale }: { locale: Locale }) {
  return (
    <a
      href="#main-content"
      className="sr-only-focusable absolute left-4 top-4 z-[100] bg-fg px-4 py-3 text-sm font-semibold text-paper no-underline focus-visible:outline-3 focus-visible:outline-offset-2"
    >
      {t(locale, 'a11y.skipToContent')}
    </a>
  )
}
