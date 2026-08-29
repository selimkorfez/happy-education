import { describe, expect, it } from 'vitest'
import { describeHits, listSourceFiles, matchLines, stripComments, type Hit } from './helpers/source'

/**
 * Durable anti-pattern guard.
 *
 * This suite protects security, type safety, truthful copy, accessible targets and
 * responsible motion. It deliberately does not prescribe a visual era: gradients,
 * rounded cards, depth and subtle motion are valid design choices when they remain
 * accessible and do not interfere with content.
 */

const SOURCE = [
  ...listSourceFiles('src', ['.ts', '.tsx', '.css']),
  ...listSourceFiles('sanity', ['.ts', '.tsx']),
]

const COPY_FILES = SOURCE.filter(
  (file) => file.relPath === 'src/lib/i18n/dictionary.ts' || file.relPath.startsWith('src/components/'),
)

function scan(pattern: RegExp, files = SOURCE): Hit[] {
  return files.flatMap((file) => matchLines(file, pattern))
}

describe('the scanner itself', () => {
  it('reads a real source tree', () => {
    expect(SOURCE.length).toBeGreaterThan(20)
    expect(COPY_FILES.length).toBeGreaterThan(5)
  })

  it('removes comments but keeps string literals and JSX text', () => {
    const stripped = stripComments(
      ['// banned: Inter', '/* banned: Geist */', "const a = 'Inter is fine in a string'", 'const b = 1 // trailing'].join('\n'),
    )
    expect(stripped).not.toContain('banned')
    expect(stripped).toContain("'Inter is fine in a string'")
    expect(stripped).toContain('const b = 1')
  })
})

describe('typography', () => {
  it('never loads Inter, Geist or Space Grotesk', () => {
    const banned = scan(
      /(?:font-family[^;]*\b(?:Inter|Geist|Space Grotesk)\b)|(?:Space[ _]Grotesk)|(?:from\s+['"]geist)|(?:\b(?:Inter|Geist)\b\s*\()|(?:['"](?:Inter|Geist)['"])/i,
    )
    expect(describeHits(banned)).toEqual([])
  })

  it('loads only the two approved families through next/font', () => {
    const fonts = SOURCE.find((file) => file.relPath === 'src/lib/fonts.ts')
    expect(fonts).toBeDefined()
    const code = stripComments(fonts?.text ?? '')
    expect(code).toContain('Fraunces')
    expect(code).toContain('Figtree')
  })
})

describe('markup safety', () => {
  it('uses dangerouslySetInnerHTML only for JSON-LD', () => {
    const offenders = SOURCE.flatMap((file) => {
      const lines = stripComments(file.text).split('\n')
      return lines.flatMap((line, index) => {
        if (!line.includes('dangerouslySetInnerHTML')) return []
        const window = lines.slice(Math.max(0, index - 8), index + 8).join('\n')
        if (window.includes('application/ld+json')) return []
        return [{ relPath: file.relPath, line: index + 1, text: line.trim() }]
      })
    })
    expect(describeHits(offenders)).toEqual([])
  })

  it('escapes JSON-LD so a CMS value cannot close the script tag', () => {
    const ESCAPE = '\\\\u003c'
    const CALLS_SERIALISER = /jsonLdHtml\s*\(|toJsonLd\s*\(/
    const emitters = SOURCE.filter((file) => file.text.includes('application/ld+json'))
    expect(emitters.length).toBeGreaterThan(0)
    const unescaped = emitters
      .filter((file) => !file.text.includes(ESCAPE) && !CALLS_SERIALISER.test(file.text))
      .map((file) => file.relPath)
    expect(unescaped).toEqual([])
  })

  it('never renders unreviewed iframe content', () => {
    expect(describeHits(scan(/<iframe\b/i))).toEqual([])
  })
})

describe('type safety', () => {
  it('contains no `any`', () => {
    expect(describeHits(scan(/(?::\s*any\b)|(?:\bas\s+any\b)|(?:<any>)|(?:\bany\[\])/))).toEqual([])
  })

  it('does not silence the type checker with blanket suppression', () => {
    expect(describeHits(scan(/@ts-(?:ignore|nocheck)/))).toEqual([])
  })
})

describe('secret hygiene', () => {
  const PUBLIC_BY_DESIGN = /PUBLISHABLE|SITE_KEY/

  it('exposes no secret-shaped name to the browser', () => {
    const offenders = SOURCE.flatMap((file) => {
      const lines = stripComments(file.text).split('\n')
      return lines.flatMap((line, index) => {
        const names = line.match(/NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|KEY)[A-Z0-9_]*/g) ?? []
        return names
          .filter((name) => !PUBLIC_BY_DESIGN.test(name))
          .map((name) => ({ relPath: file.relPath, line: index + 1, text: name }))
      })
    })
    expect(describeHits(offenders)).toEqual([])
  })

  it('never reads server secrets from a client component', () => {
    const clientComponents = SOURCE.filter((file) => /^\s*'use client'/m.test(file.text))
    const offenders = clientComponents.flatMap((file) => matchLines(file, /process\.env\.(?!NEXT_PUBLIC_)[A-Z]/))
    expect(describeHits(offenders)).toEqual([])
  })

  it('hard-codes no live credential', () => {
    const files = SOURCE.filter((file) => !/\.test\.tsx?$|__tests__|__mocks__/.test(file.relPath))
    const hits = scan(
      /\b(?:sk_live_[A-Za-z0-9]{16,}|rk_live_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}|AIza[0-9A-Za-z_-]{30,})/,
      files,
    )
    expect(describeHits(hits)).toEqual([])
  })
})

describe('user-facing copy', () => {
  const EM_DASH_BASELINE: Record<string, number> = {
    'src/lib/i18n/dictionary.ts': 2,
    'src/components/chrome/LanguageSwitcher.tsx': 2,
    'src/components/chrome/MobileNav.tsx': 1,
    'src/components/chrome/SiteHeader.tsx': 1,
    'src/components/home/HomeHero.tsx': 1,
  }

  it('adds no em dash to copy outside the known baseline', () => {
    const counts = new Map<string, Hit[]>()
    for (const hit of scan(/—/, COPY_FILES)) {
      counts.set(hit.relPath, [...(counts.get(hit.relPath) ?? []), hit])
    }
    const regressions: string[] = []
    for (const [relPath, hits] of counts) {
      const allowed = EM_DASH_BASELINE[relPath] ?? 0
      if (hits.length > allowed) regressions.push(`${relPath}: ${hits.length} em dashes, baseline ${allowed}`)
    }
    expect(regressions).toEqual([])
  })

  it('publishes none of the forbidden business claims', () => {
    const files = SOURCE.filter((file) => file.relPath !== 'src/lib/business-facts.ts')
    const hits = scan(
      /(?:British Council|English UK|ICEF|BAC accredit|OISC|IAA[- ]registered|Trustpilot)|(?:\b\d{2,4}\s*\+\s*(?:students|universities|schools|countries|öğrenci|üniversite|okul|ülke))|(?:(?:success|acceptance|approval|visa)\s+rate)/i,
      files,
    )
    expect(describeHits(hits)).toEqual([])
  })

  it('describes visa work as administrative support, never regulated advice', () => {
    expect(describeHits(scan(/(?:we|our)\s+(?:provide|offer|give)\s+immigration\s+advice/i))).toEqual([])
  })

  it('uses no decorative emoji or sparkle characters in the interface', () => {
    const hits = scan(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u)
    expect(describeHits(hits)).toEqual([])
  })
})

describe('interaction and motion', () => {
  it('keeps touch targets at the 44px minimum where a target is explicitly sized', () => {
    expect(describeHits(scan(/\bmin-h-(?:[1-9]|10)\b/))).toEqual([])
  })

  it('does not add attention-seeking utility animations', () => {
    expect(describeHits(scan(/animate-(?:bounce|pulse|ping)|data-aos/))).toEqual([])
  })

  it('provides reduced-motion protection when custom animation is present', () => {
    const globals = SOURCE.find((file) => file.relPath === 'src/styles/globals.css')
    expect(globals).toBeDefined()
    const css = globals?.text ?? ''
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('animation-duration: 0.01ms !important')
    expect(css).toContain('transition-duration: 0.01ms !important')
  })
})
