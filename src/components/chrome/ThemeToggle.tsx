'use client'

import { useLayoutEffect, useSyncExternalStore } from 'react'
import type { Locale } from '@/lib/i18n/config'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'happy-education-theme'
const COOKIE_KEY = 'happy-education-theme'
const CHANGE_EVENT = 'happy-education-theme-change'

const COPY = {
  en: { light: 'Use light mode', dark: 'Use dark mode' },
  tr: { light: 'Açık temayı kullan', dark: 'Koyu temayı kullan' },
} as const

function currentTheme(): Theme {
  const rendered = document.documentElement.dataset.theme
  if (rendered === 'light' || rendered === 'dark') return rendered
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function subscribe(onChange: () => void) {
  function onStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY || (event.newValue !== 'light' && event.newValue !== 'dark')) return
    applyTheme(event.newValue)
    storeThemeCookie(event.newValue)
    onChange()
  }

  window.addEventListener(CHANGE_EVENT, onChange)
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange)
    window.removeEventListener('storage', onStorage)
  }
}

function storedTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme
  document.documentElement.style.colorScheme = theme
}

function storeThemeCookie(theme: Theme) {
  try {
    document.cookie = `${COOKIE_KEY}=${theme}; Path=/; Max-Age=31536000; SameSite=Lax`
  } catch {
    // The page-level theme remains functional when cookie storage is blocked.
  }
}

export function ThemeToggle({ locale }: { locale: Locale }) {
  const theme = useSyncExternalStore(subscribe, currentTheme, () => 'light')

  useLayoutEffect(() => {
    const preference = storedTheme()
    const rendered = document.documentElement.dataset.theme
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const initial: Theme = preference
      ?? (rendered === 'light' || rendered === 'dark' ? rendered : (media.matches ? 'dark' : 'light'))
    applyTheme(initial)
    if (preference) storeThemeCookie(preference)
    window.dispatchEvent(new Event(CHANGE_EVENT))

    function followSystem(event: MediaQueryListEvent) {
      if (storedTheme()) return
      applyTheme(event.matches ? 'dark' : 'light')
      window.dispatchEvent(new Event(CHANGE_EVENT))
    }

    media.addEventListener('change', followSystem)
    return () => media.removeEventListener('change', followSystem)
  }, [])

  function toggleTheme() {
    const next: Theme = currentTheme() === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Storage can be unavailable in strict/private browser modes. The theme
      // still changes for the current page and the control remains responsive.
    }
    storeThemeCookie(next)
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
