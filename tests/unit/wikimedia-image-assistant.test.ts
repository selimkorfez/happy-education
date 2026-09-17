import { describe, expect, it } from 'vitest'
import {
  imageSearchSeed,
  isAllowedLicence,
  isBrandArtworkPath,
  parseWikimediaResponse,
  wikimediaSearchUrl,
  type WikimediaResponse,
} from '@sanity-schema/lib/wikimedia'

describe('licensed Wikimedia image assistant', () => {
  it('builds a cross-origin Commons metadata search', () => {
    const url = new URL(wikimediaSearchUrl('Oxford university campus'))
    expect(url.origin).toBe('https://commons.wikimedia.org')
    expect(url.searchParams.get('origin')).toBe('*')
    expect(url.searchParams.get('gsrnamespace')).toBe('6')
    expect(url.searchParams.get('gsrsearch')).toBe('Oxford university campus')
    expect(url.searchParams.get('iiprop')).toContain('extmetadata')
  })

  it('accepts reusable licences and rejects NC or ND restrictions', () => {
    expect(isAllowedLicence('CC0 1.0')).toBe(true)
    expect(isAllowedLicence('Public domain')).toBe(true)
    expect(isAllowedLicence('CC BY 4.0')).toBe(true)
    expect(isAllowedLicence('CC BY-SA 2.0')).toBe(true)
    expect(isAllowedLicence('CC BY-NC 4.0')).toBe(false)
    expect(isAllowedLicence('CC BY-ND 4.0')).toBe(false)
    expect(isAllowedLicence('All rights reserved')).toBe(false)
  })

  it('keeps only suitable bitmap results and normalises their metadata', () => {
    const response: WikimediaResponse = {
      query: {
        pages: [
          {
            pageid: 42,
            title: 'File:Oxford quadrangle.jpg',
            fullurl: 'https://commons.wikimedia.org/wiki/File:Oxford_quadrangle.jpg',
            imageinfo: [{
              url: 'https://upload.wikimedia.org/oxford-original.jpg',
              thumburl: 'https://upload.wikimedia.org/oxford-preview.jpg',
              width: 2400,
              height: 1600,
              size: 3_000_000,
              mime: 'image/jpeg',
              extmetadata: {
                ObjectName: { value: 'Oxford college quadrangle' },
                ImageDescription: { value: '<b>Historic</b> Oxford college quadrangle.' },
                Artist: { value: '<a href="/wiki/User:Example">Example Photographer</a>' },
                LicenseShortName: { value: 'CC BY-SA 4.0' },
                LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
              },
            }],
          },
          {
            pageid: 43,
            title: 'File:Restricted.jpg',
            fullurl: 'https://commons.wikimedia.org/wiki/File:Restricted.jpg',
            imageinfo: [{
              url: 'https://upload.wikimedia.org/restricted.jpg',
              thumburl: 'https://upload.wikimedia.org/restricted-preview.jpg',
              width: 2400,
              height: 1600,
              size: 2_000_000,
              mime: 'image/jpeg',
              extmetadata: {
                LicenseShortName: { value: 'CC BY-NC 4.0' },
              },
            }],
          },
        ],
      },
    }

    expect(parseWikimediaResponse(response)).toEqual([
      expect.objectContaining({
        id: '42',
        title: 'Oxford college quadrangle',
        description: 'Historic Oxford college quadrangle.',
        creator: 'Example Photographer',
        licence: 'CC BY-SA 4.0',
        width: 2400,
      }),
    ])
  })

  it('creates topic-aware starter searches and protects brand artwork fields', () => {
    const document = {
      _type: 'siteSettings',
      routeFinder: {
        items: [{
          _key: 'universities',
          key: 'universities',
          title: { en: 'University study', tr: 'Üniversite eğitimi' },
        }],
      },
    }

    const seed = imageSearchSeed(
      document,
      ['routeFinder', 'items', { _key: 'universities' }, 'image'],
    )
    expect(seed).toContain('University')
    expect(seed).toContain('campus')
    expect(isBrandArtworkPath(['brand', 'logoOnDark'])).toBe(true)
    expect(isBrandArtworkPath(['homeHero', 'image'])).toBe(false)
  })
})
