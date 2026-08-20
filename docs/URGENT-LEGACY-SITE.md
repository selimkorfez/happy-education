# URGENT — live vulnerabilities on the legacy WordPress site

**Raised:** 20 August 2026
**Applies to:** the current production site at `happyeducation.uk` (WordPress), **not** the new platform in this repository.
**Status:** open. These are live as of the audit date.

The rebuild does not fix any of this, because the rebuild is not deployed yet. The
actions in section 1 should not wait for the new site.

---

## 1. ACT TODAY

### 1.1 Unauthenticated remote code execution — CVSS 9.8

**CVE-2026-14900** — *"Cost Calculator Builder PRO <= 4.0.3 – Unauthenticated Remote
Code Execution via 'orderDetails' Parameter"*.

| Fact | Value | How it was confirmed |
|---|---|---|
| Installed version | **4.0.3** | `GET /wp-content/plugins/cost-calculator-builder-pro/readme.txt` → `Stable tag: 4.0.3` |
| Affected range | 0 → 4.0.3 **inclusive** | MITRE CVE record, assigner Wordfence, published 2026-07-29 |
| Severity | **9.8 CRITICAL** | `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H` |
| Precondition | satisfied | The nonce the exploit needs is published in the homepage HTML as `window.ccb_nonces` |

`AV:N/AC:L/PR:N/UI:N` means: reachable over the network, low complexity, **no
privileges and no user interaction required**. The vulnerable parameter reaches PHP
`eval()`.

The version and the precondition were verified. **No exploitation was attempted.**

**Do now, in this order:**

1. **Update or remove the plugin.** If the paid Cost Calculator Builder PRO is not
   actively used on the site, deleting it is faster and safer than updating. Deactivating
   is *not* sufficient — deactivated plugin files remain reachable on disk.
2. **Assume compromise until disproven.** The CVE was published 2026-07-29. This
   class of flaw yields an on-disk PHP backdoor, which content-level scanning cannot
   see. The audit found no injected markup in any of the 331 pages or 964 media items,
   which is reassuring but does **not** clear the host. Required:
   - file-integrity comparison against a clean WordPress + plugin baseline
   - review `wp-content/uploads/` for `.php` files (there should be none)
   - review all admin accounts and application passwords for unexpected entries
   - check for unexpected scheduled tasks (`wp_cron`) and admin users created since July
3. **Rotate credentials** — WordPress admin, database, hosting control panel, and any
   API keys stored in `wp-config.php`.

### 1.2 Publicly readable debug log — 16.28 MB

`GET /wp-content/debug.log` returns **HTTP 200**, 16,284,513 bytes.

It discloses the absolute server path `/homepages/14/d83506371/htdocs/happyeducation`,
the database name `dbs12430642`, and the **database table prefix `vys_`**. A sample of
268 KB across four offsets found no credentials or personal data, so this is
infrastructure disclosure rather than a data breach — but combined with 1.1 it is a
targeting aid.

**Do now:** delete the file, and set `WP_DEBUG` / `WP_DEBUG_LOG` to `false` in
`wp-config.php`. `/error_log` also returns 200 and should be removed.

### 1.3 Every plugin version is publicly enumerable

Per-plugin `readme.txt` files are world-readable, which discloses the exact version of
every plugin — including premium ones that emit no `?ver=` string. This is how the RCE
above was found from outside, with a single unauthenticated request.

Confirmed readable:

| Plugin | Version disclosed |
|---|---|
| cost-calculator-builder-pro | **4.0.3** (vulnerable) |
| cost-calculator-builder | 4.0.14 |
| woocommerce | 10.4.4 |
| wordpress-seo | 24.6 |
| weglot | 6.1 |
| elementor | 4.2.0 |
| cookie-law-info | 3.5.3 |

Note that WooCommerce, Yoast and Weglot are installed but were **not** visible in the
homepage markup — the installed surface is larger than it appears.

**Do now:** block `readme.txt`, `readme.html` and `license.txt` at the web server or
WAF. This is mitigation, not a fix; the fix is keeping the plugins current.

### 1.4 Admin username is published

The sole account is literally named `root`, and it is exposed three ways:
`/wp-json/wp/v2/users` (200), `/wp-json/wp/v2/users/1` (200), and `/?author=1` which
301s to `/author/root/`. `/wp-login.php` is open with no gate and no evidence of 2FA or
login rate limiting.

Credential stuffing needs a username and a password. The username is public, and `root`
sits near the top of every brute-force wordlist.

**Do now:** rename the account, force a password reset, enable two-factor
authentication, and disable REST user enumeration.

---

## 2. THE PHISHING PROBLEM IS DNS, NOT WORDPRESS

This is the finding that explains the reported phishing, and **migrating to Next.js
does not address it at all.** It is a DNS change, and it can be made today.

Observed 2026-08-20:

```
happyeducation.uk       TXT    "v=spf1 include:_spf-eu.ionos.com ~all"
_dmarc.happyeducation.uk  CNAME  dmarc.ionos.co.uk.
dmarc.ionos.co.uk         TXT    "v=DMARC1; p=none;"
DKIM                            no record at 40+ probed selectors
```

Four compounding failures:

1. **`~all`** is a softfail. Spoofed mail is marked, not rejected.
2. **`p=none`** means DMARC enforces nothing.
3. **No `rua=`** means zero visibility. There is no forensic trail for the phishing
   incidents already reported, and no way to see who is spoofing the domain.
4. **`_dmarc` is a CNAME to a shared IONOS record.** Happy Education **cannot set its
   own DMARC policy** without first removing that CNAME, and IONOS can change the
   policy underneath it at any time.

There is **no DKIM at all**, so even with DMARC enforced, legitimate mail would have
only SPF to align on and would fail on any forwarding.

**What this means in practice:** anyone can send mail as `admin@happyeducation.uk` or
`info@happyeducation.uk` — both of which are published on the site — to students and
parents, with altered bank details, and it will reach inboxes. For a consultancy that
discusses tuition and deposit payments, that is a direct fee-redirection fraud route.

The rollout sequence is in [DOMAIN_SECURITY.md](DOMAIN_SECURITY.md). It starts with
`p=none` plus `rua` reporting deliberately, so that legitimate senders are identified
before enforcement is tightened — moving straight to `p=reject` with no DKIM and no
sender inventory would break real company mail.

---

## 3. WHAT THE NEW PLATFORM REMOVES

For context on why the rebuild helps, once deployed:

| Legacy exposure | New platform |
|---|---|
| 7+ plugins, each a patch obligation | No plugin model. Dependencies pinned and audited in CI |
| PHP `eval()` reachable from a form parameter | No server-side templating language in request paths; input validated with Zod |
| `/wp-login.php` open to the internet | No self-hosted login. Sanity Studio behind SSO with enforced 2FA |
| Zero security response headers | CSP with nonces, HSTS, nosniff, frame-ancestors none, Permissions-Policy |
| Debug log written into the web root | Structured logs to the host sink; nothing loggable under a public path |
| Plugin versions enumerable via readme.txt | No equivalent surface |
| Database reachable from the request path | Content served from a hosted CMS API; no database in the request path |

**But note the ordering.** Items 1.1–1.4 and section 2 are live now. The rebuild is
weeks of work; the RCE is exploitable today. Fix the legacy site first.
