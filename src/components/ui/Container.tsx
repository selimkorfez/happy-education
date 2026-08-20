import { type ReactNode } from 'react'

const WIDTHS = {
  prose: 'max-w-[68ch]',
  page: 'max-w-[78rem]',
  wide: 'max-w-[90rem]',
  full: 'max-w-none',
} as const

/**
 * Horizontal page gutter. Gutters step up with viewport rather than staying fixed,
 * so 320px phones keep usable edge spacing and wide displays do not run text to the bezel.
 */
export function Container({
  children,
  width = 'page',
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode
  width?: keyof typeof WIDTHS
  className?: string
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav' | 'article'
}) {
  return (
    <Tag className={`mx-auto w-full px-5 sm:px-7 lg:px-10 ${WIDTHS[width]} ${className}`}>
      {children}
    </Tag>
  )
}
