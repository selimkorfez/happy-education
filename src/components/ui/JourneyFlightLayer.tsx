'use client'

import { useEffect, useRef } from 'react'

const VIEWBOX_WIDTH = 1000
const VIEWBOX_HEIGHT = 520

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

export function JourneyFlightLayer() {
  const rootRef = useRef<HTMLDivElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const progressPathRef = useRef<SVGPathElement>(null)
  const planeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const path = pathRef.current
    const progressPath = progressPathRef.current
    const plane = planeRef.current
    if (!root || !path || !progressPath || !plane) return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reducedMotion.matches) {
      root.dataset.reducedMotion = 'true'
      return
    }

    const pathLength = path.getTotalLength()
    progressPath.style.strokeDasharray = `${pathLength}`
    progressPath.style.strokeDashoffset = `${pathLength}`

    const clouds = Array.from(root.querySelectorAll<HTMLElement>('[data-flight-cloud]'))
    let raf = 0

    const update = () => {
      raf = 0
      const rect = root.getBoundingClientRect()
      const viewport = window.innerHeight
      const startLine = viewport * 0.84
      const endLine = viewport * 0.2
      const progress = clamp((startLine - rect.top) / Math.max(1, rect.height + startLine - endLine))

      const distance = pathLength * progress
      const point = path.getPointAtLength(distance)
      const next = path.getPointAtLength(Math.min(pathLength, distance + 2.5))
      const scaleX = rect.width / VIEWBOX_WIDTH
      const scaleY = rect.height / VIEWBOX_HEIGHT
      const angle = Math.atan2((next.y - point.y) * scaleY, (next.x - point.x) * scaleX) * (180 / Math.PI)

      plane.style.left = `${(point.x / VIEWBOX_WIDTH) * 100}%`
      plane.style.top = `${(point.y / VIEWBOX_HEIGHT) * 100}%`
      plane.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`
      plane.style.opacity = progress > 0.015 && progress < 0.995 ? '1' : '0'
      progressPath.style.strokeDashoffset = `${pathLength * (1 - progress)}`

      clouds.forEach((cloud) => {
        const start = Number(cloud.dataset.start ?? 0)
        const end = Number(cloud.dataset.end ?? 1)
        const midpoint = (start + end) / 2
        const fadeIn = clamp((progress - start) / Math.max(0.001, midpoint - start))
        const fadeOut = clamp((end - progress) / Math.max(0.001, end - midpoint))
        const visibility = Math.min(fadeIn, fadeOut)
        cloud.style.opacity = String(visibility * 0.78)
        cloud.style.transform = `translate3d(${(progress - midpoint) * 34}px, ${(0.5 - visibility) * 8}px, 0) scale(${0.86 + visibility * 0.14})`
      })
    }

    const requestUpdate = () => {
      if (!raf) raf = window.requestAnimationFrame(update)
    }

    const resizeObserver = new ResizeObserver(requestUpdate)
    resizeObserver.observe(root)
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    update()

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (raf) window.cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div ref={rootRef} aria-hidden="true" className="he-flight-layer absolute inset-0 z-20 hidden pointer-events-none lg:block">
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`} preserveAspectRatio="none">
        <path
          ref={pathRef}
          d="M 18 454 C 150 430, 155 282, 318 292 S 478 442, 600 320 S 720 112, 982 70"
          fill="none"
          stroke="rgba(244, 116, 38, 0.14)"
          strokeWidth="3"
          strokeDasharray="10 13"
          vectorEffect="non-scaling-stroke"
        />
        <path
          ref={progressPathRef}
          d="M 18 454 C 150 430, 155 282, 318 292 S 478 442, 600 320 S 720 112, 982 70"
          fill="none"
          stroke="rgba(244, 116, 38, 0.72)"
          strokeWidth="3"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <span data-flight-cloud data-start="0.04" data-end="0.34" className="he-flight-cloud left-[11%] top-[71%] scale-90" />
      <span data-flight-cloud data-start="0.18" data-end="0.52" className="he-flight-cloud left-[31%] top-[49%]" />
      <span data-flight-cloud data-start="0.42" data-end="0.76" className="he-flight-cloud left-[55%] top-[61%] scale-75" />
      <span data-flight-cloud data-start="0.64" data-end="0.94" className="he-flight-cloud left-[76%] top-[28%] scale-90" />

      <div ref={planeRef} className="he-flight-plane absolute left-0 top-0 opacity-0">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-brand/25 bg-white/94 text-brand-strong shadow-[0_12px_32px_rgba(35,35,38,0.16)] backdrop-blur-md">
          <svg viewBox="0 0 48 48" width="26" height="26" fill="currentColor" focusable="false">
            <path d="M44 24c0-1.7-1.3-3-3-3H29L19 5h-4l5 16H10l-5-6H2l3 9-3 9h3l5-6h10l-5 16h4l10-16h12c1.7 0 3-1.3 3-3Z" />
          </svg>
        </span>
      </div>
    </div>
  )
}
