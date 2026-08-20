import { describe, expect, it } from 'vitest'
import { extractHeadings, headingId, slugifyHeading } from '@/components/content/PortableText'

/**
 * Heading anchors are part of the URL surface: a table-of-contents link, a shared
 * deep link and a redirect can all point at one. They therefore have to be stable
 * and, for the Turkish tree, correct about the dotted and dotless i.
 */

function block(style: string, ...text: string[]) {
  return { _type: 'block', style, children: text.map((t) => ({ _type: 'span', text: t })) }
}

describe('slugifyHeading', () => {
  it('lowercases and hyphenates plain English headings', () => {
    expect(slugifyHeading('Entry Requirements')).toBe('entry-requirements')
    expect(slugifyHeading('How we work')).toBe('how-we-work')
  })

  it('transliterates Turkish letters rather than dropping them', () => {
    expect(slugifyHeading('Öğrenci Vizesi')).toBe('ogrenci-vizesi')
    expect(slugifyHeading('Başvuru Süreci')).toBe('basvuru-sureci')
    expect(slugifyHeading('Çalışma İzni')).toBe('calisma-izni')
    expect(slugifyHeading('Yatılı Okullar')).toBe('yatili-okullar')
    expect(slugifyHeading('Dil Okulları')).toBe('dil-okullari')
  })

  it('handles the dotted and dotless i in both cases', () => {
    // 'I'.toLowerCase() is 'i', 'İ'.toLowerCase() is i + combining dot, and 'ı'
    // has no ASCII equivalent at all. All three must land on a plain 'i'.
    expect(slugifyHeading('İngiltere')).toBe('ingiltere')
    expect(slugifyHeading('IRLANDA')).toBe('irlanda')
    expect(slugifyHeading('Kısıklı')).toBe('kisikli')
    expect(slugifyHeading('İSTANBUL')).toBe('istanbul')
    expect(slugifyHeading('ıIİi')).toBe('iiii')
  })

  it('covers every Turkish-specific letter', () => {
    expect(slugifyHeading('ğışçöü')).toBe('giscou')
    expect(slugifyHeading('ĞİŞÇÖÜ')).toBe('giscou')
  })

  it('strips punctuation, collapses separators and trims the edges', () => {
    expect(slugifyHeading('  What does it cost?  ')).toBe('what-does-it-cost')
    expect(slugifyHeading('Fees, funding & scholarships')).toBe('fees-funding-scholarships')
    expect(slugifyHeading('A/B — C')).toBe('a-b-c')
    expect(slugifyHeading('2026/27 intake')).toBe('2026-27-intake')
    expect(slugifyHeading('---')).toBe('')
    expect(slugifyHeading('')).toBe('')
  })

  it('caps the slug length so an anchor cannot become unbounded', () => {
    const long = slugifyHeading(
      'A very long heading indeed that keeps going well past any sensible anchor length limit',
    )
    expect(long.length).toBeLessThanOrEqual(60)
  })

  it('is deterministic and idempotent for already-slugged input', () => {
    expect(slugifyHeading('entry-requirements')).toBe('entry-requirements')
    expect(slugifyHeading(slugifyHeading('Öğrenci Vizesi'))).toBe('ogrenci-vizesi')
  })
})

describe('headingId', () => {
  it('joins every span of the block before slugifying', () => {
    expect(headingId(block('h2', 'Student ', 'visa ', 'basics'))).toBe('student-visa-basics')
  })

  it('tolerates a malformed or empty block', () => {
    expect(headingId(null)).toBe('')
    expect(headingId({})).toBe('')
    expect(headingId({ children: [] })).toBe('')
    expect(headingId({ children: [{}] })).toBe('')
  })
})

describe('extractHeadings', () => {
  const body = [
    block('h1', 'Should never appear'),
    block('normal', 'Some introductory prose.'),
    block('h2', 'Entry requirements'),
    block('h3', 'English language'),
    block('h2', 'Öğrenci Vizesi'),
    { _type: 'imageWithMeta', alt: 'not a heading' },
    block('h2', '   '),
    block('h4', 'Deep heading'),
  ]

  it('returns only H2s, in document order, with their anchors', () => {
    expect(extractHeadings(body)).toEqual([
      { id: 'entry-requirements', text: 'Entry requirements' },
      { id: 'ogrenci-vizesi', text: 'Öğrenci Vizesi' },
    ])
  })

  it('drops headings with no visible text', () => {
    expect(extractHeadings([block('h2', ''), block('h2', '   ')])).toEqual([])
  })

  it('produces ids that match headingId for the same block', () => {
    const heading = block('h2', 'Fees and funding')
    expect(extractHeadings([heading])[0]?.id).toBe(headingId(heading))
  })

  it('returns an empty list for anything that is not a block array', () => {
    expect(extractHeadings(null)).toEqual([])
    expect(extractHeadings(undefined)).toEqual([])
    expect(extractHeadings('<h2>Heading</h2>')).toEqual([])
    expect(extractHeadings({})).toEqual([])
    expect(extractHeadings([])).toEqual([])
  })

  it('ignores non-block types that happen to carry a style', () => {
    expect(extractHeadings([{ _type: 'callout', style: 'h2', children: [{ text: 'Nope' }] }])).toEqual([])
  })
})
