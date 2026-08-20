import { Studio } from './Studio'

/**
 * Sanity Studio, mounted in-app at /studio.
 *
 * One deployment and one domain to secure, and editors get draft previews against
 * the real front end rather than a separate hosted Studio on another origin.
 *
 * The editor itself is a client application (see ./Studio.tsx for why that
 * boundary is required); this file stays a server component purely so it can
 * export route metadata.
 */
export { metadata, viewport } from 'next-sanity/studio'

export default function StudioPage() {
  return <Studio />
}
