import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('next/image', () => ({ default: ({ src, alt }: { src: string; alt: string }) => createElement('img', { src, alt }) }))
vi.mock('@/lib/sanity/image', () => ({ imageUrl: () => 'https://cdn.sanity.io/cleared.jpg', blurDataUrl: () => undefined }))

import { EDITORIAL_PHOTOS as photos } from '@/lib/media/editorial-photos'
import { licensedMediaForDestinationEditorial, licensedMediaForEditorialText as editorial, licensedMediaForEditorialVariant as variant } from '@/lib/media/editorial-media'
import { licensedMediaForPlace, type LicensedExternalImage } from '@/lib/media/licensed-media'
import { MediaFrame } from '@/components/ui/MediaFrame'
import { PageHero } from '@/components/shared/PageHero'

const launchArticles = [
  'Choose course fit before chasing a university ranking',
  'A simple university application checklist',
  'How to compare language courses without looking only at price',
  'Questions parents should ask before booking a summer school',
  'What belongs on a boarding-school shortlist?',
  'Build a realistic study-abroad budget before you commit',
]

describe('editorial art direction', () => {
  it('gives the launch article grid six distinct photographs and keeps its hero reserved', () => {
    const images = launchArticles.map((title) => editorial(title).src)
    expect(new Set(images).size).toBe(6)
    expect(images).not.toContain(photos['home-cambridge'].src)
  })

  it('keeps a title’s choice consistent between cards, detail pages and related links', () => {
    for (const title of launchArticles) {
      expect(editorial(title, 'UK education', 'Compare options in London').src).toBe(editorial(title).src)
      expect(variant('guides', title).src).toBe(editorial(title).src)
    }
  })

  it('matches cities before a broader UK mention, including Turkish aliases and punctuation', () => {
    expect(editorial('Manchester, UK: a city guide').sourceUrl).toBe(licensedMediaForPlace('manchester')?.sourceUrl)
    expect(editorial('İngiltere’de Oxford').sourceUrl).toBe(licensedMediaForPlace('oxford')?.sourceUrl)
    expect(editorial('Londra’da yaşam').sourceUrl).toBe(licensedMediaForPlace('london')?.sourceUrl)
    expect(licensedMediaForDestinationEditorial('oxford', 'England').sourceUrl).toBe(licensedMediaForPlace('oxford')?.sourceUrl)
  })

  it('uses relevant planning/reading photography for practical English and Turkish guides', () => {
    expect([photos['planning-desk'].src, photos.notebook.src, photos.workspace.src]).toContain(editorial('İngiltere’de eğitim bütçe rehberi').src)
    expect([photos['course-books'].src, photos.bookshelves.src, photos['open-book'].src, photos['reading-notes'].src]).toContain(editorial('İngilizce dil kursları').src)
    expect(editorial('Student accommodation guide').src).toBe(photos['shared-lounge'].src)
    expect(editorial('Pre-departure support').src).toBe(photos['travel-planning'].src)
  })

  it('keeps comparisons and unsupported places neutral instead of inventing a location', () => {
    expect(editorial('Canada or Australia?').kind).toBe('study')
    expect(editorial('Oxford or Cambridge?').kind).toBe('study')
    expect(editorial('Discover Iceland').kind).toBe('study')
    expect(editorial('Hukuk eğitimi').src).not.toBe(licensedMediaForDestinationEditorial('uk').src)
  })

  it('varies UK editorial pages and gives core section indexes distinct photos', () => {
    const images = Array.from({ length: 20 }, (_, i) => editorial(`Life in the UK: story ${i}`).src)
    expect(new Set(images).size).toBeGreaterThanOrEqual(5)
    const sections = ['about', 'contact', 'consultation', 'guides', 'insights', 'language', 'services', 'universities', 'summer', 'boarding', 'tours'] as const
    expect(new Set(sections.map((key) => variant(key).src)).size).toBe(sections.length)
  })

  it('ships every new photo with an existing asset and complete reusable-rights metadata', () => {
    for (const photo of Object.values(photos)) {
      expect(existsSync(resolve(process.cwd(), `public${photo.src}`))).toBe(true)
      expect(photo.cleared).toBe(true)
      expect(photo.creator.length).toBeGreaterThan(2)
      expect(photo.alt.length).toBeGreaterThan(20)
      expect(photo.sourceUrl).toMatch(/^https:\/\/commons.wikimedia.org\/wiki\/File:/)
      expect(photo.licenceUrl).toMatch(/^https:\/\/creativecommons.org\//)
    }
  })
})

describe('publication rights at rendering boundaries', () => {
  const props = { alt: 'Study photograph', width: 800, height: 600, sizes: '100vw' }
  it('withholds an uncleared CMS image and renders the licensed fallback with attribution', () => {
    const image = { asset: { _ref: 'unapproved' }, licence: { cleared: false, holder: 'Unknown', terms: 'Unknown' } }
    const blocked = renderToStaticMarkup(createElement(MediaFrame, { ...props, image }))
    expect(blocked).not.toContain('<img')
    const fallback = renderToStaticMarkup(createElement(MediaFrame, { ...props, image, external: photos.notebook }))
    expect(fallback).toContain(photos.notebook.src)
    expect(fallback).toContain(photos.notebook.sourceUrl)
    expect(fallback).toContain(photos.notebook.licenceUrl)
    expect(fallback).not.toContain('cdn.sanity.io')
  })

  it('requires explicit boolean approval for external photography too', () => {
    const external = { ...photos.notebook, cleared: 'yes' } as unknown as LicensedExternalImage
    expect(renderToStaticMarkup(createElement(MediaFrame, { ...props, external }))).not.toContain('<img')
  })

  it('lets approved CMS hero photography replace fallback art direction', () => {
    const html = renderToStaticMarkup(createElement(PageHero, {
      locale: 'en', crumbs: [], title: 'A page', visualVariant: 'guides',
      image: { asset: { _ref: 'approved' }, alt: 'Approved campus photo', licence: { cleared: true, holder: 'Happy Education', terms: 'Owned' } },
      externalImage: photos.notebook,
    }))
    expect(html).toContain('https://cdn.sanity.io/cleared.jpg')
    expect(html).not.toContain(photos.notebook.src)
  })

  it('uses the fallback photo’s alt text, never metadata from a withheld CMS photo', () => {
    const html = renderToStaticMarkup(createElement(PageHero, {
      locale: 'en', crumbs: [], title: 'A page', visualVariant: 'guides', imageAlt: 'Withheld picture',
      image: { asset: { _ref: 'unapproved' }, licence: { cleared: false, holder: 'Unknown', terms: 'Unknown' } },
    }))
    expect(html).toContain(photos['course-books'].alt)
    expect(html).not.toContain('Withheld picture')
  })
})
