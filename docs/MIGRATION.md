# WordPress to Sanity migration

**Source of truth for the numbers below:** the audit artefacts in `docs/audit/`.
`content-inventory.csv` (336 rows), `redirects-draft.csv` (395 rows),
`institutions-extracted.json` (313 records), `blog-posts.json` (18 articles), and the raw
export at `docs/audit/archive/wp/{pages,posts,media,categories,users}.ndjson`.
Everything here is measured, not estimated. Where a number is inferred it says so.

**Related:** redirect and indexing consequences in `docs/SEO.md`; import-time sanitisation
rules in `docs/SECURITY.md` section 5; cutover sequence in `docs/DEPLOYMENT.md`.

---

## 1. What exists

| | Count |
|---|---|
| WordPress documents exported | **331** (313 pages, 18 posts) |
| Rendered HTML in those documents | 3,011,099 characters |
| Total word count | **77,255** |
| Media library items | 964 records (889 unique after de-duplication) |
| Sitemap-only URLs, absent from the export | 5 |
| Distinct broken internal link targets | 75 (30 hard 404s) |

The site is smaller than it looks. The median page is 181 words and 269 of 331 pages are under
300 words. **This is a rebuild of content depth, not a URL migration**, and planning it as a
lift-and-shift is the main way it goes wrong.

---

## 2. Classification

Every one of the 331 documents is classified in `docs/audit/content-inventory.csv`.

| Bucket | Count | Meaning |
|---|---|---|
| **KEEP** | **279** | Migrates broadly as-is, after cleanup and re-slugging |
| **REWRITE** | **21** | Real subject, unusable execution. Rewritten by an editor before publication |
| **MERGE** | **14** | Folds into a named canonical document. Every one has its canonical recorded |
| **DROP-301** | **3** | No new equivalent; redirect to the nearest genuine page |
| **DROP-410** | **14** | Deliberately gone. 410, not 404, so search engines drop them promptly |

Plus 5 URLs that appear in the legacy sitemap but not in the export: four Eduma theme demo
posts and an HTML sitemap page (all DROP-410), and a demo blog index (DROP-301).

### Target content types for the 300 KEEP and REWRITE documents

| Target type | Count |
|---|---|
| `institution` (university) | 126 |
| `institution` (language school branch) | 53 |
| `summerProgramme` | 52 |
| `page` | 27 |
| `article` | 18 |
| `languageSchool` (brand hub) | 12 |
| `institution` (boarding school) | 10 |
| `tour` | 1 |
| `legalPage` | 1 |

### DROP-410 detail

WooCommerce residue (`/cart/`, `/checkout/`, `/my-account/`), LearnPress residue
(`/courses/`, `/instructor/`, `/instructors/`, `/lp-profile/`, `/lp-checkout/`,
`/become_a_teacher/`, `/term_conditions/`), three theme demo pages, `/thanks/`, the HTML
sitemap and three demo posts. Note that `/cart/` **currently returns HTTP 200** on the live
site, so it is indexable today.

### Not dropped, contrary to expectation

The three `/elementor-sayfa-NNNNN/` pages look like page-builder junk and are not. They hold
real 174 to 384-word institution profiles (University of Western Australia, Universal Higher
Education Melbourne, Oxford International London Greenwich). They are REWRITE with a new slug,
not 410.

---

## 3. Duplication: the critical warning

**Read this section before writing any merge logic.**

Eight root-level pages share a slug or a normalised title with a nested page:

| Root page | Nested page |
|---|---|
| `/grup-yaz-okullari/` (416w) | `/yaz-okullari/grup-yaz-okullari/` (35w) |
| `/bireysel-yaz-okullari/` (529w) | `/yaz-okullari/bireysel-yaz-okullari/` (31w) |
| `/university-of-greenwich/` (161w) | `/universiteler/university-of-greenwich/` (178w) |
| `/university-college-london/` (179w) | `/yaz-okullari/grup-yaz-okullari/university-college-london/` (35w) |
| `/london-kings-college/` (181w) | `/yaz-okullari/grup-yaz-okullari/london-kings-college/` (175w) |
| `/north-london-grammar-school/` (181w) | `/yatili-okullar2/north-london-grammar-school-2/` (268w) |
| `/kaplan-international/` (312w) | `/dil-okullari/kaplan-international/` (188w) |
| `/colorado-state-university/` (236w) | `/universiteler/colorado-state-university/` (98w) |

**At least three of those eight pairs are not duplicates.** For `university-of-greenwich`,
`university-college-london` and `north-london-grammar-school`, the root page is a **summer
programme hosted on that campus** and the nested page is the **degree or boarding institution**.
The same trap applies outside this list to `university-of-westminster`, `university-of-kent`,
`tufts-university`, `st-giles-cambridge` and `st-giles-oxford`.

Verified by body text: the summer programme pages contain "Yaz Okulu".

> **Rule: classification keys on body text, never on title or slug.** Auto-merging on name is
> the single most likely way to destroy content in this migration, and what it destroys is
> sellable product pages. Every merge in the MERGE bucket is named individually in
> `content-inventory.csv` with its canonical. There is no heuristic merge step.

### Exact slug collisions

Seven slugs appear at two different paths: `bireysel-yaz-okullari`, `colorado-state-university`,
`grup-yaz-okullari`, `kaplan-international`, `london-kings-college`, `university-college-london`,
`university-of-greenwich`. Each is resolved explicitly by the inventory, not by a rule.

### Near-duplicate bodies

28 pairs in 13 clusters, covering 34 documents, at four-gram Jaccard similarity of 0.30 or above.
Three need a decision rather than a merge:

- `/yatili-okullar2/oxford-international-college-2/` and `.../oxford-international-college-brighton/`
  are **byte-identical** (J = 1.00). Hard-delete one; the two schools are different places and
  the surviving record needs real content.
- `/universiteler/manchester-metropolitan-university-2/` is 92% contained in the University of
  Manchester page. **It describes the wrong institution.** Do not merge: rewrite. The record is
  factually incorrect, and merging it would fold the error into a good page.
- `/universiteler/university-of-nicosia-2/` and `/st-georges-university-of-grenada/` (J = 0.79)
  are two empty legacy husks. Rewrite both or drop both.

### Boilerplate, by family

The "median 181 words means templated" assumption is only half right. Percentage of a page's
n-grams that also appear in another page of the same family:

| Family | n | Shared 3-grams (median) | Shared 5-grams (median / p90) |
|---|---|---|---|
| UK universities | 76 | 19.0% | 3.0% / 10.6% |
| Non-UK universities | 48 | 20.6% | 4.3% / 8.8% |
| Boarding schools | 11 | 17.9% | 6.6% / 100% |
| Language schools | 63 | 31.1% | 15.0% / 64.7% |
| Summer programmes | 59 | 46.6% | 20.2% / 71.7% |
| Blog posts | 18 | 10.3% | 0.9% / 3.8% |

The 76 UK university pages break down as 88.3% free descriptive prose, 11.7% structured fact
block, 0.1% call-to-action chrome. **They are short because the subject is short, not because
they are templated**, so they migrate as real editorial. Summer programmes and language schools
genuinely are templated: one 40-word course and accommodation string appears verbatim in 20
documents. **Spend the rewrite budget there.**

---

## 4. The `-2` slug cleanup

59 slugs carry a numeric suffix (58 ending `-2`, one ending `2`). Distribution: `/universiteler/`
42, `/yatili-okullar2/` 8, `/yaz-okullari/bireysel-yaz-okullari/` 3, root 3, other 3.

- **9 have a surviving unsuffixed twin**: `football-academy-brighton`, `st-giles-oxford`,
  `st-giles-cambridge`, `english-path-dublin`, `iletisim`, `guildhouse-school-london`,
  `cats-cambridge`, `north-london-grammar-school`, `oxford-international-college`. Each needs an
  individual decision (which is the real record, which redirects), and `st-giles-oxford`,
  `st-giles-cambridge` and `north-london-grammar-school` sit inside the summer-programme trap
  from section 3.
- **49 are orphans.** WordPress appended `-2` at creation because the slug was momentarily
  taken, and the original was later deleted. These get a clean slug with no content risk:
  `/universiteler/university-of-sussex-2/` becomes `/tr/universiteler/ingiltere/university-of-sussex/`.

Also note the section slug itself: `/yatili-okullar2/` carries a stray digit. The new tree uses
`yatili-okullar`.

This is a free win and it clears the largest single URL-hygiene defect on the site. Every one of
the 59 gets a 301.

---

## 5. Language: English is a greenfield authoring project

| | Documents | Words |
|---|---|---|
| Turkish | 272 (82%) | 70,988 |
| English | 38 (11%) | 5,860 |
| Mixed | 1 | 290 |
| Empty or stub (under 15 words) | 20 | 117 |
| **Total** | **331** | **77,255** |

**English is 7.6% of the word count**, and 19 of the 38 English documents are under 100 words:
navigation stubs and legacy husks consisting of `Address: / Prices: / IELTS:` plus an "APPLY NOW"
button. Genuine English prose amounts to **19 documents and 5,030 words**, and it is almost
entirely US, Canadian and New Zealand language-school copy that reads as provider marketing
material. **Check its provenance for copyright before reuse.** All 18 blog posts are Turkish. All
UK university, boarding school, tour, About, Turkish Contact and privacy content is Turkish.

The only purpose-built English page is the English contact page, and it contains the literal
placeholder "Address will be added here".

### The practical consequence

**The `/en/` tree starts at approximately zero usable words.** Budget roughly 77,000 words of
transcreation, not "a bit of tidying". And it is transcreation, not translation: English content
addresses UK partner schools and English-language search behaviour, Turkish content addresses
families in Turkey. The two trees are separate documents linked by a translation reference, which
is exactly why `src/lib/i18n/config.ts` models them that way.

Sequencing recommendation: **Turkish first, English second.** Turkish is where the existing
content, the existing rankings and the existing audience are. Publishing a thin English tree at
launch is worse than publishing English progressively behind a complete Turkish tree.

---

## 6. What the migration can populate, and what starts empty

Field coverage across the 313 institution-type pages:

| Field | All 313 | UK unis (76) | Language schools (63) | Summer (27) | Boarding (11) |
|---|---|---|---|---|---|
| Country | 76% | 96% | 51% | 63% | 18% |
| City | 40% | 99% | 6% | 0% | 0% |
| Ranking | 33% | 78% | 0 | 0 | 0 |
| Founded | 38% | 92% | 0 | 0 | 0 |
| Featured departments | 36% | 87% | 0 | 0 | 0 |
| Accommodation | 40% | 0 | 73% | 63% | 100% |
| Programmes / course types | 19% | 0 | 51% | 0 | 64% |
| Fees | 14% | 13% | 3% | 0 | 82% |
| Dates | 12% | 0 | 0 | 15% | 0 |
| Age range | 14% | 0 | 0 | 41% | 9% |
| Lessons per week | 16% | 0 | 2% | 78% | 0 |
| Hero image | 78% | 100% | 43% | 100% | 100% |
| Logo image | 23% | 86% | 0 | 0 | 0 |
| **Official website URL** | **0%** | **0%** | **0%** | **0%** | **0%** |
| **Any image with alt text** | **3%** | 0% | 0% | 22% | 0% |

### Three consequences

**1. Institutions need three content types, not one.** The coverage is disjoint. Universities
carry city, ranking, founded, departments and logo at 78 to 99% and have zero dates, fees or
accommodation. Boarding schools carry fees, accommodation and programmes at 64 to 100% and have
zero city, ranking or founded. Summer programmes carry lessons-per-week, age range and dates and
almost nothing else. A single institution schema would be around 70% empty for every record,
which produces an unusable editing experience and empty rendered sections.

**2. `officialWebsite` is 0 of 313 and must be collected manually.** The entire legacy site
contains only 25 external links (8 Facebook, 8 Instagram, 6 YouTube, 2 LinkedIn, 1 Companies
House, 1 Google Maps). Every institution's official URL is a manual data-collection task. The
same applies to logos outside UK universities and to alt text everywhere. **No script can fill
these three fields.** Plan the hours.

**3. Structured facts must be modelled, not pasted.** Prices in particular: model them as
`{ amount, currency, unit, validFrom, source }` so staleness is visible and every published price
carries an as-at date. Hard figures currently live in 5 blog posts and 43 institution pages, and
boarding fees are 82% populated.

---

## 7. Content quality debt to fix at import

| Issue | Documents | Handling |
|---|---|---|
| No image on the page has alt text | **235 / 331** | Alt text is a required field. Editorial task, not scriptable |
| Structure carried by `<b>`/`<strong>` instead of headings | **157** | Converted to real headings during Portable Text conversion, then reviewed. Blocks clean conversion if ignored |
| Hero image does not depict the page subject | **62** | Corrected, not carried over. Worst case: a London college page using a photograph of a university in Aberdeen. Two boarding schools share one interior photograph; two city language-school pages both use a London image |
| Heading level jumps (h1 to h5) | **53** | Re-levelled on conversion. One page runs 64 consecutive h5 elements |
| Missing apostrophe before a Turkish case suffix | 38 docs, 69 occurrences | "Kanada nın", "Amerika da", "ABD nin". Editorial pass |
| Inline `font-weight:400` span residue | 28 | Stripped |
| No headings at all | 19 | Rewrite |
| Near-empty body (under 20 words) | 19 | Includes whole-country pages: New Zealand at 2 words, South Africa at 4 |
| Legacy named HTML entities | 7 docs, 205 occurrences | Decoded during conversion. A naive converter publishes them as literal text |
| Consistent misspellings | 14 | "Avusturalya" for Avustralya on 9 pages including the homepage; "Cambdrige"; "Chercheston"; "New Zeland", which is also a live slug |
| Legacy "APPLY NOW" husks | 6 | Rebuilt, not migrated. These 6 are the only pages linking to the Salesforce form |
| Placeholder text | 1 | "Address will be added here" on the English contact page |
| Theme demo testimonial | 1 | Attributed to a professional footballer. Delete |

No mojibake was found: the encoding is clean UTF-8 and the damage is legacy entities, not
corruption. No lorem ipsum was found.

**The legacy privacy policy** pastes a Companies House URL where the website URL should be, and
has no cookie, UK GDPR, retention or data-subject-rights sections. It is not migrated. Legal
documents are authored fresh.

---

## 8. Assets and the licence-clearance gate

### The library

964 media records, 889 unique. 560 JPEG, 299 PNG, 82 WebP, 18 SVG, 5 PDF. **640 referenced, 324
orphaned (34%). 12 items (1.2%) have alt text. 98 files exceed 1 MB.** 69 items are over 2500px,
essentially all WordPress `-scaled` derivatives of stock photography.

### Provenance, and why nothing migrates blind

| Category | Approximately | Status |
|---|---|---|
| Partner and institution marketing photography | ~665 | **Belongs to the schools.** Licence for continued use is unknown and needs per-partner confirmation |
| Shutterstock | 53 files, 49 distinct asset IDs | **Licence unverified.** The retained asset ID in the filename is equally consistent with a legitimate download and with an unlicensed comp. It cannot be resolved from the filename |
| Other stock | 4 | Pexels and Unsplash are free-licence and fine. One AdobeStock file needs verification |
| Genuine Happy Education photography | **~9** | The only images the business plainly owns |
| UI decoration and theme filler | 18 | Discard, replaced by the design system |
| Third-party logos | 5 partner logos | Trademarks displayed with no stated permission. Two of them (English Path, LSI) are **blank coloured rectangles**: the artwork is missing and they render as solid blocks in the live homepage slider |
| Clipart-scraper file | 1 | Filename is the auto-generated slug of a free-clipart aggregator. A third-party trademark obtained from an unlicensed source. Do not migrate |

> **Gate: no image ships without a recorded licence basis.** Each migrated asset carries an
> owner, a source and a licence field in Sanity. Anything unresolved stays out of the build. This
> is a legal exposure, and it blocks launch in the same way a broken build does.

### Preserve these before the old site is switched off

Four PDFs are live today and are linked from pages that are being retired: three tour brochures
linked from `/thanks/` (a 410), and a summer school brochure linked from `/summer-schools/`.
**Re-host them first, then redirect.** Switching off WordPress with these unmoved loses them.

### The logo is raster-only

**No vector logo exists anywhere.** Direct probes for `logo.svg` and its variants all return 404,
and the 18 SVG files in the library are UI icons (phone, map, building, degree), not brand
artwork. The highest-resolution master is a **1131 x 1131 PNG** with an effective lockup of
916 x 384. A dark-background variant exists as a 200 x 111 PNG.

Consequences, all of which are avoidable by asking:

- The header logo cannot be rendered crisply above its raster ceiling.
- Print and large-format use has no source.
- BIMI, which would put the logo beside authenticated mail in inboxes, requires an SVG Tiny PS
  file and cannot be done at all (see `docs/DOMAIN_SECURITY.md` section 7).

**Request the original vector (AI, EPS or SVG) from whoever produced the brochure artwork.** If
it genuinely no longer exists, commission a redraw from the 1131px master. Tracing the PNG is the
fallback, not the plan. Note also that the intended brand typeface appears to be a commercial
face requiring a webfont licence; confirm the licence or approve the free substitute before the
type system is finalised.

---

## 9. Redirects

Two files, and the distinction matters:

- **`docs/audit/redirects-draft.csv`** is the audit artefact: 395 rows, **377 permanent
  redirects and 18 gone (410)**, with absolute legacy URLs and the classification reason for
  each. It is evidence and it does not change.
- **`redirects.csv` at the repository root** is the applied map that the platform reads. It is
  derived from the draft, uses repository-relative paths, and is version-controlled and
  reviewed like code. It currently holds 396 rows (378 permanent redirects and 18 gone).

Any row added to the applied map must be traceable to a decision. Composition of the audited set:

- **336 required** rows covering every document and sitemap-only URL.
- **43 legacy aliases** under `/universities/*`, `/course/*` and `/boarding-schools/*`. These are
  live WordPress 301s today, they are linked from the site's own hub pages, and **they will
  silently 404 the moment WordPress is switched off.** One hub page alone links to 54
  `/universities/*` URLs.
- **16 targets that are already 404** while still being linked from live pages and blog posts.
  One 404 URL is linked nine times from the blog. Fix these during migration rather than
  preserving the breakage.

### Rules

- **301 for anything with an equivalent. 410 for anything deliberately gone.** 410 removes a URL
  from the index faster than 404 and states intent.
- **Never redirect to a generic hub to avoid a decision.** A redirect to an unrelated page is
  worse than a 410, and a redirect to a page about a different institution is worse still. The
  summer-programme trap in section 3 is exactly where this happens.
- **Redirects are permanent.** Never retire them. They are cheap and old links live for years.
- Apply them at the platform edge, not in application code, so they resolve before rendering.
- **Chains are collapsed to a single hop** before launch. A legacy alias that today 301s to a
  URL that itself moves must point directly at the final destination.
- The map is version-controlled and reviewed like code.

### Validation, before and after cutover

1. Every `old_url` returns the expected status and lands on the expected `new_url` in one hop.
2. Every `new_url` returns 200 and is `index,follow`.
3. No redirect target is itself a redirect.
4. No redirect target is in the 410 set.
5. The 43 legacy aliases and the 16 currently-404 targets are explicitly included in the test run.
6. Spot-check the top 50 legacy URLs by traffic from the Search Console export by hand: these
   are the ones where a subtly wrong target costs real enquiries.

---

## 10. Archival

**Already archived in this repository:** `docs/audit/archive/wp/` holds the raw WordPress export
as newline-delimited JSON: `pages.ndjson` (3.6 MB), `media.ndjson` (1.7 MB), `posts.ndjson`
(212 KB), `categories.ndjson`, `users.ndjson`. This is the provenance record for every migration
decision and it stays in the repository permanently.

**Still to be captured before WordPress is switched off**, and stored outside the repository in
the client's own storage with the retention rules from `docs/SECURITY.md`:

- A full database dump and a full `wp-content` file archive (the final backup in
  `docs/DEPLOYMENT.md`).
- The original media files at full resolution, including the 324 orphaned items. Some may be
  needed later, and none can be recovered afterwards.
- The four live PDFs (section 8).
- The existing `sitemap.xml` set and `robots.txt`, as the record of what was indexed.
- The 16-month Search Console export (see `docs/SEO.md` section 13).
- A crawl of the live site (URLs, status codes, titles, meta descriptions, H1s) as a before-state
  for comparison.

**Do not archive:** `debug.log`, or anything else containing credentials. Handle any credential
found in the export as an incident and rotate it.

---

## 11. Import pipeline

Two scripts, already stubbed in `package.json`: `npm run migrate:extract` and
`npm run migrate:import`.

**Extract** reads the archived ndjson, normalises encoding, decodes legacy entities, converts
HTML to Portable Text, extracts structured fields per the coverage table in section 6, and writes
an intermediate JSON set with a stable generated document ID per source URL.

**Transform and load** maps intermediate records onto the Sanity schemas, resolves references
(institution to destination, article to author and category, translation pairs), attaches media,
and writes into the dataset.

Requirements:

- **Idempotent.** Keyed on a deterministic document ID derived from the source URL, so a re-run
  updates rather than duplicates. A migration that cannot be safely re-run will be re-run anyway,
  in a hurry, at the worst moment.
- **Dry-run mode by default**, writing a report of what would change. Writing requires an explicit
  flag.
- **Never runs against production without a fresh dataset export first** (see
  `docs/DEPLOYMENT.md`).
- **Logs every dropped element**: unmapped blocks, rejected hrefs, stripped attributes, images
  with no licence record. The log is an editorial work queue, not debug output.
- **Rejects rather than guesses.** An unparseable date, an ambiguous country, an unresolvable
  reference produces a flagged draft, not a plausible value.
- **Everything imports as a draft.** Nothing is published by a script. Publication is an editorial
  act with a human name attached.
- Runs against a **separate dataset first**, is reviewed, then runs against production.

---

## 12. Editorial re-verification queue

Content that cannot be republished until a person confirms it. This is a launch gate, tracked in
`docs/QA.md`.

### Highest liability: four articles

| Article | What must be re-verified |
|---|---|
| Working while studying abroad, country by country | **The whole table.** Weekly hour limits and post-study work durations for the UK, US, Canada, Ireland, Australia and New Zealand, each against the relevant government authority. Stated as fact today |
| Common student visa mistakes | Claims about which route applies to courses under six months, document-age requirements and sworn-translation requirements. Contradicts current UK guidance for many short courses |
| Most popular summer school cities | Names a specific visitor route for a study activity, and carries per-week prices explicitly stamped 2026 |
| UK versus Malta for English courses | Names UK visa routes whose naming has changed |

### Also gated

- **Every hard price.** Per-week language course prices in three currencies, summer school
  all-in weekly ranges, and boarding fees. Re-check or remove, then move into the dated price
  model from section 6.
- **Safeguarding claims about third-party schools**: supervision arrangements, inspection and
  vetting statements, insurance and allergy handling. Verify each with the named school or
  attribute it explicitly to that school. Never state it as Happy Education's own assurance.
- **Rankings, GPA thresholds and IELTS or TOEFL minimums** per institution. These change
  annually. Each needs a source and a year, or it comes out.
- **Accreditation body names** appearing in article text. They describe schools, not Happy
  Education.
- **The one article with no dated claims** is the daily English practice post. It is the only one
  that can be republished as-is.

### Business-fact gate

The forbidden-claims list is absolute and applies to prose, metadata and structured data alike:
student counts, university and school counts, countries served, success or acceptance or visa
approval rates, years of experience, British Council / English UK / ICEF / BAC accreditation,
IAA registration, awards, press coverage and review scores. Legacy pages assert several of these
and they contradict each other. The registered office must always be labelled as the registered
office and never as a headquarters or a staffed office. Named staff other than the sole director
need employment confirmation and consent before republication, and testimonials need documented
consent. Enforcement lives in `src/lib/business-facts.ts`; publication is checked against it in
`docs/QA.md`.

---

## 13. Phases and definition of done

| Phase | Work | Done when |
|---|---|---|
| **0. Preserve** | Final WordPress backup, PDFs re-hosted, Search Console export, live-site crawl | Every item in section 10 is captured and verified readable |
| **1. Schema** | Three institution types, programme type, article, guide, destination, dated price object, image object with required alt and licence fields | A representative record of each type round-trips through the Studio |
| **2. Dry run** | Extract and transform against a scratch dataset | Report reviewed, drop log triaged, no unexplained losses |
| **3. Import** | Load as drafts into the production dataset | Counts reconcile against `content-inventory.csv` per bucket and per type |
| **4. Editorial** | Rewrites, the manual field collection (official URLs, logos, alt text), the re-verification queue, Turkish cleanup | Every REWRITE published, no gated claim published, zero required fields empty |
| **5. English** | Transcreation of the Turkish tree | Every English page has a linked Turkish counterpart and correct reciprocal hreflang |
| **6. Redirects** | Map applied at the edge, chains collapsed | Every row in `redirects.csv` validated per section 9 |
| **7. Cutover** | Per `docs/DEPLOYMENT.md` | Post-cutover checklist signed off |

**Overall done:** 300 documents live at canonical URLs across two locales; every redirect row
resolving correctly; zero images without alt text; zero images without a licence record; zero
gated claims published; the 49 orphan `-2` slugs cleaned; the 62 mismatched heroes corrected; and
all 18 articles indexed, which is 18 more than today.

---

## 14. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| A merge on title destroys summer programme pages | Loss of sellable product pages and their rankings | No heuristic merge. Body-text classification and a named canonical per merge (section 3) |
| Legacy aliases forgotten at switch-off | 43 URLs, linked from the site's own hubs, 404 overnight | Included in the redirect map and in the validation run |
| Image licences never resolved | Launch blocked, or a rights claim after launch | Licence gate in section 8. Start the partner conversations early, they are slow |
| English tree published thin to hit a date | A weak second locale that dilutes the domain and cannot be fixed quickly | Turkish first. English progressively, behind a complete Turkish tree |
| Gated visa content republished by mistake | Regulatory exposure under the Immigration and Asylum Act 1999 | Gate list in section 12, checked at publication in `docs/QA.md` |
| Manual field collection underestimated | 313 official URLs, 240-plus logos and near-total alt text coverage are hand work | Scoped and scheduled explicitly, not assumed to be part of "the import" |
| PDFs and orphaned media lost at switch-off | Unrecoverable | Phase 0 gate |
