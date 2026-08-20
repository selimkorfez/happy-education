# Search strategy

**Scope:** metadata, canonicals, hreflang, sitemaps, robots, structured data, internal
linking, the editorial topic-cluster plan, pagination, image SEO and the Search Console
migration.
**Related:** URL-by-URL redirect handling is in `docs/MIGRATION.md`; launch verification is in
`docs/QA.md`; caching and edge behaviour are in `docs/DEPLOYMENT.md`.

---

## 0. Where the site is starting from

Three measured facts set the baseline, and they change the priorities:

1. **The 18 genuine articles are invisible to search.** None of them appears in the legacy
   `post-sitemap.xml`. That sitemap listed a theme demo blog index and three Eduma demo posts
   instead: four theme-demo URLs, zero real articles. Every one of the 18 posts also has
   `featured_media: 0`, and they are linked from a blog index with no content. They are the
   most original asset the business owns (median 0.9% shared five-grams against each other,
   against 20% for the institution pages) and they are the fastest measurable win available.
2. **The site has no crawlable hierarchy.** 147 of 331 pages sit at root depth, including
   institution pages that belong in a section, while other pages of the same type sit under
   `/universiteler/` and `/dil-okullari/`. The same content type lives at two different depths,
   with 59 `-2` duplicate slugs scattered through it.
3. **English does not exist as a tree.** `https://happyeducation.uk/en/` currently returns a
   301 to an unrelated Turkish blog post, because a slug collision hijacked it. Google still
   indexes `/en/` with an English title. There is no English site, only a handful of English
   pages.

None of this is a ranking problem. It is an architecture problem, and the rebuild fixes it by
construction.

---

## 1. Principles

- **One canonical URL per thing.** Every institution, programme, guide and article has exactly
  one address. Anything else redirects to it.
- **Structure over volume.** The competitor set includes an operation that published roughly
  6,900 posts in four months and diluted itself into slang and travel content. Do not copy the
  volume. Copy the template quality and the schema coverage.
- **Publish only what is verifiable.** Structured data is a machine-readable claim. Everything
  in `src/lib/business-facts.ts` marked anything other than `verified` is absent from the
  markup, and the forbidden-claims list is enforced in schema output as strictly as in prose.
- **Two independent editorial trees.** English and Turkish are separate documents linked by a
  translation reference. Neither is a machine translation of the other, and hreflang only ever
  points at a page that genuinely exists.

---

## 2. URL architecture

Owned by `src/lib/i18n/config.ts`, which is the single source of truth. Nothing else may
hard-code a URL segment.

```
/en                              /tr                         locale home
/en/universities/…               /tr/universiteler/…
/en/language-schools/…           /tr/dil-okullari/…
/en/summer-schools/…             /tr/yaz-okullari/…
/en/boarding-schools/…           /tr/yatili-okullar/…
/en/tours/…                      /tr/turlar/…
/en/services/…                   /tr/hizmetler/…
/en/student-guide/…              /tr/ogrenci-rehberi/…
/en/insights/…                   /tr/blog/…
/en/about                        /tr/hakkimizda
/en/contact                      /tr/iletisim
/en/free-consultation            /tr/ucretsiz-danismanlik
/en/search                       /tr/arama
/en/legal/…                      /tr/yasal/…
```

Rules:

- **Localised segments, not a translated shell.** The Turkish segments deliberately keep the
  slugs the current site already ranks for (`universiteler`, `dil-okullari`, `yaz-okullari`),
  so the migration preserves slug intent rather than inventing new Turkish paths.
- **No trailing slash** (`trailingSlash: false`). One canonical form, no duplicate pairs.
- **Latin-only slugs**, lower case, hyphen separated. Turkish characters are transliterated
  (`ı`>`i`, `ş`>`s`, `ğ`>`g`, `ü`>`u`, `ö`>`o`, `ç`>`c`). Never allow a percent-encoded slug:
  it is unreadable in a SERP, unshareable and impossible to audit.
- **Depth is capped at four segments.** Every credible competitor stops at three; the fourth is
  bought deliberately for the programme layer, which is the uncontested URL space in this market.
- **The bare `/` negotiates from `Accept-Language` and issues a 307** with `Vary: Accept-Language`
  (`src/proxy.ts`). 307 is correct: the destination depends on the visitor, so it must not be
  cached as permanent. Googlebot crawls with an English preference and lands on `/en`, which is
  also the `x-default`.
- An explicit locale in the URL is authoritative and is never rewritten into the other language.

---

## 3. Metadata

Generated per route with `generateMetadata`, typed, sourced from the CMS with coded fallbacks
so a page is never published with an empty title.

### Rules

| Field | Rule |
|---|---|
| `title` | Unique per page. Pattern: `{Page title} \| Happy Education`. Aim for 50 to 60 characters including the suffix; the CMS shows a length indicator. The `h1` and the title may differ: the title carries the query, the `h1` carries the reading experience |
| `description` | Unique per page, 120 to 160 characters, written by an editor. **Never auto-generated from the first paragraph.** If none is supplied, omit the tag rather than emit a truncated body sentence |
| `canonical` | Absolute, always. See section 4 |
| `alternates.languages` | Only the locales that genuinely exist for this document, plus `x-default`. See section 5 |
| `openGraph` | `type`, `locale` (`en_GB` / `tr_TR`), `siteName`, `title`, `description`, `url`, and a 1200x630 image. Institution and article pages use their own hero; everything else uses the site default |
| `twitter` | `summary_large_image` |
| `robots` | Default indexable. `noindex, follow` on search results (already set as a header in `src/proxy.ts`), on any thin index page with no items, and on utility pages such as form success screens |
| `authors`, `publishedTime`, `modifiedTime` | Articles and guides only, and only where a real named author exists |

### Per template

| Template | Title pattern | Notes |
|---|---|---|
| Locale home | `Study abroad consultancy in the UK \| Happy Education` (EN) | Written, not templated. The Turkish home is written independently in Turkish, not translated |
| Section index | `{Section} \| Happy Education` | |
| Destination hub | `{Study type} in {Country} \| Happy Education` | The country and study type both come from fields, so the pattern stays consistent across dozens of pages |
| City hub | `{Study type} in {City}, {Country} \| Happy Education` | |
| Institution | `{Institution name} \| Happy Education` | Not `{Name} - Reviews, Fees, Rankings`. Keyword-stuffed titles read as spam and the fields are on the page anyway |
| Programme | `{Programme} at {Institution} \| Happy Education` | |
| Article | `{Article title} \| Happy Education` | |
| Guide | `{Guide title} \| Happy Education` | |
| Legal | `{Document name} \| Happy Education` | |

### Turkish metadata is written, not translated

Turkish titles and descriptions are authored by a Turkish writer against Turkish search
behaviour. A literal translation of an English title loses the query. This is an editorial
requirement, not a nice-to-have, and it is a launch gate in `docs/QA.md`.

---

## 4. Canonicals

- **Every indexable page emits a self-referencing absolute canonical**, built from
  `siteUrl` plus the route path.
- Query parameters are **excluded** from the canonical unless they change the content. Filter
  and tracking parameters (`utm_*`, `fbclid`, `gclid`, `ref`) are stripped.
- Pagination is the exception: page 2 canonicalises to itself, not to page 1. See section 10.
- **A canonical never points at a URL that redirects, 404s or is `noindex`.** This is checked
  by the link crawl in `docs/QA.md`.
- **A canonical never points across locales.** English and Turkish are separate pages, not
  duplicates. Cross-locale relationships are expressed with hreflang only.
- Where a document is reachable from more than one hub (an institution surfaced under both a
  country hub and a study-type hub), the hub link points at the single canonical institution
  URL. There is no second copy to canonicalise.

---

## 5. Hreflang

The mapping is fixed in `src/lib/i18n/config.ts`: `en` renders `en-GB`, `tr` renders `tr-TR`,
and `en` is also the `x-default` because it is `DEFAULT_LOCALE`.

Rules, all of which are commonly got wrong:

1. **Reciprocity is mandatory.** If the English page names the Turkish page, the Turkish page
   must name the English page. A one-way annotation is ignored.
2. **Only emit a pair that exists.** The relationship comes from the `translationOf` reference
   in Sanity. If a document has no linked translation, emit only the self-reference and
   `x-default`. Never point at a section index and call it a translation, and never guess a
   URL by pattern.
3. **Always self-reference.** Each page includes itself in its own set.
4. **Absolute URLs only**, and always the canonical form: no redirects, no trailing slash
   variants, no `noindex` targets.
5. **`x-default` points at the English page**, which matches the locale negotiation default.
6. **The language switcher is not an hreflang substitute.** `/api/locale` returns a 307 with
   `Cache-Control: no-store` and is disallowed in robots. It is a runtime convenience for
   humans; the annotations are what search engines read.

Emitted shape for a page pair:

```html
<link rel="alternate" hreflang="en-GB" href="https://happyeducation.uk/en/universities/united-kingdom" />
<link rel="alternate" hreflang="tr-TR" href="https://happyeducation.uk/tr/universiteler/ingiltere" />
<link rel="alternate" hreflang="x-default" href="https://happyeducation.uk/en/universities/united-kingdom" />
```

**Why this matters more here than usual.** No competitor in this market runs a correct
bilingual setup: one has no hreflang at all, one runs Turkish-only annotations on a `.co.uk`
domain, one 301s every locale to English. A UK-registered company serving a Turkish audience is
the one player with a legitimate reason to run both trees properly, and doing it correctly is a
differentiator rather than housekeeping.

---

## 6. Sitemaps

### Architecture

A single `/sitemap.xml` (`src/app/sitemap.ts`, with the collection logic in
`src/lib/seo/sitemap.ts`) enumerating both locale trees from Sanity, merged with the static
routes the site always publishes, revalidated hourly. Each URL carries its own
`alternates.languages` built from the `translationGroup` relationship, so the hreflang pairing
is stated in the sitemap as well as in the page head. When Sanity is unconfigured or
unreachable, the route degrades to the static set rather than failing the build.

**When to split into an index.** Google accepts 50,000 URLs per file. The collection helper
exposes a lower chunk threshold (5,000) as the point at which the map should be split into a
sitemap index with per-type, per-locale children:

```
/sitemap.xml                     index
  /sitemaps/pages-{en,tr}.xml
  /sitemaps/institutions-{en,tr}.xml
  /sitemaps/programmes-{en,tr}.xml
  /sitemaps/destinations-{en,tr}.xml
  /sitemaps/articles-{en,tr}.xml
```

The collection is already structured so the split is a routing change, not a rewrite. At the
planned launch scale (roughly 1,200 to 1,800 institution and programme URLs plus 400 to 600
guide and article URLs, doubled across two locales) a single file is correct. Revisit when the
programme layer from section 12 is built out.

**RSS.** `/feed.xml` serves the article feed, English by default and Turkish via
`?locale=tr`. It is a distribution channel, not an indexing one, and it is not a substitute
for the sitemap.

### Rules

- **Only canonical, indexable, 200-returning URLs.** No redirects, no `seo.noIndex` documents,
  no search paths, no API routes, no legacy URLs. A sitemap listing a redirect is a crawl-budget
  leak and a signal that the map is not maintained.
- **A URL only appears if it genuinely resolves.** Never derive a path from a document type
  that carries no routing information: that fills the map with 404s.
- **`lastmod` is real.** It comes from the document's `_updatedAt`, not from the build time.
  A sitemap where every entry changed at deploy time is noise.
- `changefreq` and `priority` are omitted. They are ignored and they invite fiction.
- Hard limits: 50,000 URLs and 50 MB per file. The generator must split rather than truncate.
- Referenced from `robots.txt` with an absolute URL.
- **Non-production deployments serve no sitemap.** Preview deployments already emit
  `X-Robots-Tag: noindex, nofollow` from `src/proxy.ts`.
- The sitemap route is excluded from the proxy matcher, so it carries the static headers only.

### The lesson from the legacy sitemap

The old sitemap contained four theme demo URLs and none of the 18 real articles. Nobody noticed
because nobody looked. **Add a launch check and a quarterly check** that compares the published
document count in Sanity against the sitemap URL count per type and per locale, and fails on a
mismatch. That single check would have caught the entire problem.

---

## 7. Robots

Generated by `src/app/robots.ts`. In production:

```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /studio
Disallow: /en/search
Disallow: /tr/arama
Disallow: /*?q=
Sitemap: https://happyeducation.uk/sitemap.xml
```

The search paths are derived from `sectionSegment(locale, 'search')` rather than hard-coded,
so they stay correct if a segment ever changes.

- Search paths are also `noindex, follow` at the header level. The robots rule saves crawl
  budget; the header is what removes them from the index. Both are used because they do
  different jobs: a robots-disallowed URL can still be indexed from external links, and a
  disallowed URL cannot have its `noindex` read.
- `/*?q=` catches query-string search from whichever locale it is reached in.
- `/api/` and `/studio` are disallowed for tidiness, not as a security control. Security is in
  `docs/SECURITY.md`.
- **No AI or crawler blocking by default.** Being citable in AI answers is a distribution
  channel for exactly this kind of decision-support content. Revisit only if there is a
  specific reason.
- **Any non-production environment serves `Disallow: /`**, keyed on `VERCEL_ENV`, in addition to
  the `noindex, nofollow` header set by `src/proxy.ts`. Two independent controls, because a
  preview URL that reaches the index can take months to clear.

---

## 8. Structured data

Emitted as JSON-LD, built from typed values, escaped per the rule in `docs/SECURITY.md`
section 4.

### What is emitted, and where

| Type | Where | Key properties |
|---|---|---|
| `Organization` (with `EducationalOrganization` where appropriate) | Site-wide, once, from the root layout | `name`, `legalName` (HAPPY EDUCATION CONSULTANCY LTD), `url`, `logo`, `telephone`, `email`, `sameAs` (Instagram, Facebook, LinkedIn), `address` as the **registered office**, `identifier` carrying company number 11331426, `foundingDate` 2018-04-26 |
| `WebSite` | Home, per locale | `name`, `url`, `inLanguage` |
| `BreadcrumbList` | Every page below a locale home | Mirrors the visible breadcrumb exactly. Never a trail the user cannot see |
| `EducationalOrganization` | Institution pages | `name`, `url` (the institution's own site once sourced), `address`, `areaServed`. Nothing about Happy Education's relationship to it unless that relationship is documented |
| `Course` | Programme pages | `name`, `description`, `provider`, `educationalCredentialAwarded`, `timeRequired`, `courseMode`, and `offers` **only** where a fee is published with its currency and its as-at date |
| `Article` / `BlogPosting` | Articles | `headline`, `image`, `datePublished`, `dateModified`, `author` (a real named person), `publisher`, `inLanguage` |
| `FAQPage` | Only where a genuine FAQ block is visible on the page | Question and answer text identical to the rendered text |
| `HowTo` | Step-by-step process guides only, where the steps are genuinely sequential | |
| `ItemList` | Index and hub pages | Ordered list of the items actually shown |
| `ContactPoint` | Contact page | `telephone`, `email`, `availableLanguage` (en, tr), `contactType` |

### What is deliberately NOT claimed

This list is as important as the list above, and it is enforced in code by
`src/lib/business-facts.ts` and `BLOCKED_CLAIMS`.

| Never emitted | Why |
|---|---|
| `aggregateRating`, `ratingValue`, `reviewCount`, `Review` | No verifiable review corpus exists. No Trustpilot, Google or Turkish platform profile was located. Fabricated ratings are a manual-action risk and a consumer-protection issue |
| `award` | No award is verifiable |
| Accreditation claims of any kind (British Council, English UK, ICEF, BAC) | Every mention of these in the legacy content describes a **partner school**, not Happy Education. Placing them near the organisation's own identity would imply accreditation it does not hold |
| IAA (formerly OISC) registration, or any `Service` typed as immigration advice | No registration is confirmed. See the visa content rule in section 9 |
| Student counts, university counts, countries served, success or visa-approval rates | None is verifiable, and the on-site figures contradict each other (200+ against "over a hundred"; 500+ against 700+ against "hundreds") |
| `numberOfEmployees` | Unverifiable |
| `LocalBusiness`, `openingHoursSpecification`, `geo` on the registered office | The registered office is a serviced address shared with hundreds of registered companies. Marking it as a local business with opening hours would assert a staffed, visitable office that does not exist. `Organization.address` labelled as the registered office is accurate; `LocalBusiness` is not |
| `Person` markup for staff other than the director | Only the sole director is independently verifiable. Others need employment confirmation and consent |
| `Offer` on any institution page without a dated, sourced fee | A stale price presented as a current offer is a misleading claim |

### Visa and immigration content rule

No structured data, and no prose, may present Happy Education as providing immigration advice.
All visa content describes **administrative and application support only**, states plainly that
the decision rests with the relevant government authority, links to the official source, and
never predicts or promises an outcome. This is a regulatory constraint under the Immigration and
Asylum Act 1999, not a style preference, and it applies to the four highest-risk legacy articles
identified in `docs/MIGRATION.md`.

### Validation

Every template's JSON-LD is validated in the pre-launch checklist against the Rich Results Test
and the Schema.org validator, and re-checked whenever a template changes. A schema that fails to
parse is silently worthless.

---

## 9. Internal linking

### The model

A hub-and-spoke structure with three clusters that cross-link deliberately:

```
Study-type hub  ->  Country hub  ->  City hub  ->  Institution  ->  Programme
       ^                                               |
       |                                               v
   Guide cluster  <----------------------------->  Article cluster
```

### Rules

- **Every page is reachable from the navigation or a hub within three clicks of a locale home.**
  An orphan page is an unindexed page. The link crawl in `docs/QA.md` fails the build on an
  orphan.
- **Breadcrumbs on every page below the locale home**, rendered visibly and mirrored in
  `BreadcrumbList`.
- **Institutions link to their programmes; programmes link back to the institution** and to the
  city and country hubs.
- **Institution pages carry a "related institutions" block** derived from shared country, city
  and study type. This is the main way search engines discover institution pages that hubs do
  not fit on the first page of.
- **Articles link into money pages contextually**, not with a link block at the foot. An article
  about choosing a language school links to the language school hub and to two or three named
  schools it actually discusses.
- **Guides are the destination, articles are the acquisition.** Articles link up into the
  evergreen guide cluster; guides link across into institutions and programmes.
- **Anchor text is descriptive and varied.** Use the institution or topic name. Never "click
  here", never the same exact-match anchor on every link.
- **Cross-locale links are for humans only** and go through the language switcher, never as an
  inline body link.
- **Fix the legacy link debt at import.** The old site has 75 distinct broken internal targets,
  30 of them hard 404s, plus 54 links from a single hub page to `/universities/*` URLs that only
  survive today because WordPress redirects them. Every internal link is re-pointed at a
  canonical target during migration, and unresolvable ones are removed rather than carried over.

### External links

Outbound links to official sources (UKVI, university admissions pages, government guidance) are
a trust signal and should be used generously in guide content. They pass through
`safeExternalHref`, carry `rel="noopener noreferrer"`, and are **not** `nofollow`: linking to
authoritative sources is the point.

---

## 10. Pagination

- Paginated indexes use crawlable `<a href="?page=2">` links. Never an infinite scroll with no
  underlying URLs, and never a JavaScript-only control.
- **Each page self-canonicalises.** Page 2 does not canonicalise to page 1; that removes page 2
  from the index along with the items only linked from it.
- Titles and descriptions get a page suffix so they stay unique: `{Section} (page 2) | Happy Education`.
- `rel="next"` and `rel="prev"` are not emitted. Google stopped using them and they add no value.
- Page 1 is the section URL without a parameter, never `?page=1`. If `?page=1` is requested, it
  redirects to the clean URL.
- **Prefer filtered hubs over deep pagination.** A country hub with 60 institutions is better
  served by city hubs than by six pages of list. Deep pagination is where crawl budget goes to die.
- Filter parameter combinations are `noindex, follow` unless a specific combination is a real
  search target, in which case it gets its own hub page with its own copy.

---

## 11. Image SEO

The legacy state is the argument for every rule here: **12 of 964 media items have alt text
(1.2%)**, 235 of 331 pages have no alt text on any image, 62 pages use a hero whose filename
names a different institution (one page about a London college uses a photograph of a
university in Aberdeen), 98 files exceed 1 MB, and 34% of the library is orphaned.

Rules:

- **Alt text is a required field on the image object in Sanity.** Not optional, not "add later".
  A missing alt text blocks publication. Decorative images use an explicit empty alt and are
  marked decorative in the CMS, which is a deliberate choice rather than an omission.
- Alt text describes the image in context. It is not the caption, not the file name and not a
  keyword list.
- **Filenames are descriptive and transliterated** at import: `university-of-leeds-campus.jpg`,
  not `IMG_4821.jpg` or `shutterstock_1234567.jpg`.
- **The hero image must depict its subject.** The 62 mismatches are corrected during migration,
  not carried over. A mismatched hero is a trust problem before it is an SEO problem.
- Served through `next/image` from `cdn.sanity.io` (the only allowed remote host), with AVIF and
  WebP, correct `sizes`, explicit width and height to prevent layout shift, `priority` on the
  LCP image only, and lazy loading everywhere else.
- Every image carries a caption and credit field where a licence requires attribution. See the
  licence-clearance gate in `docs/MIGRATION.md`: unlicensed images do not ship, however good the
  page looks with them.
- Images are included in the relevant JSON-LD (`Article.image`, `EducationalOrganization.logo`)
  and in Open Graph.

---

## 12. Editorial topic clusters

Informed by the competitor analysis. The strategic position: competitors compete on volume and
on generic destination content. The uncontested space is **UK-specific compliance depth, Turkish
qualification mapping, and a programme-level URL layer**, all of which a UK-registered company
can address with standing that a Turkey-based agency cannot claim.

### Priority order

**Phase 1, at launch: migrate and fix what exists.**

Move the 18 articles into `/en/insights/` and `/tr/blog/`, give each a hero image, a named
author, a publish date and a last-updated date, and put them in the sitemap. They are currently
invisible; making them visible costs nothing new. Four of them (the visa mistakes post, the UK
versus Malta post, the popular summer school cities post, and the country-by-country work rights
post) are **gated behind business and legal sign-off** before republication, because they state
visa routes, hour limits and post-study work durations as fact. See the re-verification queue in
`docs/MIGRATION.md`.

**Phase 2, first quarter after launch: the compliance moat.**

Pillar: **UK study route compliance**, at `/en/student-guide/…` and `/tr/ogrenci-rehberi/…`.
Sub-topics: CAS and how it is issued; the Student route and the Child Student route; ATAS;
maintenance funds and the financial requirement; eVisa and BRP; the credibility interview;
dependants; the difference between a short course and a course requiring a study visa. Every
page: administrative support framing only, an explicit statement that the decision rests with
the Home Office, a link to the official guidance, a last-reviewed date and a named reviewer.
**No competitor covers this.** One competitor's 451 visa pages are Schengen-shaped and serve
tourist and residence intent; another has 13 visa URLs in total.

Pillar: **Turkish qualification to UK entry mapping.** Lise diploması, YKS, TYT and AYT, IB and
A-Level equivalency, and when a Foundation or an International Year One is required, with worked
examples. This is the single most-asked question of the exact target user and no competitor has
a content type for it. Highest intent, lowest competition.

**Phase 3: cost, accommodation and outcomes.**

Total cost of study modelled in GBP with a TRY view and a stated exchange-rate date, because
Turkish families budget in lira against a currency that moves. Accommodation as a first-class
content type: guarantor requirements, deposits, purpose-built student accommodation against
homestay, and what an under-18 placement requires. Graduate Route and employability outcomes,
which is the actual purchase driver for postgraduate applicants and is absent from every
competitor sitemap examined.

**Phase 4: the programme layer.**

`/en/universities/{institution}/programmes/{programme}` with `Course` schema. Competitors render
programmes as prose inside faculty blocks, so no programme URLs exist anywhere in this market,
while real search demand is subject-shaped ("masters in X in the UK"). This is the largest
uncontested URL space available and it should be built systematically rather than opportunistically.

**Ongoing: parents and safeguarding, city guides, comparisons.**

Guardianship, safeguarding and airport transfer content for under-18 placements, which is
missing market-wide. City guides covering cost, transport and student life. Comparison pages as
their own type, which serve the decision moment and attract links.

### Editorial standards, applied to every piece

- **Named author with a real byline and a profile page.** One depth-leading competitor shows no
  author and no date on 552 articles. This is cheap parity that beats them outright.
- **Published date and a visible "last reviewed" date**, with the review actually done.
- **A named reviewer on anything touching visas, fees or safeguarding.**
- **Prices are structured, dated and sourced**, never free text: amount, currency, unit,
  valid-from, source. Stale prices are the fastest way to lose trust, and hard figures currently
  live in 5 articles and 43 institution pages.
- **A genuine FAQ block** where the questions are real, marked up as `FAQPage`.
- **Comparison tables** where a comparison is genuinely being made.
- **Internal links to the relevant hub and to two or three named institutions.**

### What not to do

Do not chase volume. Do not publish adjacent lifestyle content to farm impressions. Do not
generate institution descriptions automatically: the 76 UK university pages are 88% unique prose
and only 12% structured facts, which means they are short because the subject is short, and they
migrate as real editorial rather than as templates. The templated families (summer programmes at
72% shared five-grams at the ninetieth percentile, language schools at 65%) are where the rewrite
budget belongs.

---

## 13. Search Console and Bing migration

The domain is not changing, so this is a URL change within a domain, not a site move. There is
no Change of Address to file, and no domain-level signal reset. That is the good news. The bad
news is that essentially every URL is changing, so the redirect map is doing all the work.

**Before cutover**

1. Verify a **domain property** in Google Search Console (DNS TXT verification, which survives a
   hosting change) and a Bing Webmaster Tools property. Do this weeks in advance, not on the day.
2. **Export the baseline** from the existing property: 16 months of queries, pages, countries and
   devices; the coverage report; the current index count. Once the URLs change, the old data is
   the only way to tell whether the migration helped or hurt.
3. Identify the **top 50 URLs by clicks and impressions** and confirm each one has an explicit,
   tested redirect to a genuinely equivalent page. A redirect to a hub page is a demotion; a
   redirect to a page about a different institution is worse. The eight root-level pages that
   look like duplicates but are actually summer programmes at the same campus are the specific
   trap here (see `docs/MIGRATION.md`).
4. Record the existing Google Search Console verification token so it is preserved, and keep the
   existing `google-site-verification` TXT record in DNS.

**At cutover**

5. Submit `/sitemap.xml` in both tools. Remove the legacy sitemap references.
6. Use the URL Inspection tool on the two locale homes, one page of each template type and the
   top five money pages. Request indexing for each.
7. Confirm `robots.txt` is the production version and not the preview version. This is a single
   line that can undo the entire launch.

**First week**

8. Watch the Coverage and Page Indexing reports daily. Expect "Page with redirect" to climb as
   old URLs are recrawled: that is the map working. Investigate any rise in "Not found (404)",
   "Blocked by robots.txt", "Duplicate without user-selected canonical" or "Alternate page with
   proper canonical tag".
9. Watch the Crawl Stats report for a 5xx spike.
10. Check the hreflang report for missing return links, which is the most common bilingual defect.

**First quarter**

11. Compare clicks and impressions against the exported baseline at 30, 60 and 90 days. A dip in
    the first two to four weeks is normal while the index is rewritten; a dip still present at 90
    days is a problem to diagnose, not to wait out.
12. Re-crawl the site and confirm zero internal links point at a redirect. Internal links should
    all be updated to final URLs; redirects exist for external links and old bookmarks.
13. Retire nothing from the redirect map. Redirects are permanent.

**Also fix, specifically:** `https://happyeducation.uk/en/` currently 301s to an unrelated Turkish
blog post, and Google still indexes it with an English title. It must redirect to `/en` (the
English home). This is the highest-visibility single redirect in the map.

---

## 14. Measurement

| Metric | Source | Baseline | Review |
|---|---|---|---|
| Indexed pages per locale | Search Console | Export before cutover | Weekly for a month, then monthly |
| Clicks and impressions, split EN / TR | Search Console | 16-month export | Monthly against baseline |
| Coverage errors | Search Console | 0 target | Weekly |
| Articles indexed | Search Console | **0 of 18 today** | Weekly. This is the clearest early signal that the migration worked |
| Core Web Vitals | Search Console field data plus lab checks | Budgets in `docs/QA.md` | Monthly |
| Redirect health | Crawl of `redirects.csv` | 100% resolving to 200 in one hop | Before launch, then monthly |
| Sitemap against published documents | Automated check | Exact match per type per locale | Every deploy |
| Orphan pages | Crawl | 0 | Every deploy |
| Structured data errors | Search Console enhancement reports | 0 | Monthly |

---

## 15. Anti-patterns

Written down because each one is a real, observed mistake in this market or on this site.

- A sitemap listing demo content and omitting every real article.
- Institution pages living at two different depths with `-2` duplicate slugs.
- A locale URL 301ing to an unrelated post because of a slug collision.
- Directory entries behind query-string IDs, so the entire directory is uncrawlable.
- Percent-encoded non-Latin slugs.
- Blog posts flat at the root, competing with money pages for root-level relevance.
- Publishing thousands of automated posts, then collapsing to a trickle. The velocity curve is
  visible in the sitemap and it tells the story to anyone who looks.
- Structured data claiming ratings, awards or accreditations that do not exist.
- Alt text left empty because the field was optional.
- Prices as free text with no date.
