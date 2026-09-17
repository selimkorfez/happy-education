import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { licensedMediaForInstitutionOrPlace } from '@/lib/media/licensed-media'

describe('institution photography fallbacks', () => {
  it('keeps exact campus and city matches ahead of country fallbacks', () => {
    expect(licensedMediaForInstitutionOrPlace('University of Oxford', 'Oxford', 'United Kingdom')?.kind).toBe('campus')
    expect(licensedMediaForInstitutionOrPlace('Example College', 'Manchester', 'United Kingdom')?.alt).toContain('Manchester')
  })

  it('varies country-level fallbacks deterministically across institutions', () => {
    const images = ['Alpha College', 'Beta College', 'Gamma College', 'Delta College', 'Epsilon College']
      .map((title) => licensedMediaForInstitutionOrPlace(title, 'Unmapped town', 'united-kingdom')?.sourceUrl)

    expect(new Set(images).size).toBeGreaterThan(2)
    expect(licensedMediaForInstitutionOrPlace('Alpha College', 'Unmapped town', 'united-kingdom')?.sourceUrl).toBe(images[0])
  })

  it('keeps fallback labels honest by using location imagery', () => {
    expect(licensedMediaForInstitutionOrPlace('Unknown School', 'Unknown city', 'united-states')?.kind).toBe('city')
  })
})
