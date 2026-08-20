# Application security

**Scope:** the Next.js application in this repository, its API routes, its integrations and
its content pipeline.
**Out of scope, and covered elsewhere:** DNS, email authentication, registrar and Cloudflare
account security (`docs/DOMAIN_SECURITY.md`); the live vulnerabilities on the legacy
WordPress site (`docs/URGENT-LEGACY-SITE.md`); deployment topology and cutover
(`docs/DEPLOYMENT.md`).

The design principle throughout: **the browser is given the least authority that still lets
the page work, and the server assumes every input is hostile.** Where a control is weaker
than ideal, it is written down here with what compensates for it, rather than left as an
unstated assumption.

---

## 1. Threat model

The realistic adversaries for this site, in order of likelihood:

1. **Fee-redirection fraudsters** targeting students and parents. Their vector is spoofed
   email (see `docs/DOMAIN_SECURITY.md`) and, secondarily, a cloned or clickjacked version of
   the payment or consultation flow.
2. **Automated scanners and lead spammers** hitting forms and any endpoint that costs money
   or sends mail.
3. **Content-borne injection** through the CMS or the WordPress import: a `javascript:` href,
   an SVG carrying script, an HTML blob pasted into rich text.
4. **Credential compromise of an editor account**, giving an attacker publishing rights.
5. **Opportunistic exploitation of a dependency** with a known CVE.

Assets worth protecting: enquiry and consultation submissions (names, contact details, and
sometimes a minor's details), payment session data, editor accounts, and the integrity of
what the site publishes. The site holds no passwords of its own and stores no card data.

---

## 2. Content Security Policy

### How it is emitted

The CSP is built and sent per request from `src/proxy.ts` (Next.js 16 renamed the middleware
convention to `proxy`). It cannot live in `next.config.ts` with the other headers because it
carries a **per-request nonce**. The nonce is a random UUID, base64 encoded, generated fresh
for every request, passed to the render through the `x-nonce` request header and set on the
response as `Content-Security-Policy`. Next.js reads `x-nonce` and stamps the nonce onto its
own inline bootstrap scripts automatically.

### The directives

| Directive | Value | Why |
|---|---|---|
| `default-src` | `'self'` | Everything not named below is same-origin only |
| `script-src` | `'self' 'nonce-…' 'strict-dynamic'` plus `js.stripe.com`, `challenges.cloudflare.com`, `www.googletagmanager.com` | Nonce-locked. See below |
| `style-src` | `'self' 'unsafe-inline'` | **Accepted risk.** See section 2.3 |
| `img-src` | `'self' data: blob: cdn.sanity.io`, Google tag and analytics hosts | Sanity is the only remote image origin. `next.config.ts` restricts the image optimiser to `cdn.sanity.io` as well |
| `font-src` | `'self' data:` | Fonts are self-hosted through `next/font`. No Google Fonts origin is needed, which is both a privacy and a performance win over the legacy site |
| `connect-src` | `'self'`, Stripe API, Sanity API and CDN hosts, Google Analytics hosts | The exact set the client is allowed to talk to |
| `frame-src` | `'self'`, Stripe, Turnstile | Only payment and bot-challenge frames |
| `media-src` | `'self' cdn.sanity.io` | |
| `worker-src` | `'self' blob:` | Next.js and Stripe use blob workers |
| `manifest-src` | `'self'` | |
| `frame-ancestors` | `'none'` | Nothing may embed this site. This is the control that stops a phishing page wrapping the real consultation or payment flow in an iframe and harvesting through it |
| `form-action` | `'self'` | A form injected into a page cannot post anywhere but back to us. Deliberately **excludes** `webto.salesforce.com`: unlike the legacy site, no form posts PII cross-origin from the browser. CRM delivery is server to server |
| `base-uri` | `'self'` | Stops an injected `<base>` re-pointing every relative URL |
| `object-src` | `'none'` | No plugins, ever |
| `upgrade-insecure-requests` | set in production only | |

### 2.2 Why `'strict-dynamic'`

`'strict-dynamic'` means: a script the browser already trusts (because it carried the nonce)
may load further scripts, and the host allowlist is ignored by browsers that understand the
keyword. This exists for Google Tag Manager, which by design loads tags whose hosts are not
knowable at build time. Without it, either every possible tag host goes in the allowlist
(which makes the policy meaningless) or `'unsafe-inline'` goes in `script-src` (which makes
it worthless).

The host list is still supplied alongside, because browsers that do not implement
`'strict-dynamic'` fall back to it. Modern browsers ignore it, older ones get a
reasonable policy.

The trade-off is real and should be understood: **a compromised or careless GTM container can
load arbitrary script**, and CSP will not stop it. The compensating controls are that GTM is
not loaded at all until analytics consent is granted, the container has a small named set of
editors, and the container inventory is reviewed as part of the pre-launch checklist in
`docs/QA.md`. If the tag inventory ever grows beyond a handful of well-understood tags, move
to server-side tagging rather than widening the policy.

### 2.3 `style-src 'unsafe-inline'`: an accepted, documented risk

Next.js injects inline `<style>` elements for critical CSS and for styled-components (which
Sanity Studio depends on) without a nonce. There is no supported way to nonce them today,
and CSP has no `'strict-dynamic'` equivalent for styles. So `style-src` carries
`'unsafe-inline'`.

**What this actually exposes.** An attacker who can already inject markup into a page could
inject a `<style>` block. That allows visual defacement, and in narrow cases CSS-based
exfiltration of already-visible attribute values through crafted selectors and background
image requests. It does **not** allow script execution, which is where account takeover,
form hijacking and payment tampering live.

**What compensates for it:**

- `script-src` remains nonce-locked with no `'unsafe-inline'`. The high-severity path stays shut.
- `img-src` and `connect-src` are allowlisted, so the endpoints a CSS-exfiltration attack
  could report to are constrained to a handful of known hosts.
- `default-src 'self'` catches directives not explicitly listed.
- The precondition (markup injection) is itself defended: React escapes by default,
  `dangerouslySetInnerHTML` is confined to JSON-LD (section 4), rich text is rendered from
  Portable Text rather than HTML (section 5), and every href passes `safeExternalHref`
  (section 6).
- `frame-ancestors 'none'` and `form-action 'self'` limit what an injected style or form
  could be paired with.

**Review trigger:** when Next.js supports nonced style injection, or when styled-components
is no longer in the dependency graph, remove `'unsafe-inline'` and retest the Studio and the
first paint of every template.

### 2.4 Dev and Studio exceptions

- In development only, `script-src` gains `'unsafe-eval'` and `connect-src` gains `ws:`/`wss:`
  for fast refresh. Both are gated on `NODE_ENV === 'development'` and never reach production.
- `/studio` is excluded from the proxy matcher. Sanity Studio is a third-party client
  application with its own bundle and its own authentication; running the site policy over it
  breaks it. It carries the static headers from `next.config.ts` and relies on Sanity's own
  session handling. Studio access control is a Sanity project setting, not an application
  setting: enforce SSO with two-factor authentication and review the member list quarterly.

### 2.5 Rollout

Deploy the policy in `Content-Security-Policy-Report-Only` on the first preview deployment,
exercise every template and every form, review the violation reports, then enforce before
the production cutover. Never enforce a newly changed policy for the first time in production.

---

## 3. Response headers

Set in `next.config.ts` for every path, so they hold regardless of what sits in front of the origin.

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Stops a browser re-interpreting a response as script based on its bytes rather than its declared type |
| `X-Frame-Options` | `DENY` | Legacy backstop for `frame-ancestors 'none'`, for agents that do not implement CSP framing controls |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Full URL same-origin, origin only cross-origin, nothing over a downgrade. Keeps consultation and enquiry page paths out of third-party referer logs |
| `Permissions-Policy` | Denies accelerometer, autoplay, camera, display capture, encrypted media, geolocation, gyroscope, magnetometer, microphone, MIDI, USB and interest cohorts. Allows `fullscreen=(self)` and `payment=(self "https://js.stripe.com" "https://checkout.stripe.com")` | The site needs none of these. `payment` is scoped to the Stripe origins so the Payment Request API works without granting it to any embedded content |
| `Cross-Origin-Opener-Policy` | `same-origin` | Severs the `window.opener` link, so a page opened from here cannot navigate this one |
| `Cross-Origin-Resource-Policy` | `same-origin` | Stops other origins loading our responses as subresources |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` (add `preload` only after a clean run) | **Applied at the edge after cutover, not before.** See `docs/DEPLOYMENT.md`. Enabling `includeSubDomains` before every subdomain serves valid HTTPS locks visitors out for the full `max-age` |
| `X-Powered-By` | removed (`poweredByHeader: false`) | No stack disclosure. The legacy site leaked `X-Redirect-By: WordPress` and generator meta tags |
| `Cache-Control` on `/api/*` | `no-store, no-cache, must-revalidate, max-age=0` | Nothing that mutates state or carries a signature may be cached, at the origin or at the edge. Cloudflare must also carry an explicit `/api/*` cache bypass rule |
| `Cache-Control` on `/_next/static/*` | `public, max-age=31536000, immutable` | Content-hashed build output |
| `X-Robots-Tag` | `noindex, follow` on search paths; `noindex, nofollow` on every non-production deployment | Set in `src/proxy.ts`, keyed on `VERCEL_ENV` |

`X-XSS-Protection` is deliberately **not** set. It is deprecated, browsers have removed it,
and its filter was itself a vulnerability source. CSP is the control.

---

## 4. Output encoding and `dangerouslySetInnerHTML`

React escapes interpolated values by default, and that default is not overridden anywhere in
the application except for one case.

**`dangerouslySetInnerHTML` is permitted only for JSON-LD structured data**, and only under
these rules:

1. The object is built in code from typed values. Editor-supplied strings may be placed into
   it as data, never as markup.
2. It is serialised with `JSON.stringify`, then every `<` character is replaced with its
   JSON escape `\u003c` before being written into the `<script type="application/ld+json">`
   element. That is what prevents a value containing a closing script tag from ending the
   block early and turning a string into executable markup. The escape is mandatory even
   when the values look safe, because they come from the CMS and the CMS is edited by people.
3. The script element carries `type="application/ld+json"`, which browsers do not execute.
4. Nothing else in the codebase uses it. Any new use is a code review blocker.

Every other rendering path uses ordinary JSX interpolation or the Portable Text renderer.

---

## 5. Rich text and content sanitisation

Content comes from Sanity as **Portable Text**, a structured array of blocks and marks, not
as an HTML string. This is the single most important content-security decision in the build:
there is no HTML parsing step, so there is no HTML injection surface. Unknown block types and
unknown marks render as nothing rather than as raw markup.

Rules enforced by `src/components/content/PortableText.tsx`:

- Marks and block styles are rendered from a fixed allowlist of components. An unrecognised
  type is skipped.
- Link marks pass through `safeExternalHref` (section 6). A link whose href is rejected
  renders as plain text, never as an anchor with a dead or dangerous href.
- External links get `rel="noopener noreferrer"` and are marked as external in the UI.
- Headings are re-levelled to keep a single `h1` per page. This matters more than it sounds:
  157 legacy pages carry structure in `<b>`/`<strong>` rather than headings, and 53 have
  heading-level jumps, so the conversion must normalise rather than trust the source.

**Migration-specific sanitisation**, applied in the import pipeline and not at render time
(see `docs/MIGRATION.md`):

- Legacy HTML is converted to Portable Text. Anything that does not map to a known block or
  mark is dropped, and dropped content is logged for editorial review rather than silently
  lost.
- Legacy named entities (`&uuml;`, `&ouml;`, `&ccedil;`, and the numeric forms) are decoded
  during conversion. 7 documents carry 205 of them and a naive converter would publish them
  as literal text.
- Inline `style` attributes and `font-weight:400` span residue are stripped.
- **The 18 legacy SVG files are not migrated as SVG.** SVG is executable XML and an inline
  SVG from the same origin is a stored-XSS vector. They are UI icons and are replaced by the
  design system's own icon set. `next.config.ts` sets `dangerouslyAllowSVG: false`, so even
  if an SVG reached the CMS it would not be served through the image optimiser.
- A third-party vendor email address published in the legacy content is stripped on import.

---

## 6. URL safety

`src/lib/links.ts` is the only sanctioned way to turn CMS data into an href.

`safeExternalHref(href)` returns the href only when it is safe, and `null` otherwise:

- Allowed protocols: `http:`, `https:`, `mailto:`, `tel:`. Everything else, including
  `javascript:`, `data:` and `vbscript:`, returns `null`.
- **Protocol-relative URLs (`//evil.example`) are rejected**, because they inherit the current
  scheme and read as internal at a glance.
- Bare paths and fragments are treated as internal and allowed.
- Anything that does not parse as an absolute URL is rejected rather than guessed at.

`resolveInternalHref()` builds internal paths from typed document references, so an internal
link is generated from the routing rules rather than copied from a legacy string. When a
reference has not been dereferenced by the GROQ query, it returns `null` and the renderer
falls back to plain text instead of emitting a broken link.

**Open redirect protection.** `src/app/api/locale/route.ts` accepts a `from` path and
redirects. It rejects anything that is not an internal absolute path: no leading `//`, no
`..` traversal, no absolute URL. The target is then rebuilt from the parsed locale and
section rather than echoed back, so the endpoint cannot be used to bounce a visitor to an
attacker's domain with a Happy Education URL in the link. Any future redirect endpoint must
follow the same pattern: parse, validate, rebuild, never echo.

---

## 7. Input validation

Every request body, query parameter and webhook payload is parsed with a **Zod** schema at
the boundary, and the parsed value, not the raw input, is what the rest of the handler uses.
`src/lib/env.ts` already applies the same discipline to environment configuration.

Rules:

- **Validate on the server even when the client validates.** Client-side validation is a
  usability feature.
- **Constrain lengths on every string.** An unbounded free-text field is a denial-of-service
  and a storage-cost problem before it is anything else.
- **Reject rather than coerce.** Use `.strict()` on object schemas so unexpected keys are an
  error, not silently carried forward.
- **Normalise before use:** trim whitespace, normalise Unicode, lowercase email addresses.
- **Never interpolate input into a GROQ query.** GROQ takes parameters; pass them as
  parameters. The typed `sanityFetch<T>(query, params, options, fallback)` wrapper makes this
  the path of least resistance.
- **Never interpolate input into a shell command, a file path or a redirect target.**
- Validation failures return a generic message plus field-level errors for the user's own
  input. They never echo back internal detail or the raw payload.

Personal data specifics: a consultation or enquiry form may capture a **minor's** details
(the boarding and summer school audience is 8 to 18). Collect the minimum, validate age
fields explicitly, and make sure the retention rules in section 12 are actually applied to
these records.

---

## 8. CSRF and origin checks

The application uses no session cookie that confers authority, which removes the classic CSRF
target. Two controls back that up:

1. **Origin verification on every state-changing route.** Reject a request whose `Origin`
   (falling back to `Referer`) is absent or is not the site's own origin. Return `403` with
   no detail.
2. **Server Actions**, where used, rely on Next.js's built-in Origin and Host comparison. If
   the deployment ever sits behind a hostname that differs from the canonical one, configure
   `serverActions.allowedOrigins` explicitly rather than loosening the check.

`SameSite=Lax` on the consent cookie means it is not sent on cross-site subrequests.

Webhook routes are the deliberate exception: they are called by third parties whose `Origin`
is not ours. They are authenticated by signature instead (section 11), and must be excluded
from origin checks, from bot challenges and from rate limiting.

---

## 9. Cookies

The application sets **one** cookie of its own.

| Cookie | Purpose | Attributes | Lifetime |
|---|---|---|---|
| `he_consent` | Records the visitor's cookie choices, versioned | `Path=/; SameSite=Lax; Secure` in production | 180 days, then the choice is asked again |

Design notes from `src/lib/consent.ts`:

- It is a **first-party cookie rather than `localStorage`** so the server can read it during
  SSR and simply not emit tag markup for a visitor who refused. A refused visitor never
  downloads the tag at all, rather than downloading it and asking it to behave.
- It is deliberately **not `HttpOnly`**: the client script must read it to decide whether to
  inject tags. It contains no identifier and no personal data, only three booleans, a version
  and a timestamp, so script readability costs nothing.
- Categories are `essential`, `analytics`, `marketing`. Nothing outside `essential` runs
  before an explicit choice. No category is pre-ticked.
- Accept, Reject and Manage are equally prominent on the first layer, which is what UK GDPR
  requires: refusing must be as easy as accepting.
- The choice is re-openable from the footer on every page.
- `CONSENT_VERSION` is bumped when the tag inventory changes materially, which invalidates
  stored records and forces a fresh decision.
- The stored timestamp is the record of consent.

Third-party cookies (Google, Stripe, Cloudflare Turnstile) are set only by those parties, only
after consent where they are non-essential, and are inventoried in the cookie policy. Stripe
and Turnstile are treated as strictly necessary for the flows that use them and are loaded
only on those flows, not site-wide.

---

## 10. Abuse controls

### Rate limiting

Applied per route at the application layer, and again at the edge (see `docs/DOMAIN_SECURITY.md`
section 6). Two layers, because the edge rule protects the origin from volume and the
application rule protects the integration from cost.

| Route class | Budget | Response when exceeded |
|---|---|---|
| Form submission (`/api/enquiry`, `/api/consultation`, `/api/appointment`) | 5 per minute, 20 per hour per IP | `429` with `Retry-After`, generic message |
| Payment session creation | 10 per minute per IP | `429` |
| Locale switch | 60 per minute per IP | `429` |
| Search | 30 per minute per IP | `429` |
| Webhooks | **not rate limited** | Authenticated by signature instead |

Key on `CF-Connecting-IP` when Cloudflare is in front (the header can be trusted only because
Cloudflare terminates the connection and overwrites it), falling back to the platform's
forwarded-for value. Never key on a client-supplied identifier alone. Counters are best-effort:
if the counter store is unavailable, fail closed on the expensive routes (payment, email, CRM)
and fail open on the cheap ones (search, locale), so an infrastructure blip degrades the
experience rather than the protection.

### Bot controls

- **Cloudflare Turnstile** on every public form. Verified **server side** against the Turnstile
  verify API before any side effect. A client-side token that is not verified server side is
  decoration.
- Verification is one-shot: a token is consumed once and never re-accepted.
- **Graceful degradation:** `isConfigured.turnstile()` is checked first. If keys are absent,
  the form still works and the widget is not rendered, so a clean checkout runs and a
  misconfigured deployment does not silently accept unprotected submissions in production.
  Production configuration is a launch gate in `docs/QA.md`.
- A **honeypot field** plus a minimum submit time (a human does not complete a form in under
  two seconds) catches unsophisticated bots without any third-party dependency.
- No form posts cross-origin from the browser. This is a direct correction of the legacy
  Salesforce Web-to-Lead form, which posted student names, emails and phone numbers straight
  to `webto.salesforce.com` with no CAPTCHA and no consent gate. CRM delivery now goes
  server to server with a scoped credential, behind `isConfigured.crm()`.

### Uploads

**The public application accepts no file uploads.** There is no upload endpoint, no public
write path into the CMS and no user-generated media. Assets are added by authenticated
editors through Sanity Studio, where Sanity enforces its own type and size handling, and are
served from `cdn.sanity.io`, which is the only remote host allowed by `next.config.ts` and by
`img-src`. If a document upload feature is ever required (a passport scan for an application,
for instance), it must be designed separately: private storage, server-side type sniffing
rather than trusting the declared type or extension, no execution path, no public URL, an
explicit retention rule, and a data protection impact assessment because of the data class.

---

## 11. Secrets and webhook verification

### Secret management

- Secrets are read **only** through `serverEnv()`, which throws if it is called in the browser.
  That turns an accidental leak into an immediate, obvious failure instead of a silent one.
- **No secret is ever prefixed `NEXT_PUBLIC_`.** Anything with that prefix is inlined into the
  client bundle at build time and is public by definition. The public set is enumerated
  explicitly in `src/lib/env.ts`: site URL, Sanity project ID and dataset, API version, GTM
  container ID, Turnstile **site** key, Stripe **publishable** key. Everything else is server side.
- Secrets live in the Vercel environment variable store, scoped per environment. They are never
  committed, never pasted into Sanity, never sent to a browser and never logged.
- `.env.local` is git-ignored. `.env.example` carries names and dummy values only.
- **Rotation:** on personnel change, on suspected exposure, and on a routine annual cycle.
  Rotate Sanity tokens, the Stripe secret and webhook secrets, the email API key, the Turnstile
  secret and any CRM token. Record the rotation date in the deployment log.
- **Least privilege:** the Sanity read token is read-only and used only for draft preview. No
  application code holds a Sanity write token. The CRM credential is scoped to lead creation.

### Webhook signature verification

Both inbound webhooks are authenticated cryptographically, because their URLs are guessable
and their side effects matter.

**Stripe** (`/api/webhooks/stripe`):
- Read the **raw request body**. Parsing to JSON first breaks the signature.
- Verify with `stripe.webhooks.constructEvent(rawBody, signatureHeader, STRIPE_WEBHOOK_SECRET)`,
  which performs a timing-safe comparison and enforces the timestamp tolerance that defeats replay.
- Reject with `400` on any verification failure, and log the failure without the body.
- **Handle idempotently.** Stripe retries. Record the processed event ID and make a repeat a
  no-op, so a retry cannot double-send a receipt or double-record a payment.
- Return `2xx` quickly and do slow work after acknowledging, so Stripe does not retry a
  request that actually succeeded.
- Never trust amounts or currency from the client. The authoritative values come from the
  verified event.

**Sanity revalidation** (`/api/webhooks/sanity`):
- Verify the signature using `SANITY_REVALIDATE_SECRET` (minimum 16 characters, enforced by
  the env schema) with a **timing-safe comparison**, not `===`.
- Validate the payload shape with Zod before using any field.
- Revalidate only the specific cache tags implied by the document type and ID. Never accept
  a caller-supplied tag or path, or the endpoint becomes a cache-flush denial-of-service.
- Reject with `401` on failure, with no detail about why.

Both routes carry `Cache-Control: no-store` from `next.config.ts` and must be excluded from
Cloudflare's WAF challenge, bot protection and rate limiting.

---

## 12. Logging, redaction and retention

**What is logged:** request method, path, status, duration, a request identifier, and error
type and message. Enough to debug and to notice an attack.

**What is never logged:** names, email addresses, phone numbers, message bodies, form payloads,
GROQ query parameters (they can contain visitor input, which is why `sanityFetch` logs only the
error message), any token, key, signature or cookie value, and full request bodies from any
route. Redaction is applied at the logging helper, not left to each call site, because the call
site is where it gets forgotten.

**Where logs go:** the platform log sink (stderr, collected by Vercel). **Nothing is ever
written to a file under a public path.** The legacy site served a 16.28 MB `debug.log` on the
open internet, disclosing the absolute server path, the database name and the table prefix.
That class of mistake is structurally impossible here: there is no writable web root.

**Retention:**

| Data | Retention | Notes |
|---|---|---|
| Application logs | 30 days | Platform default; extend only with a stated reason |
| Enquiry and consultation submissions | Per the privacy notice, and no longer. Set a definite period, apply it, and make sure someone actually deletes | Records may relate to a minor. Do not keep them indefinitely because deletion is inconvenient |
| Payment records | As required by UK tax and accounting rules | Card data is never held: Stripe holds it |
| Consent records | 180 days, matching the cookie lifetime | The timestamp is the proof of consent |
| DMARC aggregate reports | Per the processor's settings, typically 12 months | See `docs/DOMAIN_SECURITY.md` |

**Data subject rights:** UK GDPR requires the ability to find, export and delete an
individual's records within one month. If enquiry data lands in a CRM, the deletion path must
cover the CRM too, not only the mailbox. Document who runs that process.

---

## 13. Monitoring

| Signal | Where | Alert on |
|---|---|---|
| Deployment failures and build errors | Vercel | Any production build failure |
| Server errors | Vercel logs | `5xx` rate above the baseline, any unhandled exception |
| CSP violations | The report endpoint, if enabled | A new violation source, which usually means a tag changed |
| Rate limit hits | Application logs | A sustained rise, which usually means an attack or a broken client |
| Webhook signature failures | Application logs | **Any** occurrence. This is either a misconfiguration or someone probing |
| Failed Turnstile verifications | Application logs | A spike |
| WAF blocks and bot challenges | Cloudflare | A spike, or a rule newly firing on legitimate form traffic |
| Certificate expiry | Cloudflare and Vercel | 30 days before expiry |
| Domain expiry | Registrar | 60 days before expiry (09 July 2027) |
| DMARC aggregate reports | Report processor | A new unauthenticated source sending as the domain |
| Uptime | External monitor | Two consecutive failures on the homepage in each locale |

Keep the alert list short enough that every alert is read. An alert nobody reads is worse than
no alert, because it creates a false belief that something is being watched.

---

## 14. Dependencies

- **Pinned exact versions** in `package.json`, with `package-lock.json` committed. No range
  specifiers, so a build is reproducible and a transitive change is visible in a diff.
- `npm audit` runs in CI. **High and critical findings block the merge.** Moderate findings get
  a ticket with a date.
- Dependency update pull requests are reviewed like any other change and must pass the full
  check set in `docs/QA.md`.
- **Keep the dependency count low.** The current runtime set is small and deliberate: Next,
  React, the Sanity client, Stripe, Zod. Every addition is a permanent patch obligation. The
  legacy site's core problem was not that WordPress is insecure, it is that seven-plus plugins
  each carried their own vulnerability schedule and one of them shipped an unauthenticated RCE.
- Node version is pinned in `engines` (>= 22.11.0) and matched by the Vercel runtime setting.
- Before launch and quarterly after, review the dependency tree for packages that are
  unmaintained or have changed ownership.

---

## 15. Incident response

**Roles.** Name a single incident lead before you need one. The lead decides, communicates and
records; everyone else executes. For this project the lead is the client's nominated contact,
with the build team on technical support.

**Severity.**

| Level | Meaning | Response |
|---|---|---|
| **S1** | Personal data exposed, payments affected, site serving attacker content, or the domain being used to defraud students | Immediate. Consider ICO notification (72 hours) and direct notification of affected people |
| **S2** | Exploitable vulnerability confirmed, no evidence of exploitation | Same day |
| **S3** | Degraded security control (a header missing, a rate limit misconfigured) | Next working day |
| **S4** | Hygiene | Next planned release |

**Sequence.**

1. **Record the time and what was observed.** Start a timeline document immediately, and keep
   appending to it. Reconstructing this afterwards is always harder than it sounds.
2. **Contain.** Roll back the deployment (`docs/DEPLOYMENT.md`), or take the affected route out
   of service. Preserve logs before anything is deleted.
3. **Assess.** What data, whose data, over what window. Be honest about what you cannot
   determine, and say so.
4. **Eradicate.** Fix the cause, not only the symptom. Rotate every credential that could
   plausibly have been exposed, not only the one you know was.
5. **Recover.** Redeploy from a known-good commit. Verify with the post-cutover checklist.
6. **Notify.** If personal data is involved, the ICO clock is 72 hours from awareness. If
   students or parents could be defrauded, tell them by a channel that is not the compromised
   one, and tell them early. For anything involving spoofed email or payment instructions,
   telephone contact beats an email that people have every reason to distrust.
7. **Review.** Write up what happened, what the control gap was, and what changes. Add a
   regression test or a checklist item so the same gap cannot reopen quietly.

**Contacts to have written down in advance:** the incident lead; the domain and DNS
administrator; the Vercel, Sanity, Stripe and Cloudflare account owners; the payment provider's
support route; the data protection contact; and the ICO reporting URL. Keep this list somewhere
that is still reachable when the site and the company mailbox are not.

---

## 16. Legacy WordPress exposures against the new platform

All legacy findings below were measured on 20 August 2026 and independently re-verified.
This table is what the rebuild actually changes. Note the ordering point in section 17.

| # | Legacy exposure (measured) | New platform |
|---|---|---|
| 1 | **Zero security response headers.** No CSP, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` or `Permissions-Policy` on any response | All present from day one. Nonce-based CSP with `strict-dynamic`, `frame-ancestors 'none'`, `form-action 'self'`, plus the full header set in section 3 |
| 2 | **`/wp-json/wp/v2/users` returns the admin account.** Sole author is literally named `root`, also exposed via `/?author=1` redirecting to `/author/root/`. `/wp-login.php` open, no 2FA, no login rate limiting | No user enumeration endpoint exists and no self-hosted login exists. Editors authenticate to Sanity Studio, which is a separate hosted service. SSO with enforced two-factor is a launch requirement |
| 3 | **`/wp-content/debug.log` publicly readable, 16,284,513 bytes.** Discloses the absolute server path `/homepages/14/d83506371/htdocs/happyeducation`, the database name `dbs12430642` and the table prefix `vys_`. `WP_DEBUG_LOG` was on in production | No writable web root. Structured logs go to the platform sink with the redaction policy in section 12. There is no path under which a log could be served |
| 4 | **Per-plugin `readme.txt` readable**, disclosing the exact version of every plugin including premium ones with no `?ver=` string. This is how an external reviewer found the RCE with one unauthenticated request. Also `/readme.html` (7,407 B) and `/license.txt` (19,903 B) | No plugin model, no version-disclosure files, no `X-Powered-By`, no generator meta. Dependencies are pinned in a lockfile and audited in CI |
| 5 | **Salesforce Web-to-Lead form posting PII cross-origin with no CAPTCHA.** `POST https://webto.salesforce.com/servlet/servlet.WebToLead` with the org ID in a hidden field, linked as "APPLY NOW" from at least six university pages. No bot protection, no consent gate | Forms post to our own API route. Server-side Zod validation, Turnstile verified server side, honeypot, rate limits, then server-to-server CRM delivery with a scoped credential. `form-action 'self'` makes the cross-origin post impossible even if markup were injected |
| 6 | **Unauthenticated RCE, CVSS 9.8** (CVE-2026-14900, Cost Calculator Builder PRO 4.0.3), with the required nonce published in the homepage HTML. A form parameter reaches PHP `eval()` | No server-side templating language in the request path, no `eval` equivalent, and every input parsed by a Zod schema before use |
| 7 | **`wp-cron.php` publicly hittable**, forcing PHP execution on every unauthenticated request | No equivalent endpoint. Scheduled work, where needed, runs as a platform cron with an authenticated handler |
| 8 | **18 SVG files in the media library**, served from the site origin. SVG is executable XML | SVG is not migrated. `dangerouslyAllowSVG: false`. Icons come from the design system |
| 9 | **Outdated theme and plugins.** CourseLog 1.3.9 against a latest of 1.4.2, and that release is only tested to WordPress 6.8 while the site runs 7.1. ElementsKit a major version behind, MetForm behind, Elementor three patches behind, CookieYes behind | No themes. Small pinned dependency set, CI audit, blocking policy for high and critical findings |
| 10 | **Cloudflare not in front.** Nameservers are IONOS, origin IP directly exposed, no WAF, no edge rate limiting, no bot management | Cloudflare in front of Vercel with managed WAF rules, bot protection, targeted `/api/*` rate limits and an explicit `/api/*` cache bypass |
| 11 | **No HSTS**, so the HTTP to HTTPS redirect is strippable on a hostile network. No `frame-ancestors`, so the site can be framed into a phishing page | HSTS after cutover verification, `frame-ancestors 'none'` and `X-Frame-Options: DENY` from day one |
| 12 | **Tracking loads regardless of consent state** (GTM, Google Ads and Meta Pixel present in the homepage markup; consent gating unverified) | Nothing beyond essential runs before an explicit choice. The server reads the consent cookie during SSR and does not emit tag markup for a visitor who refused. Google Consent Mode v2 signals are mapped from the same record |

---

## 17. Residual risks and open items

Written down rather than left implicit.

| Risk | Status | Mitigation or next step |
|---|---|---|
| `style-src 'unsafe-inline'` | **Accepted** | Section 2.3. Review when Next.js supports nonced styles |
| `'strict-dynamic'` trusts whatever GTM loads | **Accepted** | Consent-gated, small container, reviewed tag inventory. Move to server-side tagging if the inventory grows |
| Sanity Studio is outside the site CSP | **Accepted** | Third-party application with its own auth. Compensate with SSO, enforced 2FA and quarterly member review |
| Editor account compromise could publish attacker content | **Open** | 2FA, least-privilege roles, and the fact that Portable Text renders no raw HTML limits the damage to text and links |
| Legacy host may already be compromised | **Open, urgent** | Content scanning cannot clear it. File-integrity check required. See `docs/URGENT-LEGACY-SITE.md` |
| Domain remains spoofable until DMARC enforcement | **Open, urgent** | The twelve-week rollout in `docs/DOMAIN_SECURITY.md`. Interim advisory to students and parents from day 0 |
| Third-party image and stock licences unverified | **Open** | Licence-clearance gate in `docs/MIGRATION.md`. Legal exposure rather than security, but it blocks launch the same way |

**The ordering point.** Items 1 to 12 in section 16 are real improvements, and none of them
arrives until the new platform is deployed. The RCE, the readable debug log and the spoofable
domain are live **today**. Fix the legacy site and the DNS first; ship the rebuild second.
