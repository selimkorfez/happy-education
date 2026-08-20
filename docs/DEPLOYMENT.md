# Deployment and cutover

**Scope:** hosting topology, environments, configuration, webhooks, the DNS cutover, rollback
and disaster recovery.
**Related:** DNS, WAF and email records in `docs/DOMAIN_SECURITY.md`; application controls in
`docs/SECURITY.md`; content readiness in `docs/MIGRATION.md`; the launch checklist in
`docs/QA.md`.

---

## 1. Topology

```
                    ┌──────────────────────────────────────────┐
   Visitor  ──────► │  Cloudflare (proxied, orange cloud)       │
                    │  DNS · TLS termination · WAF · bot rules  │
                    │  rate limits · static asset cache         │
                    └───────────────────┬──────────────────────┘
                                        │  Full (strict) TLS
                    ┌───────────────────▼──────────────────────┐
                    │  Vercel                                   │
                    │  Next.js 16 app · ISR and cache tags      │
                    │  API routes · image optimiser             │
                    │  owns the HTML cache                      │
                    └──────┬─────────────────────┬──────────────┘
                           │                     │
              ┌────────────▼─────────┐   ┌───────▼──────────────┐
              │  Sanity (hosted CMS) │   │  Stripe · email      │
              │  content + assets    │   │  Turnstile · CRM     │
              │  cdn.sanity.io       │   │                      │
              └──────────┬───────────┘   └──────────────────────┘
                         │  publish webhook
                         └────────────────► /api/webhooks/sanity  (revalidate by tag)
```

Mail is **not** in this path. `MX` records point at IONOS and must never be proxied through
Cloudflare. See `docs/DOMAIN_SECURITY.md`.

---

## 2. Cloudflare and Vercel: how they interact without double-caching

This is the part that goes wrong quietly, so it is stated as a rule rather than a preference.

> **Vercel owns the HTML cache. Cloudflare caches static assets only and never HTML.**

### Why

Next.js incremental static regeneration and cache tags are the invalidation mechanism. When an
editor publishes, the Sanity webhook revalidates the affected tags and Vercel serves fresh HTML
on the next request. If Cloudflare is also caching HTML, it holds a copy that Vercel's
invalidation cannot reach, so the published change is invisible until the Cloudflare entry
expires. The usual symptom is "the site is stale for some people and not others", followed by
someone disabling caching entirely and losing the performance instead.

The second failure mode is worse: a "Cache Everything" rule that catches a personalised or
state-carrying response and serves one visitor's response to another.

### Required Cloudflare settings

| Setting | Value | Why |
|---|---|---|
| Caching level | Standard | Caches by file extension. HTML is not cached by default, which is the behaviour we want |
| **"Cache Everything" page or cache rules** | **Not used for HTML** | This is the setting that creates the double cache |
| Browser Cache TTL | **Respect Existing Headers** | Vercel already sends correct `Cache-Control` per route. Overriding it breaks both the immutable asset policy and the no-store API policy |
| Cache rule: `/api/*` | **Bypass cache**, placed first | Belt and braces on top of the origin's `no-store`. A cached API response is a data leak, not a performance issue |
| Cache rule: `/_next/static/*` | Cache, edge TTL long | Content-hashed and immutable. Safe to cache hard |
| Auto Minify (HTML, CSS, JS) | **Off** | Rewrites markup and breaks the nonce-based CSP |
| Rocket Loader | **Off** | Rewrites and defers script. Breaks nonces and consent-gated tag loading |
| Mirage / Polish | Off | The image optimiser already handles this, and Polish would re-encode optimised output |
| Always Online | **Off** | It would serve an archived copy of the site, and the archive it holds may predate the migration |
| SSL/TLS mode | **Full (strict)** | Anything less leaves the Cloudflare-to-Vercel hop unauthenticated |
| Minimum TLS | 1.2, with 1.3 enabled | |
| Always Use HTTPS | On | |
| HSTS | **Off until cutover is verified.** See section 8 | |
| WebSockets | Off | Not used |
| Development Mode | Off in production (it bypasses cache entirely and expires after 3 hours) | |

### If HTML caching at the edge is ever wanted

Only with a cache-purge step wired into the deploy and into the Sanity webhook, so that
publishing purges Cloudflare as well as revalidating Vercel. Until that exists, do not enable it.
The performance gain over Vercel's own edge network is small; the staleness risk is not.

### Vercel settings

- Framework preset Next.js, Node 22 runtime (matching `engines` in `package.json`).
- Production branch `main`. Every other branch produces a preview deployment.
- Deployment Protection on preview deployments.
- `Skew Protection` enabled, so a client that loaded an old build keeps talking to that build
  during a deploy rather than hitting mismatched assets.
- Custom domain: `happyeducation.uk` as the primary, `www.happyeducation.uk` redirecting to it.

---

## 3. Environments

| | Development | Preview | Production |
|---|---|---|---|
| Host | Local | Vercel preview URL | `happyeducation.uk` |
| Sanity dataset | `development` | `production` (read-only usage) | `production` |
| Stripe | Test keys | Test keys | Live keys |
| Email | Disabled or a sandbox sender | Sandbox sender only | Live sender |
| CRM | Disabled | Disabled | Live |
| Turnstile | Disabled or test keys | Test keys | Live keys |
| Analytics | Disabled | Disabled | Live GTM container |
| Indexing | n/a | `noindex, nofollow` header, set by `src/proxy.ts` on any `VERCEL_ENV` other than production | Indexable |

Preview deployments must never send real email, never charge a real card and never write to the
CRM. The `isConfigured` checks in `src/lib/env.ts` make "not configured" a safe state rather than
a crash, so the correct way to disable an integration in an environment is to leave its variables
unset.

### Environment variables

Public values (inlined into the client bundle, safe by definition):

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Defaults to `https://happyeducation.uk` | Must match the deployed origin per environment, or canonicals and sitemaps will be wrong |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | For content | Without it the site renders empty states rather than failing |
| `NEXT_PUBLIC_SANITY_DATASET` | Defaults to `production` | |
| `NEXT_PUBLIC_SANITY_API_VERSION` | Defaults to a pinned date | Pinned deliberately. Do not float it |
| `NEXT_PUBLIC_GTM_ID` | Production only | Format-checked. Analytics is off without it |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Production | Paired with the secret below |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production | Must start `pk_` |

Server secrets (never `NEXT_PUBLIC_`, never in the repository, never in Sanity):

| Variable | Purpose |
|---|---|
| `SANITY_API_READ_TOKEN` | Draft preview only. Read-only scope |
| `SANITY_REVALIDATE_SECRET` | Webhook signature. Minimum 16 characters, enforced by the schema |
| `SANITY_PREVIEW_SECRET` | Draft-mode entry. Minimum 16 characters |
| `STRIPE_SECRET_KEY` | Must start `sk_`. Live key in production only |
| `STRIPE_WEBHOOK_SECRET` | Must start `whsec_`. **Different per endpoint**, so test and live differ |
| `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_ENQUIRY_RECIPIENT` | Transactional email |
| `TURNSTILE_SECRET_KEY` | Server-side token verification |
| `CRM_WEBHOOK_URL`, `CRM_API_TOKEN` | Optional CRM delivery |

`src/lib/env.ts` validates all of these at startup and fails loudly on a malformed value. A
missing optional value is not an error: the feature simply reports itself unconfigured.

**Sending domain note.** `EMAIL_FROM` must be a domain that is authenticated for DKIM and covered
by SPF before it sends anything real. Adding a new transactional sender is a change to the sender
inventory in `docs/DOMAIN_SECURITY.md` section 2, not a deployment detail. Introducing an
unauthenticated sender mid-rollout is exactly what breaks a DMARC ramp.

---

## 4. Preview deployments

- Every pull request gets a preview URL. The full check set from `docs/QA.md` runs against it.
- Previews are `noindex, nofollow` at the header level and behind Vercel Deployment Protection.
- Previews read the production dataset so reviewers see real content, but hold no live payment,
  email or CRM credentials.
- **Sanity draft preview** runs through the draft-mode route, authenticated with
  `SANITY_PREVIEW_SECRET`, using the draft-aware client. Draft mode is per-visitor and never
  cached (`revalidate: 0`), so an editor sees unpublished work without it leaking into anyone
  else's page.
- Share preview URLs with the client for content sign-off. That is what they are for.

---

## 5. Sanity webhook: on-demand revalidation

Configured in the Sanity project, not in code.

| Field | Value |
|---|---|
| URL | `https://happyeducation.uk/api/webhooks/sanity` |
| Trigger | Create, update, delete |
| Filter | The document types that appear on public pages |
| Projection | `{ _id, _type, "slug": slug.current, locale, "translationOf": translationOf._ref }` |
| Secret | `SANITY_REVALIDATE_SECRET` |
| HTTP method | POST |

Handler behaviour (see `docs/SECURITY.md` section 11):

1. Verify the signature with a timing-safe comparison. Reject with 401 on failure, with no detail.
2. Parse the payload with Zod.
3. Revalidate the tags implied by the document type and ID: the document itself, its section
   index, the locale home if it is featured, and **its linked translation**, because publishing a
   Turkish page changes the English page's hreflang set.
4. Never accept a caller-supplied tag or path.
5. Return 200 quickly.

Verify after configuring: publish a trivial change and confirm the live page updates within
seconds without a redeploy. If it does not, the usual causes are a missing tag on the fetch, a
Cloudflare HTML cache entry (section 2), or a webhook filter that excludes the type.

---

## 6. Stripe webhook

Registered in the Stripe dashboard, twice: once in test mode pointing at a preview or staging URL,
once in live mode pointing at production. **Each endpoint has its own signing secret**, so
`STRIPE_WEBHOOK_SECRET` differs per environment. Using the test secret in production is a common
and confusing failure: every event fails verification and every payment appears to succeed at the
checkout while nothing happens afterwards.

| Field | Value |
|---|---|
| URL | `https://happyeducation.uk/api/webhooks/stripe` |
| Events | Only what is handled. Start with `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded` |
| API version | Pin it, and pin the same version in the SDK configuration |

Requirements: raw body, `constructEvent` verification, idempotent handling keyed on the event ID,
fast 2xx acknowledgement with slow work deferred, and no rate limit, bot challenge or WAF rule in
front of the endpoint. Test with the Stripe CLI (`stripe listen --forward-to`) before going live,
and use the dashboard's "Send test webhook" against production after cutover to confirm a 200.

---

## 7. DNS cutover

The domain is not changing, so this is a hosting change. There is no domain-authority reset, and
no Change of Address filing (see `docs/SEO.md` section 13).

### Lower the TTLs first

**At least 48 hours before cutover**, lower the TTL on the records that will change (`A`, `AAAA`,
`CNAME` for apex and `www`) to **300 seconds**. Do not touch `MX`, `TXT` or any mail record. A
record with a 24-hour TTL cannot be rolled back quickly, which turns a small problem into a
day-long one.

Raise the TTLs back to a normal value (one hour or more) about a week after a clean cutover.

### The change

1. Add both domains in Vercel (`happyeducation.uk` and `www.happyeducation.uk`) and complete
   Vercel's verification **before** the cutover. Verification can be done while the old site is
   still live.
2. In Cloudflare DNS, point the apex and `www` at Vercel as Vercel instructs, with the proxy
   (orange cloud) enabled. Leave `MX`, SPF, DKIM, DMARC, the Google site verification TXT and any
   other verification record untouched.
3. Confirm resolution from several networks and resolvers before announcing anything.

```bash
dig +short happyeducation.uk A
dig +short www.happyeducation.uk CNAME
curl -sI https://happyeducation.uk | head -20
curl -sI https://www.happyeducation.uk | head -5   # expect a redirect to the apex
```

### TLS verification

- Confirm Cloudflare has issued an edge certificate covering both the apex and `www`, and that
  Vercel has issued its own certificate for the origin (required for Full (strict)).
- Confirm `https://` works on both hostnames with no warning, and that `http://` redirects.
- Check the certificate chain and expiry, and confirm auto-renewal is on.
- Check any other subdomain that exists. This matters for the HSTS decision below.

---

## 8. HSTS, only after verification

Do not enable HSTS before the cutover is verified. `Strict-Transport-Security` is a one-way door
for the length of its `max-age`: a browser that has seen it will refuse to reach the host over
HTTP at all, and with `includeSubDomains` it applies that to every subdomain, including ones that
may not serve valid HTTPS yet.

Staged rollout:

1. **After cutover verification**, enable with a short max-age and no subdomains:
   `max-age=300`.
2. **After 24 hours clean**, raise to `max-age=86400`.
3. **After a week clean, and only once every subdomain serves valid HTTPS**, move to
   `max-age=63072000; includeSubDomains`.
4. **Preload last, and only deliberately.** Adding `preload` and submitting to the preload list is
   effectively irreversible on a human timescale: removal takes months to propagate. Do it only
   when there is certainty that no subdomain will ever need plain HTTP, including any MTA-STS
   policy host.

---

## 9. Cutover checklists

### Pre-cutover (the week before)

**Content and editorial**
- [ ] All KEEP, REWRITE and MERGE content published in both trees, or the English tree's scope
      is explicitly agreed and its pages exist
- [ ] Re-verification queue cleared or the gated items unpublished (`docs/MIGRATION.md` section 12)
- [ ] Every image has alt text and a recorded licence basis
- [ ] Legal pages published and reviewed
- [ ] The four legacy PDFs re-hosted

**Technical**
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run test`, `npm run build` all clean
- [ ] Full `docs/QA.md` checklist signed off on a preview deployment
- [ ] Production environment variables set and verified, live keys in place
- [ ] `NEXT_PUBLIC_SITE_URL` is the production origin
- [ ] Redirect map loaded and validated: every row in `redirects.csv`, one hop, correct status
- [ ] `robots.txt` is the production version. Check this twice; it is one line and it can undo the launch
- [ ] Sitemap generates and its URL count reconciles with published documents per type and locale
- [ ] CSP verified in report-only mode across every template, then enforced
- [ ] Sanity webhook configured and tested
- [ ] Stripe live webhook registered and returning 200
- [ ] Cloudflare configured per section 2, WAF reviewed in log mode and switched to enforce
- [ ] `/api/*` cache bypass rule in place and first in order
- [ ] TTLs lowered to 300 seconds at least 48 hours ahead
- [ ] Search Console and Bing properties verified, 16-month baseline exported
- [ ] **Final WordPress backup taken and verified restorable** (section 12)
- [ ] Rollback procedure rehearsed, not merely written

**People**
- [ ] Cutover window agreed, avoiding a Friday and avoiding peak enquiry season
- [ ] Named owner on call for 24 hours afterwards
- [ ] Client informed, with a phone number that works if email does not

### Cutover day

1. Freeze content edits on both the old and the new system.
2. Take a final Sanity dataset export.
3. Take the final WordPress backup, if it was not taken the day before.
4. Deploy production and confirm the deployment is healthy on the Vercel URL.
5. Switch DNS (section 7).
6. Watch resolution propagate. Confirm from multiple networks.
7. Verify TLS on the apex and `www`.
8. Run the smoke test below.
9. Submit the sitemap in Search Console and Bing.
10. Enable HSTS at step 1 of section 8.
11. Announce.

**Smoke test, in order**
- [ ] `/` redirects by language and lands on a locale home
- [ ] Both locale homes render
- [ ] One page of every template type in both locales
- [ ] Language switch from a deep page lands on the equivalent page, not the homepage
- [ ] Navigation and footer links all resolve
- [ ] Search returns results
- [ ] Enquiry form submits, Turnstile verifies, the notification email arrives, the CRM record appears
- [ ] Consultation booking completes
- [ ] A test payment completes and the Stripe webhook returns 200
- [ ] Cookie banner appears, Reject genuinely blocks tags, the choice persists
- [ ] Ten sampled legacy URLs redirect correctly, including one legacy alias and one currently-404 target
- [ ] `robots.txt` and `sitemap.xml` are correct
- [ ] Security headers present on a real response (`curl -sI`)
- [ ] No console errors, no CSP violations

### Post-cutover

**First hour**
- [ ] Error rate at baseline
- [ ] Cloudflare analytics show traffic reaching the origin
- [ ] No WAF rule blocking legitimate form submissions

**First 24 hours**
- [ ] Search Console URL Inspection on both locale homes and the top five money pages
- [ ] Enquiry submissions arriving and being read by a human
- [ ] Payment flow exercised once more end to end
- [ ] Raise HSTS to stage 2

**First week**
- [ ] Daily Search Console coverage review. "Page with redirect" rising is expected and healthy
- [ ] Full redirect map re-crawled against the live site
- [ ] Core Web Vitals field data starting to arrive
- [ ] Raise TTLs back to normal
- [ ] HSTS to stage 3 once every subdomain is confirmed
- [ ] **Take the old WordPress site offline** (section 12)

**First month**
- [ ] Traffic compared against the exported baseline
- [ ] Internal links audited so none points at a redirect
- [ ] Rate limit and WAF thresholds tuned against real traffic
- [ ] Post-launch review written up

---

## 10. Monitoring

Configured before cutover, not after. See `docs/SECURITY.md` section 13 for the security signals;
the operational ones are:

| Signal | Source | Alert |
|---|---|---|
| Uptime, both locale homes | External monitor, 1-minute interval | Two consecutive failures |
| 5xx rate | Vercel | Above baseline for 5 minutes |
| Build and deploy failures | Vercel | Any production failure |
| Function duration and error rate | Vercel | Regression against the previous week |
| Webhook delivery failures | Stripe and Sanity dashboards | Any repeated failure |
| Form submission volume | Application logs | A drop to zero, which usually means something silently broke |
| Certificate expiry | Cloudflare and Vercel | 30 days out |
| Core Web Vitals | Field data | Monthly against the budgets in `docs/QA.md` |

The form-volume alert deserves particular attention. A broken enquiry form produces no errors and
no alerts; it produces silence, and silence is indistinguishable from a quiet week until someone
notices the pipeline is empty.

---

## 11. Rollback

| Situation | Action | Time |
|---|---|---|
| Bad deploy, DNS already cut over | Promote the previous deployment in Vercel (instant rollback) | Under 2 minutes |
| Bad content publish | Revert the document in Sanity history and let the webhook revalidate | Under 5 minutes |
| Bad configuration (env var, header, redirect) | Fix and redeploy, or roll back the deployment | Under 10 minutes |
| Something fundamentally wrong with the new platform, within the TTL window | Point DNS back at the WordPress origin | 5 to 15 minutes, given the 300-second TTL |
| Same, after the old site is decommissioned | **No DNS rollback exists.** Roll forward | Hours |

**This is why the old site stays running, and unchanged, for at least a week after cutover, and
why TTLs are lowered in advance.** It is also why the decommissioning step in section 12 is a
deliberate, scheduled action rather than something that happens by neglect.

Rollback decision rule: roll back on anything affecting payments, form submission or site-wide
availability. Roll forward on cosmetic or single-page problems. Announce the decision, do not
debate it in the middle of an incident.

---

## 12. The old WordPress site

**Take a final, verified backup first.**

- Full database dump and full `wp-content` archive.
- Verify the backup restores. An unverified backup is a hope, not a backup.
- Store it in the client's own storage, encrypted, with a stated retention period. Not on the web
  host, and not in this repository.
- Capture everything in `docs/MIGRATION.md` section 10 at the same time: the media library at full
  resolution including the 324 orphaned items, the four live PDFs, the legacy sitemaps and
  `robots.txt`, and a crawl of the live site as a before-state.
- **Do not archive `debug.log`.** Delete it. If any credential is found anywhere in the export,
  treat it as an incident and rotate it.

**Then take the site off the public internet, within a week of cutover.**

This is not tidiness. The legacy install carries an unauthenticated remote code execution
vulnerability with the exploitation precondition satisfied on its homepage, a publicly readable
16.28 MB debug log disclosing the server path, database name and table prefix, a published admin
username on an open login page, and per-plugin `readme.txt` files that disclose the exact version
of everything installed. Leaving it reachable "just in case" leaves a live, exploitable host on a
domain that is being used to phish the company's own students. See `docs/URGENT-LEGACY-SITE.md`.

Acceptable end states, in order of preference: delete the hosting account after the backup is
verified; or restrict the origin to an allowlist of office IPs while the backup is verified, then
delete. Not acceptable: leaving it publicly reachable, or leaving it up with a "we have moved"
page still running WordPress.

Also clean up: remove any DNS record that pointed only at the old host, cancel any WordPress
plugin licence renewals, and revoke third-party access (former agency logins, the Salesforce
Web-to-Lead form, any plugin API key).

---

## 13. Backup and disaster recovery

| Asset | Backup | Frequency | Recovery |
|---|---|---|---|
| **CMS content** | `sanity dataset export` to the client's storage. Sanity also keeps document history and its own backups | Nightly, automated; plus a manual export before every import run and before cutover | `sanity dataset import` into a fresh dataset, then repoint `NEXT_PUBLIC_SANITY_DATASET`. Single-document recovery from Studio history |
| **Media assets** | Included in the dataset export | With the dataset | With the dataset |
| **Code** | Git, with an off-platform remote mirror | On every push | Redeploy from any commit. Vercel retains previous deployments for instant promotion |
| **Configuration** | Environment variables documented (names, not values) in this file; secret values in a password manager, not a spreadsheet | On change | Recreate from the documented list. **Test this**: an undocumented variable is discovered at the worst possible time |
| **Redirect map** | `redirects.csv` at the repository root, with the audit artefact preserved at `docs/audit/redirects-draft.csv` | With the code | Reapply from the file |
| **Legacy WordPress archive** | Final backup, section 12 | Once, verified | Restore to a private host only, never publicly |
| **Cloudflare configuration** | Export the zone file, and record the rules in `docs/DOMAIN_SECURITY.md` | On change | Re-import the zone, recreate the rules |
| **DNS records** | Zone export plus the change log in `docs/DOMAIN_SECURITY.md` section 9 | On change | Re-import |

**Targets:** recovery time objective 4 hours for a full platform rebuild from backups; recovery
point objective 24 hours for content, and effectively zero for code.

**Test the restore twice a year.** Import the dataset export into a scratch dataset, deploy a
preview against it, and confirm the site renders. A backup that has never been restored is an
assumption.

**Single points of failure worth naming:** the Sanity project, the Vercel project, the Cloudflare
account, the registrar account and the Stripe account. Each should have **at least two named
owners** with independent access. A single admin account with a single set of credentials in one
person's password manager is the most common disaster recovery failure, and it is entirely
preventable by adding a second owner today.

---

## Repository

`https://github.com/RheagarTargerian/happy-education` — **private**.

It stays private. `docs/URGENT-LEGACY-SITE.md` documents a confirmed, unpatched
remote code execution vulnerability on the live happyeducation.uk WordPress site,
including the exact vulnerable version and the precondition that makes it
exploitable. That is a working attack blueprint while the legacy site is still up.
Do not make this repository public until the legacy site is decommissioned or
patched, and consider moving that document out of version control entirely once the
issue is closed.

## Connecting Vercel (5 minutes, needs your account)

The deploy itself could not be automated: it needs an authenticated Vercel session,
and `vercel login` is an interactive browser flow.

1. **Import** — vercel.com/new, choose `RheagarTargerian/happy-education`.
   Framework and region are already set in `vercel.json` (`lhr1`, London).
2. **Set environment variables** before the first deploy. Minimum for a working site:

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_SITE_URL` | `https://happyeducation.uk` |

   Everything else is optional and degrades honestly. See `.env.example` for the
   full list with notes on what each one unlocks.

3. **Deploy.** The build runs `next build`; it will succeed with no other variables
   set, and the migrated content renders from `content/migrated/`.

### The site will not be indexed until DNS is switched

This is deliberate and worth understanding before someone reports it as a bug.

Indexing requires a production build **and** the request arriving on the canonical
hostname from `NEXT_PUBLIC_SITE_URL`. A deployment promoted with `--prod` but still
served at `happy-education.vercel.app` reports `VERCEL_ENV=production`, so the
environment check alone would have let a staging copy compete with the real site and
put unreviewed legal drafts into search results.

`src/lib/canonical-host.ts` enforces both conditions. Verified behaviour, same build:

| Host | robots.txt | X-Robots-Tag |
|---|---|---|
| `happyeducation.uk` | `Allow: /` | none, indexable |
| `happy-education.vercel.app` | `Disallow: /` | `noindex, nofollow` |

So the Vercel URL is a safe review environment, and indexing begins the moment DNS
points at it. Nothing needs changing at cutover.

### Then, in order

1. Create the Sanity project, set `NEXT_PUBLIC_SANITY_PROJECT_ID` and
   `SANITY_API_WRITE_TOKEN`, run `node scripts/migrate/import.mjs --commit`,
   verify in the Studio, then delete `content/migrated/`.
2. Add Stripe keys and register the webhook at `/api/webhooks/stripe`.
3. Work through the DNS and email tasks in `DOMAIN_SECURITY.md`. Those are
   independent of this deployment and address the phishing problem.
4. Follow the cutover checklist above.
