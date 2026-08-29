'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { NavGroup } from '@/lib/navigation'
import { t } from '@/lib/i18n/dictionary'
import type { Locale } from '@/lib/i18n/config'

/**
 * Accessible desktop disclosure navigation with modern visual treatment.
 * Keyboard, pointer and focus behaviour remains native and predictable while the
 * presentation uses softer panels, depth and short state transitions.
 */
export function PrimaryNav({ groups, locale }: { groups: NavGroup[]; locale: Locale }) {
  const [openKey, setOpenKey] = useState<string | null>(null)
  const pathname = usePathname()
  const navRef = useRef<HTMLElement | null>(null)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // eslint-disable-next-line react-hooks/set-state-in-effect -- synchronising local state with the URL.
  useEffect(() => setOpenKey(null), [pathname])

  useEffect(() => {
    if (!openKey) return
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      const trigger = navRef.current?.querySelector<HTMLButtonElement>(`[data-nav-trigger="${openKey}"]`)
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
      <ul className="flex items-center gap-0.5">
        {groups.map((group) => {
          const isActive = pathname === group.href || pathname.startsWith(`${group.href}/`)
          return (
            <li key={group.key} className="relative">
              {group.children?.length ? (
                <NavDisclosure
                  group={group}
                  isActive={isActive}
                  isOpen={openKey === group.key}
                  onToggle={() => setOpenKey((key) => (key === group.key ? null : group.key))}
                  onHoverOpen={() => {
                    clearHover()
                    hoverTimer.current = setTimeout(() => setOpenKey(group.key), 90)
                  }}
                />
              ) : (
                <Link href={group.href} aria-current={isActive ? 'page' : undefined} className={linkClass(isActive)}>
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
    'inline-flex min-h-11 items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-[0.9rem] font-semibold no-underline transition duration-200',
    isActive
      ? 'bg-brand-soft text-brand-strong'
      : 'text-fg-muted hover:bg-white hover:text-fg',
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
        className={linkClass(isActive || isOpen)}
      >
        {group.label}
        <Chevron open={isOpen} />
      </button>

      {isOpen ? (
        <div
          id={panelId}
          className="he-enter absolute left-0 top-[calc(100%+0.55rem)] z-50 min-w-[19rem] overflow-hidden rounded-[1.25rem] border border-border/80 bg-white p-2 shadow-[0_22px_55px_rgba(35,35,38,0.14)]"
        >
          <ul className="space-y-1">
            <li>
              <Link href={group.href} className="group flex min-h-11 items-center justify-between rounded-xl bg-paper-sunk px-4 text-sm font-bold text-fg no-underline transition hover:bg-brand-soft">
                {group.label}
                <span aria-hidden="true" className="text-brand-strong transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </li>
            {group.children?.map((child) => (
              <li key={child.href}>
                <Link href={child.href} className="block min-h-11 rounded-xl px-4 py-3 text-sm text-fg-muted no-underline transition hover:bg-paper hover:text-fg">
                  <span className="font-bold text-fg">{child.label}</span>
                  {child.description ? <span className="mt-0.5 block max-w-[30ch] text-xs leading-relaxed text-fg-muted">{child.description}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg aria-hidden="true" width="11" height="11" viewBox="0 0 10 10" fill="none" className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
      <path d="M1 3.5 5 7l4-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
