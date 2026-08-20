import { z } from 'zod'

/**
 * Environment configuration.
 *
 * Two rules enforced here:
 *   1. Nothing secret is ever exposed to the browser. Anything read from
 *      `serverEnv` is server-only; `NEXT_PUBLIC_` values are the public set and are
 *      the only ones a client component may reference.
 *   2. The build must not require production credentials. Every integration is
 *      optional, and the code paths that need one check `isConfigured` first. This
 *      lets the site build and run on a clean checkout, showing real pages, rather
 *      than crashing on a missing key.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default('https://happyeducation.uk'),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1).optional(),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1).default('production'),
  NEXT_PUBLIC_SANITY_API_VERSION: z.string().default('2026-08-01'),
  NEXT_PUBLIC_GTM_ID: z.string().regex(/^GTM-[A-Z0-9]+$/).optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_').optional(),
})

/**
 * Referenced explicitly rather than via a loop, because Next.js inlines
 * `process.env.NEXT_PUBLIC_*` at build time only for statically analysable access.
 */
const publicRaw = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
  NEXT_PUBLIC_SANITY_API_VERSION: process.env.NEXT_PUBLIC_SANITY_API_VERSION,
  NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
}

const parsedPublic = publicSchema.safeParse(publicRaw)

if (!parsedPublic.success) {
  // Public config being wrong is a deployment error worth failing loudly on.
  throw new Error(
    `Invalid public environment configuration:\n${JSON.stringify(parsedPublic.error.flatten().fieldErrors, null, 2)}`,
  )
}

export const publicEnv = parsedPublic.data

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Sanity — read token is only needed for draft preview and private datasets.
  SANITY_API_READ_TOKEN: z.string().optional(),
  SANITY_REVALIDATE_SECRET: z.string().min(16).optional(),
  SANITY_PREVIEW_SECRET: z.string().min(16).optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),

  // Transactional email
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().optional(),
  EMAIL_ENQUIRY_RECIPIENT: z.string().email().optional(),

  // Bot protection
  TURNSTILE_SECRET_KEY: z.string().optional(),

  // Optional CRM behind the LeadProvider interface.
  CRM_WEBHOOK_URL: z.string().url().optional(),
  CRM_API_TOKEN: z.string().optional(),
})

let cachedServerEnv: z.infer<typeof serverSchema> | null = null

/**
 * Server-only configuration. Throws if called from the browser, which turns an
 * accidental secret leak into an immediate, obvious failure rather than a silent one.
 */
export function serverEnv() {
  if (typeof window !== 'undefined') {
    throw new Error('serverEnv() was called in the browser. Server secrets must never be bundled.')
  }
  if (cachedServerEnv) return cachedServerEnv

  const parsed = serverSchema.safeParse(process.env)
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment configuration:\n${JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)}`,
    )
  }
  cachedServerEnv = parsed.data
  return cachedServerEnv
}

/** Feature availability, so callers degrade instead of throwing. */
export const isConfigured = {
  sanity: () => Boolean(publicEnv.NEXT_PUBLIC_SANITY_PROJECT_ID),
  stripe: () => Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
  email: () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM),
  turnstile: () =>
    Boolean(publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY),
  crm: () => Boolean(process.env.CRM_WEBHOOK_URL && process.env.CRM_API_TOKEN),
  analytics: () => Boolean(publicEnv.NEXT_PUBLIC_GTM_ID),
}

export const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
export const isProduction = process.env.NODE_ENV === 'production'
