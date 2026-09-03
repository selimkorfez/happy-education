'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

export function Reveal({
  children,
  className = '',
  delay = 0,
}: {
  children: ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { threshold: 0.12, rootMargin: '0px 0px -5% 0px' },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`he-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${Math.max(0, delay)}ms` }}
    >
      {children}
    </div>
  )
}
