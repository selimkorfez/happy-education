import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const contentDir = path.join(process.cwd(), 'content', 'migrated')

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(path.join(contentDir, file), 'utf8')) as T
}

type Article = {
  _id: string
  locale: string
  title: string
  excerpt: string
  slug: { current: string }
  translationGroup: { _ref: string }
  body: Array<{ _type: string; children?: Array<{ text: string }>; headers?: string[]; rows?: Array<{ cells: string[] }> }>
}

describe('translated legacy articles', () => {
  const turkish = readJson<Article[]>('article.json')
  const english = readJson<Article[]>('article.en.json')

  it('contains one complete English sibling for every Turkish article', () => {
    expect(english).toHaveLength(18)
    expect(new Set(english.map((article) => article.slug.current)).size).toBe(18)
    expect(english.map((article) => article.translationGroup._ref).sort())
      .toEqual(turkish.map((article) => article.translationGroup._ref).sort())

    for (const article of english) {
      expect(article.locale).toBe('en')
      expect(article.title.trim()).not.toBe('')
      expect(article.excerpt.trim()).not.toBe('')
      expect(article.body.length).toBeGreaterThan(0)
    }
  })

  it('preserves every body block and translates all visible table cells', () => {
    english.forEach((article, index) => {
      expect(article.body).toHaveLength(turkish[index]!.body.length)
      const visibleText = article.body.flatMap((block) => [
        ...(block.children?.map((child) => child.text) ?? []),
        ...(block.headers ?? []),
        ...(block.rows?.flatMap((row) => row.cells) ?? []),
      ])
      expect(visibleText.every((text) => text.trim().length > 0)).toBe(true)
      expect(visibleText.join(' ')).not.toMatch(/[çğıöşüÇĞİÖŞÜ]|<<<|>>>/)
    })
  })
})
