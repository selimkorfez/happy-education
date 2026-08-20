'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { Container } from '@/components/ui/Container'

/**
 * Route error boundary.
 *
 * Shows nothing technical: no stack, no message from the thrown error, no digest
 * beyond the opaque id Next provides for correlating with server logs.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The digest correlates with the server-side log entry. The error itself is
    // never rendered to the visitor.
    console.error('[route-error]', { digest: error.digest })
  }, [error])

  return (
    <Container>
      <div className="max-w-[60ch] py-20">
        <h1 className="font-display text-[length:var(--text-3xl)] font-semibold text-fg">
          Something went wrong at our end
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-fg-muted">
          This is a problem with our website, not with anything you did. Please try again in a moment,
          or contact us directly if it keeps happening.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-12 items-center rounded-[3px] bg-brand-strong px-6 text-base font-semibold text-white hover:bg-brand-pressed"
          >
            Try again
          </button>
          <Link href="/en/contact"
            className="inline-flex min-h-12 items-center rounded-[3px] border border-border-input px-6 text-base font-semibold text-fg no-underline hover:bg-paper-sunk"
          >
            Contact us
          </Link>
        </div>
        {error.digest ? (
          <p className="mt-8 text-xs text-fg-muted">Reference: {error.digest}</p>
        ) : null}
      </div>
    </Container>
  )
}
