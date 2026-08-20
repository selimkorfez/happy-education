'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { NavGroup } from '@/lib/navigation'
import { t } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/config'

/**
 * Desktop primary navigation.
 *
 * Implemented as a set of disclosure buttons rather than an ARIA `menu`, because
 * these open panels of links, not a menu of commands — the disclosure pattern is
 * what screen-reader users expect here and it keeps normal link semantics intact.
 *
 * Behaviour:
 *   - click or Enter/Space toggles a panel
 *   - Escape closes and returns focus to the trigger
 *   - Tab out of the panel closes it
 *   - pointer hover opens after a short intent delay, so sweeping the cursor
 *     across the bar does not flicker panels open
 * There is no motion beyond the panel appearing; nothing slides, fades or lifts.
 */
export function PrimaryNav({ groups, locale }: { groups: NavGroup[]; locale: Locale }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const pathname = usePathname()
  const navRef = useRef<HTMLElement | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Any navigation closes the panel.
  useEffect(() => setOpenKey(null), [pathname])

  useEffect(() => {
    if (!openKey) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const trigger = navRef.current?.querySelector<HTMLButtonElement>(
        `[data-nav-trigger="${openKey}"]`,
      )
      setOpenKey(null)
      trigger?.focus()
    }
    function onPointerDown(event: PointerEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setOpenKey(null)
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [openKey])

  const clearHover = useCallback(() => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = null
  }, [])

  useEffect(() => clearHover, [clearHover])

  const handleFocusOut = useCallback((event: React.FocusEvent<HTMLElement>) => {
    // Closing only when focus genuinely leaves the nav keeps Shift+Tab working.
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpenKey(null)
  }, [])

  return (
    <nav
      ref={navRef}
      aria-label={t(locale, 'nav.primary')}
      className="hidden lg:block"
      onBlur={handleFocusOut}
      onPointerLeave={() => {
        clearHover()
        hoverTimer.current = setTimeout(() => setOpenKey(null), 180)
      }}
      onPointerEnter={clearHover}
    >
      <ul className="flex items-center gap-1">
        {groups.map((group) => {
          const isActive = pathname === group.href || pathname.startsWith(`${group.href}/`)
          return (
            <li key={group.key} className="relative">
              {group.children?.length ? (
                <NavDisclosure
                  group={group}
                  isActive={isActive}
                  isOpen={openKey === group.key}
                  onToggle={() => setOpenKey((k) => (k === group.key ? null : group.key))}
                  onHoverOpen={() => {
                    clearHover()
                    hoverTimer.current = setTimeout(() => setOpenKey(group.key), 90)
                  }}
                />
              ) : (
                <Link
                  href={group.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={linkClass(isActive)}
                >
                  {group.label}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function linkClass(isActive: boolean) {
  return [
    'inline-flex items-center gap-1 whitespace-nowrap px-3 py-2 text-[0.9375rem] font-medium no-underline',
    'underline-offset-[6px] hover:underline hover:decoration-2',
    isActive ? 'text-fg underline decoration-brand decoration-2' : 'text-fg-muted hover:text-fg',
  ].join(' ')
}

function NavDisclosure({
  group,
  isActive,
  isOpen,
  onToggle,
  onHoverOpen,
}: {
  group: NavGroup
  isActive: boolean
  isOpen: boolean
  onToggle: () => void
  onHoverOpen: () => void
}) {
  const panelId = useId()

  return (
    <>
      <button
        type="button"
        data-nav-trigger={group.key}
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
        onPointerEnter={onHoverOpen}
        className={linkClass(isActive)}
      >
        {group.label}
        <Chevron open={isOpen} />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="absolute left-0 top-full z-50 min-w-[16rem] border border-border bg-card py-2"
        >
          <ul>
            <li>
              <Link href={group.href} className={panelLinkClass('font-semibold text-fg')}>
                {group.label}
              </Link>
            </li>
            <li aria-hidden="true">
              <hr className="my-2 border-0 border-t border-border" />
            </li>
            {group.children?.map((child) => (
              <li key={child.href}>
                <Link href={child.href} className={panelLinkClass('text-fg-muted')}>
                  {child.label}
                  {child.description ? (
                    <span className="mt-0.5 block text-xs text-fg-muted">{child.description}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  )
}

function panelLinkClass(extra: string) {
  return `block px-4 py-2 text-sm no-underline hover:bg-paper-sunk hover:text-fg ${extra}`
}

/** Rotation is a static state change, not an animation. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="none"
      className={open ? 'rotate-180' : ''}
    >
      <path d="M1 3.5 5 7l4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" />
    </svg>
  )
}
