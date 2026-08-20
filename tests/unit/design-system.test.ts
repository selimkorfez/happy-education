import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { REPO_ROOT, readSourceFile } from './helpers/source'

/**
 * Design-system guard.
 *
 * `scripts/check-contrast.mjs` is the authority on WCAG 2.2 AA for this palette.
 * Running it as a child process here means a token change that breaks contrast
 * fails the unit suite, not only the separate CI step, so it surfaces in the
 * editor loop where the token was changed.
 *
 * The second half of this file closes the gap the script cannot see on its own:
 * the script holds its own copy of the hex values, so a token edited in
 * `globals.css` but not in the script would keep passing while the site regressed.
 */

const CONTRAST_SCRIPT = join(REPO_ROOT, 'scripts', 'check-contrast.mjs')

const result = spawnSync(process.execPath, [CONTRAST_SCRIPT], {
  cwd: REPO_ROOT,
  encoding: 'utf8',
  timeout: 30_000,
})

const output = `${result.stdout ?? ''}${result.stderr ?? ''}`

describe('contrast check', () => {
  it('runs to completion', () => {
    expect(result.error, String(result.error)).toBeUndefined()
    expect(result.signal).toBeNull()
  })

  it('exits zero, so every required pairing meets WCAG 2.2 AA', () => {
    expect(output).not.toMatch(/^FAIL/m)
    expect(result.status, output).toBe(0)
  })

  it('actually asserted a meaningful number of pairings', () => {
    // Guards against the script being emptied or short-circuited and still exiting 0.
    const passes = output.match(/^PASS/gm) ?? []
    expect(passes.length).toBeGreaterThanOrEqual(20)
  })

  it('checks the focus ring and control borders at the 3:1 non-text threshold', () => {
    expect(output).toContain('focus ring on page')
    expect(output).toContain('input border on page')
  })
})

describe('token parity between globals.css and the contrast script', () => {
  const css = readSourceFile('src/styles/globals.css').text
  const script = readSourceFile('scripts/check-contrast.mjs').text

  const cssTokens = new Map<string, string>(
    [...css.matchAll(/--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)].map((match) => [
      match[1] ?? '',
      (match[2] ?? '').toLowerCase(),
    ]),
  )

  const scriptTokens = new Map<string, string>(
    [...script.matchAll(/'([a-z0-9-]+)':\s*'(#[0-9a-fA-F]{3,8})'/g)].map((match) => [
      match[1] ?? '',
      (match[2] ?? '').toLowerCase(),
    ]),
  )

  it('finds the palette in both files', () => {
    expect(cssTokens.size).toBeGreaterThanOrEqual(15)
    expect(scriptTokens.size).toBeGreaterThanOrEqual(15)
  })

  it('agrees on every hex value the guard knows about', () => {
    const drift: string[] = []
    for (const [name, hex] of scriptTokens) {
      const fromCss = cssTokens.get(name)
      if (fromCss && fromCss !== hex) {
        drift.push(`--color-${name}: css ${fromCss} vs check-contrast.mjs ${hex}`)
      }
    }
    expect(drift).toEqual([])
  })

  it('leaves no colour token unguarded', () => {
    const unguarded = [...cssTokens.keys()].filter((name) => !scriptTokens.has(name))
    expect(unguarded).toEqual([])
  })
})

describe('banned visual treatments', () => {
  const css = readSourceFile('src/styles/globals.css').text

  it('defines no gradient, glow or blur surface in the global stylesheet', () => {
    expect(css).not.toMatch(/linear-gradient|radial-gradient|conic-gradient/)
    expect(css).not.toMatch(/backdrop-filter/)
    expect(css).not.toMatch(/filter:\s*blur/)
  })

  it('uses the 3px corner radius rather than a pill or a large radius', () => {
    const radii = [...css.matchAll(/border-radius:\s*([^;]+);/g)].map((match) =>
      (match[1] ?? '').trim(),
    )
    for (const radius of radii) {
      expect(radius, `border-radius: ${radius}`).not.toMatch(/9999px|50%|\b(?:1[2-9]|[2-9]\d)px/)
    }
  })

  it('keeps the focus outline rather than removing it', () => {
    expect(css).not.toMatch(/outline:\s*(?:none|0)\s*;/)
  })
})
