'use client'

import Script from 'next/script'
import { useConsentState } from './ConsentProvider'

/**
 * Analytics loader.
 *
 * Nothing is injected until the visitor has granted the analytics category, so no
 * third-party request is made on a first visit or after a refusal. This is the
 * opposite of the legacy site, where a Meta Pixel <noscript> beacon fired on every
 * page load regardless of the cookie banner's state.
 *
 * The container ID is optional: with no NEXT_PUBLIC_GTM_ID configured the site
 * simply runs without analytics rather than failing.
 */
export function Analytics() {
  const consent = useConsentState()
  const containerId = process.env.NEXT_PUBLIC_GTM_ID

  if (!containerId || !consent.analytics) return null

  return (
    <Script
      id="gtm-loader"
      strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`}
    />
  )
}
