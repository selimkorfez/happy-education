# ADVERSARIAL VERIFICATION — "business" report, happyeducation.uk
Checks run 2026-08-20. Primary sources re-pulled independently (curl + whois + Wayback CDX + WebFetch). Anything I could not reproduce is marked REFUTED or UNVERIFIABLE.

## A. CONFIRMED (re-verified against primary source)

| Claim | Verdict | My primary source |
|---|---|---|
| Name HAPPY EDUCATION CONSULTANCY LTD, no. 11331426 | CONFIRMED | CH overview page, live pull |
| Status Active; type Private limited Company | CONFIRMED | same |
| Incorporated 26 April 2018 | CONFIRMED | same |
| Registered office 16 Upper Woburn Place, London, England, WC1H 0AF | CONFIRMED | same |
| SIC 85600 Educational support services, sole code | CONFIRMED | same |
| Last accounts made up to 28 Feb 2025; next due 30 Nov 2026 | CONFIRMED (+ next period is *28 Feb 2026*) | CH overview + filing history (AA filed 28 Nov 2025) |
| Confirmation statement last dated 28 Mar 2026, next due 11 Apr 2027 | CONFIRMED (CS01 filed 02 Apr 2026; next statement date 28 Mar 2027) | CH overview + filing history |
| Previous names: none | CONFIRMED (no "Previous company names" block on overview) | CH overview |
| Sole director KOCA, Sefa Mutlu — appointed 26 Apr 2018, British, DOB Jan 1979, 1 officer / 0 resignations | CONFIRMED | CH officers page |
| Officer ID `9dI4_hOACKlBGLdG2mRdtvpCs50`; "holds no other directorships" | CONFIRMED — appointments page: "Total number of appointments 1" | CH appointments |
| RO history: Suite 1, 596 Green Lanes N13 5RY → 244 Chase Road N14 6HH (16 Sep 2019) → 16 Upper Woburn Place (12 Nov 2025) | CONFIRMED — both AD01s present with those exact strings | CH filing history |
| Domain registered 09-Jul-2018, Ionos SE, Nominet 3rd-party match 09-Jul-2018, expiry 09-Jul-2027 | CONFIRMED verbatim | `whois -h whois.nic.uk happyeducation.uk` (run 20-Aug-2026) |
| Earliest Wayback capture 09 Oct 2021 | CONFIRMED — first CDX row `20211009185928` | `web.archive.org/cdx/search/cdx?url=happyeducation.uk*` |
| Site self-claim "Happy Education, 2018'de Londra merkezli olarak kurulmuş" | CONFIRMED verbatim | live `/anasayfa/hakkimizda/` |
| LinkedIn: Happy Education Consultancy, London GB, Founded 2018, 2-10 employees, **83 followers**, Education | CONFIRMED (self-reported) | uk.linkedin.com/company/happyeducation |
| Phone +44 7735 826785 (UK mobile 07735 prefix) | CONFIRMED — present sitewide in footer | live homepage, `/anasayfa/iletisim/` |
| admin@ + info@happyeducation.uk in export | CONFIRMED (admin ×4, info ×1) | `raw/wp/pages.ndjson` |
| Instagram `happyeducationturkiye`, Facebook `HappyEdUK`, LinkedIn `company/happyeducation` in footer | CONFIRMED on every live page fetched | live HTML |
| No YouTube / TikTok / X profile for Happy Education | CONFIRMED absent from site (0 tiktok, 0 twitter/x pages; only 6 CATS YouTube links) | `pages.ndjson` scan |
| Istanbul address "Altunizade Mah. Kısıklı Cad. No:28, Üsküdar, İstanbul" published sitewide | CONFIRMED (published only) | live footer |
| Funfact `data-value` = 20 / 200 / 150 / 500, labels Ülke / Üniversite / Lise / **Öğreci** (typo) | CONFIRMED exactly | `/anasayfa/hakkimizda/` HTML |
| Visible funfact text renders "0 +" | CONFIRMED | stripped text: `0 + Ülke 0 + Üniversite 0 + Lise 0 + Öğreci` |
| "500'den fazla öğrenciye" and "700'den fazla öğrencinin" | CONFIRMED verbatim | same page |
| "6 years of experience" / "hundreds of students" / "over a hundred universities" / "more than 15 language schools" | **CONFIRMED, but source in report is wrong** — text is 0 hits in the export and 0 in the 16 Jul 2025 capture; it exists in the **06 Feb 2025** Wayback capture of `/anasayfa/about-us/` | `web.archive.org/web/20250206124913/…/anasayfa/about-us/` |
| `/anasayfa/about-us/` now 404 | CONFIRMED (HTTP 404) | curl |
| "Address will be added here" literal placeholder on English contact page | CONFIRMED — under heading "Office Directories" on `/anasayfa/iletisim-2/` (HTTP 200) | live HTML |
| CATS socials (`cats_cambridge`, `CATSeducation`, `UCHr30LnTQx8lmEhWcBNHQCg`) belong to a partner school, on school pages only | CONFIRMED — exactly 6 pages each (colorado-state-university, university-of-nicosia-2, st-georges-university-of-grenada, dublin-international-study-centre-2, university-of-portsmouth-2, +1) | `pages.ndjson` |
| Homepage testimonial implying visa help | CONFIRMED verbatim: "vize sürecimi ve üniversite başvuru sürecimi rahatlıkla tamamladım" | `pages.ndjson` |
| Staff names Yusuf Baş, Fatih Özdemir, Semra Atilay, Akjemal Allaberdiyeva + testimonial first names DİLARA/MELİKE/ZEYNEP/FEYZA/ESRA/BAYRAM/ASLI | CONFIRMED present | `pages.ndjson`, hakkimizda |
| IAA register not machine-queryable | CONFIRMED — HTTP 200, 118 KB of Salesforce Aura shell, zero server-rendered records, only "Loading" strings | `portal.immigrationadviceauthority.gov.uk/s/adviser-register` |
| Other-entity table: 14996288 HAPPY EDUCATION LONDON LTD (Active, inc. 11 Jul 2023); 12842646 HAPPY EDUCATIONAL CONSULTANCY LTD (Active, inc. 27 Aug 2020, Birmingham); 12677357 HAPPY EDUCATION LTD (Dissolved 18 Nov 2025); 11467233 HAPPY EDUCATION LTD (Dissolved 24 Dec 2019) | ALL FOUR CONFIRMED | CH company pages |
| happyeducon.com created 2019-05-20, registrant country NP | CONFIRMED (2019-05-20T07:53:24Z, PDR Ltd, Registrant Country: NP) | `whois happyeducon.com` |
| "2026 − 2018 = 8 years" | CONFIRMED arithmetic | — |

## B. REFUTED

1. **"All 8 filings since 2019 are micro-entity" — REFUTED.** 8 accounts filings exist, but one is **AAMD, filed 05 Apr 2022: "Amended total exemption full accounts made up to 28 February 2022"** — not a micro-entity filing. Correct: 7 micro-entity AA + 1 amended total-exemption-full. Source: CH filing history. (Consequence: the report's supporting argument that "micro-entity accounts publish no turnover" is weakened — the 2022 amended full accounts may carry more detail.)

2. **"2,623 companies registered at [16 Upper Woburn Place]" — REFUTED.** Numbers I get from CH Advanced Search `registeredOfficeAddress`:
   - `16 Upper Woburn Place` → **498 results**
   - `16 Upper Woburn Place, London, WC1H 0AF` → **285 results**
   - `WC1H 0AF` → **292 results**
   None is 2,623. Worse, **the URL the report cites does not support the claim at all**: `search/companies?q="16 Upper Woburn Place"` is a *name* search and returns unrelated companies (top hit: LONDON UPPER WOBURN PLACE CENTRE LIMITED, 08737146, registered at 2 Kingdom Street W2 6BD). The qualitative point (shared/serviced address) survives; the figure does not.

3. **Content-mention counts — REFUTED across the board** (recount over `raw/wp/pages.ndjson` + `posts.ndjson`, 313 + 18 = 331 docs):

   | Report | Actual (docs containing term) | Actual (raw occurrences) |
   |---|---|---|
   | "vize danışmanlığı" on 6 pages | 6 (5 pages + 1 post) — **OK** | — |
   | "vize işlemleri" on 4 | 4 (3 pages + 1 post) — **OK** | — |
   | "vize başvurusu" on 11 | **7** (1 page + 6 posts) | — |
   | visa/immigration on **54 of 331** | **43** (`/vize|visa|immigration/i`); 48 even when widened with `göçmen|oturum` | — |
   | 13 "British Council" mentions | 10 pages / 12 docs | **16** |
   | 6 "English UK" mentions | 4 pages / 5 docs | **5** |
   | 5 "BAC" mentions | **0** | **0** |

   **"BAC" appears zero times in the entire export** — under any casing, as a word or substring; "British Accreditation Council" also 0. That row is fabricated.

4. **Phone sourced to `https://happyeducation.uk/en/` — REFUTED as a source.** `/en/` returns **HTTP 301 → `https://happyeducation.uk/en-populer-yaz-okulu-sehirleri/`**, a Turkish blog post about summer-school cities. There is no `/en/` page live, and 0 `/en/` URLs in `sitemap-urls.txt`. The phone number is real (it is in the sitewide footer), but the citation is dead. Related: the report's phrase "linked from the live site footer on **both language versions**" is unsupported — there is no separate English site; only individual English pages (e.g. `/anasayfa/iletisim-2/`, title "Contact – Happy Education").

5. **"`244 Chase Road N14 6HH` still cited by the dead about-us page" — REFUTED.** "Chase Road" occurs **0 times** in pages/posts/media/categories/users ndjson, 0 times in the 06 Feb 2025 about-us capture, and 0 times in the 16 Jul 2025 capture. The *third-party* half of the claim does hold: a live web search still surfaces "244 Chase Road, London, N14 6HH" for company 11331426 (stale search-index/D&B data). Fix the claim to "third-party directories only".

6. **"Search snippet asserting Happy Education 'is a member of British Council accredited agencies'" — NOT REPRODUCIBLE.** Targeted search returned no such snippet from any source. Treat as UNVERIFIABLE, not as an established fact. (The underlying warning is still correct — see A: all 16 "British Council" occurrences sit on partner-school pages, describing *those schools*.)

7. **"English UK member — VERIFIED ABSENT (member search 404)" — unsound inference.** `englishuk.com/en/members/member-search` 404s, but `englishuk.com/members` returns **200** and exposes a "member directory". A 404 on a guessed path is not evidence of non-membership. Downgrade to UNVERIFIABLE.

## C. UNVERIFIABLE (report asserts more confidence than the evidence supports)

- **"ZoomInfo 11-50"** — zoominfo.com/c/happy-education/1309125484 returns **HTTP 403** to me. Cannot confirm; the claimed "direct contradiction: LinkedIn 2-10 vs ZoomInfo 11-50" rests on an unretrievable page. Do not present as fact.
- **Trustpilot "NOT FOUND"** — `uk.trustpilot.com/review/happyeducation.uk` returns **HTTP 403** (bot-blocked), same as the report reported. Absence is not established; "no profile located" is the maximum defensible statement. Same for Google Business Profile and Turkish review platforms — search-negative only.
- **IAA registration** — correctly UNVERIFIED. The register genuinely cannot be queried programmatically (confirmed in A). Report's framing ("not a clearance") is right; keep it.
- **"16 Upper Woburn Place = Regus serviced/virtual office"** — the shared-address pattern is confirmed (285–498 co-registrants), but I did not independently confirm the operator is Regus at that specific street number. Mark operator UNKNOWN.
- **happyeducationlondon.com belongs to HAPPY EDUCATION LONDON LTD (14996288)** — the site is live (HTTP 200) but I found no link between site and company number. Note also 14996288's SIC is **68310 Real estate agencies**, not education, which makes the pairing less likely than the report implies.
- **Turkish legal entity UNKNOWN** — agreed, no Turkish registration verified.
- **"British Council accredits UK teaching centres, not overseas agents"** — directionally correct (Accreditation UK is the scheme for UK centres) but I did not exhaustively establish that no BC agent register exists anywhere. Soften "VERIFIED ABSENT" to "no such register located".

## D. Material items the report MISSED

- **PSC not reported.** CH PSC page: **Mr Sefa Mutlu Koca, active PSC, notified 25 April 2019, ownership of shares 75% or more**, plus a *withdrawn* "no registrable person" statement (notified 26 Apr 2018, withdrawn 25 Apr 2019). This strengthens "sole owner-director" — should be in SAFE TO PUBLISH.
- **Director identity verification status: "Verified / Verification requirements complete"** (CH officers + PSC pages) — a legitimate good-standing signal under the new CH ID-verification regime.
- **Wrong legal name on the archived English about-us**: "Happy Education **Education** Consultancy Ltd" (duplicated word, does not match the register). If that copy is migrated it is an incorrect company name — add to the do-not-carry-over list.
- **Third-party email leak in the export**: `info@managetechs.co.uk` appears once in `raw/wp/pages.ndjson` — an external vendor address published in page content. Should be stripped at migration.
- **`/en/` 301s to an unrelated Turkish blog post.** Google still indexes `https://happyeducation.uk/en/` as "Study Abroad Consultancy - Happy Education", and Wayback has a working English homepage there as recently as **19 Jan 2026**. An English homepage was silently destroyed and its URL hijacked by a slug collision (`/en/` → `/en-populer-yaz-okulu-sehirleri/`). This is both an SEO and a trust regression and belongs in the migration redirect map.
- **CH filing history shows CH01 (15 Jan 2026) and PSC04 (15 Jan 2026)** director/PSC detail changes — consistent with the Nov 2025 address move; no red flag, but the report's "registered office history" narrative omits them.

## E. Net assessment of the report

Corporate-identity core (CH company/officer/PSC/filing data, Nominet WHOIS, Wayback first capture, LinkedIn figures, on-site funfact and typo evidence, the four "other Happy Education" company numbers) is **accurate and reproducible** — unusually clean, no hallucinated company details or register false-positives.

The failures cluster in **derived counts and citation hygiene**: one fabricated row (BAC ×5, actual 0), one fabricated register figure (2,623 vs 285–498), three inflated content counts (54/13/11 vs 43/16/7 — note two of these are *raw-occurrence vs document-count* confusions, one is not), one dead source URL used as a citation (`/en/`), one misattributed quote source (about-us "6 years" text is in the Feb-2025 archive, not the export or the Jul-2025 archive), one false stale-address claim (Chase Road on-site: 0), and two "VERIFIED ABSENT" labels resting on 403s/404s rather than evidence.

**The three headline recommendations survive intact**: (1) IAA/visa exposure is real and unresolved — the visa marketing language is confirmed present (43 docs, incl. explicit "vize danışmanlığı" ×6) and IAA registration genuinely cannot be checked from outside; (2) no trust metric is corroborable and the on-site figures self-contradict (200+ universities vs "over a hundred"; 500 vs 700 vs "hundreds" — both sides of that contradiction now confirmed against primary sources); (3) all British Council / English UK mentions belong to partner schools, not to Happy Education.

Files used: `/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/audit/raw/wp/pages.ndjson`, `…/raw/wp/posts.ndjson`, `…/sitemap-urls.txt`; fetched evidence cached at `/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/ch_overview.html`, `ch_officers.html`, `ch_filing-history.html`, `ch_persons-with-significant-control.html`, `ch_appointments.html`, `ch_adv.html`, `co_14996288.html`, `co_12842646.html`, `co_12677357.html`, `co_11467233.html`, `wb_about.html`, `wb_about2.html`, `wb_en.html`, `iaa.html`.