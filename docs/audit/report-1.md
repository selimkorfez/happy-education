Evidence gathering complete. Compiling findings.

---

# SECURITY / INFRASTRUCTURE / EMAIL AUDIT — happyeducation.uk
**Audit date:** 2026-08-20. **Entity VERIFIED:** HAPPY EDUCATION CONSULTANCY LTD, company no. 11331426, Active, incorporated 26 Apr 2018, 16 Upper Woburn Place, London WC1H 0AF, SIC 85600 (source: `find-and-update.company-information.service.gov.uk/company/11331426`). Matches expected entity.

**Headline:** the reported "phishing problem" is **not** a compromised website. 331 pages/posts (3,011,099 chars of rendered HTML) and 964 media items are **clean** — zero injected scripts, iframes, spam or obfuscation. The phishing vector is the **email authentication posture**, which leaves the domain trivially spoofable, combined with a **publicly readable 16.3 MB debug log** and a **known admin username**.

---

## CRITICAL

### C1 — Domain is trivially spoofable; DMARC policy is not even under client control
**Evidence (dig, 2026-08-20):**
```
happyeducation.uk TXT      "v=spf1 include:_spf-eu.ionos.com ~all"
_dmarc.happyeducation.uk.  856 IN CNAME dmarc.ionos.co.uk.
dmarc.ionos.co.uk.         856 IN TXT   "v=DMARC1; p=none;"
DKIM: no record at 40+ probed selectors (default, google, k1, k2, s1, s2, selector1,
      selector2, mail, dkim, smtp, key1/2, zoho, fm1-3, protonmail, mandrill, sendgrid,
      ionos, ionos1/2, 1and1, oneandone, 1und1, ui, sel1/2, dkim-ionos, mailjet,
      mailchimp, brevo, hs1/2, ctct1/2, pm-bounces, litesrv, …)
```
Four compounding failures:
1. **`~all` (softfail)** — spoofed mail is *not* rejected, only soft-marked.
2. **`p=none`** — DMARC does nothing. No enforcement at all.
3. **No `rua=`** — zero visibility. Nobody can see who is spoofing the domain, and there is no forensic trail for the incident the client is reporting.
4. **DMARC is a CNAME to `dmarc.ionos.co.uk`** — a *shared IONOS-controlled record*. The client **cannot change their own DMARC policy** without first replacing the CNAME, and IONOS could change it under them at any time.

Plus **no DKIM whatsoever** — so even if DMARC were enforced, legitimate mail would have only SPF to pass alignment on, and would break on any forwarding.

**Why it matters:** An international education consultancy handling tuition-fee payments is a prime target for **business email compromise / fee-redirection fraud**. Anyone can send mail as `info@happyeducation.uk` or `admin@happyeducation.uk` (both VERIFIED present in site content) to students and parents with altered bank details, and it will reach inboxes. This is the single most likely explanation for the client's reported phishing problem.

**New platform must:** treat DMARC rollout as P0, independent of the site rebuild — see DMARC ROLLOUT INPUTS. Own the `_dmarc` record directly (delete the CNAME).

### C2 — `/wp-content/debug.log` publicly readable, 16.28 MB
**Evidence:** `HTTP 200`, `content-length: 16284513`, `last-modified: Sat, 18 Jul 2026 10:27:52 GMT`, `content-type` served inline. Leaks:
- Absolute server path: `/homepages/14/d83506371/htdocs/happyeducation` (IONOS shared-hosting account ID)
- Database name: `dbs12430642`
- **Database table prefix: `vys_`** (defeats the obscurity benefit of a non-default prefix; directly useful for SQLi exploitation)
- `WP_DEBUG` + `WP_DEBUG_LOG` were enabled in production
- Internal file/line numbers across `wp-includes/`, plugin internals

**Sampled 268 KB across 4 ranges (head, tail, 4 MB, 9 MB offsets):** no credentials, no API keys, no email addresses, no IPs found. So it is an **infrastructure disclosure**, not a PII breach — but it is a complete blueprint for a targeted attack.

**Also:** `/error_log` returns `200` (0 bytes).

**New platform must:** never write debug logs into a web-served path; `NODE_ENV=production`, structured logs to stderr/host log sink only. Delete this file from the WP host **today** — before migration, not after.

---

## HIGH

### H1 — Admin username is known and user enumeration is wide open
**Evidence:**
```
/wp-json/wp/v2/users     200 → [{"id":1,"name":"root","slug":"root", ...}]
/wp-json/wp/v2/users/1   200
/?author=1               301 → https://happyeducation.uk/author/root/
/wp-login.php            200 (open, no gate)
/wp-admin/               302 → wp-login.php
```
Sole author account is literally `root` (also VERIFIED in `raw/wp/users.ndjson`, single record).

**Why it matters:** Credential stuffing needs username + password. The username is published by three independent channels. `root` is in the first ~10 entries of every WordPress brute-force wordlist. The only remaining control is password strength; there is **no evidence of 2FA, login rate limiting, or IP allowlisting** (the only rate limit seen is a coarse host-level `x-ws-ratelimit-limit: 1000`). A successful login here means full site takeover — and, given the site's role, a highly credible platform from which to phish students.

**New platform must:** Sanity/Next.js has no `/wp-login.php` equivalent. Use SSO with enforced 2FA for Sanity Studio; never expose a user-enumeration endpoint. **Before migration:** rename the `root` account, force a password reset, enable 2FA.

### H2 — Zero security response headers
**Evidence — full header set, homepage `https://happyeducation.uk/` and deep page `https://happyeducation.uk/anasayfa/hakkimizda/`:**
```
content-type: text/html; charset=UTF-8
x-ws-origin: available
x-ws-ratelimit-limit: 1000
x-ws-ratelimit-remaining: 999
date: …
server: Apache
link: <https://happyeducation.uk/wp-json/>; rel="https://api.w.org/", …
x-redirect-by: WordPress          (on redirects)
```
| Header | Status |
|---|---|
| Content-Security-Policy | **ABSENT** |
| Strict-Transport-Security | **ABSENT** |
| X-Content-Type-Options | **ABSENT** |
| X-Frame-Options | **ABSENT** |
| Referrer-Policy | **ABSENT** |
| Permissions-Policy | **ABSENT** |
| `Server` | `Apache` (product disclosed, version not) |
| `X-Powered-By` | absent (good) |
| `X-Redirect-By` | `WordPress` (**stack disclosure**) |

No HSTS means the HTTP→HTTPS 301 is strippable on hostile networks — relevant to phishing, since a MITM can serve a cloned login/lead form. No XFO/CSP `frame-ancestors` means the site can be **iframed into a phishing page** for clickjacking.

**New platform must:** ship all six from day one. `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `frame-ancestors 'none'`, and the CSP built from the allowlist below.

### H3 — CourseLog theme outdated and unsupported on the installed core
**Evidence:** installed `courselog` **1.3.9** (from `?ver=1.3.9` on 18 theme assets); `courselog-child` reports `ver=7.1` (inherits core version, not meaningful). Latest is **1.4.2 (27 Apr 2026)**, whose changelog states compatibility with **WordPress 6.8**. The site runs **WordPress 7.1**.
**Why it matters:** three releases behind, and even the *current* release is not tested against the installed core. Premium ThemeForest themes bundle their own vendor libraries and are a recurring source of unpatched vulnerabilities. No specific CVE confirmed for 1.3.9 — **UNKNOWN**, requires a WPScan/Patchstack subscription check.
**New platform must:** eliminate this entirely — no themes in a Next.js/Sanity build.

### H4 — Salesforce Web-to-Lead form: no CAPTCHA, cross-origin PII POST
**Evidence:** `https://happyeducation.uk/salesforce/` (HTTP 200; source `audit/raw/wp/pages.ndjson:186`):
```html
<form action="https://webto.salesforce.com/servlet/servlet.WebToLead?encoding=UTF-8&orgId=00D8d00000ArP1E" method="POST">
<input type=hidden name="oid" value="00D8d00000ArP1E">
<input type=hidden name="retURL" value="https://happyeducation.uk/">
```
Grep for `captcha|recaptcha` on the live page: **no match**. Linked from at least 6 university pages as "APPLY NOW" (`pages.ndjson:131,192,193,225,252,262`).
**Why it matters:** unauthenticated, unprotected lead injection straight into the CRM — attackers can flood Salesforce with fake student leads, poisoning the sales pipeline, or use it as a spam relay. Student PII (names, emails, phone) crosses origin to a third party with no consent gate tied to the cookie banner.
**New platform must:** server-side form handling with bot protection (Turnstile/reCAPTCHA + rate limit), POST to your own API route, then server-to-server into Salesforce with a scoped credential. Add `form-action` to CSP. Confirm the Salesforce transfer is covered in the privacy notice (GDPR Art. 13).

### H5 — Cost Calculator Builder installed, version UNKNOWN
**Evidence:** `/wp-content/plugins/cost-calculator-builder/includes/gutenberg-block/build/style-index.css` present on homepage, but **no `?ver=` string emitted** — version could not be determined.
**Known CVE history:** CVE-2025-14757 broken access control (patched 3.6.10); Cost Calculator Builder **Pro** CVE-2026-14900 **critical RCE affecting ≤ 4.0.3**; earlier SQLi < 3.2.29 and ≤ 3.2.15.
**Verdict: UNKNOWN — cannot confirm exposure without the installed version. Requires business verification** (read it from the WP admin plugins screen). If it is the Pro edition at ≤ 4.0.3, treat as CRITICAL RCE and patch immediately.

---

## MEDIUM

| # | Finding | Evidence | Why it matters / action |
|---|---|---|---|
| M1 | `wp-cron.php` publicly hittable | `200`, 0 bytes | Unauthenticated repeated GETs force PHP execution → cheap DoS on shared hosting. Set `DISABLE_WP_CRON` + real cron. N/A on new platform. |
| M2 | Version-disclosure files exposed | `/readme.html` `200` (7,407 B), `/license.txt` `200` (19,903 B) | Standard fingerprinting aids. Delete. |
| M3 | Generator meta leaks exact versions | `<meta name="generator" content="WordPress 7.1" />`, `<meta name="generator" content="Elementor 4.2.0; …">` | Tells an attacker precisely which exploit to load. Suppress; N/A on new platform. |
| M4 | **No CAA record** | `dig +short happyeducation.uk CAA` → empty | Any CA in the world may issue for this domain — enables a **convincing phishing cert** for a lookalike host. Add `CAA 0 issue "sectigo.com"` (+ your new CDN's CA) and `iodef`. |
| M5 | **DNSSEC not enabled** | no `DNSKEY`, no `DS`, no `RRSIG`, no `AD` flag | DNS answers are forgeable via cache poisoning. IONOS supports DNSSEC — enable, or move DNS to Cloudflare (see M8). |
| M6 | CookieYes one version behind | `cookie-law-info` **3.5.3**; latest 3.5.4 | Low direct risk; indicates patching is not routine. |
| M7 | 18 SVG files in media library | `raw/wp/media.ndjson`, `image/svg+xml` ×18 (e.g. `/uploads/2021/03/phone-icon2.svg`) | SVG is executable XML — stored-XSS vector if served inline from the same origin. Sanitise on migration or convert to static assets. |
| M8 | **Cloudflare is NOT in front** | NS: `ns1037.ui-dns.com`, `ns1111.ui-dns.biz`, `ns1088.ui-dns.de`, `ns1044.ui-dns.org` (IONOS/1&1); A `217.160.0.135`; AAAA `2001:8d8:100f:f000::228` | No WAF, no DDoS absorption, no bot management, no edge rate limiting. Origin IP is directly exposed. |
| M9 | Shared IONOS hosting | path `/homepages/14/d83506371/` | Noisy-neighbour and IP-reputation risk — a spamming neighbour on `217.160.0.135` degrades your mail deliverability. |

---

## LOW / INFO — verified-good controls (do not regress these)

- **TLS is healthy.** Issuer `C=GB, O=Sectigo Limited, CN=Sectigo Public Server Authentication CA DV R36`; subject `CN=*.happyeducation.uk`; SAN `*.happyeducation.uk, happyeducation.uk`; valid `Jan 16 2026 → Jan 30 2027`; **TLSv1.3**, `TLS_AES_256_GCM_SHA384`; `Verify return code: 0 (ok)`. Note it is **DV, not OV/EV**, and a **wildcard** (one key compromise covers all subdomains).
- **HTTPS redirects correct.** `http://happyeducation.uk/` → `301` → `https://happyeducation.uk/`; `https://www.` → `301` → apex. (Weakened by missing HSTS — H2.)
- **`xmlrpc.php` blocked** — `503` with a host-level block page (not WordPress). Kills the classic `system.multicall` brute-force amplifier. Good.
- **`wp-config.php` and `wp-config.php.bak` blocked** — both `503`.
- **Directory listings disabled** — `/wp-content/uploads/`, `/wp-content/plugins/`, `/wp-includes/`, `/wp-content/upgrade/` all `403`.
- **REST settings endpoint protected** — `/wp-json/wp/v2/settings` → `401`.
- **MetForm entries are NOT exposed.** `/wp-json/metform/v1/entries` → `200` but returns only the *route discovery index*, not submission data. No PII leak. (MetForm **4.1.7** installed; CVE-2026-0633 unauthenticated entry disclosure affects **≤ 4.1.0**, patched 4.1.1 → **not vulnerable**.)
- **ElementsKit Lite is patched.** Installed **3.10.02**. CVE-2026-23693 (CVSS 10.0, unauthenticated open proxy via `/wp-json/elementskit/v1/widget/mailchimp/subscribe`) affects **< 3.7.9**. The endpoint *is* exposed in the namespace list, but the installed version is past the fix. Multisite RCE/XSS issues affect **< 3.10.01** → also patched. **Not vulnerable**, but keep it updated — this plugin has a heavy CVE cadence.
- **WordPress core is fully current** — 7.1, released 19 Aug 2026 (one day before audit).
- **`.git` exposure inconclusive** — `/.git/config` returns `403` (1,271 B), identical to the generic Apache forbidden page used for all denied paths. Cannot distinguish "exists but denied" from "denied by pattern". Low confidence; **verify on the host**.
- Elementor **4.2.0** currency: **UNKNOWN** — could not confirm whether 4.2.0 is the latest 4.x. Verify in WP admin.

### Compromise scan — NEGATIVE (explicit clean result)
Scanned `raw/wp/pages.ndjson` (313 pages) + `raw/wp/posts.ndjson` (18 posts) = **331 documents, 3,011,099 chars** of `content.rendered`, plus 964 media records and the live homepage (195,416 B).

| Indicator | Result |
|---|---|
| Injected external `<script src>` in content | **0** |
| `<iframe>` to unknown domains in content | **0** |
| Pharma/casino/loan/SEO spam keywords | **0** |
| `eval(` / `atob(` / `base64_decode(` / `fromCharCode(` | **0** (content and homepage) |
| Long base64 blobs (≥200 chars) | **0** |
| Hidden `display:none` / `visibility:hidden` blocks containing off-site anchors | **0** |
| `.php`/`.phtml`/`.exe`/`.js` uploads in media library | **0** (964 items: 560 jpeg, 299 png, 82 webp, 18 svg, 5 pdf) |
| Homepage obfuscation markers | **0** |

Only 5 of 331 documents contain any `<script>` tag at all. Every external host in content is a legitimate, expected destination (Facebook, Instagram, YouTube, LinkedIn, Google Maps, Companies House, MDN, W3C, Salesforce).

**Conclusion: no evidence of website compromise.** The client's phishing problem is almost certainly **email-borne domain spoofing (C1)**, not a hacked site. Confirm by obtaining a sample phishing message with **full headers** and checking `Authentication-Results` — the absence of `rua` (C1) means no reports exist to inspect.

---

## DMARC ROLLOUT INPUTS

### Confirmed legitimate senders (must not break)
| # | Sender | Status | Evidence |
|---|---|---|---|
| 1 | **IONOS hosted mailboxes** — `mx00.ionos.co.uk`, `mx01.ionos.co.uk` (pref 10) | **VERIFIED** | `dig MX`. SPF-covered via `include:_spf-eu.ionos.com` → `ip4:212.227.126.128/25 82.165.159.0/26 212.227.15.0/25 212.227.17.0/27 217.72.192.64/26 185.48.116.13/32 212.227.25.128/25 ip6:2001:8d8:5c2::/64 2001:8d8:5c5::/64` |
| 2 | **Known mailboxes in use** — `info@happyeducation.uk`, `admin@happyeducation.uk` | **VERIFIED** in site content | `raw/wp/pages.ndjson` (admin ×2, info ×1) |
| 3 | **WordPress site mail** (MetForm notifications, WP core) via PHP `mail()` from the IONOS shared host | **INFERRED** — MetForm 4.1.7 installed with `metform/v1/entries` | **REQUIRES VERIFICATION**: confirm the webhosting egress IP falls inside `_spf-eu.ionos.com`. Classic DMARC-breaker. |
| 4 | **Salesforce** org `00D8d00000ArP1E` | **VERIFIED integration**; sending status **UNKNOWN** | If Salesforce sends auto-responses as `@happyeducation.uk`, needs `include:_spf.salesforce.com` + Salesforce DKIM key. **REQUIRES VERIFICATION.** |
| 5 | **Mailchimp** | **UNKNOWN** | `elementskit/v1/widget/mailchimp` namespace exists but no evidence of active use. **REQUIRES VERIFICATION.** |
| 6 | **Google** — `google-site-verification=wSgGHjeMRQXSqKVVdBXDC3MI2O0rOkmPQm2WOSZ9-Yo` | **VERIFIED**, Search Console only | MX is IONOS, **not** Google Workspace → no Google sending path assumed. |
| 7 | Third-party dev contact `info@managetechs.co.uk` | **VERIFIED** in content | Different domain — out of scope for this DMARC. |

**SPF lookup budget: 1 of 10 used.** Outer record has a single `include:`; `_spf-eu.ionos.com` contains only `ip4`/`ip6` mechanisms and adds zero further lookups. **Ample headroom** to add Salesforce/ESP includes. (Note: `_spf-eu.ionos.com` terminates in `?all`, so the include yields *neutral* — not *pass* — for non-listed IPs, which correctly means it does not broaden the outer record.)

### Safe rollout sequence

**Phase 0 — take control + gain visibility (Day 0–1). Do this before anything else.**
1. **Delete the `_dmarc` CNAME** to `dmarc.ionos.co.uk` and publish your own TXT. Until this is done the client controls nothing.
2. Publish, still non-enforcing so nothing can break:
   ```
   _dmarc.happyeducation.uk TXT
   "v=DMARC1; p=none; rua=mailto:dmarc-rua@happyeducation.uk; ruf=mailto:dmarc-ruf@happyeducation.uk; fo=1; adkim=r; aspf=r; pct=100"
   ```
   Use a DMARC analytics provider mailbox rather than a raw mailbox — the XML is unreadable by hand.
3. Add CAA and enable DNSSEC (M4, M5) in the same change window.

**Phase 1 — observe (Weeks 1–4).** Collect aggregate reports. Enumerate every sending IP. Resolve items 3, 4, 5 above. **Do not advance until reports show ≥98% of legitimate volume passing.**

**Phase 2 — authenticate (Weeks 2–5, overlapping).**
1. **Enable DKIM at IONOS** (control panel) — this is the biggest single gap; DKIM survives forwarding, SPF does not.
2. Add DKIM for Salesforce and any ESP found in Phase 1.
3. Add any missing SPF includes (budget allows).
4. Verify **alignment** — the `From:` domain must match the DKIM `d=` / SPF `MAIL FROM` domain, not merely pass.

**Phase 3 — tighten SPF (Week 5).** Only once DKIM is live and aligned: `~all` → `-all`. Doing this before DKIM risks breaking forwarded mail.

**Phase 4 — quarantine, ramped (Weeks 6–9).** `p=quarantine; pct=25` → monitor 1 week → `pct=50` → `pct=100`. Roll back one step on any legitimate-mail failure in the reports.

**Phase 5 — reject (Weeks 10–12).** `p=reject; sp=reject; pct=100`. Optionally tighten `adkim=s; aspf=s`.

**Phase 6 — hardening (post-rollout).** MTA-STS (`_mta-sts` TXT + policy file — currently **absent**), TLS-RPT (`_smtp._tls` — currently **absent**), and BIMI once `p=quarantine`+ is stable.

**Immediate interim mitigation, independent of the above:** notify students/parents through a non-email channel that the firm will never change bank details by email, and give them a phone number to verify payment instructions. DMARC enforcement takes ~12 weeks; fee-redirection fraud does not wait.

---

## CSP ALLOWLIST INPUTS

**VERIFIED from live homepage HTML (195,416 B) and REST responses:**

| Directive | Host | Evidence |
|---|---|---|
| `script-src` | `www.googletagmanager.com` | `<script src="https://www.googletagmanager.com/gtag/js?id=AW-16608224779">` |
| `script-src` | `connect.facebook.net` | Meta Pixel loader; `fbq('init','903879057928055')`, `fbq('track','PageView')` |
| `frame-src` | `www.googletagmanager.com` | `<iframe src="https://www.googletagmanager.com/ns.html?id=GTM-PCTZXT3Z">` |
| `frame-src` | `www.youtube.com` | embeds in page content (6 refs) |
| `style-src` | `fonts.googleapis.com` | `<link rel='stylesheet' href='https://fonts.googleapis.com/css?family=Roboto…|Rubik…'>` |
| `img-src` | `secure.gravatar.com` | avatar URLs in `/wp-json/wp/v2/users` |
| `img-src` | `s.w.org`, `upload.wikimedia.org` | homepage refs |
| `form-action` | `webto.salesforce.com` | `/salesforce/` Web-to-Lead POST target |

**Tracking IDs (VERIFIED):** GTM `GTM-PCTZXT3Z` · Google Ads `AW-16608224779` · Meta Pixel `903879057928055`.

**INFERRED — required but not literally present in homepage HTML (do not omit):**
- `fonts.gstatic.com` — `img-src`/`font-src`; fetched by the Google Fonts CSS.
- `www.google-analytics.com`, `region1.google-analytics.com`, `analytics.google.com` — `connect-src`/`img-src`; gtag beacon endpoints.
- `www.googleadservices.com`, `googleads.g.doubleclick.net`, `www.google.com` — `img-src`/`frame-src`; Google Ads conversion pixels (`AW-` tag).
- `www.facebook.com` — `img-src`/`connect-src`; Meta Pixel beacon.

**Outbound links only — NOT CSP-relevant** (no directive needed): `wa.me`, `maps.app.goo.gl`, `www.instagram.com`, `www.linkedin.com`, `developer.mozilla.org`, `find-and-update.company-information.service.gov.uk`, `www.w3.org`, `api.w.org`.

### Starting CSP for the Next.js platform
```
default-src 'self';
script-src 'self' 'nonce-{RANDOM}' https://www.googletagmanager.com https://connect.facebook.net;
style-src  'self' 'nonce-{RANDOM}' https://fonts.googleapis.com;
font-src   'self' https://fonts.gstatic.com;
img-src    'self' data: https://secure.gravatar.com https://www.google-analytics.com
           https://www.googletagmanager.com https://www.facebook.com
           https://www.google.com https://googleads.g.doubleclick.net;
connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com
           https://analytics.google.com https://www.facebook.com;
frame-src  https://www.googletagmanager.com https://www.youtube-nocookie.com;
form-action 'self';
frame-ancestors 'none';
base-uri 'self';
object-src 'none';
upgrade-insecure-requests;
report-uri /api/csp-report;
```
**Notes for implementation:**
- Deploy in `Content-Security-Policy-Report-Only` first, collect for 2 weeks, then enforce.
- Use **nonces**, not `'unsafe-inline'`. GTM works with nonce propagation; budget for this, as a GTM container whose tags inject arbitrary scripts will fight a strict CSP — consider server-side GTM.
- `form-action 'self'` **deliberately excludes** `webto.salesforce.com` — per H4 the Salesforce POST should be proxied server-side. If the direct client POST is retained, add `https://webto.salesforce.com` and accept the H4 risk.
- Prefer `youtube-nocookie.com` over `youtube.com` for GDPR.
- Self-host Roboto/Rubik via `next/font` to drop `fonts.googleapis.com`/`fonts.gstatic.com` entirely — better privacy, better performance, smaller CSP.
- Gate GTM and Meta Pixel behind the consent banner; they currently load regardless of the CookieYes state (**UNVERIFIED** whether consent-gating is configured — worth confirming, as unconsented pixel loading is a live GDPR/PECR exposure).

---

## PRIORITISED REMEDIATION (do these on the *existing* site, now — do not wait for the rebuild)

1. **Delete `/wp-content/debug.log`** and set `WP_DEBUG_LOG=false`. (C2 — 5 minutes)
2. **Rename the `root` account, force password reset, enable 2FA.** (H1 — 15 minutes)
3. **Publish a client-controlled DMARC record with `rua`.** (C1 Phase 0 — 30 minutes; buys the visibility needed to actually investigate the phishing)
4. **Enable DKIM at IONOS.** (C1 Phase 2)
5. **Verify the Cost Calculator Builder version** — if Pro ≤ 4.0.3, patch immediately (H5).
6. Delete `/readme.html`, `/license.txt`, `/error_log`. (M2)
7. Add CAA; enable DNSSEC. (M4, M5)
8. Issue a non-email advisory to students/parents about fee-payment verification. (C1 interim)

**Open items requiring business verification:** Cost Calculator Builder version · whether WordPress/MetForm mail egresses within IONOS SPF ranges · whether Salesforce sends as `@happyeducation.uk` · whether Mailchimp is active · Elementor 4.2.0 currency · `.git` presence on the host · whether GTM/Meta Pixel are consent-gated · a sample phishing email **with full headers**.

**Sources:** [Companies House 11331426](https://find-and-update.company-information.service.gov.uk/company/11331426) · [CVE-2026-23693 (ElementsKit)](https://www.cvedetails.com/cve/CVE-2026-23693/) · [CVE-2026-0633 (MetForm)](https://www.sentinelone.com/vulnerability-database/cve-2026-0633/) · [WPScan: elementskit-lite](https://wpscan.com/plugin/elementskit-lite/) · [Patchstack: cost-calculator-builder](https://patchstack.com/database/wordpress/plugin/cost-calculator-builder/vdp) · [CookieYes on WPScan](https://wpscan.com/plugin/cookie-law-info/) · [Courselog on ThemeForest](https://themeforest.net/item/courselog-education-wordpress-theme/29889145) · [WordPress releases](https://wordpress.org/news/category/releases/)