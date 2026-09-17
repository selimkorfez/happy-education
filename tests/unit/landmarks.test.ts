import { describe, expect, it } from 'vitest'
import { landmarkForPathname, landmarkSceneKeys } from '@/lib/navigation/landmarks'

describe('destination landmark transitions', () => {
  it('selects country artwork in both language route trees', () => {
    expect(landmarkForPathname('/en/universities/united-kingdom')?.label).toBe('United Kingdom')
    expect(landmarkForPathname('/tr/universiteler/ingiltere')?.label).toBe('United Kingdom')
    expect(landmarkForPathname('/en/language-schools/australia')?.motif).toBe('opera')
  })

  it('prefers a city when a future city route is present', () => {
    expect(landmarkForPathname('/en/universities/united-kingdom/oxford')?.label).toBe('Oxford')
    expect(landmarkForPathname('/tr/dil-okullari/amerika/san-francisco')?.label).toBe('San Francisco')
  })

  it('leaves ordinary routes on the general travel transition', () => {
    expect(landmarkForPathname('/en/services')).toBeNull()
    expect(landmarkForPathname('/tr/iletisim')).toBeNull()
  })

  it('has artwork for the full current destination and city catalogue', () => {
    expect(landmarkSceneKeys()).toHaveLength(48)
  })
})
