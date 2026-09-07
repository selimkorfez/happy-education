'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'

type Phase = 'idle' | 'covering' | 'covered' | 'clearing'

function shouldHandleClick(event: MouseEvent, anchor: HTMLAnchorElement) {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  if (anchor.target && anchor.target !== '_self') return false
  if (anchor.hasAttribute('download') || anchor.dataset.noTransition === 'true') return false

  const rawHref = anchor.getAttribute('href')
  if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('mailto:') || rawHref.startsWith('tel:')) return false

  const next = new URL(anchor.href, window.location.href)
  if (next.origin !== window.location.origin) return false
  if (next.pathname === window.location.pathname) return false

  return true
}

export function RouteCloudTransition() {
  const router = useRouter()
  const pathname = usePathname()
  const [phase, setPhase] = useState<Phase>('idle')
  const phaseRef = useRef<Phase>('idle')
  const previousPathRef = useRef(pathname)
  const pendingRef = useRef<string | null>(null)
  const fallbackRef = useRef<number | null>(null)
  const coverRef = useRef<number | null>(null)
  const navigationRef = useRef<number | null>(null)
  const revealRef = useRef<number | null>(null)

  useEffect(() => {
    phaseRef.current = phase

    if (phase === 'idle') {
      delete document.documentElement.dataset.routeTransition
      return
    }

    document.documentElement.dataset.routeTransition = phase
  }, [phase])

  useEffect(() => {
    if (previousPathRef.current === pathname) return
    previousPathRef.current = pathname

    if (!pendingRef.current) return

    if (fallbackRef.current) window.clearTimeout(fallbackRef.current)

    // Keep the viewer inside the cloud layer very briefly after the new route
    // arrives. This prevents a normal page swap from being visible underneath.
    revealRef.current = window.setTimeout(() => {
      phaseRef.current = 'clearing'
      setPhase('clearing')

      revealRef.current = window.setTimeout(() => {
        pendingRef.current = null
        phaseRef.current = 'idle'
        setPhase('idle')
      }, 980)
    }, 120)

    return () => {
      if (revealRef.current) window.clearTimeout(revealRef.current)
    }
  }, [pathname])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return

      const anchor = target.closest('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (!shouldHandleClick(event, anchor)) return

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      if (reducedMotion) return
      if (phaseRef.current !== 'idle') {
        event.preventDefault()
        return
      }

      const next = new URL(anchor.href, window.location.href)
      const destination = `${next.pathname}${next.search}${next.hash}`

      event.preventDefault()
      pendingRef.current = destination
      phaseRef.current = 'covering'
      setPhase('covering')

      // First the page visibly recedes, then the viewer reaches the dense cloud
      // layer. The route only changes once the old page is completely obscured.
      coverRef.current = window.setTimeout(() => {
        phaseRef.current = 'covered'
        setPhase('covered')
      }, 540)

      navigationRef.current = window.setTimeout(() => {
        router.push(destination)
      }, 650)

      fallbackRef.current = window.setTimeout(() => {
        if (!pendingRef.current) return
        pendingRef.current = null
        phaseRef.current = 'clearing'
        setPhase('clearing')
        window.setTimeout(() => {
          phaseRef.current = 'idle'
          setPhase('idle')
        }, 980)
      }, 4500)
    }

    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      if (fallbackRef.current) window.clearTimeout(fallbackRef.current)
      if (coverRef.current) window.clearTimeout(coverRef.current)
      if (navigationRef.current) window.clearTimeout(navigationRef.current)
      if (revealRef.current) window.clearTimeout(revealRef.current)
      delete document.documentElement.dataset.routeTransition
    }
  }, [router])

  return (
    <div
      aria-hidden="true"
      data-phase={phase}
      className="he-route-cloud-transition fixed inset-0 z-[120] overflow-hidden pointer-events-none"
    >
      <div className="he-route-cloud-depth he-route-cloud-depth-far absolute inset-[-22%]" />
      <div className="he-route-sky absolute inset-0" />
      <div className="he-route-cloud-bank he-route-cloud-bank-top absolute inset-x-[-24%] top-[-30%] h-[70%]" />
      <div className="he-route-cloud-bank he-route-cloud-bank-bottom absolute inset-x-[-24%] bottom-[-32%] h-[72%]" />
      <span className="he-route-cloud he-route-cloud-1" />
      <span className="he-route-cloud he-route-cloud-2" />
      <span className="he-route-cloud he-route-cloud-3" />
      <span className="he-route-cloud he-route-cloud-4" />
      <span className="he-route-cloud he-route-cloud-5" />
      <span className="he-route-cloud he-route-cloud-6" />
      <span className="he-route-cloud he-route-cloud-7" />
      <span className="he-route-cloud he-route-cloud-8" />
      <span className="he-route-cloud he-route-cloud-9" />
      <span className="he-route-cloud he-route-cloud-10" />
      <div className="he-route-cloud-depth he-route-cloud-depth-near absolute inset-[-34%]" />
      <div className="he-route-cloud-haze absolute inset-0" />
    </div>
  )
}
