'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'

type Phase = 'idle' | 'covering' | 'clearing'

const MIN_COVER_MS = 180
const CLEAR_MS = 260

function shouldHandleClick(event: MouseEvent, anchor: HTMLAnchorElement) {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download') || anchor.dataset.noTransition === 'true') return false

  const rawHref = anchor.getAttribute('href')
  if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return false

  const next = new URL(anchor.href, window.location.href)
  if (next.origin !== window.location.origin) return false
  if (next.pathname === window.location.pathname && next.search === window.location.search) return false

  return true
}

function Cloud({ className }: { className: string }) {
  return (
    <svg
      className={`he-route-cloud ${className}`}
      viewBox="0 0 240 120"
      fill="none"
      focusable="false"
      aria-hidden="true"
    >
      <g fill="currentColor">
        <ellipse cx="120" cy="84" rx="108" ry="27" />
        <circle cx="58" cy="70" r="34" />
        <circle cx="103" cy="50" r="45" />
        <circle cx="154" cy="58" r="39" />
        <circle cx="193" cy="74" r="29" />
      </g>
    </svg>
  )
}

export function RouteCloudTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>('idle')
  const overlayRef = useRef<HTMLDivElement>(null)
  const phaseRef = useRef<Phase>('idle')
  const previousPathRef = useRef(pathname)
  const pendingRef = useRef<string | null>(null)
  const startedAtRef = useRef(0)
  const fallbackRef = useRef<number | null>(null)
  const revealRef = useRef<number | null>(null)
  const cleanupRef = useRef<number | null>(null)

  const applyPhase = useCallback((nextPhase: Phase) => {
    phaseRef.current = nextPhase
    setPhase(nextPhase)
    overlayRef.current?.setAttribute('data-phase', nextPhase)

    if (nextPhase === 'idle') {
      delete document.documentElement.dataset.routeTransition
    } else {
      document.documentElement.dataset.routeTransition = nextPhase
    }
  }, [])

  const resetTransition = useCallback(() => {
    pendingRef.current = null
    startedAtRef.current = 0
    applyPhase('idle')
  }, [applyPhase])

  useEffect(() => {
    if (previousPathRef.current === pathname) return
    previousPathRef.current = pathname
    if (!pendingRef.current) return

    if (fallbackRef.current) window.clearTimeout(fallbackRef.current)

    // The destination is already active. Keep only a short minimum visual beat
    // so the cloud sweep is visible even when a prefetched route resolves almost
    // instantly, then reveal the new page without holding navigation back.
    const elapsed = performance.now() - startedAtRef.current
    const remaining = Math.max(0, MIN_COVER_MS - elapsed)

    revealRef.current = window.setTimeout(() => {
      applyPhase('clearing')
      cleanupRef.current = window.setTimeout(resetTransition, CLEAR_MS)
    }, remaining)

    return () => {
      if (revealRef.current) window.clearTimeout(revealRef.current)
      if (cleanupRef.current) window.clearTimeout(cleanupRef.current)
    }
  }, [pathname, applyPhase, resetTransition])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (!shouldHandleClick(event, anchor)) return

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      if (phaseRef.current !== 'idle') {
        event.preventDefault()
        return
      }

      const next = new URL(anchor.href, window.location.href)
      const destination = `${next.pathname}${next.search}${next.hash}`

      event.preventDefault()
      pendingRef.current = destination
      startedAtRef.current = performance.now()

      // Commit the visible transition state before Next starts its concurrent
      // route update. Without this, a very fast/prefetched production route can
      // repaint the component with the old `idle` phase and make the transition
      // appear to vanish. This is a state-ordering guarantee, not a time delay.
      flushSync(() => {
        applyPhase('covering')
      })

      // Navigation still starts immediately after the covering state is committed.
      router.push(destination)

      fallbackRef.current = window.setTimeout(() => {
        if (!pendingRef.current) return
        applyPhase('clearing')
        cleanupRef.current = window.setTimeout(resetTransition, CLEAR_MS)
      }, 2500)
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      if (fallbackRef.current) window.clearTimeout(fallbackRef.current)
      if (revealRef.current) window.clearTimeout(revealRef.current)
      if (cleanupRef.current) window.clearTimeout(cleanupRef.current)
      delete document.documentElement.dataset.routeTransition
    }
  }, [router, applyPhase, resetTransition])

  return (
    <div
      ref={overlayRef}
      aria-hidden="true"
      data-phase={phase}
      className="he-route-cloud-transition fixed inset-0 z-[120] overflow-hidden pointer-events-none"
    >
      <div className="he-route-sky absolute inset-0" />
      <Cloud className="he-route-cloud-1" />
      <Cloud className="he-route-cloud-2" />
      <Cloud className="he-route-cloud-3" />
      <Cloud className="he-route-cloud-4" />
      <Cloud className="he-route-cloud-5" />
      <Cloud className="he-route-cloud-6" />
      <div className="he-route-mist absolute inset-0" />
    </div>
  )
}
