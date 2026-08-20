import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * Shared helpers for the source-scanning guard tests.
 *
 * These tests read the repository as text rather than importing it, because the
 * things they guard against (a banned font, a stray `any`, an em dash in copy)
 * are properties of the source, not of the runtime.
 *
 * Everything here strips comments before matching. A rule that fires on prose is
 * a rule people learn to ignore, and this codebase documents its decisions in
 * long comments that legitimately mention the very patterns being banned.
 */

export const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url))

const IGNORED_DIRECTORIES = new Set(['node_modules', '.next', '.git', 'dist', 'coverage'])

export interface SourceFile {
  /** Absolute path on disk. */
  path: string
  /** Path relative to the repository root, using forward slashes. */
  relPath: string
  text: string
}

/** Recursively collects files under `dir` (relative to the repo root) by extension. */
export function listSourceFiles(dir: string, extensions: readonly string[]): SourceFile[] {
  const absolute = join(REPO_ROOT, dir)
  const out: SourceFile[] = []

  function walk(current: string): void {
    for (const entry of readdirSync(current)) {
      if (IGNORED_DIRECTORIES.has(entry)) continue
      const full = join(current, entry)
      if (statSync(full).isDirectory()) {
        walk(full)
        continue
      }
      if (!extensions.some((ext) => entry.endsWith(ext))) continue
      out.push({
        path: full,
        relPath: relative(REPO_ROOT, full).split(sep).join('/'),
        text: readFileSync(full, 'utf8'),
      })
    }
  }

  walk(absolute)
  return out.sort((a, b) => a.relPath.localeCompare(b.relPath))
}

export function readSourceFile(relPath: string): SourceFile {
  const path = join(REPO_ROOT, relPath)
  return { path, relPath, text: readFileSync(path, 'utf8') }
}

/**
 * Replaces the contents of `//` and block comments with spaces, keeping every
 * newline so reported line numbers still match the file on disk.
 *
 * String and template literals are preserved: they carry user-facing copy, which
 * several of these rules are specifically about. Regular-expression literals are
 * not tracked, which can only ever cause a rule to look at less text, never more.
 */
export function stripComments(text: string): string {
  let out = ''
  let index = 0
  type Mode = 'code' | 'line' | 'block' | 'single' | 'double' | 'template'
  let mode: Mode = 'code'

  while (index < text.length) {
    const char = text[index] ?? ''
    const next = text[index + 1] ?? ''

    if (mode === 'code') {
      if (char === '/' && next === '/') {
        mode = 'line'
        out += '  '
        index += 2
        continue
      }
      if (char === '/' && next === '*') {
        mode = 'block'
        out += '  '
        index += 2
        continue
      }
      if (char === "'") mode = 'single'
      else if (char === '"') mode = 'double'
      else if (char === '`') mode = 'template'
      out += char
      index += 1
      continue
    }

    if (mode === 'line') {
      if (char === '\n') {
        mode = 'code'
        out += char
      } else {
        out += ' '
      }
      index += 1
      continue
    }

    if (mode === 'block') {
      if (char === '*' && next === '/') {
        mode = 'code'
        out += '  '
        index += 2
        continue
      }
      out += char === '\n' ? '\n' : ' '
      index += 1
      continue
    }

    // Inside a string or template literal.
    if (char === '\\') {
      out += char + next
      index += 2
      continue
    }
    if (
      (mode === 'single' && char === "'") ||
      (mode === 'double' && char === '"') ||
      (mode === 'template' && char === '`')
    ) {
      mode = 'code'
    }
    out += char
    index += 1
  }

  return out
}

export interface Hit {
  relPath: string
  line: number
  text: string
}

/** Every line of `file` matching `pattern`, after comments have been removed. */
export function matchLines(file: SourceFile, pattern: RegExp): Hit[] {
  const lines = stripComments(file.text).split('\n')
  const hits: Hit[] = []
  lines.forEach((line, i) => {
    // A fresh regex per line, so a /g pattern cannot carry lastIndex between lines.
    const test = new RegExp(pattern.source, pattern.flags.replace('g', ''))
    if (test.test(line)) hits.push({ relPath: file.relPath, line: i + 1, text: line.trim() })
  })
  return hits
}

/** Formats hits for an assertion message a human can act on without re-running. */
export function describeHits(hits: readonly Hit[]): string[] {
  return hits.map((hit) => `${hit.relPath}:${hit.line}  ${hit.text}`)
}
