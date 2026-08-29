import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { REPO_ROOT, readSourceFile } from './helpers/source'

/**
 * Design-system guard.
 *
 * Visual direction is allowed to evolve, but accessibility is not. This suite
 * therefore guards contrast, token parity, focus visibility and reduced-motion
 * support rather than prescribing an old aesthetic such as square corners or a
 * ban on gradients and depth.
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
    const passes = output.match(/^PASS/gm) ?? []
    expect(passes.length).toBeGreaterThanOrEqual(30)
  })

  it('checks the focus ring and control borders at the 3:1 non-text threshold', () => {
    expect(output).toContain('focus ring on page')
    expect(output).toContain('input border on page')
  })

  it('checks text on the new soft visual surfaces', () => {
    expect(output).toContain('body text on warm brand tint')
    expect(output).toContain('body text on sky tint')
    expect(output).toContain('body text on mint tint')
    expect(output).toContain('body text on lilac tint')
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
    expect(cssTokens.size).toBeGreaterThanOrEqual(19)
    expect(scriptTokens.size).toBeGreaterThanOrEqual(19)
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

describe('accessible visual behaviour', () => {
  const css = readSourceFile('src/styles/globals.css').text

  it('keeps the focus outline rather than removing it', () => {
    expect(css).not.toMatch(/outline:\s*(?:none|0)\s*;/)
    expect(css).toContain(':focus-visible')
  })

  it('provides a reduced-motion mode for animated UI', () => {
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toMatch(/animation-duration:\s*0\.01ms\s*!important/)
    expect(css).toMatch(/transition-duration:\s*0\.01ms\s*!important/)
  })

  it('uses a bounded radius scale rather than arbitrary global geometry', () => {
    expect(css).toContain('--radius-sm: 6px')
    expect(css).toContain('--radius-md: 12px')
    expect(css).toContain('--radius-lg: 20px')
    expect(css).toContain('--radius-xl: 28px')
  })
})
