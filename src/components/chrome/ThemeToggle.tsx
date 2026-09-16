'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'
import type { Locale } from '@/lib/i18n/config'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'happy-education-theme'
const CHANGE_EVENT = 'happy-education-theme-change'

const COPY = {
  en: { light: 'Use light mode', dark: 'Use dark mode' },
  tr: { light: 'Açık temayı kullan', dark: 'Koyu temayı kullan' },
} as const

function currentTheme(): Theme {
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onChange)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onChange)
  }
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => 'light')

  useLayoutEffect(() => {
    if (document.documentElement.dataset.theme) return
    const stored = localStorage.getItem(STORAGE_KEY)
    const initial: Theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    document.documentElement.dataset.theme = initial
    document.documentElement.style.colorScheme = initial
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }, [])

  function toggleTheme() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    document.documentElement.style.colorScheme = next
    localStorage.setItem(STORAGE_KEY, next)
    window.dispatchEvent(new Event(CHANGE_EVENT))
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={COPY[locale][nextTheme]}
      title={COPY[locale][nextTheme]}
      className="relative inline-grid min-h-11 min-w-11 place-items-center border border-transparent text-fg-muted transition hover:border-border hover:bg-card hover:text-fg"
    >
      <svg className="he-theme-icon-sun h-[1.1rem] w-[1.1rem]" aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.55 1.55M17.52 17.52l1.55 1.55M2 12h2.2M19.8 12H22M4.93 19.07l1.55-1.55M17.52 6.48l1.55-1.55" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      <svg className="he-theme-icon-moon h-[1.1rem] w-[1.1rem]" aria-hidden="true" viewBox="0 0 24 24" fill="none">
        <path d="M20.3 15.2A8.2 8.2 0 0 1 8.8 3.7 8.4 8.4 0 1 0 20.3 15.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export const THEME_STORAGE_KEY = STORAGE_KEY
