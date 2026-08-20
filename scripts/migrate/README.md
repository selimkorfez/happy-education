# WordPress to Sanity migration

Plain Node ESM. No build step, no TypeScript, no dependencies beyond `@sanity/client`
(and that only for `--commit`). Run everything from the repository root with `node`.

```
node scripts/migrate/html-to-portable-text.mjs --self-test   # 17 conversion assertions
node scripts/migrate/extract.mjs                             # source  -> out/documents/*.json
node scripts/migrate/media.mjs                               # asset manifest (no network)
node scripts/migrate/media.mjs --download                    # fetch + resize the files
node scripts/migrate/import.mjs                              # DRY RUN (the default)
node scripts/migrate/import.mjs --commit --with-media        # writes to Sanity
node scripts/migrate/report.mjs                              # writes docs/MIGRATION_QA.md
```

## Files

| File | Does |
|---|---|
| `html-to-portable-text.mjs` | Elementor HTML to Portable Text. Also a CLI: `--self-test`, `--wp-id <id>` |
| `extract.mjs` | Applies the audit's KEEP/REWRITE/MERGE/DROP buckets, populates structured fields, resolves internal links, writes `out/` |
| `media.mjs` | Splits the 964-asset library into referenced and orphaned, downloads, resizes, writes the upload manifest |
| `import.mjs` | Idempotent two-pass load into Sanity |
| `report.mjs` | Source-to-target comparison, writes `docs/MIGRATION_QA.md` |
| `lib/html.mjs` | Tolerant dependency-free HTML parser |
| `lib/text.mjs` | Entity decoding, mojibake repair, copy-defect detection, slugify |
| `lib/keys.mjs` | Deterministic `_key` and `_id` generation |
| `lib/csv.mjs` | CSV and NDJSON readers |
| `out/` | Generated. Git-ignored via `out/.gitignore` |

## Credentials

`import.mjs --commit` needs a write token in the environment. It is never hard-coded
and never written to `out/`:

```
export SANITY_API_WRITE_TOKEN='sk...'      # sanity.io/manage -> API -> Tokens (Editor)
node scripts/migrate/import.mjs --commit
```

Project and dataset come from `NEXT_PUBLIC_SANITY_PROJECT_ID` and
`NEXT_PUBLIC_SANITY_DATASET`; `.env.local` is read if present. Those two are public
by design, which is why the token has no `NEXT_PUBLIC_` prefix. Override the dataset
for a rehearsal with `--dataset staging`.

## Re-running is safe

Document `_id`s are derived from the legacy WordPress id (`institution-tr-12196`) and
every Portable Text `_key` is a hash of (document, key kind, ordinal). The same input
produces byte-identical output, and `createOrReplace` overwrites rather than
duplicating. A failed import can simply be re-run.

Note that a re-run also overwrites editor changes made in the Studio. Once editors
start work, restrict the run with `--types` or `--limit`.

## Rules the scripts enforce

- No factual claim is edited. Fees, prices, dates, rankings, visa statements and
  work-rights claims are carried across verbatim, `review.timeSensitive` is set and
  `review.editorialFlag` names what has to be re-checked. Encoding is repaired;
  wording never is.
- A structured field is populated only where `institutions-extracted.json` holds the
  value. `officialWebsite` is empty on every record because it is empty in the source.
- `licence.cleared` is `false` on every migrated image. `imageWithMeta` refuses to
  render an uncleared image, so the site fails closed.
- No document may contain a `happyeducation.uk/wp-content` URL. `import.mjs`
  validates for it and refuses to write a payload that still has one.
- `javascript:`, `data:`, `vbscript:` and `file:` hrefs are dropped, keeping the link
  text. The Portable Text schema has no HTML block, so no migrated markup can reach
  the renderer.
- `--dry-run` is the default for `import.mjs`. It refuses to write without `--commit`.
