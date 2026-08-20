# Happy Education

The international education consultancy platform for **HAPPY EDUCATION CONSULTANCY LTD**: a
bilingual (English and Turkish) content site with a Sanity-backed CMS, replacing the legacy
WordPress installation at `happyeducation.uk`.

> ## Read this first
>
> **The legacy WordPress site has a live, unauthenticated remote code execution vulnerability
> (CVSS 9.8), a publicly readable 16 MB debug log, an exposed admin username, and a domain
> that anyone can send mail as.**
>
> **[docs/URGENT-LEGACY-SITE.md](docs/URGENT-LEGACY-SITE.md)**
>
> This rebuild does not fix any of it, because this rebuild is not deployed. Those are a
> **separate and more urgent workstream** with actions that should happen today, independent of
> the launch schedule for this repository. The reported phishing is a DNS and email
> authentication problem, not a compromised website, and migrating to Next.js does not address
> it. Do not let the rebuild timeline become the reason those stay open.

---

## Business identity

Every fact below is verified against a primary source and is safe to publish. They live in
[`src/lib/business-facts.ts`](src/lib/business-facts.ts) with their provenance attached.

| | |
|---|---|
| Legal name | HAPPY EDUCATION CONSULTANCY LTD |
| Company number | 11331426 (Companies House, active) |
| Incorporated | 26 April 2018 |
| Registered office | 16 Upper Woburn Place, London, England, WC1H 0AF |
| Director | Sefa Mutlu Koca (sole officer since incorporation) |
| Nature of business | SIC 85600, educational support services |
| Phone / WhatsApp | +44 7735 826785 / 447735826785 |
| Email | admin@happyeducation.uk |
| Social | [Instagram](https://www.instagram.com/happyeducationturkiye/) · [Facebook](https://www.facebook.com/HappyEdUK) · [LinkedIn](https://www.linkedin.com/company/happyeducation) |

Two constraints that shape the code, not just the copy:

**The registered office is a Regus serviced address**, shared with roughly 2,600 other registered
companies. It must be labelled "registered office" and never described as a headquarters or a
staffed office. The `office` document type in Sanity forces this distinction as a required field.

**No IAA (formerly OISC) immigration registration is confirmed.** Under the Immigration and
Asylum Act 1999, giving immigration advice in the course of a business requires registration.
Until a number and level are supplied, all visa content must describe administrative and
application support only, must state that decisions rest with the relevant government authority,
must link to the official source, and must never promise or predict an outcome. See
`IMMIGRATION_ADVICE_STATUS` in `src/lib/business-facts.ts`.

### Claims that must never be published

`BLOCKED_CLAIMS` in `src/lib/business-facts.ts` is the enforced list. In summary: no student or
applicant counts, no institution or country counts, no success or visa-approval rates, no
years-of-experience figure, no British Council / English UK / ICEF / BAC accreditation, no IAA
registration, no awards or press mentions, no review scores, and no partner relationship without
a signed agreement behind it.

The mechanism is `publicValue(fact)`, which returns `null` for anything not marked `verified`.
Components render nothing when it returns null. They must never substitute a placeholder.

---

## Prerequisites

- **Node 24 LTS.** `package.json` sets an `engines` floor of `>=22.11.0`, but `@types/node` is
  pinned to the 24 line and CI runs 24. Develop on 24.
- **npm 11.3.0** (declared as `packageManager`; Corepack will select it).
- A Sanity project, if you want CMS content locally. Everything runs without one.

## Install

```bash
npm ci
cp .env.example .env.local
```

`.env.example` documents every variable the code reads, what degrades without it, and where the
real value is configured. Its defaults are deliberately commented out: **the site is designed to
run with no integrations at all**, and an unset variable ("this feature is off") is a much better
state than a plausible but wrong one ("this feature is broken").

The only line worth setting immediately is `NEXT_PUBLIC_SITE_URL=http://localhost:3000`.

**No secret may ever be prefixed `NEXT_PUBLIC_`.** Next.js inlines those into the browser bundle.
Server secrets go through `serverEnv()`, which throws if called in the browser.

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server on http://localhost:3000 |
| `npm run build` | Production build. Fails on type errors by design. |
| `npm start` | Serve a production build locally |
| `npm run typecheck` | `tsc --noEmit`. Run before every commit. |
| `npm run lint` | ESLint across the repository |
| `npm test` | Vitest, single run |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:e2e` | Playwright, including the axe-core accessibility pass |
| `npm run sanity:dev` | Sanity Studio standalone (the app also mounts it at `/studio`) |
| `npm run sanity:deploy` | Deploy the Studio to Sanity's hosting |
| `node scripts/check-contrast.mjs` | WCAG 2.2 AA gate on the colour tokens. Exits non-zero on failure. |

## Project structure

```
src/
  app/
    (site)/[locale]/          Public site. Both locale trees, one set of templates.
      layout.tsx              <html lang>, fonts, header, footer, consent provider
      page.tsx                Locale home
      [...segments]/          Catch-all: every section index and document page
    api/
      locale/route.ts         Language switch; resolves the equivalent document
  components/
    ui/                       Button, Container, MediaFrame, Logo
    chrome/                   Header, footer, navigation, language switcher, skip link
    content/                  PortableText renderer for CMS rich text
    shared/                   PageHero, Breadcrumbs, FaqSection, ReviewMeta, ConsultationBand
    consent/                  Cookie banner, preferences, consent-gated analytics
    home/                     Homepage sections
    seo/                      JSON-LD emitters
  lib/
    env.ts                    Validated configuration and isConfigured feature flags
    i18n/                     Locale registry, URL segment map, UI dictionary
    routing.ts                URL segments -> a description of what to render
    sanity/                   Client, image URLs, GROQ queries
    business-facts.ts         Verified facts, blocked claims, provenance gate
    legal.ts                  Legal page registry and localised slugs
    links.ts                  Safe href handling, internal reference resolution
    navigation.ts             Header and footer navigation model
    consent.ts                Consent record, cookie handling, Consent Mode mapping
    format.ts, fonts.ts       Locale-aware formatting, typography
  styles/globals.css          Tailwind v4 theme: the entire design token set
  proxy.ts                    Per-request CSP nonce, locale negotiation, robots headers

sanity/
  schemas/documents/          core.ts (settings, people, legal, technical)
                              content.ts (destinations, institutions, articles, commerce)
  schemas/objects/            seo, imageWithMeta, richText, editorial provenance
  lib/structure.ts            Studio desk navigation, grouped by language

scripts/check-contrast.mjs    Design system accessibility gate
docs/                         Documentation (index below)
docs/audit/                   Verified audit data: reports, inventories, WordPress export
```

## Where the CMS lives

The Sanity Studio is mounted at **`/studio`** inside this Next.js app (`basePath: '/studio'` in
[`sanity.config.ts`](sanity.config.ts)). One deployment, one domain to secure, one TLS
certificate.

- Access is Sanity project membership only. There is no public registration, no self-service
  sign-up and no self-hosted login page.
- **Enable SSO and enforce 2FA on the Sanity organisation.** This is the only authentication
  surface the platform has.
- Vision (the GROQ playground) is loaded outside production only, so the query console is never
  shipped to a live editor session.
- `/studio` is excluded from the proxy matcher in `src/proxy.ts`: the Studio bundle needs
  different CSP handling from the public site.

Editors should read the walkthroughs in [docs/CONTENT_MODEL.md](docs/CONTENT_MODEL.md), which are
written for non-technical staff.

## Content migration

The legacy WordPress content has been exported, classified and staged. Nothing has been imported
yet.

The raw export and the classification live in `docs/audit/`:

| File | Rows | What it is |
|---|---|---|
| `archive/wp/*.ndjson` | | Raw WordPress export: pages, posts, media, categories, users |
| `content-inventory.csv` | 336 | Every legacy URL with a bucket (keep / rewrite / merge / drop) and a target |
| `redirects-draft.csv` | 395 | Old URL to new URL, with status code and reason |
| `institutions-extracted.json` | 313 | Structured institution records with field-level provenance |
| `blog-posts.json` | 18 | The blog, with topic clusters and re-verification flags |

The migration runs in two steps:

```bash
npm run migrate:extract    # WordPress export -> normalised intermediate JSON
npm run migrate:import     # normalised JSON -> Sanity documents
```

Pass 1 (`scripts/migrate/extract.mjs`) never talks to Sanity. It reads the WordPress export plus
the audit artefacts, applies the classification the audit already made, and writes one JSON file
per target content type into `scripts/migrate/out/documents/` alongside `dropped.json`,
`merges.json`, `links.json`, `media-references.json` and `notes.json`. Pass 2 takes that output
and creates documents.

Keeping the two passes separate means the classification can be reviewed as plain JSON before
anything is written to the content lake, and re-running pass 1 costs nothing.

> **Check the script paths before running these.** `package.json` currently declares
> `node scripts/extract-wp.mjs` and `node scripts/import-sanity.mjs`, but the migration code
> lives at `scripts/migrate/extract.mjs`. The two need reconciling; see the note in
> [docs/MIGRATION.md](docs/MIGRATION.md) for the current entry points.

Two things the importer must respect, because they are enforced by the schema and by the
rendering layer:

- **Images arrive without a cleared licence.** `MediaFrame` refuses to render an image whose
  `licence.cleared` is not `true`, and renders a composed brand panel instead. The legacy library
  is largely partner marketing, commercial stock and screenshots of unknown provenance, so this
  is the intended outcome, not a bug to work around.
- **Every imported document needs a locale and, where a counterpart exists, a `translationGroup`.**
  Without the group the language switcher cannot resolve the equivalent page and falls back to
  the section index.

## Deployment

**Vercel** hosts the application. **Cloudflare** is intended to sit in front of it for DNS, WAF
and DDoS absorption. (Note: the audit found Cloudflare is *not* currently in front of the legacy
site; DNS is with IONOS. Putting it in front is a deployment task, not a completed one.)

The division of responsibility has to be explicit, or the two caches fight:

- **Vercel is the cache of record** for HTML. It owns ISR, on-demand revalidation and cache tags.
- **Cloudflare must respect origin cache headers** rather than running its own overlapping HTML
  cache. A second cache with independent expiry means an editor's publish clears one layer and
  not the other.
- **`/api/*` must never be cached anywhere.** `next.config.ts` sends
  `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` on those paths, and Cloudflare
  needs a matching bypass rule. These routes carry signatures, per-visitor redirects and state
  changes.

Security headers that do not vary per request are set in `next.config.ts`. The
Content-Security-Policy is **not**: it carries a per-request nonce so the site can avoid
`script-src 'unsafe-inline'`, so it is emitted from `src/proxy.ts`.

Non-production deployments send `X-Robots-Tag: noindex, nofollow` automatically, keyed off
`VERCEL_ENV`, so preview URLs cannot be indexed against the live site.

Full reasoning is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Documentation index

### In this repository

| Document | What it covers |
|---|---|
| **[docs/URGENT-LEGACY-SITE.md](docs/URGENT-LEGACY-SITE.md)** | **Live vulnerabilities on the legacy WordPress site and the email spoofing route. Separate, urgent workstream. Read first.** |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Rendering strategy, routing and locale model, data layer, caching, the Cloudflare/Vercel split, the client/server boundary, integration adapters, dependency rationale, and the decision record |
| [docs/CONTENT_MODEL.md](docs/CONTENT_MODEL.md) | Every Sanity type and field, the locale model and why it is document-level, the provenance and verification gates, and editor walkthroughs for publishing a destination, an institution and an article |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Palette with provenance and measured contrast ratios, the brand-orange fill rule, typography and Turkish glyph coverage, scale, spacing, radii, components, motion, breakpoints, and the anti-pattern blacklist |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Hosting topology, the Cloudflare and Vercel cache split, environment promotion and the cutover sequence |
| [docs/SECURITY.md](docs/SECURITY.md) | Application security: API routes, integrations, the content pipeline, CSP and import-time sanitisation |
| [docs/DOMAIN_SECURITY.md](docs/DOMAIN_SECURITY.md) | DNS, SPF, DKIM and DMARC. The rollout sequence for the email spoofing problem |
| [docs/MIGRATION.md](docs/MIGRATION.md) | WordPress to Sanity: bucket classification, redirects, sanitisation, and what carries across verbatim |
| [docs/SEO.md](docs/SEO.md) | Metadata, canonicals, hreflang, sitemaps, structured data, topic clusters and the Search Console migration |
| [.env.example](.env.example) | Every environment variable, what degrades without it, and where the real value is configured |

### Audit data (`docs/audit/`)

Real, verified findings from the pre-rebuild audit. These are the evidence base for the claims
the site does and does not make.

| File | Subject |
|---|---|
| `report-1.md` | Security, infrastructure and email authentication |
| `report-2.md` | Business facts, verified against primary sources |
| `report-3.md` | Competitor information architecture |
| `report-4.md` | Brand identity and media assets (the palette provenance) |
| `report-5.md` | Content inventory and migration classification |
| `verify-1.md`, `verify-2.md` | Adversarial re-checks of the above |

### Referenced but not present

Source comments and other documents point at these. If a link above or in the source is dead,
this is why. Check `docs/` before assuming, since the documentation set is being written in
parallel:

| Missing document | Referenced from |
|---|---|
| `docs/LEGAL_REVIEW.md` | `src/lib/business-facts.ts`, `src/lib/legal.ts` |
| `docs/QA.md` | `docs/SEO.md` |

`LEGAL_REVIEW.md` is the more important of the two. Every legal page in `src/lib/legal.ts` is a
draft pending solicitor review, `legalPage.solicitorApproved` defaults to `false`, and the
blocked-claims list needs a documented owner. None of that should be carried in code comments
alone.

---

## Conventions

- **TypeScript strict**, plus `noUncheckedIndexedAccess`, `noImplicitOverride` and
  `noFallthroughCasesInSwitch`. `any` is not used anywhere.
- **`dangerouslySetInnerHTML` is used for JSON-LD only**, with every `<` in the
  serialised JSON replaced by the unicode escape `\u003c`, so a closing `script` tag
  cannot be smuggled through a string value. The
  Portable Text schema has no HTML block and no raw embed type, so no CMS value can reach it.
- **British English** in English copy. **Natural Turkish** in Turkish copy, written as Turkish
  rather than translated word for word. No em dashes in user-facing copy.
- **No invented facts.** No metrics, testimonials, partners or accreditations that are not
  evidenced. When in doubt, render nothing.
