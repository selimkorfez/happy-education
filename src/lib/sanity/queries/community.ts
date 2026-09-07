import 'server-only'
import { sanityFetch } from '@/lib/sanity/client'
import { isConfigured } from '@/lib/env'
import type { Locale } from '@/lib/i18n/config'
import type { MediaSource } from '@/components/ui/MediaFrame'

export interface SocialPostCard {
  _id: string
  title: string
  platform: 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook' | 'LinkedIn'
  externalUrl: string
  summary: string
  whyItMatters: string
  topic?: string
  publishedAt?: string
  featured?: boolean
  thumbnail?: MediaSource
}

export interface TestimonialCard {
  _id: string
  studentName: string
  quote: string
  programme?: string
  photo?: MediaSource
  permissionStatus: 'written' | 'verbal'
}

/**
 * Only explicitly active social cards are public. The website links to the original
 * Happy Education post rather than embedding a tracker-heavy third-party iframe.
 */
export async function listSocialPosts(locale: Locale, limit = 18): Promise<SocialPostCard[]> {
  if (!isConfigured.sanity()) return []
  return sanityFetch<SocialPostCard[]>(
    /* groq */ `
      *[
        _type == "socialPost"
        && locale == $locale
        && active == true
        && defined(externalUrl)
        && defined(summary)
        && defined(whyItMatters)
      ] | order(featured desc, publishedAt desc, _createdAt desc)[0...$limit]{
        _id, title, platform, externalUrl, summary, whyItMatters,
        topic, publishedAt, featured, thumbnail
      }
    `,
    { locale, limit },
    { tags: ['socialPost'], revalidate: 900 },
    [],
  )
}

/**
 * A historic/public quote is not enough to republish it here. Both authenticity and
 * publication permission must be recorded in Sanity before the query can return it.
 */
export async function listApprovedTestimonials(locale: Locale, limit = 12): Promise<TestimonialCard[]> {
  if (!isConfigured.sanity()) return []
  return sanityFetch<TestimonialCard[]>(
    /* groq */ `
      *[
        _type == "testimonial"
        && locale == $locale
        && verified == true
        && permissionStatus in ["written", "verbal"]
      ] | order(_createdAt desc)[0...$limit]{
        _id, studentName, quote, programme, photo, permissionStatus
      }
    `,
    { locale, limit },
    { tags: ['testimonial'], revalidate: 900 },
    [],
  )
}
