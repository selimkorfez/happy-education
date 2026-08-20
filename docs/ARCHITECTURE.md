# Architecture

Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, Sanity 6.

This document explains how the pieces fit and, more usefully, why each choice was made and what
was given up for it. Where something is designed but not yet implemented, it says so.

---

## 1. The shape of the system

```
                 visitor
                    |
              [ Cloudflare ]   DNS, TLS, WAF, DDoS, bot management
                    |          respects origin cache headers; bypasses /api/*
                    |
              [   Vercel   ]   the cache of record for HTML
                    |          ISR + on-demand revalidation by tag
        +-----------+-----------+
        |                       |
  src/proxy.ts             App Router
  CSP nonce                Server Components render
  locale redirect          a small number of client islands hydrate
  robots headers
        |
        +--> Sanity Content Lake (published content via CDN)
        |
        +--> Stripe / Resend / CRM / Turnstile  (all optional, all server-side)
```

There is no database in the request path, no server-side templating language reachable from a
form parameter, and no self-hosted login. That is a deliberate contrast with what is being
replaced (see [URGENT-LEGACY-SITE.md](URGENT-LEGACY-SITE.md) section 3).

---

## 2. Rendering strategy

### React Server Components by default

Every component is a Server Component unless it has a specific reason not to be. On a content
site this is the correct default rather than a fashion: the vast majority of the page is text,
links and images that never change between renders, and shipping a component tree to the browser
to re-derive markup the server already produced is pure cost.

The practical effect is that `src/lib/i18n/dictionary.ts`, `src/lib/navigation.ts`,
`src/lib/business-facts.ts`, `src/lib/legal.ts` and every GROQ query stay out of the client
bundle entirely. The dictionary alone is roughly 200 strings in two languages; none of it is
downloaded by a visitor.

Modules that must never be bundled for the browser import `server-only` as their first line:
`src/lib/env.ts`, `src/lib/sanity/client.ts`, `src/lib/routing.ts` and every file under
`src/lib/sanity/queries/`. That turns an accidental client import into a build error rather than
a runtime leak.

### Static generation with ISR

`generateStaticParams` in `src/app/(site)/[locale]/layout.tsx` pre-renders both locale trees at
build time. Document pages set a revalidation window rather than a rebuild requirement:

| Content | `revalidate` | Reason |
|---|---|---|
| Locale home | 3600s | Chrome plus a small article rail; an hour of staleness is invisible |
| Articles and article lists | 900s | Editorial changes should surface quickly after publishing |
| Destinations, institutions, tours, summer programmes | 1800s | Reference content, edited in batches |
| Guides, services, pages, legal pages | 1800s | Same |
| Translation lookups | 3600s | Group membership changes very rarely |
| Route and sitemap enumeration | 3600s | New documents can wait an hour, or trigger a tag purge |

These live on the individual `sanityFetch` calls, not on the page, so one page composed of several
queries gets the shortest sensible window for each part rather than the union of the slowest.

### What is dynamic, and why

Only three things opt out of static rendering, and each has a reason that cannot be designed away:

1. **`src/proxy.ts`** runs per request. It has to: it mints a fresh CSP nonce per response, and a
   nonce that is cached is a nonce that is worthless.
2. **`/api/locale`** is a route handler that reads a query string and issues a redirect. It sends
   `Cache-Control: no-store`, because a language switch is a per-visitor action and a shared cache
   entry for it would send the next visitor to somebody else's page.
3. **Form submission endpoints** (enquiry, checkout, webhooks) are state-changing by definition
   and are covered by the blanket `no-store` on `/api/*` in `next.config.ts`.

Notably **the language switcher is not dynamic**. `LanguageSwitcher` reads the current path with
`usePathname()` rather than `headers()`. Reading `headers()` in a Server Component opts the whole
route out of static generation, and paying that price on every page of a content site to build one
href would be a bad trade. `src/proxy.ts` does set an `x-pathname` request header for server code
that genuinely needs the path, but the switcher deliberately does not use it.

---

## 3. Routing and the locale registry

### Two independent editorial trees

Happy Education does not run one site with a translation layer over it. It runs two editorial
trees that happen to share a design system:

```
/en/universities/united-kingdom
/tr/universiteler/ingiltere
```

These are the same page, and they share **no URL segment**. The Turkish segments were chosen to
match the slugs the current WordPress site already ranks for (`universiteler`, `dil-okullari`,
`yaz-okullari`, `ingiltere`), so the migration preserves search intent instead of inventing new
Turkish paths and discarding the ranking history.

### The registry is the single source of truth

`src/lib/i18n/config.ts` holds a `SectionKey` list (locale-independent, stable identifiers such as
`universities`, `languageSchools`, `insights`) and a `SECTIONS` map from key plus locale to URL
segment. Nothing anywhere else hard-codes a URL segment. Every path is built through
`sectionPath(locale, key)`, `docPath(locale, key, ...slugs)` or `homePath(locale)`, and a URL is
read back with `sectionFromSegment(locale, segment)`, which is derived from the same map at module
load.

The payoff: renaming a public URL segment is a one-line change in one file, and the reverse lookup,
the navigation, the breadcrumbs, the sitemap and the language switcher all follow. The cost is a
small indirection every time you want a link, which is worth it.

### Route resolution

`src/app/(site)/[locale]/[...segments]/page.tsx` is a single catch-all that handles every section
index and every document page for both locales. `src/lib/routing.ts` turns the segments into a
discriminated union describing what should render:

```ts
type ResolvedRoute =
  | { kind: 'sectionIndex'; section: SectionKey }
  | { kind: 'destination'; section: SectionKey; doc: DestinationDoc }
  | { kind: 'institution'; section: SectionKey; doc: InstitutionDoc }
  | { kind: 'summerListing' | 'summerProgramme' | 'tour' | 'article' | 'prose' | 'legal'
      | 'fixedPage' | 'search'; /* ... */ }
```

Resolution is separated from rendering on purpose. `generateMetadata` and the page body call the
same `resolveRoute`, so a page can never advertise metadata for one document while rendering
another. That class of bug is silent, survives review, and is caught only by someone noticing a
wrong title in a search result weeks later.

Section indexes always resolve, even against an empty dataset, so navigation never points at a 404
before content is imported. Individual documents resolve to `null` when missing, which becomes a
real 404.

### Routes outside the locale trees

Four routes sit outside `(site)/[locale]` because they are not pages:

| Route | Purpose |
|---|---|
| `src/app/robots.ts` | `robots.txt`, generated so the sitemap URL and the site origin come from one place |
| `src/app/sitemap.ts` | The XML sitemap, built from `getAllRoutableDocs()` so it cannot drift from what actually exists |
| `src/app/feed.xml/route.ts` | The article feed |
| `src/app/api/*` | `locale`, `checkout`, `webhooks/stripe` |

`robots.txt` and `sitemap*.xml` are excluded from the proxy matcher in `src/proxy.ts`, alongside
`/studio`, `_next/static`, `_next/image` and anything with a file extension. That matcher is worth
reading before adding a route: anything it does not match gets no CSP header and no locale
redirect.

### Locale negotiation

`src/proxy.ts` handles paths with no locale prefix. It parses `Accept-Language` with q-values,
falls back to `en` (which is also the `x-default`), and issues a **307** to the locale root with a
`Vary: Accept-Language` header so a cached redirect is not served to a visitor with a different
language.

The rule it does not break: **an explicit locale in the URL is authoritative.** `/en/...` is never
rewritten to Turkish content because the browser prefers Turkish. Negotiation applies only to a
path that carries no locale at all. A visitor who has been sent a link deserves the page in that
link.

---

## 4. Translation groups and the language switcher

Because the two trees share no slug, resolving "the same page in the other language" is a data
question, not a string operation.

Every localisable document carries a `translationGroup` reference. A `translationGroup` document
holds no content: it is purely the shared identity of one logical page. Two documents pointing at
the same group are the same page in different languages.

The switcher renders a plain anchor to `/api/locale?to=tr&from=/en/universities/united-kingdom`.
No fetch happens on click. The route handler in `src/app/api/locale/route.ts` then degrades in
explicit steps, best to worst:

1. **The linked translation of this exact document.** `findTranslatedPath` walks
   document to group to sibling in the target locale, and returns the sibling's slug.
2. **The same section's index in the target locale.** Always available; built from the registry
   with no CMS involvement, so it survives a CMS outage.
3. **The target locale's home page.** Last resort only.

Step 3 exists to be avoided. Dumping every language switch on the homepage is the behaviour this
route was written to prevent, and it should only ever happen for a locale home, an unrecognised
section, or a document with no group.

`from` is validated before use: it must be an internal absolute path, it must not start with `//`,
and it must not contain `..`. Anything else is discarded and the visitor gets the locale home. This
is an open-redirect guard, not a formality: a redirect endpoint that echoes a user-supplied
destination is a phishing primitive, and this business already has a phishing problem.

`findAlternates` provides the same relationship to `generateMetadata` for `hreflang`. It returns
only locales that genuinely have a published translation. Advertising an alternate that 404s is
worse than omitting it.

---

## 5. The Sanity data layer

### Two clients, one wrapper

`src/lib/sanity/client.ts` exports two clients:

- **`getClient()`** reads published content through Sanity's CDN (`useCdn: true`,
  `perspective: 'published'`). Every public page render uses this.
- **`getPreviewClient()`** includes drafts, authenticated with `SANITY_API_READ_TOKEN`
  (`useCdn: false`, `perspective: 'drafts'`, `stega: false`). Only ever used inside an
  authenticated draft-mode request.

Both return `null` when the project is not configured.

### `sanityFetch` and the fallback contract

```ts
sanityFetch<T>(query, params, options, fallback): Promise<T>
```

The `fallback` argument is **required and positional**, which is the whole point. You cannot write
a query against this codebase without deciding, at the call site, what the page should show when
the CMS is unavailable. It returns the fallback in three cases:

- Sanity is not configured (`isConfigured.sanity()` is false)
- the client could not be constructed
- the query threw

Errors are logged with the message only, deliberately **without the query parameters**, because
parameters can contain visitor-supplied input from search and filter routes.

The consequence is that a Sanity outage degrades the site rather than taking it down. Listings go
empty, document pages 404, and the chrome, homepage copy, navigation, footer, legal registry and
business facts (all defined in code) render exactly as normal. This is also what makes a clean
checkout with no credentials a genuinely useful development environment rather than a stack trace.

### Projections are explicit, always

Every GROQ projection selects named fields. No query returns a whole document. Two reasons, and
the second matters more:

1. Payload size.
2. An editor adding an internal-only field, a migration note, a private contact, a to-do, cannot
   leak it. The field is simply not selected, so it never reaches the render tree and never reaches
   the RSC payload.

References inside rich text are dereferenced through `LINK_PROJECTION` (`src/lib/links.ts`) so
`resolveInternalHref` can build a real path at render time rather than emitting a dangling link.

### Images

`src/lib/sanity/image.ts` builds every image URL through Sanity's transformation API with
`auto('format')`, so a 4000px editor upload never reaches a phone and format negotiation (AVIF,
WebP) happens on the Accept header. `next.config.ts` allowlists `cdn.sanity.io` as the only remote
image host, and sets `dangerouslyAllowSVG: false`: SVG from a CMS is a script-execution vector and
is never rendered through the image optimiser.

`MediaFrame` adds the licence gate on top. See [CONTENT_MODEL.md](CONTENT_MODEL.md) section on
images.

---

## 6. Caching and revalidation

Three layers, each with a distinct job.

### Layer 1: time-based ISR

Each `sanityFetch` carries a `revalidate` window (table in section 2). This is the safety net: even
with no webhook configured at all, content is never more than its window out of date. It requires
no infrastructure and cannot break.

### Layer 2: on-demand revalidation by tag

Every query also carries cache tags. The pattern is a broad type tag plus a narrow document tag:

```ts
{ tags: ['destination', `destination:${slug}`], revalidate: 1800 }
{ tags: ['article', `article:${slug}`], revalidate: 900 }
{ tags: ['institution', `institution:${slug}`] }
{ tags: ['translation'] }
{ tags: ['routes'] }
```

A Sanity webhook fires on publish, authenticates with `SANITY_REVALIDATE_SECRET`, and purges the
relevant tags. The broad tag exists because publishing one article invalidates more than that
article's own page: it also invalidates every listing that includes it. The narrow tag exists so
that editing one destination does not purge all 313 institution pages.

> **Status: the webhook receiver is not implemented yet.** The tags are in place on every query and
> the secret is defined in `src/lib/env.ts`, so the receiver is the only missing piece. Until it
> lands, layer 1 is doing all the work and publishes appear within the revalidate window.

### Layer 3: immutable build assets

`next.config.ts` sets `public, max-age=31536000, immutable` on `/_next/static/*`. Those paths are
content-hashed, so they are safe to cache forever, and doing so removes them from the revalidation
problem entirely.

### The rule that ties it together

**Only one layer may own HTML caching, and it is Vercel.** See the next section.

---

## 7. Cloudflare and Vercel: who caches what

This is the part most likely to be got wrong, so it is stated as rules.

| Concern | Owner | Notes |
|---|---|---|
| DNS, TLS termination at the edge | Cloudflare | Also DNSSEC, which the audit found is not enabled today |
| WAF, DDoS absorption, bot management | Cloudflare | The legacy origin IP is currently exposed directly |
| Rate limiting on form and API paths | Cloudflare | Cheaper and earlier than doing it in application code |
| **HTML cache** | **Vercel, exclusively** | ISR, on-demand revalidation, cache tags |
| Static asset cache | Either | Content-hashed and immutable, so overlap is harmless |
| Security response headers | Vercel origin | Set in `next.config.ts` and `src/proxy.ts` so they survive either path |

**Why they must not overlap on HTML.** Vercel's ISR knows when an editor published something,
because the webhook tells it. Cloudflare does not. If Cloudflare runs its own HTML cache with its
own expiry, then an editor publishing a correction purges one layer and not the other, and the site
serves the old page from the edge for an unbounded period with no way to tell which layer is at
fault. The failure is intermittent, looks like a CMS bug, and wastes days.

**So: Cloudflare must be configured to respect origin cache headers on HTML.** Not "Cache
Everything". Not a page rule with its own Edge Cache TTL on `text/html`.

**`/api/*` must never be cached, anywhere, by anything.** `next.config.ts` already sends:

```
Cache-Control: no-store, no-cache, must-revalidate, max-age=0
Pragma: no-cache
```

on every `/api/*` path, and Cloudflare needs a matching bypass rule. These routes carry Stripe
webhook signatures, per-visitor language redirects, and state changes. A cached POST response or a
cached redirect is a data-leak class bug, not a performance annoyance.

### Content-Security-Policy: why it is not in `next.config.ts`

Every header that does not vary per request lives in `next.config.ts`: `X-Content-Type-Options`,
`X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-Opener-Policy`,
`Cross-Origin-Resource-Policy`.

The CSP is not one of them. It carries a **per-request nonce**, which is what lets the site avoid
`script-src 'unsafe-inline'`. `src/proxy.ts` generates the nonce, sets it on the `x-nonce` request
header (Next.js reads that and stamps it onto its own inline bootstrap scripts automatically), and
attaches the assembled policy to the response.

The policy uses `'strict-dynamic'`, so a nonced loader such as GTM can pull its own dependencies
without allowlisting every downstream Google host, while injected inline script stays blocked. Host
lists are still supplied for browsers that do not honour `strict-dynamic`.

`style-src` includes `'unsafe-inline'`. This is an accepted, documented compromise: Next.js injects
inline `<style>` for critical CSS without a nonce. The exposure is style injection only, and
`script-src` remains nonce-locked, which is where the real risk sits.

Two directives worth calling out because they defend specific business risks:

- `frame-ancestors 'none'` means nothing can embed this site. A clickjacked consultation booking or
  payment flow is exactly the attack that matters for a consultancy handling deposits.
- `form-action 'self'` means a form can only post back to this origin. If content injection ever did
  land a form on a page, it could not exfiltrate a lead.

`X-XSS-Protection` is deliberately absent. It is deprecated and its filter has itself been a source
of vulnerabilities.

---

## 8. The client/server boundary

Client components are countable on two hands, and each one has a written justification. The set
falls into exactly three categories, and **adding a fourth needs an argument**:

1. **Navigation disclosure state** (`PrimaryNav`, `MobileNav`)
2. **Consent** (`ConsentProvider`, `CookieBanner`, `CookiePreferencesButton`, `Analytics`), which is
   a client-side decision by definition
3. **Genuine input** (forms, the appointment picker, the search field) plus `LanguageSwitcher`,
   which needs the current path

To list them, run `grep -rl "use client" src/`. The current set:

| Component | Ships JS because | Could it be a Server Component? |
|---|---|---|
| `search/SearchForm.tsx` | A controlled input and submit behaviour | No. |
| `booking/AppointmentPicker.tsx` | Slot selection state before submission | No. |
| `chrome/PrimaryNav.tsx` | Desktop disclosure panels: open/close state, Escape to close and restore focus, close on tab-out, hover-intent delay, close on navigation | No. This is genuine interaction state. |
| `chrome/MobileNav.tsx` | Full-height panel: open state, focus trap, focus restore, body scroll lock, close on navigation | No. Sub-sections inside it use native `<details>`, which needs no JS of its own. |
| `chrome/LanguageSwitcher.tsx` | `usePathname()` to build the `from` parameter | Only by reading `headers()`, which would make every page dynamic. Deliberate trade. |
| `consent/ConsentProvider.tsx` | Reads and writes the consent cookie, holds the decision in context | No. Consent is a client-side decision by definition. |
| `consent/CookieBanner.tsx` | Consumes the context, renders the banner and preferences dialog | No. |
| `consent/CookiePreferencesButton.tsx` | Reopens the preferences dialog from the footer | No. Kept as a tiny separate file so the whole footer does not become a client component. |
| `consent/Analytics.tsx` | Injects the GTM script only after consent is granted | No. The decision is only known client-side. |

**Everything else is a Server Component**, including the entire header shell, the footer, all
homepage sections, every routed template, `PortableText` and every rich-text block type,
`MediaFrame`, `Breadcrumbs`, `PageHero`, `ReviewMeta`, `FaqSection`, `ConsultationBand` and every
JSON-LD emitter.

Three patterns keep it that way:

- **`FaqSection` uses native `<details>`/`<summary>`.** Correct keyboard behaviour, correct
  screen-reader semantics and correct focus handling arrive for free. A JavaScript accordion would
  ship code to re-implement all three, usually worse.
- **`CookiePreferencesButton` is split out from `SiteFooter`.** The button needs the consent
  context; the rest of the footer (which reads `business-facts`, `legal` and `navigation`) does
  not. Splitting keeps roughly 200 lines of registry data on the server.
- **Client islands are leaves, never containers.** A form is a client component; the page around it
  is not. `'use client'` is contagious downwards, so putting it on a wrapper drags the whole subtree
  into the bundle. Push the directive as far down the tree as it will go.

The consent architecture deserves a note. The consent record is stored in a **first-party cookie,
not `localStorage`**, so the server can read it during SSR and avoid emitting tag markup at all for
a visitor who has refused. `ConsentProvider` defers rendering the banner until after mount
(`hydrated` flag) so server and client markup agree during hydration. `useConsentState()` defaults
to `DENY_ALL` before a decision exists, which means the failure mode of any bug in this area is
"no tracking", not "tracking without consent".

---

## 9. Integration adapters

Every third-party integration sits behind an interface, and every one is optional. The pattern is
the same in each case: a narrow interface the application depends on, one or more implementations
behind it, and a no-op implementation selected when the integration is not configured.

The reason is not testability, which is a side benefit. It is that this is a consultancy that has
not yet chosen a CRM or a scheduling tool, and the site cannot be blocked on that decision or
rewritten after it.

### `LeadProvider` (`src/lib/leads/`)

**Purpose.** Accepts a normalised `Lead` (enquiry, consultation, programme enquiry, newsletter) and
delivers it somewhere.

**The interface.**

```ts
interface LeadProvider {
  readonly channel: 'crm' | 'email' | 'console'
  isAvailable(): boolean
  deliver(lead: Lead): Promise<LeadResult>
}
```

Two rules are baked into that shape. **`isAvailable()` is checked before `deliver()`**, so an
unconfigured integration is skipped quietly rather than throwing. And **`deliver()` must resolve,
never reject**: a provider that throws would take the other channels down with it, and a lead that
reaches nobody is lost revenue and, for a family mid-application, a broken promise. Delivery fans
out across every available channel and reports per-channel results.

**Implementations.** Email via Resend, gated on `isConfigured.email()`. Optional CRM webhook, gated
on `isConfigured.crm()` (`CRM_WEBHOOK_URL` plus `CRM_API_TOKEN`). A `console` provider for local
development, so an enquiry form is testable on a clean checkout.

**Why it exists.** So that adopting a CRM later is a new implementation of one interface, not a
change to every form. `src/lib/env.ts` describes the CRM variables as sitting "behind the
LeadProvider interface" for exactly this reason.

**Two design details worth knowing.** `LeadResult.reference` and `LeadResult.reason` must never
carry personal data or a raw provider response body, because both end up in logs. And the API
returns field-level *error codes* rather than sentences: the browser already knows the visitor's
locale and owns the wording, which also keeps the response from echoing submitted content back to
a caller.

The `Lead` type has no field for a passport number, a bank detail, a medical condition or an
identity document, and `validation.ts` rejects any submission that tries to introduce one. That
material belongs in a secure client file, never in a website form and never in an email. Given
this domain, that is a deliberate exclusion rather than an oversight.

**Degraded state.** With no channel available, forms must be honestly unavailable and the page must
show the published phone, WhatsApp and email routes instead. A form that accepts a submission it
cannot deliver is worse than no form.

### `SchedulingProvider`

**Purpose.** Turns an `appointmentType` document into bookable availability and records a booking.

**Why it exists.** The `appointmentType` schema deliberately holds the commercial truth
(`durationMinutes`, `priceMinor`, `currency`, `refundable`, `cancellationPolicy`, `active`) in
Sanity, so an editor can change a consultation's price or duration without a deploy and without
touching a scheduling vendor's dashboard. The provider handles only calendar mechanics. If the
business adopts, or later abandons, a particular scheduling tool, the priced catalogue stays put.

**Degraded state.** No provider configured means the consultation page presents the contact routes
rather than a live calendar.

> **Status: interface not yet written.** The `appointmentType` document type exists in the schema
> and carries the full commercial contract, so the provider is the only missing piece.

### Payment catalogue

**Purpose.** Map a `paymentService` document to a Stripe Checkout session.
Implemented across `src/app/api/checkout/route.ts` and `src/app/api/webhooks/stripe/route.ts`.

**The invariant.** *The browser never supplies an amount.* `paymentService` carries a `reference`
(a stable internal code such as `application-service`), `priceMinor` and `currency`. The client
sends only the reference. The server looks up the document, reads the authoritative price, and
creates the session from that. Both `appointmentType` and `paymentService` say so in their schema
descriptions: "Authoritative: the browser cannot change it."

This is the single most important rule in the payment path. A checkout that accepts a
client-supplied amount is a free-goods vulnerability, and it is a common one.

**Also enforced.** Every incoming Stripe webhook is verified against `STRIPE_WEBHOOK_SECRET` before
it is trusted. Without verification, a forged "payment succeeded" event is a trivial POST.

**Degraded state.** `isConfigured.stripe()` requires both `STRIPE_SECRET_KEY` and
`STRIPE_WEBHOOK_SECRET`. Without both, payable services are not offered and no checkout is created.
`paymentService.active` defaults to `false`, so a newly imported service is never live by accident.

### Turnstile

**Purpose.** Bot protection on the high-abuse forms.

`isConfigured.turnstile()` requires **both** `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and
`TURNSTILE_SECRET_KEY`, because a widget the server cannot verify is decoration. Without both,
forms fall back to rate limiting, honeypots and server-side validation.

---

## 10. Error handling

**Configuration errors fail loudly and early.** Public configuration is parsed at module load and
throws on an invalid value, because getting `NEXT_PUBLIC_SITE_URL` or a GTM container ID wrong is
a deployment error that should stop the deployment, not produce a subtly broken site. `serverEnv()`
throws immediately if called in the browser, converting an accidental secret leak into an obvious
crash rather than a silent exfiltration.

**Data errors degrade.** `sanityFetch` catches, logs without parameters, and returns the caller's
fallback. `/api/locale` catches CMS failures and falls through to the section index. A missing
document is `null`, which the route turns into a real 404 rather than an empty page that returns
200 and gets indexed.

**Missing content is a composed state, not a broken one.** `MediaFrame` with no image (or an
uncleared licence) renders a flat brand panel with the mark ghosted into it, labelled outside
production so nobody mistakes it for finished work. `LatestInsights` renders nothing at all when
there are no articles in that locale, rather than a heading over a void. `ReviewMeta` returns null
when there are no dates and no sources.

**Unsafe input is dropped, not sanitised.** `safeExternalHref` returns `null` for anything that is
not `http:`, `https:`, `mailto:` or `tel:`, and explicitly rejects protocol-relative `//host` URLs,
which inherit the current scheme and read as internal at a glance. `PortableText` then renders the
link text as plain text rather than emitting a dead or dangerous anchor. `javascript:` and `data:`
are also rejected at the schema level, so this is defence in depth against values that predate the
validation, such as anything carried in from the WordPress import.

---

## 11. Dependencies

Every package, and why it is here. The list is short on purpose: each dependency is a permanent
patch obligation, and the site being replaced is a case study in what happens when that obligation
is not met.

### Runtime

| Package | Version | Why |
|---|---|---|
| `next` | 16.3.1 | The framework. App Router, RSC, ISR, image optimisation, `next/font` self-hosting. |
| `react`, `react-dom` | 19.2.8 | Required by Next 16. |
| `next-sanity` | 13.3.3 | Sanity client with Next cache integration (`next: { revalidate, tags }`), plus the Portable Text renderer. Using this rather than `@sanity/client` directly is what makes tag-based revalidation work. |
| `@sanity/image-url` | 1.2.0 | Builds transformation URLs that respect the editor's hotspot and crop. Listed in `optimizePackageImports` to keep it off the client graph. |
| `sanity` | 6.10.1 | The Studio, mounted at `/studio`. Also provides `defineType`/`defineField`, which is what makes the schema type-checked. |
| `@sanity/vision` | 6.10.1 | GROQ playground. Loaded outside production only. |
| `styled-components` | 6.1.19 | Not used by the site. A peer requirement of the Sanity Studio UI. |
| `stripe` | 22.5.0 | Server-side Stripe SDK: Checkout sessions and webhook signature verification. Never imported into a client component. |
| `zod` | 4.4.3 | Environment schema validation in `src/lib/env.ts`, and the validation layer for every form and webhook payload. Chosen over hand-written guards because the parsed output is typed, so validation and types cannot drift. |
| `server-only` | 0.0.1 | A build-time tripwire. Importing a `server-only` module from a client component is a build error. |

### Development

| Package | Version | Why |
|---|---|---|
| `typescript` | 5.9.3 | Strict, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`. |
| `@types/node` | 24.10.1 | Matches the Node 24 target. |
| `@types/react`, `@types/react-dom` | 19.x | Match React 19. |
| `tailwindcss`, `@tailwindcss/postcss` | 4.3.3 | v4's CSS-first `@theme` block means the design tokens live in `src/styles/globals.css` as real custom properties, readable at runtime, with no JavaScript config file to drift from them. |
| `postcss` | 8.5.6 | Tailwind v4's build path. |
| `eslint`, `eslint-config-next` | 10.8.1 / 16.3.1 | Linting runs as a separate CI step; Next 16 no longer runs it during `next build`. |
| `vitest` | 3.2.4 | Unit tests for the pure logic: locale negotiation, path building, consent parsing, `safeExternalHref`, formatters. |
| `@playwright/test` | 1.62.1 | End-to-end: language switching across the two trees, consent flows, navigation keyboard behaviour. |
| `@axe-core/playwright` | 4.11.2 | Automated accessibility assertions inside the e2e run. Automated checks catch perhaps a third of WCAG issues, so this supplements manual testing rather than replacing it. |

The unit suite covers the pure logic that the rest of the system leans on: the locale registry and
path builders, the UI dictionary, `safeExternalHref` and reference resolution, consent parsing,
formatters, the business-facts provenance gate, route resolution, Portable Text extraction, and a
design-system suite that asserts the token contract and the anti-pattern rules directly.

> **Note:** there is no ESLint flat config (`eslint.config.*`) in the repository, so `npm run lint`
> is declared but not yet runnable. `npm run typecheck`, `npm test`, `npm run test:e2e` and
> `node scripts/check-contrast.mjs` all work.

**Deliberately absent:** no CSS-in-JS runtime for the site itself, no component library, no
animation library, no icon package (the few icons are inline SVG), no client-side state manager,
no date library (`Intl.DateTimeFormat` covers both locales), no analytics SDK (GTM is loaded behind
consent, or not at all).

---

## 12. Decision record

Short ADR-style entries. Each records what was decided, what the alternative was, and what it cost.

### ADR-001: Separate documents per locale, not field-level translation

**Decision.** Each language is a separate Sanity document. Two documents that are the same page
point at a shared `translationGroup`.

**Alternative considered.** Field-level localisation, where one document holds `{ en: ..., tr: ... }`
for every field. This is the more common Sanity pattern.

**Why not.** Three reasons. The two trees are not translations of each other: the Turkish tree is
the primary market with 331 pages of history and existing rankings, while the English tree is
thinner and differently structured. Slugs must differ per locale to preserve ranking intent, which
field-level localisation handles awkwardly. And an editor working in Turkish should see a Turkish
document, not a form with half the fields in a language they are not writing.

**Trade-off accepted.** Resolving the equivalent page requires a CMS query rather than a string
swap, which is why `/api/locale` exists as a server route. A document can also be published in one
language and not the other, so `findAlternates` must return only locales that genuinely have a
translation rather than assuming both exist.

### ADR-002: `fallback` is a required argument to `sanityFetch`

**Decision.** The signature is `sanityFetch<T>(query, params, options, fallback)` with `fallback`
required and positional.

**Alternative considered.** Let it throw, and catch at the route or in an error boundary.

**Why not.** A thrown error becomes a 500 for the whole page. On a content site, the correct
response to "the CMS is unreachable" is almost always "render the parts that do not need the CMS",
because the chrome, navigation, contact details and legal pages are all defined in code. Making
`fallback` required forces that decision at every call site instead of leaving it to a distant
error boundary that has no idea what the page was trying to show.

**Trade-off accepted.** A query that silently returns `[]` can mask a real breakage. Mitigated by
logging every failure, and by pages rendering a genuinely empty state (or 404) rather than a
half-page.

### ADR-003: Emit the CSP from the proxy, not from `next.config.ts`

**Decision.** Static security headers in `next.config.ts`; the CSP in `src/proxy.ts` with a
per-request nonce.

**Alternative considered.** A static CSP in `next.config.ts` with `script-src 'unsafe-inline'`.

**Why not.** `'unsafe-inline'` on `script-src` defeats most of the value of having a CSP. The site
loads GTM (after consent), Stripe and Turnstile, and each of those wants to inject script. With a
nonce plus `'strict-dynamic'`, those loaders work while injected inline script stays blocked.

**Trade-off accepted.** `src/proxy.ts` runs on every request, and the nonce means the HTML response
cannot be cached with the header baked in. `style-src` still needs `'unsafe-inline'` because Next
injects unnonced inline styles; that residual risk is style injection only and is documented as
accepted.

### ADR-004: Business facts live in code with provenance, not in the CMS

**Decision.** `src/lib/business-facts.ts` holds every real-world claim as
`{ value, status, source, checked }`, and `publicValue()` returns `null` unless `status` is
`'verified'`.

**Alternative considered.** Put everything in `siteSettings` in Sanity and let the client edit it.

**Why not.** The legacy site's own numbers contradict each other (the About page counters say 500+
students, the prose says 700+), and none can be corroborated, because the company files
micro-entity accounts that disclose neither turnover nor headcount. The failure mode of a plain CMS
field is that somebody types a plausible number and it ships. The failure mode here is that an
unverified fact renders as nothing.

**Trade-off accepted.** Changing a verified fact needs a deploy. Acceptable: these are registered
company details that change rarely, and each change should involve someone re-checking the source.
Operational content that genuinely changes (working hours, offices) is owned by `siteSettings` in
Sanity; this file is the safety net and the audit trail.

### ADR-005: One catch-all route, not a route file per section

**Decision.** `[...segments]` plus `resolveRoute()` handles every section index and document page.

**Alternative considered.** A separate directory per section: `universities/[slug]`,
`insights/[slug]`, and so on.

**Why not.** URL segments are locale-dependent (`universities` / `universiteler`), so a directory
per section would mean thirteen sections times two locales as physical directories, all duplicated,
all needing to stay in sync with `SECTIONS`. Renaming one Turkish segment would mean moving a
directory.

**Trade-off accepted.** Route resolution happens in application code instead of being expressed by
the filesystem, which is slightly less obvious to a newcomer. Mitigated by `ResolvedRoute` being a
discriminated union, so the renderer's switch is exhaustively type-checked.

### ADR-006: Images are gated on a licence record

**Decision.** `MediaFrame` renders a composed brand panel unless `image.licence.cleared === true`.

**Alternative considered.** Render whatever is in the CMS and handle licensing as a process
question.

**Why not.** The audit found roughly 9 genuine Happy Education photographs in an 889-item library.
The rest is partner-school marketing, commercial stock and screenshots, including a homepage banner
that is a studio stock shot and a partner logo whose filename literally begins `png-clipart-`.
Migrating those onto a rebuilt site carries the same exposure forward with a fresh coat of paint.

**Trade-off accepted.** The site launches with fewer photographs than the legacy site had. The
placeholder is designed to be a deliberate graphic block rather than a broken-image state, so pages
remain presentable while photography is licensed or commissioned.

### ADR-007: `usePathname()` in the language switcher, not `headers()`

**Decision.** `LanguageSwitcher` is a client component reading `usePathname()`.

**Alternative considered.** A Server Component reading the `x-pathname` header that `src/proxy.ts`
already sets.

**Why not.** Calling `headers()` opts the entire route out of static generation. Paying that on
every page of a content site to construct one `href` is the wrong trade.

**Trade-off accepted.** A small client component in the header on every page. It has no effects, no
state and no event handlers; it renders anchors. The `x-pathname` header remains available for
server code that genuinely needs the path.

### ADR-008: Native `<details>` for FAQs and mobile sub-navigation

**Decision.** Use the platform element rather than a JavaScript accordion.

**Alternative considered.** A custom disclosure component with ARIA attributes and state.

**Why not.** `<details>`/`<summary>` gives correct keyboard operation, correct screen-reader
announcement and correct focus behaviour with no JavaScript. A hand-rolled version ships code to
reproduce all three and usually gets one of them subtly wrong.

**Trade-off accepted.** Less control over open/close animation, which does not matter here because
the motion policy forbids that animation anyway. Note this is a different decision from
`PrimaryNav`, which is a genuine disclosure-button pattern because it needs hover intent, tab-out
dismissal and focus restoration that `<details>` does not provide.

### ADR-009: Consent state in a first-party cookie, not `localStorage`

**Decision.** `he_consent`, a versioned JSON record in a first-party cookie, `SameSite=Lax`, six
month `Max-Age`, `Secure` in production, not `HttpOnly`.

**Alternative considered.** `localStorage`.

**Why not.** The server needs to read the decision during SSR so it can avoid emitting tag markup
for a visitor who has refused. `localStorage` is invisible to the server, which forces a
client-side check after hydration and a window in which the wrong thing may already have loaded.

**Trade-off accepted.** Not `HttpOnly`, because the client script must read it to decide whether to
inject tags. The value contains no personal data: three booleans, a version number and a timestamp.
`CONSENT_VERSION` is bumped when the tag inventory changes materially, which invalidates old
records and forces a fresh decision.
