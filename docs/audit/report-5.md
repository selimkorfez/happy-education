# Happy Education — content inventory & migration classification

## FILES WRITTEN

| Path | Rows | Contents |
|---|---|---|
| `/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/audit/content-inventory.csv` | 336 | `old_path,wp_id,type,words,language,bucket,target_content_type,target_path,merge_canonical,reason` — all 331 docs + 5 sitemap-only URLs |
| `.../audit/redirects-draft.csv` | 395 | `old_url,new_url,status,reason` — 336 required + 43 legacy aliases + 16 currently-404 internal targets |
| `.../audit/institutions-extracted.json` | 313 | 34 fields/page incl. provenance (`fieldProvenance`: `section-heading` vs `inline-label`) |
| `.../audit/blog-posts.json` | 18 | per-post topic, clusters, EN/TR slugs, re-verification flags |
| working files: `.../scratchpad/work/{lang,inventory,quality,dup-pairs,dup-clusters}.json` | | language scoring, quality issue lists, similarity matrices |

## 1. BUCKET COUNTS (331 documents)

| Bucket | n | Notes |
|---|---|---|
| **KEEP** | 279 | |
| **REWRITE** | 21 | |
| **MERGE** | 14 | all 14 have a named canonical |
| **DROP-301** | 3 | `/salesforce/`→`/tr/iletisim/`, `/anasayfa/blog/`→`/tr/blog/`, `/yaz-okullari/`→`/tr/yaz-okullari/` |
| **DROP-410** | 14 | 10 plugin artefacts + 4 theme-demo/utility pages |

Plus 5 sitemap-only URLs absent from the WP export (4× DROP-410 Eduma demo posts + `/sitemap.html`; `/home/blog/`→DROP-301).

**KEEP+REWRITE by target content type (300 docs):** institution/university 126 · institution/languageSchool 53 · summerProgramme 52 · page 27 · article 18 · languageSchool (brand hub) 12 · institution/boardingSchool 10 · tour 1 · legalPage 1.

**DROP-410 detail** — WooCommerce `/cart/ /checkout/ /my-account/`; LearnPress `/courses/ /instructor/ /instructors/ /lp-profile/ /lp-checkout/ /become_a_teacher/ /term_conditions/`; theme demo `/anasayfa/price/ /anasayfa/price-disc/ /anasayfa/testimonial/`; `/thanks/`; `/sitemap.html` + 3 Eduma demo posts. **`/cart/` currently returns HTTP 200 live.**

**Not dropped, contrary to the brief's expectation:** the three `/elementor-sayfa-NNNNN/` pages are **not** orphan builder junk — they hold real 174–384-word institution profiles (University of Western Australia; Universal Higher Education Melbourne; Oxford International London Greenwich). REWRITE + re-slug, do not 410.

## 2. DUPLICATION — measured

**Exact slug collisions (same slug, two paths): 7**
`bireysel-yaz-okullari` · `colorado-state-university` · `grup-yaz-okullari` · `kaplan-international` · `london-kings-college` · `university-college-london` · `university-of-greenwich`

**Root-level page duplicating a nested page (slug or normalised title): 8 pairs**

| root | nested |
|---|---|
| `/grup-yaz-okullari/` 416w | `/yaz-okullari/grup-yaz-okullari/` 35w |
| `/bireysel-yaz-okullari/` 529w | `/yaz-okullari/bireysel-yaz-okullari/` 31w |
| `/university-of-greenwich/` 161w | `/universiteler/university-of-greenwich/` 178w |
| `/university-college-london/` 179w | `/yaz-okullari/grup-yaz-okullari/university-college-london/` 35w |
| `/london-kings-college/` 181w | `/yaz-okullari/grup-yaz-okullari/london-kings-college/` 175w |
| `/north-london-grammar-school/` 181w | `/yatili-okullar2/north-london-grammar-school-2/` 268w |
| `/kaplan-international/` 312w | `/dil-okullari/kaplan-international/` 188w |
| `/colorado-state-university/` 236w | `/universiteler/colorado-state-university/` 98w |

⚠ **Three of these eight are NOT duplicates** — `university-of-greenwich`, `university-college-london`, `north-london-grammar-school` (and, outside this list, `university-of-westminster`, `university-of-kent`, `tufts-university`, `st-giles-cambridge`, `st-giles-oxford`): the root page is a **summer programme hosted on the campus**, the nested page is the **degree/boarding institution**. Verified by body text ("… Yaz Okulu"). Auto-merging on title is the single most likely way to destroy content in this migration.

**"-2" suffixed slugs: 59** (58 ending `-2`, 1 ending `2`). Distribution: `/universiteler/` 42 · `/yatili-okullar2/` 8 · `/yaz-okullari/bireysel-yaz-okullari/` 3 · root 3 · other 3.
- **9 have a surviving unsuffixed twin** (`football-academy-brighton`, `st-giles-oxford`, `st-giles-cambridge`, `english-path-dublin`, `iletisim`, `guildhouse-school-london`, `cats-cambridge`, `north-london-grammar-school`, `oxford-international-college`).
- **49 are orphans** — WordPress appended `-2` at creation because the slug was momentarily taken, then the original was deleted. All 49 get a clean slug on migration (`/universiteler/university-of-sussex-2/` → `/tr/universiteler/ingiltere/university-of-sussex/`). Free SEO win, zero content risk.

**Near-duplicate body text (4-gram Jaccard ≥ 0.30): 28 pairs in 13 clusters covering 34 documents.**
Top: `/yatili-okullar2/oxford-international-college-2/` vs `…-brighton/` **J=1.00 byte-identical**; `university-of-nicosia-2` vs `st-georges-university-of-grenada` J=0.79 (two empty legacy husks); **`university-of-manchester` vs `manchester-metropolitan-university-2` J=0.76 / containment 0.92** — MMU's page describes the wrong institution; `kaplan-international-los-angeles` vs `…-chicago` J=0.74 / C=0.99. Largest cluster (n=6): the Bucksmore-style summer camps.

**Boilerplate — the "median 181 words ⇒ templated" hypothesis is only half right.** % of a page's n-grams that also appear in ≥1 other page of the same family:

| family | n | shared 3-grams (median) | shared 5-grams (median / p90) |
|---|---|---|---|
| UK universities `/universiteler/*` | 76 | 19.0% | **3.0% / 10.6%** |
| Non-UK universities (root) | 48 | 20.6% | 4.3% / 8.8% |
| Boarding `/yatili-okullar2/*` | 11 | 17.9% | 6.6% / 100% |
| Language schools `/dil-okullari/*` | 63 | 31.1% | **15.0% / 64.7%** |
| Summer programmes (all) | 59 | 46.6% | **20.2% / 71.7%** |
| Blog posts | 18 | 10.3% | 0.9% / 3.8% |

Component split of the 76 UK university pages (12,412 words total, mean 163/page): **88.3% free descriptive prose, 11.7% structured fact block, 0.1% CTA chrome.** So university pages are short because they are *genuinely short*, not because they are templated — they migrate as real editorial. Summer and language-school pages *are* templated: one 40-word "Kurs Seçenekleri / Konaklama Seçenekleri" string appears verbatim in **20 documents**.

## 3. STRUCTURED-DATA COVERAGE (what migration can populate vs what starts empty)

| field | all 313 | UK unis (76) | lang schools (63) | summer (27) | boarding (11) |
|---|---|---|---|---|---|
| country | 76% | 96% | 51% | 63% | 18% |
| city | 40% | **99%** | 6% | 0% | 0% |
| ranking | 33% | **78%** | 0 | 0 | 0 |
| founded | 38% | **92%** | 0 | 0 | 0 |
| featured departments | 36% | **87%** | 0 | 0 | 0 |
| accommodation | 40% | 0 | **73%** | 63% | **100%** |
| programmes / course types | 19% | 0 | **51%** | 0 | **64%** |
| fees | 14% | 13% | 3% | 0 | **82%** |
| dates | 12% | 0 | 0 | 15% | 0 |
| age range | 14% | 0 | 0 | 41% | 9%* |
| lessons per week | 16% | 0 | 2% | **78%** | 0 |
| group size | 5% | 0 | 0 | 11% | 0 |
| IELTS | 2% | 7% | 0 | 0 | 0 |
| hero image | 78% | **100%** | 43% | **100%** | **100%** |
| logo image | 23% | **86%** | 0 | 0 | 0 |
| **official website URL** | **0%** | **0%** | **0%** | **0%** | **0%** |
| any image with alt text | **3%** | 0% | 0% | 22% | 0% |

\* free-text mentions like "13–18 yaş" captured in `ageRangeMentions`.

**`officialWebsite` is 0/313.** The entire site contains only 25 external links: 8 Facebook, 8 Instagram, 6 YouTube, 2 LinkedIn, 1 Companies House, 1 Google Maps. Every institution's official URL must be sourced manually.

Media: **964 items, 640 referenced, 324 orphaned (34%); 12 items (1.2%) have alt text; 98 files >1 MB.**

## 4. LANGUAGE — English is essentially a greenfield authoring project (CONFIRMED)

| | docs | words |
|---|---|---|
| Turkish | 272 (82%) | 70,988 |
| English | 38 (11%) | 5,860 |
| Mixed | 1 (`/salesforce/`) | 290 |
| Empty/stub (<15w) | 20 | 117 |
| **total** | **331** | **77,255** |

**English is 7.6% of the word count**, and 19 of the 38 English documents are under 100 words (nav stubs and legacy `Address:/Prices:/IELTS: + APPLY NOW` husks). **Genuine English prose = 19 documents / 5,030 words**, and it is almost entirely US/Canada/NZ language-school copy (EC English, Kaplan, LSI, English Path) that reads as provider marketing material — **check its provenance for copyright before reuse**. All 18 blog posts are Turkish. All UK university, boarding, tour, About, Contact(TR), and privacy content is Turkish.

Practical consequence: **the `/en/` tree starts at ~0 usable words.** Budget ~77k words of translation/transcreation, not "a bit of tidying". Only `/anasayfa/iletisim-2/` is a purpose-built English page, and it contains the literal placeholder "Address will be added here".

## 5. THE 18 BLOG POSTS

All Turkish, author `root`, category `Uncategorized`, **all 18 have `featured_media: 0` — zero featured images**, and **none of them appear in `post-sitemap.xml`** (which lists only `/home/blog/` and 3 Eduma demo posts). They are effectively invisible to search today.

| # | Date | W | Slug (current) | Topic | EN slug | TR slug | Cluster | Time-sensitive claims → RE-VERIFY |
|---|---|---|---|---|---|---|---|---|
| 1 | 2025-10-07 | 718 | `yurtdisina-cikmadan-once-…-7-hazirlik` | 7-step pre-departure checklist | `/en/blog/7-things-to-do-before-you-study-abroad/` | `/tr/blog/yurtdisina-cikmadan-once-yapilmasi-gereken-7-hazirlik/` | pre-departure | per-country visa document lists; health-insurance requirements |
| 2 | 2025-10-07 | 958 | `en-populer-yurtdisi-egitim-ulkeleri-…` | UK vs Canada vs Malta vs Ireland | `/en/blog/uk-vs-canada-vs-malta-vs-ireland-for-study-abroad/` | `/tr/blog/ingiltere-kanada-malta-irlanda-karsilastirmasi/` | destination-comparison | relative cost ordering; "Canada offers wide scholarship/internship options"; **title has a trailing comma** |
| 3 | 2025-10-07 | 828 | `yurtdisinda-dil-egitimi-almanin-kariyerinize-10-faydasi` | 10 career benefits | `/en/blog/10-career-benefits-of-studying-english-abroad/` | (unchanged) | language-study-value | unsourced "raises salary expectations" claim |
| 4 | 2025-10-07 | 890 | `yurtdisi-egitim-danismanligi-neden-onemli` | Why use a consultancy | `/en/blog/why-use-a-study-abroad-consultant/` | (unchanged) | consultancy-and-process | none numeric; check service list still matches |
| 5 | 2025-10-08 | 805 | `ingiltere-mi-malta-mi` | UK vs Malta | `/en/blog/uk-vs-malta-for-english-language-courses/` | (unchanged) | destination-comparison | **names "Short-Term Study Visa" + "Student Visa" as the UK routes — route naming has changed** |
| 6 | 2025-10-08 | 864 | `cocugunuzu-yurtdisinda-egitime-hazirliyorsaniz` | Parent guide | `/en/blog/a-parents-guide-to-preparing-your-child-to-study-abroad/` | `/tr/blog/cocugunuzu-yurtdisinda-egitime-hazirlamak/` | parents-and-safeguarding | "8–17, typically 2–4 weeks"; links to `/boarding-schools` (**404**) |
| 7 | 2025-10-08 | 849 | `vize-basvurusunda-en-sik-yapilan-hatalar-ve-cozumleri` | Visa mistakes | `/en/blog/common-student-visa-mistakes-and-how-to-avoid-them/` | (unchanged) | visa-and-immigration | **"courses under 6 months should use a student visa, not a short-term visitor visa" — contradicts current UK guidance for many short courses**; "documents dated within 30 days"; sworn-translation requirement |
| 8 | 2025-10-08 | 893 | `dil-okulu-secerken-dikkat-edilmesi-gerekenler` | Choosing a language school | `/en/blog/how-to-choose-a-language-school/` | (unchanged) | language-study-value | **HARD PRICES: Malta €150–250/wk, Ireland €200–300/wk, UK £300–400/wk**; accreditation bodies (British Council/English UK, Languages Canada, ACELS, FELTOM) |
| 9 | 2025-10-09 | 831 | `is-ingilizcesi-icin-ingiltere-mi-amerika-mi` | Business English UK vs US | `/en/blog/business-english-uk-vs-us/` | (unchanged) | destination-comparison | sector generalisations (opinion); relative price claims |
| 10 | 2025-10-09 | 849 | `yurtdisinda-dil-egitimi-gunluk-hayatta-ingilizce-pratigi` | Daily English practice | `/en/blog/how-to-practise-english-every-day-while-studying-abroad/` | `/tr/blog/gunluk-hayatta-ingilizce-pratigi/` | language-study-value | **none — safest post to republish as-is** |
| 11 | 2025-11-07 | 829 | `neden-ingiltere-yaz-okulu` | Why a UK summer school | `/en/blog/why-choose-a-uk-summer-school/` | (unchanged) | summer-schools | **HARD PRICES: London/Oxford/Cambridge ≈ £1,000–1,500/wk all-in; Brighton/Bournemouth/Canterbury £700–1,000** |
| 12 | 2025-12-02 | 907 | `en-uygun-fiyatli-ingilizce-kursu` | Cheapest countries for English | `/en/blog/where-are-the-most-affordable-english-courses/` | (unchanged) | destination-comparison | **entire premise is price-based, dated Dec 2025 — full refresh required**; links to 2 dead URLs |
| 13 | 2025-12-22 | 715 | `yaz-okulu-karsilastirmasi` | Group vs individual summer school | `/en/blog/group-vs-individual-summer-schools/` | `/tr/blog/grup-mu-bireysel-yaz-okulu-mu/` | summer-schools | lists "our destinations" — several of those pages are 32–53-word stubs |
| 14 | 2026-01-08 | **1079** | `yaz-okulunda-guvenlik-ve-konaklama` | Safety & accommodation (has FAQ) | `/en/blog/summer-school-safety-and-accommodation-guide/` | `/tr/blog/yaz-okullarinda-guvenlik-ve-konaklama/` | parents-and-safeguarding | **safeguarding/compliance claims about third-party schools: "24/7 supervision", inspection & vetting statements, insurance & allergy handling — verify each or attribute it to the school** |
| 15 | 2026-01-08 | 816 | `en-populer-yaz-okulu-sehirleri` | Why London leads (has FAQ) | `/en/blog/most-popular-summer-school-cities-london/` | (unchanged) | summer-schools | **"£1,100–1,600/wk" explicitly stamped 2026**; **calls the route a "Standard Visitor Visa"** — questionable; age bands 10-17/15-18/5-9 |
| 16 | 2026-01-15 | 948 | `ingiltere-yaz-okulu-bavul-hazirligi` | Packing guide | `/en/blog/uk-summer-school-packing-list/` | (unchanged) | pre-departure | "carry £100–200 in small notes"; **"in 2026 card payment is accepted everywhere"** |
| 17 | 2026-01-20 | 1033 | `dunyanin-en-iyi-universiteleri` | Top universities & entry requirements | `/en/blog/worlds-most-prestigious-universities-and-entry-requirements/` | `/tr/blog/dunyanin-en-prestijli-universiteleri/` | university-admissions | **QS/THE rank positions (annual)**; **GPA thresholds and IELTS/TOEFL minimums per institution** |
| 18 | 2026-01-26 | 923 | `yurtdisinda-universite-okurken-calismak` | Work rights by country (**table**) | `/en/blog/working-while-studying-abroad-country-by-country/` | (unchanged) | visa-and-immigration | **HIGHEST LIABILITY. Full table: UK 20h/40h+/Graduate Visa 2yr · US 20h on-campus/OPT 1–3yr · Canada 20h/unlimited in vacation/PGWP ≤3yr · Ireland 20h/40h+/1–2yr · Australia 48h per fortnight/2–4yr · NZ 20h/40h+/1–3yr. Every row needs re-verification against UKVI, USCIS, IRCC, INIS, Home Affairs, INZ.** |

Clusters: destination-comparison 4 · language-study-value 3 · summer-schools 3 · pre-departure 2 · parents-and-safeguarding 2 · visa-and-immigration 2 · university-admissions 1 · consultancy-and-process 1. Total 15,735 words. Posts 14 and 15 already carry an "SSS" (FAQ) section — direct FAQPage-schema candidates.

**I am not restating any of the above claims as fact. They are quoted from the pages and every one is flagged for business/legal re-verification.**

## 6. CONTENT QUALITY — top issues

| Issue | Docs | Detail |
|---|---|---|
| Every image on the page lacks alt text | **235 / 331** | site-wide accessibility + image-SEO failure; only 12 of 964 media items have alt text |
| Page structure carried by `<b>/<strong>`, not headings | **157** | ≤1 real `<hN>` but 3–10 bold pseudo-headings; blocks clean Portable Text conversion |
| Hero image filename ≠ page subject | **62** | worst: `/london-kings-college/` uses **`University-of-Aberdeen.jpg`**; `/yatili-okullar2/north-bridge-house-school/` and `…/oxford-international-college-brighton/` share `peacock-room-4_Peacock-Room-Carousel.jpg`; `/dil-okullari/uk/manchester-dil-okullari/` and `…/brighton-dil-okullari/` both use `londra1.jpg`; `/dil-okullari/avustralya-dil-okullari/` uses `ingilitere.jpg` |
| Heading-level jumps (h1→h5, h2→h5) | **53** | `/ingiltere-universiteler/` is h2→h3→h2 then **64 consecutive h5** |
| Inline `font-weight:400` span spam | 28 | up to 51 per page — Google-Docs paste residue |
| Missing apostrophe before Turkish case suffix | **38 docs / 69 occurrences** | "Kanada nın", "Amerika da", "ABD nin", "Teksas ın", "Manchester ın" |
| No headings at all | 19 | incl. all 6 `/yatili-okullar2/` `-2` pages and the US EC/LSI pages |
| Near-empty body (<20 words) | 19 | 8 are plugin artefacts; but also `/dil-okullari/new-zeland/` (2w) and `/dil-okullari/south-africa/` (4w) representing whole countries |
| Legacy Turkish HTML entities (`&uuml; &ouml; &ccedil;`) | 7 docs / 205 occurrences | `/turlar/` alone has 40; will survive as literal text through a naive converter |
| Heavy numeric entities (≥15 `&#8217;` etc.) | 8 | incl. 5 blog posts |
| Consistent misspellings | 14 | **"Avusturalya"** for Avustralya on 9 pages incl. the homepage; "Cambdrige"; "Chercheston" for Chesterton; "Sir Micheal"; "New Zeland" (also the live slug) |
| Legacy `APPLY NOW / Facebook Instagram Youtube` template | 6 | all under `/universiteler/`, all 21–98 words, all English |
| Placeholder text | 1 | `/anasayfa/iletisim-2/` — **"Address will be added here"** |
| Theme demo testimonial | 1 | `/anasayfa/testimonial/` — attributed to "Blaise Matuidi" (a footballer) |
| Broken internal link targets | **75 distinct** | **30 are hard 404s**, 44 currently serve a WordPress 301, 1 a 302 |

**No mojibake found** — 0 occurrences of `Ã¼ / Ã§ / ÅŸ / â€™` patterns. Encoding is clean UTF-8; the damage is legacy named entities, not corruption. **No lorem ipsum found.**

Notable 404s: `/ingiltere-universiteler/` links to **54 `/universities/*` URLs** (all 301 today, all die with WordPress); `/dil-okullari/ingiltere-dil-okullari/` links to `/dil-okullari/uk/{londra-2,cambridge-2,oxford-2,birmingham-2,brighton,manchester}` — **all hard 404 now**; `/dil-okullari/malta-dil-okulu-fiyatlari-happy-education` is 404 and linked **9 times from the blog**.

`/policy/` (the privacy policy) pastes `https://find-and-update.company-information.service.gov.uk/company/11331426` where the website URL should be — this both confirms **company number 11331426** and is a live legal-document defect. The policy has no cookie, UK-GDPR/DPA-2018, retention, or data-subject-rights sections.

## 7. THE 15 MOST IMPORTANT MIGRATION DECISIONS

1. **Do not merge on title.** 8 root↔nested title matches exist but ≥3 are a *summer programme* vs a *university/boarding school* at the same campus (Greenwich, UCL, North London Grammar; also Westminster, Kent, Tufts, St Giles Cambridge/Oxford). Merging them destroys sellable product pages. Classification must key on body text ("Yaz Okulu"), not name.
2. **Institution pages need three separate CMS types, not one.** Field coverage is disjoint: universities carry city/ranking/founded/departments/logo (78–99%) and *zero* dates/fees/accommodation; boarding schools carry fees/accommodation/programmes (64–100%) and *zero* city/ranking/founded; summer programmes carry lessonsPerWeek/ageRange/dates and nothing else. A single "institution" schema would be ~70% empty for every record.
3. **`officialWebsite` is 0/313 — plan a manual data-collection pass.** Same for logos outside UK universities (86% there, 0% everywhere else) and for alt text (3% site-wide). These are the three fields no migration script can fill.
4. **English is new authoring, not translation cleanup.** 5,860 English words total, only 19 documents ≥100 words, all of them provider marketing copy of uncertain provenance. Treat `/en/` as ~77k words of new work and check the existing English pages for third-party copyright before reuse.
5. **The 18 blog posts are the only genuinely original asset (median 0.9% shared 5-grams) and they are currently un-indexable** — absent from `post-sitemap.xml`, zero featured images, linked from a 0-word blog index. Migrate first, add hero images, submit a real sitemap. Fastest measurable SEO win available.
6. **Gate posts 5, 7, 15, 18 behind legal/business sign-off.** Post 18's country×work-rights table and post 7's visa-type advice are stated as fact and are the highest-liability content on the site. Post 10 is the only one with no dated claims.
7. **Retire prices from evergreen pages into a dated, structured field.** Hard figures live in 5 blog posts and 43 institution pages; boarding fees (£52,000 A-Level, £40,000 GCSE) are 82% populated. Model them as `{amount, currency, unit, validFrom, source}` so staleness is visible, and stamp "as of" on every published price.
8. **Normalise the 49 orphan `-2` slugs on migration** (`university-of-sussex-2` → `university-of-sussex`). Zero content risk, and it clears the largest single URL-hygiene defect on the site.
9. **Reunify the two UK language-school hubs and the two Ireland hubs.** `/dil-okullari/ingiltere-dil-okullari/` (536w) vs `/dil-okullari/uk/` (33w), and `/irlanda-dil-okullari/` (476w) vs `/dil-okullari/ireland/` (10w). Keep the prose, retire the stub URL — currently both rank for the same query.
10. **Rescue, don't drop, the three `/elementor-sayfa-NNNNN/` pages.** They contain real 174–384-word profiles. Contrary to the usual heuristic, these are not builder junk.
11. **`/yatili-okullar2/oxford-international-college-2/` and `…-brighton/` are byte-identical (J=1.00): hard-delete one.** And rewrite `/universiteler/manchester-metropolitan-university-2/` — 92% of its text is contained in the University of Manchester page, i.e. it describes the wrong institution. Do not merge; the record is factually wrong.
12. **Rebuild the 6 legacy `APPLY NOW` husks (21–98 words) rather than migrating them**, and retire `/salesforce/` with them — those 6 pages are the only things linking to it. Note the CRM dependency: the enquiry flow currently posts to a **Salesforce Web-to-Lead form**; that integration must be reproduced or replaced before launch.
13. **Templated families need editorial investment, university pages do not.** Summer (p90 = 72% shared 5-grams) and language schools (p90 = 65%) recycle a 40-word course/accommodation block across 20+ pages; universities are 88% unique prose. Spend the rewrite budget on summer + language schools; migrate universities near-verbatim.
14. **Preserve the 4 live PDFs before killing their host pages.** `/thanks/` (410) links `england-tour.pdf`, `Europe-Tour-Disneyland-.pdf`, `Italy-Tour-.pdf` and `/summer-schools/` links `Happy-Education-Bireysel-Yaz-Okullari-2026.pdf` — all HTTP 200 today. Re-host, then redirect.
15. **Carry the 43 legacy `/universities/*`, `/course/*`, `/boarding-schools/*` aliases forward.** They are live WordPress 301s today (verified by curl), they are linked from the site's own hub pages, and they will silently 404 the moment WordPress is switched off. Also fix the 16 targets that are *already* 404 while still being linked from live pages and blog posts. All 59 are in `redirects-draft.csv`, marked `LEGACY ALIAS` / `CURRENTLY 404`.

**Redirect map integrity:** 395 rows — 377× 301, 18× 410. All 318 sitemap URLs and all 18 posts are covered. Only two rows point at `/tr/` (the homepage itself and the 404 `/anasayfa/` parent stub); 302 distinct destinations across 377 redirects — no lazy homepage fallback anywhere.