# Test strategy and launch verification

**Scope:** how the platform is tested, and the checklist that must be signed off before the DNS
cutover in `docs/DEPLOYMENT.md`.

Two documents feed the gates here: the forbidden-claims and re-verification lists in
`docs/MIGRATION.md` section 12, and the security configuration in `docs/SECURITY.md`. A green
test run with an unverified business claim on the homepage is not a pass.

---

## 1. Test layers

| Layer | Tool | Runs | Blocks |
|---|---|---|---|
| Types | `npx tsc --noEmit` | Every commit, every CI run | Yes |
| Lint | `npm run lint` (`eslint-config-next`) | Every CI run | Yes |
| Unit | `npm run test` (Vitest) | Every CI run | Yes |
| Build | `npm run build` | Every CI run and every preview | Yes |
| End to end | `npm run test:e2e` (Playwright) | Every preview deployment | Yes |
| Accessibility | `@axe-core/playwright` inside the e2e run | Every preview | Yes, on serious and critical |
| Colour contrast | `node scripts/check-contrast.mjs` | Every CI run | Yes |
| Dependency audit | `npm audit` | Every CI run and weekly | Yes on high and critical |
| Link crawl | Crawler against the preview URL | Before every release | Yes on broken internal links and orphans |
| Redirect validation | Crawl of `redirects.csv` | Before cutover, then monthly | Yes |
| Performance | Lighthouse or equivalent against the preview | Before every release | Warn, then block on regression past budget |
| Manual | This document, section 4 | Before cutover, and per release for the affected areas | Yes |

**Rule: never use `any`, and never disable a type error to make a test pass.** The build is
configured with `typescript: { ignoreBuildErrors: false }` deliberately.

---

## 2. What to unit test

Pure logic with real consequences, not rendering trivia.

- `src/lib/i18n/config.ts`: `sectionPath`, `docPath`, `buildPath`, `homePath` for both locales;
  `sectionFromSegment` round-trips; no section segment collides across sections within a locale;
  `isLocale` rejects everything that is not a locale.
- `src/lib/links.ts`: `safeExternalHref` rejects `javascript:`, `data:`, `vbscript:`, and
  protocol-relative `//host`; accepts `http`, `https`, `mailto`, `tel`, bare paths and fragments;
  returns `null` on unparseable input. `resolveInternalHref` returns `null` for an undereferenced
  reference rather than a broken path.
- `src/lib/consent.ts`: `parseConsent` rejects malformed JSON, a wrong version and non-boolean
  fields; `toGoogleConsentMode` denies everything under `rejectAll`; cookie attributes include
  `Secure` in production.
- `src/lib/business-facts.ts`: `publicValue` returns `null` for anything not `verified`, for
  every fact in the registry. **Add a test that fails if any `BLOCKED_CLAIMS` string appears in
  the dictionary or in any component's literal text.**
- `src/lib/legal.ts`: every `LEGAL_PAGES` entry produces a path in both locales and every key has
  a label in both.
- `src/lib/i18n/dictionary.ts`: every key present in `en` is present in `tr`. This is enforced by
  types, so the test is a guard against the types being loosened.
- `src/lib/format.ts`: dates and money format correctly per locale; `readingMinutes` handles
  empty input.
- Sanitisation helpers in the import pipeline: entity decoding, heading re-levelling, rejected
  href handling, SVG exclusion.
- Webhook signature verification: a valid signature passes, a tampered body fails, an expired
  timestamp fails, a replayed event is a no-op.

---

## 3. What to cover end to end

Written as Playwright specs, run against a preview deployment, in both locales.

1. Locale negotiation from `/` and both locale homes render.
2. Navigation: every primary nav item resolves to 200 in both locales; mobile navigation opens,
   traps focus and closes on Escape.
3. Language switch from a deep document page lands on the equivalent page, not the homepage, and
   from a page with no translation lands on the section index rather than the homepage.
4. Each template type renders with real content and with empty content (the `sanityFetch`
   fallback path), because a CMS outage must degrade rather than 500.
5. Search: a query returns results; an empty query and a no-results query both render sensibly;
   the page carries `noindex`.
6. Enquiry form: validation errors are announced to assistive technology; a valid submission
   succeeds; a submission without a Turnstile token is rejected server side; the rate limit
   returns 429 after the budget.
7. Consultation booking end to end.
8. Appointment flow: availability, selection, confirmation, and the confirmation email.
9. Payment: a test card completes; a declined card shows a useful message; the webhook is received
   and is idempotent on a replayed event.
10. Consent: the banner appears on first visit; Reject blocks all non-essential tags (assert that
    no request to a tag host occurs); Accept loads them; the choice persists across pages and
    reloads; the footer control reopens it.
11. Legal pages: every entry in `LEGAL_PAGES` resolves in both locales and is linked from the
    footer.
12. Error pages: 404 and 500 render in the correct locale with working navigation.
13. Accessibility: an axe scan on one page of every template type in both locales.

---

## 4. Pre-launch verification checklist

Every box needs a name and a date. Sections map to the definition of done.

### 4.1 Both locales

- [ ] Every published document exists at its canonical URL in Turkish
- [ ] Every English page has a linked Turkish counterpart, or its absence is a recorded decision
- [ ] `lang` attribute is correct on every page (`en-GB` / `tr-TR`)
- [ ] Turkish copy reads as natural professional Turkish, not a literal translation. Reviewed by a
      native speaker
- [ ] English copy is British English throughout
- [ ] No em dashes in any user-facing copy
- [ ] Turkish typography is correct: apostrophes before case suffixes, correct dotted and dotless
      i, no legacy HTML entities surviving as literal text
- [ ] Dates, currencies and numbers formatted per locale

### 4.2 Navigation and language switch

- [ ] Every primary and footer link resolves to 200 in both locales
- [ ] Breadcrumbs on every page below a locale home, matching `BreadcrumbList`
- [ ] Mobile navigation: opens, closes, traps focus, is reachable by keyboard, targets at least
      44px
- [ ] Language switch from: a locale home, a section index, a document with a translation, a
      document without one, and a search results page
- [ ] Skip link is the first focusable element and works

### 4.3 Every template type

One page of each, in both locales: home, section index, destination hub, city hub, institution
(university), institution (language school), institution (boarding school), summer programme,
programme, tour, article, guide, service, about, contact, consultation, search, legal, 404.

- [ ] Renders with full content
- [ ] Renders with sparse content and with no content, without layout collapse
- [ ] Heading order is correct, one `h1` per page
- [ ] Images have alt text, correct dimensions and no layout shift
- [ ] Related-content and internal linking blocks populate

### 4.4 Search

- [ ] Returns relevant results in both locales, including Turkish characters and transliterated
      equivalents
- [ ] Empty state and no-results state
- [ ] Carries `X-Robots-Tag: noindex, follow` **in both locales**. Check `/tr/arama` explicitly,
      not only `/en/search`: the header is applied by path match in `src/proxy.ts` and a match
      written against the English segment alone silently misses the Turkish one
- [ ] Disallowed in `robots.txt` in both locales
- [ ] Rate limited

### 4.5 Forms, consultation and appointments

- [ ] Server-side validation rejects what client-side validation catches
- [ ] Errors are associated with their fields and announced
- [ ] Turnstile verified server side; a submission with no token is rejected
- [ ] Honeypot and minimum submit time work
- [ ] Rate limits return 429 with `Retry-After`
- [ ] Notification email arrives and is readable
- [ ] The acknowledgement to the enquirer arrives and is authenticated (SPF and DKIM aligned)
- [ ] CRM record is created, with no PII crossing origin from the browser
- [ ] Consultation booking completes and confirms
- [ ] Appointment availability, booking, confirmation, rescheduling and cancellation
- [ ] Where a minor's details can be entered, only the minimum is collected and the retention rule
      is documented in the privacy notice

### 4.6 Payment and webhooks

- [ ] Live Stripe keys in production, test keys nowhere near it
- [ ] Successful payment, declined card, abandoned checkout
- [ ] Amounts and currency taken from the server, never from the client
- [ ] Stripe webhook registered against production with its own signing secret, returning 200
- [ ] Replayed event is a no-op
- [ ] Sanity webhook revalidates within seconds of a publish, including the linked translation
- [ ] Neither webhook is rate limited, challenged or cached
- [ ] Both reject an invalid signature with no detail in the response

### 4.7 Consent

- [ ] Banner appears on first visit, in the page's language
- [ ] Accept, Reject and Manage are equally prominent
- [ ] No category is pre-ticked
- [ ] Reject genuinely prevents tag loading. Verify in the network panel, not by trusting the UI
- [ ] Accept loads tags and Google Consent Mode signals map correctly
- [ ] Choice persists, and is re-openable from the footer on every page
- [ ] Cookie policy lists every cookie actually set, with purpose and duration
- [ ] The consent record is stored with a timestamp

### 4.8 Legal

- [ ] All 11 legal documents published in both locales
- [ ] Reviewed by a solicitor, or clearly marked as drafts pending review and signed off as such
      by the client
- [ ] Footer carries the company details required by the Companies Act 2006 and the E-Commerce
      Regulations: registered name, company number and registered office
- [ ] The registered office is labelled as the registered office. It is **never** described as a
      headquarters, an office, or somewhere a visitor can attend
- [ ] Privacy notice covers the CRM transfer, the email processor, the payment processor,
      retention periods and data-subject rights
- [ ] Safeguarding and complaints documents exist, because the audience includes minors

### 4.9 Redirects

- [ ] Every row in `redirects.csv` validated: correct status, one hop, expected destination
- [ ] The 43 legacy aliases included
- [ ] The 16 currently-404 targets included
- [ ] 410s return 410, not 404
- [ ] `https://happyeducation.uk/en/` redirects to the English home
- [ ] No redirect target is itself a redirect, a 410 or a `noindex` page
- [ ] Top 50 legacy URLs by traffic checked by hand against the Search Console export

### 4.10 Metadata, sitemap and structured data

- [ ] Every page has a unique title and description in both locales
- [ ] Self-referencing absolute canonical on every indexable page
- [ ] Hreflang reciprocal, self-referencing, absolute, with `x-default` on English
- [ ] Open Graph and Twitter tags with a valid image
- [ ] `robots.txt` is the production version
- [ ] Sitemap index and all children generate; URL counts reconcile with published documents per
      type and per locale
- [ ] `lastmod` values are real
- [ ] No `noindex`, redirecting or 404 URL appears in any sitemap
- [ ] JSON-LD validates on every template against the Rich Results Test
- [ ] **No `aggregateRating`, `review`, `award` or accreditation property anywhere in the markup**
- [ ] No `LocalBusiness` or opening hours on the registered office
- [ ] Preview deployments are `noindex, nofollow` and serve no sitemap

### 4.11 Accessibility (WCAG 2.2 AA)

- [ ] Axe scan clean of serious and critical issues on every template, in both locales
- [ ] `node scripts/check-contrast.mjs` passes; every colour pair meets 4.5:1 for text and 3:1 for
      large text and non-text controls
- [ ] Full keyboard operation: no trap, logical order, visible focus everywhere. Focus outlines are
      never removed
- [ ] Touch targets at least 44px (WCAG 2.2 target size)
- [ ] Screen reader pass on the home, an institution page and the enquiry form, in both locales
- [ ] Form fields have real labels; errors are programmatically associated and announced
- [ ] Images have meaningful alt text; decorative images are explicitly marked decorative
- [ ] Heading structure is a real outline, one `h1` per page, no skipped levels
- [ ] Content reflows at 320px with no horizontal scrolling, and at 400% zoom
- [ ] Respects `prefers-reduced-motion`
- [ ] Accessibility statement published and accurate about known limitations

### 4.12 Mobile

- [ ] Tested on a real iOS device and a real Android device, not only in a simulator
- [ ] 320px to 430px viewports render without horizontal scroll
- [ ] Tap targets do not overlap; nothing important sits under a system gesture area
- [ ] Forms usable on mobile keyboards, with correct `inputmode` and `autocomplete`
- [ ] Phone and WhatsApp links open the right application
- [ ] Images serve appropriately sized variants on a slow connection

### 4.13 Performance budgets

Measured on the production build, on a mobile profile, on a throttled connection.

| Metric | Budget |
|---|---|
| Largest Contentful Paint | under 2.5s |
| Interaction to Next Paint | under 200ms |
| Cumulative Layout Shift | under 0.1 |
| Time to First Byte | under 800ms |
| JavaScript transferred, initial route | under 150 KB compressed |
| Total page weight, content page | under 1 MB |
| Images per page above the fold | one LCP image, marked `priority`, everything else lazy |
| Lighthouse Performance | 90 or above |
| Lighthouse Accessibility | 100 |
| Lighthouse Best Practices, SEO | 100 |

- [ ] Budgets met on home, an institution page and an article, in both locales
- [ ] No render-blocking third-party script
- [ ] Fonts self-hosted with `font-display: swap` and preloaded where they affect LCP
- [ ] No image over 300 KB served. The legacy library has 98 files over 1 MB and none of them
      ship as-is
- [ ] No skeleton loaders on static content

### 4.14 Security configuration

- [ ] All headers from `docs/SECURITY.md` section 3 present on a real production response
      (`curl -sI https://happyeducation.uk`)
- [ ] CSP enforced, not report-only, with no `'unsafe-inline'` in `script-src`
- [ ] Zero CSP violations across a full click-through of every template
- [ ] HSTS staged per `docs/DEPLOYMENT.md` section 8, not enabled prematurely
- [ ] No secret in the client bundle: grep the built output for key prefixes and for every server
      variable name
- [ ] `/api/*` returns `no-store` and is bypassed at the Cloudflare cache
- [ ] Rate limits verified on each protected route
- [ ] Open-redirect attempt against `/api/locale` fails (`//evil.example`, `../`, an absolute URL)
- [ ] `javascript:` and `data:` hrefs in CMS content render as text, not links
- [ ] No SVG from the CMS renders inline
- [ ] Sanity Studio requires SSO with two-factor; the member list is reviewed
- [ ] `npm audit` clean of high and critical
- [ ] Preview deployments are protected and not indexable

### 4.15 Business-fact verification gate

**Nothing in this section may be published until the named claim is confirmed.** This is the
gate that keeps the site defensible, and it is a hard blocker.

**Must be absent from the entire site, in both languages, in prose, metadata and structured data:**

- [ ] Student counts (any "500+", "700+", "hundreds of students" formulation)
- [ ] University or school counts ("200+ universities", "150+ schools", "over a hundred")
- [ ] Countries served ("20+ countries")
- [ ] Success, acceptance or visa-approval rates of any kind
- [ ] Years-of-experience figures (the legacy "6 years" is stale and wrong; 2018 is the verifiable
      fact and it can be stated as an establishment date)
- [ ] British Council, English UK, ICEF or BAC accreditation, in any wording, anywhere near Happy
      Education's own identity. Where a partner school's accreditation is described, it is
      unambiguously attributed to that school
- [ ] IAA (formerly OISC) registration or any immigration-advice positioning
- [ ] Awards, press coverage, review scores or star ratings
- [ ] Named staff other than the sole director, unless employment and consent are confirmed
- [ ] Testimonials, unless documented consent exists for each
- [ ] The superseded Chase Road address, and the theme demo testimonial

**Must be confirmed before publication:**

- [ ] Every price on the site: source, currency, unit, as-at date
- [ ] Every visa or immigration statement: administrative support framing, decision-rests-with-the-authority
      statement, link to the official source, no predicted outcome
- [ ] Every safeguarding claim about a third-party school: confirmed with that school, or
      attributed to it explicitly
- [ ] Every ranking, GPA threshold and English-test minimum: source and year
- [ ] The four gated articles cleared or unpublished (`docs/MIGRATION.md` section 12)
- [ ] Istanbul office: publish only if the business confirms it, and only described accurately
- [ ] Every image: licence basis recorded. Unresolved Shutterstock, partner and clipart-sourced
      images do not ship
- [ ] Partner logos: written permission from each trademark owner, or the logo comes out

**Positively confirmed and safe to publish:** the registered name HAPPY EDUCATION CONSULTANCY LTD,
company number 11331426, active status, incorporation on 26 April 2018, the registered office at
16 Upper Woburn Place (labelled as the registered office), SIC 85600 educational support services,
the sole director Sefa Mutlu Koca, the phone number and WhatsApp number, the admin email address,
and the three social profiles as links without follower counts.

---

## 5. Sign-off

Cutover proceeds only when every section above is signed. A partial sign-off is a decision to
launch with a known gap, which is legitimate only if it is recorded here with a name against it.

| Section | Owner | Date | Notes |
|---|---|---|---|
| 4.1 Both locales | | | |
| 4.2 Navigation and language switch | | | |
| 4.3 Templates | | | |
| 4.4 Search | | | |
| 4.5 Forms, consultation, appointments | | | |
| 4.6 Payment and webhooks | | | |
| 4.7 Consent | | | |
| 4.8 Legal | | | |
| 4.9 Redirects | | | |
| 4.10 Metadata, sitemap, structured data | | | |
| 4.11 Accessibility | | | |
| 4.12 Mobile | | | |
| 4.13 Performance | | | |
| 4.14 Security | | | |
| 4.15 Business facts | | | |

**Known gaps accepted at launch:**

| Gap | Why accepted | Owner | Resolution date |
|---|---|---|---|
| | | | |

---

## 6. After launch

- Run the full checklist quarterly, and after any change to headers, CSP, consent or payment.
- Re-run the redirect validation monthly for the first quarter, then quarterly.
- Re-run the sitemap reconciliation on every deploy. It is one check and it would have caught the
  legacy site's entire indexing failure.
- Re-verify dated content on a schedule: prices quarterly, visa and immigration content whenever
  official guidance changes and at minimum every six months, rankings annually.
- Review the accessibility statement against reality after any significant template change.

---

## Measured performance (20 August 2026)

Lighthouse 12 against `next start` on the production build, homepage `/en`, with the
CMS empty. Re-measure after the content import: real images and article lists will
move these numbers, and the mobile LCP is the one to watch.

| Metric | Mobile (throttled) | Desktop | Target |
|---|---|---|---|
| Performance | 98 | 99 | — |
| Accessibility | — | 100 | — |
| Best practices | — | 96 | — |
| SEO | — | 100 | — |
| **LCP** | **1.8 s** | 0.9 s | < 2.5 s |
| **CLS** | **0** | 0 | < 0.1 |
| **TBT** (INP proxy) | **20 ms** | 20 ms | INP < 200 ms |
| First Contentful Paint | 1.8 s | — | — |
| Speed Index | 2.0 s | — | — |

All three Core Web Vitals targets in the brief are met on mobile.

Caveats, stated plainly:
- TBT is a lab proxy for INP, not INP itself. Confirm INP from field data in Search
  Console once the site has traffic.
- Measured with an empty dataset. The homepage hero image is present, so LCP is
  representative, but destination and article pages have not been measured because
  they do not render until the migration is committed.
- Lighthouse's own accessibility score is an automated subset. The manual keyboard
  walkthrough and the axe-core specs in `tests/e2e/accessibility.spec.ts` are the
  substantive check.
