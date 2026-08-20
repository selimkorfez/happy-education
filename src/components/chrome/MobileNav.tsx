'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import type { NavGroup } from '@/lib/navigation'
import { t } from '@/lib/i18n/dictionary'
import { sectionPath, type Locale } from '@/lib/i18n/config'

/**
 * Mobile navigation.
 *
 * A full-height panel rather than a cramped dropdown, because the hierarchy here is
 * two levels deep and needs room. Sub-sections use native <details>, which gives
 * correct keyboard and screen-reader behaviour with no JavaScript of its own.
 *
 * Focus is trapped while open and restored to the trigger on close, and the page
 * behind is locked from scrolling.
 */
export function MobileNav({ groups, locale }: { groups: NavGroup[]; locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => setIsOpen(false), [pathname])

  useEffect(() => {
    if (!isOpen) return

    const { body } = document
    const previousOverflow = body.style.overflow
    body.style.overflow = 'hidden'

    // Move focus into the panel so the next Tab lands inside it.
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus()

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return

      const focusables = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), summary, input, select, textarea',
      )
      if (focusables.length === 0) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (!first || !last) return

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      body.style.overflow = previousOverflow
    }
  }, [isOpen])

  return (
    <div className="lg:hidden">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-controls="mobile-nav-panel"
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2 text-sm font-semibold text-fg"
      >
        <span aria-hidden="true">
          {isOpen ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M3 3l12 12M15 3L3 15" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M1 4h16M1 9h16M1 14h16" stroke="currentColor" strokeWidth="1.75" />
            </svg>
          )}
        </span>
        {isOpen ? t(locale, 'nav.closeMenu') : t(locale, 'nav.menu')}
      </button>

      {isOpen ? (
        <div
          id="mobile-nav-panel"
          ref={panelRef}
          className="fixed inset-x-0 bottom-0 top-[var(--header-height,4.5rem)] z-40 overflow-y-auto border-t border-border bg-paper"
        >
          <nav aria-label={t(locale, 'nav.primary')} className="px-5 py-4">
            <ul className="divide-y divide-border">
              {groups.map((group) =>
                group.children?.length ? (
                  <li key={group.key}>
                    <details className="group">
                      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between py-3 text-lg font-semibold text-fg [&::-webkit-details-marker]:hidden">
                        {group.label}
                        <span aria-hidden="true" className="text-fg-muted group-open:rotate-180">
                          <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
                            <path
                              d="M1 3.5 5 7l4-3.5"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="square"
                            />
                          </svg>
                        </span>
                      </summary>
                      <ul className="pb-3 pl-1">
                        <li>
                          <Link href={group.href} className={mobileSubLink}>
                            {t(locale, 'common.viewAll')} — {group.label}
                          </Link>
                        </li>
                        {group.children.map((child) => (
                          <li key={child.href}>
                            <Link href={child.href} className={mobileSubLink}>
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </details>
                  </li>
                ) : (
                  <li key={group.key}>
                    <Link
                      href={group.href}
                      className="flex min-h-14 items-center py-3 text-lg font-semibold text-fg no-underline"
                    >
                      {group.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>

            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
              <Link
                href={sectionPath(locale, 'consultation')}
                className="inline-flex min-h-12 items-center justify-center rounded-[3px] bg-brand-strong px-6 text-base font-semibold text-white no-underline"
              >
                {t(locale, 'nav.consultation')}
              </Link>
              <Link
                href={sectionPath(locale, 'contact')}
                className="inline-flex min-h-12 items-center justify-center rounded-[3px] border border-border-input px-6 text-base font-semibold text-fg no-underline"
              >
                {t(locale, 'nav.contact')}
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </div>
  )
}

const mobileSubLink =
  'flex min-h-12 items-center py-2 text-base text-fg-muted no-underline hover:text-fg'
