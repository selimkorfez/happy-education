# Domain and email security

**Owner:** Happy Education (client), with the build team advising.
**Applies to:** `happyeducation.uk` DNS, the registrar account, the mail senders and the
Cloudflare configuration. **None of this lives in this repository.**
**Baseline measured:** 20 August 2026. Re-measure before acting; DNS changes.

> This is the most important operational document in the project. Every step below is
> work done outside the codebase, and none of it is delivered by deploying the new
> website. Treat it as a separate, parallel workstream with its own owner and dates.

---

## 0. Why this document exists

### The root cause, in one paragraph

Happy Education reported a phishing problem. The domain's email authentication posture
explains it without requiring a hacked website. `happyeducation.uk` publishes an SPF
record that ends in `~all` (softfail, so a forged message is marked at most, never
rejected), publishes **no DKIM key at all** (39 to 40 common selectors were probed and
every one returned nothing), and its DMARC record is not a record at all: `_dmarc.happyeducation.uk`
is a **CNAME to `dmarc.ionos.co.uk`**, a shared IONOS-controlled name that resolves to
`v=DMARC1; p=none;`. The consequences compound. Anyone on the internet can send mail
with `From: admin@happyeducation.uk` or `From: info@happyeducation.uk`, both of which are
published on the current website, and it will be delivered. Because the policy is `p=none`
with no `rua=` address, no receiving mail provider reports the abuse to anyone, so there
is no forensic trail for the incidents already reported. And because the policy is a CNAME
to a shared record, Happy Education **cannot change its own policy** until that CNAME is
removed, and IONOS can change it underneath the domain at any time. For a consultancy that
discusses tuition deposits and fee payments with students and parents, this is a direct
route to fee-redirection fraud: a convincing invoice from a genuinely spoofed address,
with altered bank details.

### Why the website rebuild does not fix it

The rebuild replaces the application. Spoofed email does not touch the application. A
message forged as `admin@happyeducation.uk` never contacts any web server, so no header,
no Content Security Policy and no deployment can influence whether it is delivered. The
controls that decide it are DNS records (SPF, DKIM, DMARC) and the configuration of the
mail senders. Launching the new site with the DNS unchanged leaves the domain exactly as
spoofable as it is today. **Start section 1 now, in parallel with the build.**

### One caveat about the "not compromised" conclusion

The content audit found no injected markup in any of the 331 pages or 964 media items, and
concluded that the phishing is email-borne rather than site-borne. The adversarial review
then established that the legacy host runs Cost Calculator Builder PRO 4.0.3, which is
vulnerable to CVE-2026-14900, an unauthenticated remote code execution flaw with the
exploitation precondition satisfied on the live homepage. A content scan cannot see an
on-disk PHP backdoor. So the email posture is the **leading environmental cause and must be
fixed regardless**, but it is not proof that the host is clean. The host-level actions are
in `docs/URGENT-LEGACY-SITE.md` and must run in parallel with this document, not instead of it.

---

## 1. Measured baseline, 20 August 2026

| Item | Observed value | Verdict |
|---|---|---|
| Nameservers | `ns1037.ui-dns.com`, `ns1111.ui-dns.biz`, `ns1088.ui-dns.de`, `ns1044.ui-dns.org` (IONOS) | Cloudflare is **not** in front of the domain |
| A / AAAA | `217.160.0.135` / `2001:8d8:100f:f000::228` | Origin IP directly exposed |
| MX | `mx00.ionos.co.uk`, `mx01.ionos.co.uk` (pref 10) | IONOS hosted mailboxes |
| SPF | `v=spf1 include:_spf-eu.ionos.com ~all` | **Softfail.** 1 of 10 DNS lookups used; the include expands to `ip4`/`ip6` only and terminates in `?all`, so it adds no lookups and does not broaden the outer record |
| DMARC | `_dmarc.happyeducation.uk` **CNAME** `dmarc.ionos.co.uk` which is `v=DMARC1; p=none;` | **Not client-controlled.** No `rua`, no `ruf`, no enforcement |
| DKIM | No record at 39 to 40 probed selectors (`default`, `ionos`, `ionos1/2`, `s1/s2`, `selector1/2`, `k1/k2`, `google`, `mail`, `dkim`, `smtp`, ESP selectors, and more) | **Absent entirely** |
| CAA | none | Any certificate authority in the world may issue for this domain |
| DNSSEC | no `DNSKEY`, no `DS`, no `RRSIG`, no `AD` flag | Not signed |
| MTA-STS | no `_mta-sts` TXT, no policy host | Absent |
| TLS-RPT | no `_smtp._tls` TXT | Absent |
| Registrar | IONOS SE, Nominet `.uk`. Registered 09 July 2018, expires 09 July 2027 | Renewal is not imminent, but see section 7 |
| TLS certificate | Sectigo **DV wildcard** `*.happyeducation.uk`, valid 16 Jan 2026 to 30 Jan 2027, TLS 1.3 | Healthy. Note DV and wildcard: one key covers every subdomain |

### Commands used, for re-verification

```bash
dig +short happyeducation.uk TXT
dig +short _dmarc.happyeducation.uk CNAME
dig +short _dmarc.happyeducation.uk TXT
dig +short dmarc.ionos.co.uk TXT
dig +short happyeducation.uk MX
dig +short happyeducation.uk NS
dig +short happyeducation.uk CAA
dig +short happyeducation.uk DNSKEY
dig +short happyeducation.uk DS @a.nic.uk
dig +short _mta-sts.happyeducation.uk TXT
dig +short _smtp._tls.happyeducation.uk TXT
# DKIM: one probe per selector
for s in default ionos ionos1 ionos2 s1 s2 selector1 selector2 k1 k2 google mail dkim smtp; do
  printf '%-12s ' "$s"; dig +short "$s._domainkey.happyeducation.uk" TXT | head -1; echo
done
```

Record every result with its date in the change log at the end of this document.

---

## 2. The DMARC rollout, in order

Each step has a gate. **Do not start a step until the previous gate is met.** The whole
sequence takes roughly ten to twelve weeks and it is deliberately slow: the failure mode of
rushing is that genuine offer letters, CAS correspondence and payment instructions from
Happy Education stop being delivered to the families who need them.

### Step 1. Take ownership of `_dmarc` (day 0, about 30 minutes)

Delete the CNAME `_dmarc.happyeducation.uk -> dmarc.ionos.co.uk` and publish a TXT record
in its place. Until this is done, no other DMARC work is possible: a name cannot hold a
CNAME and a TXT record at the same time, and the current policy belongs to IONOS.

```
_dmarc.happyeducation.uk.  TXT  "v=DMARC1; p=none; rua=mailto:<rua-address>; ruf=mailto:<ruf-address>; fo=1; adkim=r; aspf=r; pct=100"
```

Notes:
- `p=none` is intentional. This step changes **nothing** about delivery. It only turns on
  reporting. Nothing can break.
- `rua=` is the point of the whole step. Use a DMARC report-processing service mailbox,
  not a human mailbox: aggregate reports are gzipped XML and are unreadable by hand.
- `ruf=` (forensic or failure reports) is optional and many providers never send it. If it
  is used, note that failure reports can contain message headers and therefore personal
  data, so name the processor in the privacy notice and keep the retention short.
- `adkim=r; aspf=r` (relaxed alignment) is correct while subdomains and third-party senders
  are still being discovered. Tighten later, not now.
- If the `rua` address is at a different domain, that domain must publish an authorisation
  record: `happyeducation.uk._report._dmarc.<their-domain>  TXT  "v=DMARC1"`. Most report
  processors do this for you; verify it, because without it your reports are silently dropped.

**Gate:** `dig _dmarc.happyeducation.uk TXT` returns your record and no CNAME remains.

### Step 2. Inventory every legitimate sender (week 1, alongside step 3)

Nothing may be enforced until this list is complete and each row is either authenticated or
retired. Start from the audit's findings and add anything the business names.

| # | Sender | Status at audit | What must be confirmed |
|---|---|---|---|
| 1 | IONOS hosted mailboxes (`mx00`/`mx01.ionos.co.uk`) | **Confirmed** in use | Covered by the existing SPF include. Needs DKIM enabling in the IONOS control panel |
| 2 | `admin@happyeducation.uk`, `info@happyeducation.uk` | **Confirmed** published on the site | Which are actually in use, and who reads them |
| 3 | Website form mail from the legacy WordPress host (PHP `mail()`, MetForm notifications) | **Inferred** | Whether the web host's egress IP falls inside `_spf-eu.ionos.com`. This is the classic DMARC breaker. The new platform removes it: transactional mail goes through an authenticated API sender instead |
| 4 | Salesforce (org `00D8d00000ArP1E`) | Integration confirmed; **sending status unknown** | Whether Salesforce sends any mail as `@happyeducation.uk`. If yes, it needs `include:_spf.salesforce.com` plus a Salesforce DKIM key |
| 5 | Mailchimp | **Unknown** | Whether any list is active. If yes, authenticate it or shut it down |
| 6 | Google | Search Console verification only; MX is IONOS, not Workspace | Confirm there is no Gmail "send mail as" path |
| 7 | Any accountant, recruiter, scheduling or e-signature tool that mails "on behalf of" the company | **Not yet inventoried** | Ask the business directly. These are what break rollouts |
| 8 | New platform transactional mail (enquiry acknowledgements, receipts) | To be introduced | Authenticate the new provider before it sends anything real |

Ask the business two direct questions: *what sends email as us that is not a person typing
in a mailbox?* and *what have we signed up to in the last five years that emails our
students?*

**Gate:** every row is either "authenticated" or "retired", with a named owner.

### Step 3. Publish DKIM for every sender (weeks 2 to 5)

This is the single biggest gap and the highest-value step. DKIM survives forwarding;
SPF does not. Without DKIM, a legitimate message forwarded by a university mailbox or a
mailing list fails SPF alignment and would be rejected once policy is tightened.

1. **IONOS mailboxes first.** Enable DKIM in the IONOS control panel and publish the
   selector records it gives you. Confirm with `dig +short <selector>._domainkey.happyeducation.uk TXT`.
2. **Then every third-party sender** from step 2, each with its own selector.
3. **Verify alignment, not just passing.** A message can pass DKIM with `d=` set to the
   provider's own domain and still fail DMARC, because DMARC requires the `d=` domain to
   align with the visible `From:` domain. Send a test to a mailbox that shows
   `Authentication-Results` and read it: you want `dkim=pass header.d=happyeducation.uk`,
   not `header.d=some-esp.example`.
4. Use a **2048-bit key** where the provider offers a choice, and record the selector,
   creation date and owner for each key so rotation is possible later.

**Gate:** aggregate reports show DKIM passing **and aligned** for every sender that carries
meaningful volume.

### Step 4. Read the reports (weeks 1 to 4, continuous)

The reports are the evidence base for every later decision. What to look for:

- **Sources you do not recognise.** Some are spoofing. Some are a forgotten mail tool that
  is genuinely yours. Do not tighten anything until each meaningful source is classified.
- **Volume distribution.** A source with three messages a month is not a reason to delay;
  a source with 20% of volume is.
- **Forwarding failures.** SPF fails on forwarding by design. If DKIM is aligned, DMARC
  still passes. This is why step 3 comes before step 5.

**Gate to advance:** at least four weeks of continuous reports, and **98% or more of
legitimate volume passing DMARC with alignment**. Do not advance on a good week; advance on
a stable month.

### Step 5. Tighten SPF to `-all` (week 5, only after DKIM is live)

Change:

```
happyeducation.uk.  TXT  "v=spf1 include:_spf-eu.ionos.com <any additional includes> -all"
```

Rules:
- Only after step 3 and step 4 gates are met.
- Watch the **10 DNS lookup limit**. The current record uses 1 of 10, because
  `_spf-eu.ionos.com` expands to literal `ip4`/`ip6` mechanisms. There is ample headroom,
  but each new `include:` consumes at least one lookup and exceeding ten makes the record
  `permerror`, which fails everything. Count before publishing.
- Publish `v=spf1 -all` on any subdomain and any parked hostname that never sends mail.
- Keep SPF and DKIM both live. `-all` alone is not the goal; alignment is.

**Gate:** one week at `-all` with no increase in legitimate failures in the reports.

### Step 6. Move to `p=quarantine`, ramped (weeks 6 to 9)

Raise the percentage in stages, holding at least one full week at each and reading the
reports between each change.

```
p=quarantine; pct=25   ->  p=quarantine; pct=50   ->  p=quarantine; pct=100
```

If any legitimate mail fails, **step back one stage immediately**, fix the sender, and
resume. Stepping back is a normal part of the rollout, not a failure.

Add `sp=` explicitly once the parent policy is stable, so subdomains inherit deliberately
rather than by accident.

### Step 7. Move to `p=reject` (weeks 10 to 12)

```
_dmarc.happyeducation.uk.  TXT  "v=DMARC1; p=reject; sp=reject; pct=100; rua=mailto:<rua-address>; fo=1; adkim=s; aspf=s"
```

Tighten `adkim`/`aspf` to strict (`s`) only if reports show every sender aligns on the exact
domain rather than a subdomain. If anything aligns on a subdomain, leave relaxed.

Keep `rua=` forever. Reporting is not a rollout phase, it is a permanent control: it is how
you find out that a new marketing tool started sending as your domain.

### Why not jump straight to `p=reject`

It is tempting: the domain is being spoofed today, and `p=reject` is what stops it. It would
also, on current configuration, break real mail. There is **no DKIM**, so alignment would
rest entirely on SPF, and SPF fails whenever a message is forwarded, which is exactly what
happens when a student forwards an offer letter to a parent or a university mailbox relays
it onward. The sender inventory is **incomplete**: at least three plausible senders (website
form mail, Salesforce, Mailchimp) are unresolved, and any one of them sending unauthenticated
mail would have it rejected outright. And there is **no reporting**, so you would not find
out from the reports; you would find out from a student who never received a payment
deadline. Rejected mail is not deferred or delivered to spam. It is gone. The staged path
above reaches the same destination with the failures surfacing in reports rather than in
lost enrolments.

**Interim mitigation, from day 0 and independent of all of the above:** tell students and
parents through a channel that is not email (WhatsApp, phone, a banner on the site) that
Happy Education will never change bank details by email, and give them a phone number to
verify any payment instruction. Enforcement takes about twelve weeks. Fee-redirection fraud
does not wait twelve weeks.

---

## 3. CAA records

No CAA record exists, which means any certificate authority may issue a certificate for
this domain. Publishing CAA narrows that to the authorities you actually use, and the
`iodef` tag gives you a report when someone else tries.

Publish **after** the hosting decision is final, and make sure the list covers every CA in
the chain you will actually depend on:

```
happyeducation.uk.  CAA  0 issue "letsencrypt.org"
happyeducation.uk.  CAA  0 issue "pki.goog"
happyeducation.uk.  CAA  0 issue "sectigo.com"
happyeducation.uk.  CAA  0 issuewild ";"
happyeducation.uk.  CAA  0 iodef "mailto:<security-contact>"
```

Practical warnings:
- **Confirm the CA list against your providers before publishing.** Vercel and Cloudflare
  both issue certificates on your behalf and the issuing CA can change. Getting this wrong
  causes silent renewal failures that surface as an expired certificate months later.
- `issuewild ";"` forbids new wildcard issuance. Only set it once the current Sectigo
  wildcard is no longer being renewed, otherwise renewal will fail.
- Keep the `iodef` mailbox monitored by a person.

---

## 4. DNSSEC

Not enabled today. Without it, DNS answers for this domain can be forged by cache
poisoning, which is a plausible precursor to a convincing phishing page on a lookalike
host.

Enable it at whichever provider is authoritative after the DNS decision in section 6:

- **Staying with IONOS:** enable DNSSEC in the IONOS DNS panel. As registrar and DNS host,
  IONOS publishes the DS record at Nominet for you.
- **Moving to Cloudflare:** move DNS first, confirm resolution, then enable DNSSEC in
  Cloudflare and copy the DS record it generates into the IONOS registrar panel.

**Ordering rule, and it matters:** never change nameservers while a DS record is published.
Remove the DS record first, wait for its TTL to expire, then change nameservers, then
re-enable. A DS record pointing at keys the new nameservers do not hold makes the domain
resolve as `SERVFAIL` for every validating resolver, which is a total outage of both the
website and email.

---

## 5. Registrar security

| Control | Action | Notes |
|---|---|---|
| Registrar account MFA | Enable multi-factor authentication on the IONOS account, using an authenticator app or hardware key rather than SMS | The registrar account is the master key to the domain. Anyone who holds it holds the website and the email |
| Transfer lock | Enable the transfer lock in the IONOS domain panel | For `.uk` this restricts the Nominet tag change. Confirm with IONOS exactly which protection is available for `.uk`, as it differs from generic TLDs |
| Nominet account | Confirm whether a Nominet Online Services account exists for the registrant, and secure it with MFA if so | Registrant-level access can move a `.uk` domain independently of the registrar |
| Registrant contact | Point the registrant email at a monitored company mailbox, never a personal address, and never one hosted on the domain itself | A registrant address inside the domain is unreachable when the domain breaks |
| Expiry | Expires 09 July 2027. Enable auto-renew and put a calendar reminder at 60 days before | |
| Access review | Record who holds registrar credentials. Remove any former agency or contractor access | The previous site was built by a third party whose address appears in the content |

---

## 6. Cloudflare configuration

Cloudflare is not currently in front of the domain: nameservers are IONOS and the origin IP
is directly exposed. The target topology puts Cloudflare in front of Vercel. The full
interaction rules, especially caching, are in `docs/DEPLOYMENT.md`; the security-relevant
settings are here.

### DNS and TLS

- Move DNS to Cloudflare, proxying (orange cloud) the apex and `www` only. **Do not proxy**
  the `MX` hosts or any mail-related record; proxying breaks mail delivery.
- SSL/TLS mode **Full (strict)**. Anything less allows an unauthenticated hop between
  Cloudflare and the origin.
- Minimum TLS version 1.2. Enable TLS 1.3, Automatic HTTPS Rewrites and Always Use HTTPS.
- HSTS: enable **only after** the certificate and every subdomain are verified working.
  See the HSTS staging note in `docs/DEPLOYMENT.md`. Enabling `includeSubDomains` before
  every subdomain serves valid HTTPS locks visitors out of those subdomains for the whole
  `max-age`.

### WAF and bot controls

- Enable the **Cloudflare Managed Ruleset** and the **OWASP Core Ruleset**, starting in log
  mode for one week, then enforcing. Review the log for false positives against the enquiry
  and consultation forms before enforcing.
- Enable **Bot Fight Mode** (or Super Bot Fight Mode on a paid plan). Explicitly allow
  verified search engine crawlers, because the whole SEO migration depends on Googlebot and
  Bingbot being able to crawl freely.
- Block or challenge traffic to legacy WordPress paths that no longer exist and only ever
  attract scanners: `/wp-login.php`, `/wp-admin/*`, `/xmlrpc.php`, `/wp-json/*`,
  `/wp-content/*`. These should 404 on the new platform anyway; blocking them at the edge
  keeps the noise out of the logs and out of the origin.
- **Turnstile** on the enquiry, consultation and appointment forms. The application already
  degrades gracefully when Turnstile is not configured (`isConfigured.turnstile()`), so keys
  can be added without a code change.

### Rate limiting

Targeted rules, not a blanket limit. Suggested starting points, to be tuned from real
traffic in the first month:

| Rule | Path | Threshold | Action |
|---|---|---|---|
| Form submission | `/api/enquiry`, `/api/consultation`, `/api/appointment` | 5 requests per minute per IP | Managed challenge, then block on repeat |
| Payment intent creation | `/api/checkout*` | 10 per minute per IP | Managed challenge |
| Locale switch | `/api/locale` | 60 per minute per IP | Block. This is a redirect endpoint; a human never needs more |
| Search | `/<locale>/search` | 30 per minute per IP | Managed challenge |
| Site-wide floor | `/*` | 300 per minute per IP | Managed challenge, for volumetric abuse only |

**Never rate-limit or challenge the webhook endpoints** (`/api/webhooks/stripe`,
`/api/webhooks/sanity`). They are called by machines whose IPs you do not control, and a
challenge page is not something Stripe or Sanity can solve. Protect those with signature
verification instead (see `docs/SECURITY.md`), and add explicit skip rules so the WAF and
rate limiter do not interfere.

### Caching: the one rule that must not be broken

**`/api/*` must bypass the Cloudflare cache entirely.** Create a cache rule matching
`/api/*` with **Bypass cache** set, ahead of any other cache rule. The origin already sends
`Cache-Control: no-store, no-cache, must-revalidate, max-age=0` on `/api/*` (set in
`next.config.ts`), and Cloudflare should respect it, but an explicit bypass rule removes the
risk that a future "Cache Everything" page rule quietly starts serving one visitor's API
response to another. A cached POST response or a cached personalised redirect is a data leak,
not a performance problem.

Also: disable Cloudflare's HTML minification, Rocket Loader and any script-rewriting
feature. They rewrite or inject script and will break a nonce-based Content Security Policy.

---

## 7. MTA-STS and TLS-RPT

Both absent. They stop an active attacker downgrading inbound mail to cleartext and give
you a report when TLS negotiation fails.

**TLS-RPT** is a single record and can be published immediately:

```
_smtp._tls.happyeducation.uk.  TXT  "v=TLSRPTv1; rua=mailto:<tls-report-address>"
```

**MTA-STS** needs a DNS record plus a policy file served over HTTPS from a dedicated
hostname:

```
_mta-sts.happyeducation.uk.  TXT  "v=STSv1; id=20260901000000"
mta-sts.happyeducation.uk.   CNAME/A -> wherever the policy file is served
```

`https://mta-sts.happyeducation.uk/.well-known/mta-sts.txt`:

```
version: STSv1
mode: testing
mx: mx00.ionos.co.uk
mx: mx01.ionos.co.uk
max_age: 604800
```

Start in `mode: testing`, read the TLS reports for two to four weeks, then move to
`mode: enforce`. The `id` value must change every time the policy file changes. Note the
policy host needs its own valid certificate, and the `mx:` list must be kept in step with
the real MX records: an out-of-date MTA-STS policy in enforce mode rejects your own mail.

**BIMI** is worth considering only after `p=quarantine` or stronger is stable, and it needs
a Verified Mark Certificate plus an SVG Tiny PS logo. Note that no vector logo currently
exists for Happy Education (see `docs/MIGRATION.md`), so BIMI has a prerequisite that is
already on the asset request list.

---

## 8. Ordered checklist

Print this. Tick items with a date and a name.

**Day 0**
- [ ] Remove the `_dmarc` CNAME; publish own `p=none` TXT with `rua=`
- [ ] Confirm reports are arriving at the `rua` address within 48 hours
- [ ] Enable registrar MFA and the transfer lock
- [ ] Publish TLS-RPT
- [ ] Issue the non-email advisory to students and parents about payment verification
- [ ] Run the legacy-host actions in `docs/URGENT-LEGACY-SITE.md` (separate but same day)

**Week 1**
- [ ] Complete the sender inventory (section 2, step 2), with an owner per row
- [ ] Enable DKIM on the IONOS mailboxes
- [ ] Decide DNS provider (stay at IONOS, or move to Cloudflare)

**Weeks 2 to 4**
- [ ] DKIM live for every third-party sender
- [ ] Verify alignment for each sender from real `Authentication-Results` headers
- [ ] Enable DNSSEC (respecting the ordering rule in section 4)
- [ ] Publish CAA once the CA list is confirmed
- [ ] Cloudflare in front, WAF in log mode, `/api/*` cache bypass rule in place

**Week 5**
- [ ] Gate check: four weeks of reports, 98% or more legitimate volume passing and aligned
- [ ] SPF to `-all`; publish `v=spf1 -all` on non-sending subdomains
- [ ] WAF to enforce mode after false-positive review

**Weeks 6 to 9**
- [ ] `p=quarantine; pct=25`, hold one week
- [ ] `p=quarantine; pct=50`, hold one week
- [ ] `p=quarantine; pct=100`, hold one week
- [ ] MTA-STS in testing mode

**Weeks 10 to 12**
- [ ] `p=reject; sp=reject`
- [ ] Consider strict alignment
- [ ] MTA-STS to enforce
- [ ] Schedule a quarterly review: reports read, senders re-inventoried, keys rotated

---

## 9. Change log

Append one row per change. This is the record that makes a rollback possible and tells the
next person why a record looks the way it does.

| Date | Record changed | From | To | Made by | Verified by | Rollback |
|---|---|---|---|---|---|---|
| 2026-08-20 | (baseline measurement, no change) | | | Audit | | n/a |
