import Link from 'next/link'
import { type ComponentProps, type ReactNode } from 'react'

/**
 * Actions.
 *
 * Deliberately restrained: 3px radius rather than pills, a solid fill rather than a
 * gradient, and no transform on hover. Hover changes colour only — nothing lifts,
 * glows or slides, which keeps the interface calm and avoids motion for users who
 * have not asked for it.
 */

type Variant = 'primary' | 'secondary' | 'quiet'
type Size = 'md' | 'lg'

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-[3px] font-semibold no-underline ' +
  'transition-colors duration-150 ' +
  // 44px minimum target on touch (WCAG 2.5.8 needs 24px; 44px is the comfortable target).
  'min-h-11 ' +
  'disabled:cursor-not-allowed disabled:opacity-60'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-strong text-white hover:bg-brand-pressed active:bg-brand-pressed',
  secondary:
    'border border-border-input bg-transparent text-fg hover:bg-paper-sunk active:bg-paper-sunk',
  // Text action. Underline is always present so the affordance is not colour-only.
  quiet:
    'text-brand-strong underline underline-offset-4 decoration-from-font hover:decoration-2 min-h-0',
}

const SIZES: Record<Size, string> = {
  md: 'px-5 py-2.5 text-[0.9375rem]',
  lg: 'px-7 py-3.5 text-base',
}

function classes(variant: Variant, size: Size, className: string) {
  const sizing = variant === 'quiet' ? '' : SIZES[size]
  return `${BASE} ${VARIANTS[variant]} ${sizing} ${className}`.replace(/\s+/g, ' ').trim()
}

interface CommonProps {
  variant?: Variant
  size?: Size
  className?: string
  children: ReactNode
}

/** Internal navigation. Use for anything that changes the URL. */
export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: CommonProps & ComponentProps<typeof Link>) {
  return (
    <Link href={href} className={classes(variant, size, className)} {...rest}>
      {children}
    </Link>
  )
}

/** Genuine actions: submit, toggle, open. Never used for navigation. */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  children,
  ...rest
}: CommonProps & ComponentProps<'button'>) {
  return (
    <button type={type} className={classes(variant, size, className)} {...rest}>
      {children}
    </button>
  )
}

/**
 * External link that announces itself to screen readers and opens safely.
 * `noreferrer` prevents the target learning the referring URL.
 */
export function ExternalLink({
  href,
  children,
  className = '',
  srSuffix,
}: {
  href: string
  children: ReactNode
  className?: string
  srSuffix: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-brand-strong underline underline-offset-4 ${className}`}
    >
      {children}
      <span className="sr-only"> ({srSuffix})</span>
    </a>
  )
}
