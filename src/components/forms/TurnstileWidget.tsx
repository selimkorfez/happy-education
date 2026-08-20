'use client'

import { useEffect, useRef } from 'react'
import type { Locale } from '@/lib/i18n/config'

/**
 * Cloudflare Turnstile, rendered explicitly.
 *
 * The script is injected from here with `document.createElement` rather than a
 * `<script>` tag in the markup. That is a CSP decision, not a style one: this site
 * serves a nonce-based policy with `strict-dynamic` (see `src/proxy.ts`), under
 * which a script created by already-trusted code is allowed, while a tag in the
 * HTML without the request's nonce would be blocked.
 *
 * Turnstile writes its token into a hidden input named `cf-turnstile-response`
 * inside the surrounding form, so the token travels with an ordinary submission
 * and with the enhanced one alike. Nothing here has to move it by hand.
 *
 * The widget only exists when `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is set. With no key
 * the form renders and works, protected by the honeypot and the rate limiter.
 */

interface TurnstileRenderOptions {
  sitekey: string
  callback?: (token: string) => void
  'error-callback'?: () => void
  'expired-callback'?: () => void
  'timeout-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  language?: string
  action?: string
}

interface TurnstileApi {
  render: (container: HTMLElement, options: TurnstileRenderOptions) => string | undefined
  reset: (widgetId?: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

let scriptPromise: Promise<void> | null = null

function loadTurnstile(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.addEventListener('load', () => resolve())
    script.addEventListener('error', () => {
      scriptPromise = null
      reject(new Error('turnstile-script-failed'))
    })
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function TurnstileWidget({
  siteKey,
  locale,
  label,
  action,
  onToken,
}: {
  siteKey: string
  locale: Locale
  /** Announced to screen readers; the widget itself carries no useful name. */
  label: string
  /** Reported to Cloudflare so different forms can be told apart in the dashboard. */
  action?: string
  onToken?: (token: string | null) => void
}) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const widgetIdRef = useRef<string | null>(null)
  const onTokenRef = useRef(onToken)

  /*
   * Keep the callback ref current without mutating it during render.
   * The widget is rendered once and its callback captured at that moment, so the
   * ref is what lets a re-rendered parent's handler still be reached. Assigning it
   * inline during render is a React violation and can be lost to a discarded
   * render pass; an effect is the supported place for it.
   */
  useEffect(() => {
    onTokenRef.current = onToken
  }, [onToken])

  useEffect(() => {
    let cancelled = false
    const container = containerRef.current
    if (!container) return

    loadTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile) return
        const id = window.turnstile.render(container, {
          sitekey: siteKey,
          theme: 'light',
          language: locale,
          action,
          callback: (token) => onTokenRef.current?.(token),
          'expired-callback': () => onTokenRef.current?.(null),
          'error-callback': () => onTokenRef.current?.(null),
          'timeout-callback': () => onTokenRef.current?.(null),
        })
        widgetIdRef.current = id ?? null
      })
      .catch(() => {
        // Cloudflare could not be reached. The server treats an unreachable
        // Turnstile as a skipped check, so the visitor is not stranded.
        onTokenRef.current?.(null)
      })

    return () => {
      cancelled = true
      const id = widgetIdRef.current
      if (id && window.turnstile) window.turnstile.remove(id)
      widgetIdRef.current = null
    }
  }, [siteKey, locale, action])

  return <div ref={containerRef} role="group" aria-label={label} className="mt-2" />
}
