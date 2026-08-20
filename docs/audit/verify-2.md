## ADVERSARIAL VERIFICATION — happyeducation.uk security report

**Verdict: the report is factually unusually accurate — but its single most important finding is wrong in the dangerous direction.** It classified a live, publicly-known, unauthenticated RCE as "UNKNOWN, requires business verification" and ranked it #5. I resolved that UNKNOWN from a public URL in one request, and it resolves to the worst case.

---

## 🔴 PRIMARY REFUTATION — H5 is not UNKNOWN; it is a live critical RCE

**Report claim:** *"Cost Calculator Builder installed, version UNKNOWN … no `?ver=` string emitted — version could not be determined … Requires business verification (read it from the WP admin plugins screen). If it is the Pro edition at ≤ 4.0.3, treat as CRITICAL RCE."*

**REFUTED.** The version was determinable without admin access. Plugin `readme.txt` files are world-readable on this host:

| Source | Result |
|---|---|
| `https://happyeducation.uk/wp-content/plugins/cost-calculator-builder/readme.txt` | `Stable tag: 4.0.14` (free edition) |
| `https://happyeducation.uk/wp-content/plugins/cost-calculator-builder-pro/readme.txt` | **HTTP 200, 94,722 B, `Stable tag: 4.0.3`** |

Corroborated: the Pro readme's changelog **top entry is `= 4.0.3 =`**, so 4.0.3 is the newest version in that folder.

**CVE-2026-14900 (verified via MITRE CVE API `cveawg.mitre.org/api/cve/CVE-2026-14900`):**
- state PUBLISHED, assigner Wordfence, published **2026-07-29**
- title: *"Cost Calculator Builder PRO <= 4.0.3 – Unauthenticated Remote Code Execution via 'orderDetails' Parameter"*
- affected: StylemixThemes / Cost Calculator Builder PRO, versions **0 → 4.0.3 inclusive**
- **CVSS 9.8 CRITICAL**; `orderDetails[*].originalValue` injected verbatim into a formula passed to PHP `eval()`

**The exploitation precondition is satisfied on the homepage.** The CVE notes the required nonce is public on front-end pages. Verified in the live homepage HTML:

```
window.ccb_nonces = {"ccb_payment":"ec729a4658","ccb_contact_form":"c129e13aa1",
"ccb_woo_checkout":"26e3f35ac4","ccb_add_order":"a1e5e96f51","ccb_orders":"0d141a7dbf",…}
```

Installed Pro 4.0.3 ≤ 4.0.3 → **the site is vulnerable to unauthenticated RCE.** This is P0/C0, not item #5. (I confirmed the version and precondition only; I did not attempt exploitation.)

**This undermines the report's headline.** Its conclusion — *"no evidence of website compromise… the phishing problem is almost certainly email-borne domain spoofing"* — rests on a scan of `content.rendered` and media metadata. That method **cannot detect an on-disk PHP backdoor**, which is precisely what this CVE yields. The RCE was disclosed 2026-07-29; `debug.log` last-modified is 2026-07-18. The clean-content result is real but does not license the conclusion. A host-level file-integrity scan is required before the "not compromised" claim can stand.

---

## Other REFUTED claims

| # | Report claim | Actual | Source |
|---|---|---|---|
| R1 | CourseLog latest "**1.4.2 (27 Apr 2026)**" | 1.4.2, released **30 April 2025** | ThemeForest item 29889145. Theme is ~16 months stale, not ~4 — the finding is *worse* than stated |
| R2 | CookieYes "3.5.3; **latest 3.5.4** … one version behind" | Latest is **3.5.5** (updated ~10h before audit) | wordpress.org/plugins/cookie-law-info/ |
| R3 | YouTube "**embeds** in page content (6 refs)" → justifies `frame-src www.youtube.com` | 6 refs, but **all 6 are `href=` anchors** to one YT channel; **0 `<iframe>` in all 331 docs** | recomputed over pages+posts ndjson. YouTube belongs in the report's own "outbound links only — NOT CSP-relevant" bucket |
| R4 | "`?ver=1.3.9` on **18** theme assets" | **17** assets carry `ver=1.3.9`; the 18th is `courselog-child/style.css?ver=7.1` | live homepage HTML |
| R5 | "`raw/wp/pages.ndjson` (**admin ×2**, info ×1)" | `admin@happyeducation.uk` **×4**, `info@` ×1, `info@managetechs.co.uk` ×1 | grep over pages.ndjson |
| R6 | "Elementor 4.2.0 currency: **UNKNOWN**" | Resolvable: latest **4.2.3** (19 Aug 2026); installed 4.2.0 is 3 patches behind | wordpress.org/plugins/elementor/ |

---

## Material OMISSIONS

1. **Undisclosed installed plugins.** The report inventoried plugins only from homepage asset URLs and missed three, all confirmed by readable `readme.txt`: **WooCommerce 10.4.4**, **Yoast SEO 24.6**, **Weglot 6.1**. Weglot is independently proven installed by `debug.log` (`wp-content/plugins/weglot`) and is invisible in homepage HTML. WooCommerce is corroborated by the `vys_actionscheduler_logs` table in the log.
2. **The `readme.txt` disclosure itself.** M2 lists only `/readme.html` and `/license.txt`. Per-plugin `readme.txt` is far more valuable to an attacker — it yields the *exact* version of every plugin including premium ones with no `?ver=` string. That is exactly how I found the RCE.
3. **CVE-2026-10865** — CCB ≤ 4.0.11, unauthenticated extraction of plaintext Stripe/Razorpay secret keys and PayPal `client_secret` (CVSS 5.3, published 2026-07-11). Installed free edition is 4.0.14 → **not vulnerable**, but the report never checked this family.
4. **ElementsKit 3.10.02 is a full major version behind** (latest **4.0.1**, 12 Aug 2026). MetForm 4.1.7 behind **4.2.0** (12 Aug 2026). The report's "not vulnerable / patched" verdicts are correct but the staleness framing is absent.

---

## CONFIRMED claims (independently re-verified)

**Company details — CONFIRMED exactly**, no hallucination: HAPPY EDUCATION CONSULTANCY LTD, 11331426, Active, incorporated 26 April 2018, 16 Upper Woburn Place, London WC1H 0AF, SIC 85600 Educational support services. Matches expected entity. *(Companies House)*

**All four CVEs are real and accurately characterised** — verified against the MITRE CVE API, not a summarizer:

| CVE | Report's characterisation | API verdict |
|---|---|---|
| CVE-2026-23693 | ElementsKit < 3.7.9, CVSS 10.0, Mailchimp open proxy | CONFIRMED (VulnCheck, 2026-02-23; CVSS 9.3 and 10 both listed) |
| CVE-2026-0633 | MetForm ≤ 4.1.0, patched 4.1.1 | CONFIRMED (Wordfence, 2026-01-24; forgeable cookie). Installed 4.1.7 → not vulnerable ✓ |
| CVE-2025-14757 | CCB, patched 3.6.10 | CONFIRMED (≤3.6.9, fixed 3.6.10). Report's label "broken access control" is loose — it is unauth payment-status bypass, CVSS 5.3, only with Pro |
| CVE-2026-14900 | CCB Pro ≤ 4.0.3 critical RCE | CONFIRMED — and it **applies here** (see above) |

*Note: a plain web search failed to surface CVE-2026-14900 and suggested it "doesn't exist." That was a false negative; the MITRE API and NVD both carry it. I did not refute it on search-absence alone.*

**DNS — every value re-dug, all exact:** SPF `v=spf1 include:_spf-eu.ionos.com ~all`; `_dmarc` CNAME → `dmarc.ionos.co.uk` → `"v=DMARC1; p=none;"` (no `rua`, not client-controlled — all four sub-claims stand); MX `mx00/mx01.ionos.co.uk` pref 10; NS the four `ui-dns.com/.biz/.de/.org`; A `217.160.0.135`; AAAA `2001:8d8:100f:f000::228`; **no CAA, no DNSKEY/DS, no MTA-STS, no TLS-RPT**. DKIM: probed all 39 named selectors — zero hits. The `_spf-eu.ionos.com` expansion matches the report **character-for-character including the terminal `?all`**, and the "1 of 10 lookups" budget analysis is correct.

**TLS — exact:** issuer `C=GB, O=Sectigo Limited, CN=Sectigo Public Server Authentication CA DV R36`; subject `CN=*.happyeducation.uk`; SAN `*.happyeducation.uk, happyeducation.uk`; `Jan 16 2026 → Jan 30 2027`; TLSv1.3 / `TLS_AES_256_GCM_SHA384`; `Verify return code: 0 (ok)`.

**HTTP surface — all 19 probed paths match status and byte size exactly**, including `debug.log` `200 / content-length 16284513 / last-modified Sat, 18 Jul 2026 10:27:52 GMT`, homepage 195,416 B, readme.html 7,407 B, license.txt 19,903 B, xmlrpc/wp-config/wp-config.php.bak `503`, directory listings `403`, `/wp-json/wp/v2/settings` `401`. All six security headers absent; `server: Apache`; no `x-powered-by`; `x-redirect-by: WordPress` on 301.

**debug.log disclosures — confirmed, including the one I expected to be invented:** path `/homepages/14/d83506371/htdocs/happyeducation`, db `dbs12430642` (906 hits), and **table prefix `vys_`** — found as `vys_actionscheduler_logs` (1,812 hits) and `SELECT * FROM vys_actionscheduler_logs`. I sampled **854 KB** (vs the report's 268 KB) across 6 ranges: **zero** emails, IPs, passwords, API keys or tokens. The "infrastructure disclosure, not PII breach" characterisation holds.

**Content/compromise scan — every number reproduced exactly:** 331 docs, **3,011,099 chars**, 5 docs containing `<script>`, 0 external `<script src>`, 0 iframes, 0 `eval/atob/base64_decode/fromCharCode`, 0 long base64, 0 spam keywords. Media **964 = 560 jpeg / 299 png / 82 webp / 18 svg / 5 pdf**. External host list matches exactly. This is genuine, careful work.

**`root` user, Salesforce, tracking IDs, MetForm endpoint:** all confirmed — single user id 1 slug `root`, `/?author=1` → 301 → `/author/root/`; form action `webto.salesforce.com/...&orgId=00D8d00000ArP1E` with `oid` hidden field, **0** captcha matches; `GTM-PCTZXT3Z`, `AW-16608224779`, `fbq('init', '903879057928055')`; `/wp-json/metform/v1/entries` returns route index only, no PII.

**`.git` inconclusive — CONFIRMED and strengthened.** `.git/config`, `.git/HEAD` and `/wp-content/uploads/` all return byte-identical 403s (md5 `03264180bd81c04773f715565194c2c9`, 1,271 B), while `/.svn/entries` returns a 404 WP page. Pattern-based deny; existence genuinely undeterminable remotely.

**WordPress 7.1 released 19 Aug 2026** — confirmed; core is current.

---

## Corrected priority order

1. **Patch/disable Cost Calculator Builder PRO 4.0.3 → CVE-2026-14900 unauth RCE, CVSS 9.8.** Today. Then assume-breach: host-level file-integrity check, `vys_users` and `vys_options` review, rotate salts/DB creds. The clean content scan does **not** clear this.
2. Delete `/wp-content/debug.log`; disable `WP_DEBUG_LOG`. *(unchanged)*
3. Block `wp-content/plugins/*/readme.txt` — it is disclosing every plugin version including premium ones.
4. Rename `root`, force reset, 2FA. *(unchanged)*
5. DMARC Phase 0 — the report's C1 analysis is sound and its rollout plan is technically correct; keep it, but it is no longer the leading hypothesis for the phishing incident.
6. Inventory the three missed plugins (WooCommerce 10.4.4, Yoast 24.6, Weglot 6.1) — Weglot also adds a cross-origin surface absent from the CSP allowlist.

**Requires business verification (unchanged from report, still genuinely unknown):** whether WP/MetForm mail egresses inside IONOS SPF ranges · whether Salesforce sends as `@happyeducation.uk` · whether Mailchimp is active · whether GTM/Meta Pixel are consent-gated · a sample phishing email with full headers.

**Caveat on my own method:** plugin versions above are read from shipped `readme.txt` `Stable tag` + changelog head, not the admin screen. That is strong evidence — and enough to act on immediately — but the admin plugins screen should confirm CCB Pro 4.0.3 as the remediation is applied.