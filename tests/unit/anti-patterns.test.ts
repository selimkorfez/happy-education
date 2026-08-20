import { describe, expect, it } from 'vitest'
import { describeHits, listSourceFiles, matchLines, stripComments, type Hit } from './helpers/source'

/**
 * Anti-pattern guard.
 *
 * Every rule here corresponds to a decision recorded in the project brief, and
 * every one of them is the kind of thing that is invisible in review once the diff
 * is large: a font swapped back in, a stray `any` that unpicks strict mode, a
 * secret handed to the browser through a NEXT_PUBLIC_ name.
 *
 * All matching happens after comments are stripped. This codebase documents its
 * bans in prose ("Explicitly NOT used anywhere in this project: Inter, Geist,
 * Space Grotesk"), and a guard that fired on its own documentation would be
 * turned off within a week.
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
      ['// banned: Inter', '/* banned: Geist */', "const a = 'Inter is fine in a string'", 'const b = 1 // trailing'].join(
        '\n',
      ),
    )
    expect(stripped).not.toContain('banned')
    expect(stripped).toContain("'Inter is fine in a string'")
    expect(stripped).toContain('const b = 1')
    expect(stripped.split('\n')).toHaveLength(4)
  })

  it('does not treat a slash inside a string as a comment', () => {
    expect(stripComments("const x = '//not-a-comment'")).toContain('//not-a-comment')
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
    const fontImports = scan(/from\s+['"]next\/font\/google['"]/)
    expect(fontImports.length).toBeGreaterThan(0)
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
        // JSON-LD is emitted as <script type="application/ld+json"> immediately
        // around the call; anything else is unreviewed HTML injection.
        const window = lines.slice(Math.max(0, index - 8), index + 8).join('\n')
        if (window.includes('application/ld+json')) return []
        return [{ relPath: file.relPath, line: index + 1, text: line.trim() }]
      })
    })
    expect(describeHits(offenders)).toEqual([])
  })

  it('escapes the JSON-LD payload so a CMS string cannot close the script tag', () => {
    // `<` must become < before the JSON reaches the page, either inline or
    // through the shared serialiser. A schema field carrying "</script>" is
    // otherwise an injection point straight out of the CMS.
    const ESCAPE = '\\\\u003c'
    const CALLS_SERIALISER = /jsonLdHtml\s*\(|toJsonLd\s*\(/

    const emitters = SOURCE.filter((file) => file.text.includes('application/ld+json'))
    expect(emitters.length, 'no JSON-LD emitters found at all').toBeGreaterThan(0)

    const unescaped = emitters
      .filter((file) => !file.text.includes(ESCAPE) && !CALLS_SERIALISER.test(file.text))
      .map((file) => file.relPath)
    expect(unescaped).toEqual([])

    // The shared serialiser, if one is used, must do the escaping itself.
    const serialisers = SOURCE.filter((file) => /export function (?:jsonLdHtml|toJsonLd)\b/.test(file.text))
    for (const file of serialisers) {
      expect(file.text, file.relPath).toContain(ESCAPE)
    }
  })

  it('never renders CMS HTML through an iframe or an unguarded embed', () => {
    expect(describeHits(scan(/<iframe\b/i))).toEqual([])
  })
})

describe('type safety', () => {
  it('contains no `any`', () => {
    const hits = scan(/(?::\s*any\b)|(?:\bas\s+any\b)|(?:<any>)|(?:\bany\[\])/)
    expect(describeHits(hits)).toEqual([])
  })

  it('does not silence the type checker with a blanket suppression', () => {
    const hits = scan(/@ts-(?:ignore|nocheck)/)
    expect(describeHits(hits)).toEqual([])
  })
})

describe('secret hygiene', () => {
  /**
   * `NEXT_PUBLIC_*` values are inlined into the client bundle, so a name carrying
   * SECRET, TOKEN or KEY is a leak unless the value is public by design.
   *
   * Two allowlisted shapes: a Stripe PUBLISHABLE key, and a Turnstile/reCAPTCHA
   * SITE_KEY, both of which are meant to be read by the browser.
   */
  const PUBLIC_BY_DESIGN = /PUBLISHABLE|SITE_KEY/

  it('exposes no secret-shaped name to the browser', () => {
    const offenders = SOURCE.flatMap((file) => {
      const lines = stripComments(file.text).split('\n')
      return lines.flatMap((line, index) => {
        const names = line.match(/NEXT_PUBLIC_[A-Z0-9_]*(?:SECRET|TOKEN|KEY)[A-Z0-9_]*/g) ?? []
        const bad = names.filter((name) => !PUBLIC_BY_DESIGN.test(name))
        return bad.map((name) => ({ relPath: file.relPath, line: index + 1, text: name }))
      })
    })
    expect(describeHits(offenders)).toEqual([])
  })

  it('reads server secrets through serverEnv(), never process.env in a client component', () => {
    const clientComponents = SOURCE.filter((file) => /^\s*'use client'/m.test(file.text))
    expect(clientComponents.length).toBeGreaterThan(0)
    const offenders = clientComponents.flatMap((file) =>
      matchLines(file, /process\.env\.(?!NEXT_PUBLIC_)[A-Z]/),
    )
    expect(describeHits(offenders)).toEqual([])
  })

  it('hard-codes no live credential', () => {
    // Length-bounded so an obviously fake fixture ('sk_live_123') does not fire,
    // and test files are excluded because that is where such fixtures belong.
    const files = SOURCE.filter((file) => !/\.test\.tsx?$|__tests__|__mocks__/.test(file.relPath))
    const hits = scan(
      /\b(?:sk_live_[A-Za-z0-9]{16,}|rk_live_[A-Za-z0-9]{16,}|whsec_[A-Za-z0-9]{16,}|AIza[0-9A-Za-z_-]{30,})/,
      files,
    )
    expect(describeHits(hits)).toEqual([])
  })

  it('keeps fake credentials in test files obviously fake', () => {
    // A fixture that looks like a real key invites someone to paste a real one
    // next to it. Anything that long in a test file is a finding in its own right.
    const testFiles = SOURCE.filter((file) => /\.test\.tsx?$|__tests__/.test(file.relPath))
    const hits = testFiles.flatMap((file) =>
      matchLines(file, /\b(?:sk_live_|rk_live_|whsec_)[A-Za-z0-9]{16,}/),
    )
    expect(describeHits(hits)).toEqual([])
  })
})

describe('user-facing copy', () => {
  /**
   * Known em-dash debt, kept as an explicit per-file baseline so the rule is
   * enforceable today without failing on copy this track does not own. Removing an
   * em dash is always safe; the numbers only ever go down.
   *
   * Outstanding at the time of writing:
   *   src/lib/i18n/dictionary.ts      'meta.defaultTitle', both locales
   *   src/components/chrome/LanguageSwitcher.tsx  two screen-reader labels
   *   src/components/chrome/MobileNav.tsx         "View all — {section}"
   *   src/components/chrome/SiteHeader.tsx        brand aria-label
   *   src/components/home/HomeHero.tsx            hero placeholder label
   */
  const EM_DASH_BASELINE: Record<string, number> = {
    'src/lib/i18n/dictionary.ts': 2,
    'src/components/chrome/LanguageSwitcher.tsx': 2,
    'src/components/chrome/MobileNav.tsx': 1,
    'src/components/chrome/SiteHeader.tsx': 1,
    'src/components/home/HomeHero.tsx': 1,
  }

  it('adds no em dash to any copy file outside the known baseline', () => {
    const counts = new Map<string, Hit[]>()
    for (const hit of scan(/—/, COPY_FILES)) {
      counts.set(hit.relPath, [...(counts.get(hit.relPath) ?? []), hit])
    }

    const regressions: string[] = []
    for (const [relPath, hits] of counts) {
      const allowed = EM_DASH_BASELINE[relPath] ?? 0
      if (hits.length > allowed) {
        regressions.push(
          `${relPath}: ${hits.length} em dashes, baseline ${allowed}\n${describeHits(hits).join('\n')}`,
        )
      }
    }
    expect(regressions).toEqual([])
  })

  it('publishes none of the forbidden business claims', () => {
    // The registry that names these claims is allowed to contain them.
    const files = SOURCE.filter((file) => file.relPath !== 'src/lib/business-facts.ts')
    const hits = scan(
      /(?:British Council|English UK|ICEF|BAC accredit|OISC|IAA[- ]registered|Trustpilot)|(?:\b\d{2,4}\s*\+\s*(?:students|universities|schools|countries|öğrenci|üniversite|okul|ülke))|(?:(?:success|acceptance|approval|visa)\s+rate)/i,
      files,
    )
    expect(describeHits(hits)).toEqual([])
  })

  it('describes visa work as administrative support, never as advice', () => {
    // No IAA registration is confirmed, so "immigration advice" must not appear
    // as something the company offers.
    const hits = scan(/(?:we|our)\s+(?:provide|offer|give)\s+immigration\s+advice/i)
    expect(describeHits(hits)).toEqual([])
  })

  it('uses no emoji or sparkle characters in the interface', () => {
    const hits = scan(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u)
    expect(describeHits(hits)).toEqual([])
  })
})

describe('interaction and motion', () => {
  it('adds no hover lift or scroll animation', () => {
    const hits = scan(/hover:(?:-)?translate|hover:scale|animate-(?:bounce|pulse|ping)|data-aos|scroll-animate/)
    expect(describeHits(hits)).toEqual([])
  })

  it('builds no shadow-based hierarchy', () => {
    const hits = scan(/\bshadow-(?:sm|md|lg|xl|2xl)\b/)
    expect(describeHits(hits)).toEqual([])
  })

  it('uses no pill buttons or oversized radii in components', () => {
    const hits = scan(/\brounded-(?:full|xl|2xl|3xl)\b/)
    expect(describeHits(hits)).toEqual([])
  })

  it('keeps touch targets at the 44px minimum where a target is sized', () => {
    // Every interactive element that declares its own height uses min-h-11 or larger.
    const hits = scan(/\bmin-h-(?:[1-9]|10)\b/)
    expect(describeHits(hits)).toEqual([])
  })
})
