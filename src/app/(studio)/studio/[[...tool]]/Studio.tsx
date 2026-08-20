'use client'

import { NextStudio } from 'next-sanity/studio'
import config from '../../../../../sanity.config'

/**
 * Client boundary for the Sanity Studio.
 *
 * This exists so `sanity.config.ts` is never pulled into the React Server
 * Component graph. Sanity's editor bundle imports `swr`, and under the
 * `react-server` export condition `swr` has no default export, so importing the
 * config from a server component fails the build outright.
 *
 * Marking the boundary here rather than on the page keeps `metadata` exportable
 * from the page itself, which a client component cannot do.
 */
export function Studio() {
  return <NextStudio config={config} />
}
