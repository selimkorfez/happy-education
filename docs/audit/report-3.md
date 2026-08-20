# COMPETITOR IA & EDITORIAL RESEARCH — Happy Education rebuild

## 0. Reachability / domain resolution (verified)

| Brief name | Real domain | Status | Is it actually a competitor? |
|---|---|---|---|
| Academix | `www.academix.com.tr` (academix.com and academix.co.uk both redirect/fail here; `academix.com` 301s to `www.academix.com.tr`) | 200, sitemap open | **YES** — primary comparator |
| Lemon Academy | `lemonacademy.co.uk` | 200, sitemap open | **YES** — primary comparator |
| Vertas Education / Vertas Edu | **NOT FOUND** | `vertasedu.com`, `vertaseducation.com` → DNS fail (000). `vertas.co.uk` = **Vertas Group, UK integrated facilities management** (cleaning/catering/security), verified not an education consultancy | **NO — does not exist.** Probable brief typo for **Veritas** (`veritasedu.net`, Turkish consultancy, founded 2006). Flagging as **UNKNOWN / requires business verification** — do not treat as a competitor without the client confirming which company they meant |
| Oscar Education | `oscareducation.com` | 403 to curl (Cloudflare challenge); homepage readable via WebFetch; **sitemap_index.xml blocked — could not be sized** | **NO** — this is **Oscar Cultural Institute L.L.C., Dubai UAE**, KHDA-approved vocational/IT training (job courses, accounting, data analysis). Not a study-abroad placement agency, not UK, not Turkish market |
| Pisa Education | `pisaeducation.com` | 200, sitemap open | **NO** — **Vietnamese agency placing students into South Korea** (`/du-hoc-han-quoc/` = "study in Korea"). Content is Vietnamese/Korean. Retained below **only** as a multilingual URL-pattern reference |
| English UK | `www.englishuk.com` | 200 | **NO (not a competitor)** — trade body. Retained as directory-architecture reference, as the brief intended |
| *added* Study In UK | `www.studyinuk.com.tr` | 200 | Turkish-market UK placement platform — included as a counter-example |

**Two of the six named targets are false leads and one does not exist.** Reporting that plainly rather than inventing structure.

---

## 1. ACADEMIX — `www.academix.com.tr`

**Verified sitemap: `https://www.academix.com.tr/sitemap.xml` — 4,492 URLs total.**

### 1.1 Top-level nav (verbatim, from homepage)
`Kurumsal` (→ Academix Hakkında, About Academix, Vizyon & Misyon, Franchise Başvurusu, İş Başvurusu, Dilek ve Öneri) · `Bilgi İste` · `İletişim` · `Dil Okulu` · `Yaz Okulu` · `Lise` · `Foundation` · `Üniversite` · `Master / MBA` · `Sertifika` · `Summer Session` · `Sınav Hazırlık Kursları` · `Vize`

Nav is organised by **study product (level of study)**, not by destination country. Destination is the *second* axis.

### 1.2 URL patterns & hierarchy depth
Depth is **strictly capped at 3 segments** (measured across all 4,492 URLs: 25 × 1-seg, 3,540 × 2-seg, 927 × 3-seg). No 4-segment URLs exist.

- Product hub: `/yurtdisinda-dil-okulu`, `/ingilterede-universite`, `/yurtdisinda-lise`
- **Country is fused into the hub slug**, not a separate path segment: `/ingilterede-universite`, `/amerikada-universite`, `/kanadada-master`, `/italyada-universite`, `/polonyada-universite` (20+ country×level hubs)
- City page: `/yurtdisinda-dil-okulu/londra-dil-okullari`, `/oxford-dil-okullari`, `/cambridge-dil-okullari`
- **Institution page: `/ingilterede-universite/university-of-leeds`** — one flat slug under the country×level hub
- **Multi-campus chain gets a 3rd level**: `/yurtdisinda-dil-okulu/kaplan-international-languages/london-covent-garden`, `/berkeley`, `/toronto` — brand hub → branch. This is the only 3-level use and it is the smartest thing in their IA
- City guide as separate type: `/sehir-rehberi/londra`, `/sehir-rehberi/new-york`
- Article: `/yurtdisi-egitim-makaleleri/<slug>`; scholarship: `/yurtdisi-egitim-burslari/<slug>`; review: `/ogrenci-yorumlari/<slug>`

### 1.3 Actual counts per section (grep of sitemap)
| Section | URLs |
|---|---|
| `/yurtdisinda-dil-okulu` (407 category + 443 school/branch) | **851** |
| `/yurtdisi-egitim-makaleleri` (articles) | **552** |
| `/ogrenci-yorumlari` (student reviews) | **395** |
| `/yurtdisinda-yaz-okulu` | **373** |
| `/danisman-yorumlari` (counsellor profiles/reviews) | **231** |
| `/yurtdisi-egitim-burslari` (scholarships) | **168** |
| `/ingilterede-universite` | **165** |
| `/ingilterede-master` | **153** |
| `/yurtdisi-egitim-etkinlikleri` (events) | **148** |
| `/yurtdisinda-foundation` | **140** |
| `/amerikada-universite` | **119** |
| `/yurtdisinda-lise` | **106** |
| `/yurtdisi-egitim-haberleri` (news) | **104** |
| `/amerikada-master` | **95** |
| `/sehir-rehberi` (city guides) | **84** |
| Other country×level hubs (Kanada, İtalya, Polonya, Almanya, İrlanda, İspanya, Avustralya, Hollanda, Fransa, Ukrayna) | 13–45 each |

**Institution/programme pages ≈ 1,400–1,600** (dil okulu schools 443 + universities/masters across all countries ≈ 800+ + lise/foundation).

### 1.4 What a single institution page actually contains
**University page** (`/ingilterede-universite/university-of-leeds`), verified in order:
1. Nav → 2. **Free consultation form (above the fold)** → 3. Breadcrumbs (`Anasayfa / İngiltere'de Üniversite / University of Leeds`) → 4. Hero image → 5. Tabbed content → 6. General information → 7. **Ranking block (QS 2025: 82, THE 2025: 123, US News 2025: 141)** → 8. **Programmes by faculty (8 faculties)** → 9. **Admission criteria incl. IELTS bands (UG 6.0–7.0, PG 6.5–7.5)** → 10. **Application deadlines** → 11. **Programme fees (UG £20,750–£25,250; PG £15,000–£37,000)** → 12. **Scholarship opportunities** → 13. Map → 14. **Street View** → 15. Student reviews → 16. Footer.
*Absent: accommodation detail, related institutions, author/date.*

**Language-school branch page** (`.../kaplan-international-languages/london-covent-garden`), verified in order:
1. **Enquiry form (top)** → 2. Breadcrumbs → 3. General info (school type, capacity, class size) → 4. **Facilities list** → 5. **Course list** (Vacation/General/Intensive English, Academic Year, Academic Semester, Business English, IELTS Prep, Cambridge Prep) → 6. Social activities → 7. Accommodation options → 8. Photo gallery → 9. Map → 10. Street View → 11. **Student reviews with names + photos** → 12. **Enquiry form repeated (bottom)**.
*Prices are pushed to a downloadable PDF, not on-page. No FAQ, no accreditation logos, no sibling-branch links.*

### 1.5 Editorial
552 articles at `/yurtdisi-egitim-makaleleri/<slug>` + 104 news + 168 scholarship posts. Index is grouped **thematically (destination + field of study)**, not chronologically. Clusters: subject-choice (`yurtdisinda-tip-okumak`, `yurtdisinda-yazilim-muhendisligi-okumak`, `yurtdisinda-uluslararasi-ticaret-okumak`), visa (`2026-2027-italya-egitim-vizesi-basvuru-rehberi...`), test prep (`toefl-speaking-sinavi-icin-tuyolar-ve-stratejiler`), rankings (`dunya-universite-siralamasi-2026`).
**Cards show NO author, NO date, NO reading time.** Article pages show no author/date either. This is a real E-E-A-T weakness.

### 1.6 Lead gen
Enquiry form appears **twice per institution page (top and bottom)**. Fields verified: `Adınız` / `Soyadınız` / `E-posta` / `Telefon` / `Bizi Nereden Duydunuz?` / `Bilgi Almak İstediğiniz Şube` (branch selector) / `Mesajınız`. Dedicated `/bilgi-istek-formu` and `/dilek-ve-oneri-formu`. **Five separate language-level tests** as lead magnets: `/ingilizce-`, `/italyanca-`, `/ispanyolca-`, `/almanca-seviye-tespit-sinavi` + `/seviye-tespit-sinavi`. Prices published on university pages (fee ranges) but language-school prices are gated behind a PDF price list (`/yurtdisinda-dil-okulu/fiyat-listeleri/ingiltere-dil-okulu-fiyatlari`). No online booking or payment.

### 1.7 Multilingual
**No.** No `hreflang` tags found in homepage HTML. Turkish-only, with a single English "About Academix" page. 

### 1.8 Trust signals
Verified on homepage: `64.000+ Öğrenci`, `1996'dan beri`, `300+ Anlaşmalı Okul`, `30+ Ülke`, `17 Şube`, `80+ Danışman`, ST "Super Star" agency award 2017/2018/2019/2020-21/2023, ST Star Awards 2026 finalist.
- **Evidence-backed:** the awards (third-party, verifiable via StudyTravel); the 395 named student reviews; the 231 counsellor profiles; the 17 physical branches with addresses.
- **Decorative / unverifiable:** 64,000+ students, 300+ partner schools, 80+ consultants — no methodology, no date, no source.
- **Schema is thin:** only `Organization`, `AggregateRating`, `ItemList`, `SiteNavigationElement`. No `Course`, no `FAQPage`, no `BreadcrumbList`.

---

## 2. LEMON ACADEMY — `lemonacademy.co.uk`

**Verified sitemap index `https://lemonacademy.co.uk/sitemaps.xml` → 10 sub-sitemaps. Total 9,150 unique URLs: 7,823 posts + 1,332 pages.** Nearly **2× Academix and ~28× Happy Education**.

### 2.1 Top-level nav (verbatim)
`Yurtdışı Eğitim` (→ İngilizce Seviye Testi, Yurt Dışında Sertifika Programları, Yurtdışında Burs Programı Bul) · `Yurtdışında Dil Eğitimi` (11 country children) · `Yurtdışında Lisans` · `Yurtdışında Yüksek Lisans` · `Work And Study` · `Blog` · `Kurumsal` · `İletişim`
Depth measured: 375 × 1-seg, 803 × 2-seg, 149 × 3-seg, 4 × 4-seg. **Effectively 3 levels.**

### 2.2 URL patterns
- Product hub: `/yurtdisinda-dil-okulu`, `/yurtdisi-universite`, `/yurt-disi-yuksek-lisans`, `/work-and-study`
- **Country under hub as its own segment**: `/yurtdisinda-dil-okulu/ingiltere`, `/avustralya`, `/malta-dil-okulu`, `/irlanda-dil-okulu`, `/kanada`, `/almanya`, `/dubai-dil-okulu`
- **City under country (3 levels)**: `/yurtdisinda-dil-okulu/avustralya/sydney-dil-okullari`, `/melbourne-`, `/perth-`, `/adelaide-`, `/hobart-`, `/darwin-`, `/cairns-`, `/gold-coast`
- **School page also at level 3**: `/yurtdisinda-dil-okulu/ingiltere/kaplan-international-dil-okulu`, `/sprachcaffe`; `/malta-dil-okulu/ese-dil-okulu`, `/chamber-college`, `/sprachcaffe-malta-dil-okulu`; `/cape-town-dil-okullari/ec-english`
- **Topical sub-pages hang off country**: `/yurtdisinda-dil-okulu/ingiltere/ogrenci-vizesi`, `/malta-dil-okulu/calisma-izni`, `/avustralya/vize-bilgilendirme-rehberi`
- **Blog posts are FLAT at root** — no `/blog/` prefix: `/zurih-universiteleri-rehberi-basvuru-ucret-burs`, `/zeppelin-universitesi-basvuru-rehberi-bolumler-sartlar`

### 2.3 Counts per section
| Cluster | Pages |
|---|---|
| Blog posts (flat root) | **7,823** |
| `*-vize` country visa pages | **451** |
| `*-oturum-izni` residence-permit pages | **210** |
| `*-dil-okulu` / `-okulu` | **174** |
| `*-konsolosluk` consulate pages | **150** |
| under `/yurtdisinda-dil-okulu/` | **167** |
| `*-rehberi` country guides | **33** |
| `/basinda-biz` (press) | **27** |
| `*-university` | **35** |

The visa/consulate/residence architecture is a **matrix**: ~30 European countries × ~15 visa sub-pages each. Example (Yunanistan): `yunanistan-vize-ucreti`, `-vize-sss`, `-vize-randevu`, `-vize-gerekli-evraklar`, `-vize-formu`, `-vize-dilekce-ornegi`, `-vize-basvurusu`, `-vize-basvuru-sureci`, `-turistik-vize`, `-ticari-vize`, `-ogrenci-vizesi`, `-calisma-vizesi`, `-aile-ziyareti-vizesi`, `-aile-birlesimi-vizesi`, plus `-oturum-izni-*` and `-konsoloslugu-*`.

### 2.4 Institution page content
`/yurtdisinda-dil-okulu/ingiltere/kaplan-international-dil-okulu`, in order:
1. Header → 2. School overview → 3. **Available programmes** (General/Intensive/Business English, IELTS prep, Academic) → 4. Social activities → 5. **Interactive education pricing calculator** → 6. **Interactive accommodation pricing calculator** → 7. Discount promo → 8. **FAQ block** → 9. Accommodation & activity detail → 10. Photo gallery → 11. Footer.
*Absent: breadcrumbs, map, accreditation logos, reviews, author/date.*
**The two live price calculators are their strongest institution-page asset** — Academix has nothing equivalent.

### 2.5 Editorial strategy — the critical finding
Article template verified on `/zurih-universiteleri-rehberi-basvuru-ucret-burs`:
- **~3,500 words**
- 14 H2/H3 in a fixed pattern: overview → **head-to-head comparison** → entry requirements split UG/PG → language requirements → **fees + cost of living** → scholarships/work → how to apply → **step-by-step process** → tips to improve acceptance odds → deadlines/timing → student life → *own-service section* → conclusion → **FAQ (7 Q&A)**
- **Named author with credentials: "Leman Aydın Koçyiğit"**
- **"Son Güncelleme: 12 Mart 2026"** (last-updated date, not publish date)
- **Comparison table** (columns: Üniversite / Akademik Güçlü Yanlar / Öğretim Dili / Harç / Notlar)
- Internal links to money pages (İngilizce Seviye Testi, Yurtdışında Dil Eğitimi, danışmanlık, ülke rehberleri)

**Publishing velocity from sitemap `<lastmod>` — this is a programmatic/AI content operation, not human editorial:**
| Month | Posts |
|---|---|
| 2025-11 | 22 |
| **2025-12** | **1,277** |
| **2026-01** | **2,135** |
| **2026-02** | **2,061** |
| **2026-03** | **1,468** |
| 2026-04 | 113 |
| 2026-06 | 220 |
| 2026-07 | 147 |
| 2026-08 | 123 |

~6,900 posts in four months (Dec 2025–Mar 2026), then a drop to ~120–220/month. Topic tokens across 7,823 slugs: `rehberi` 2,424, `ipuclari` 876, `basvuru` 821, `guncel` 752, `butce` 644, `vize` 638, `ulasim` 582, `dil` 543, `ingilizce` 486, `work`+`and` 468/448, `ornekler` 433, `maliyet` 428, `vs` 413, `ingiltere` 412, `travel` 373. Clusters extend far beyond education into **travel guides** (`zermatt-gezi-rehberi`, `zakopane-gezi-rehberi`), **English grammar lessons** (`zero-article-nedir`, `zarf-cumlecikleri`), **Work&Travel job pages** (`ziyafet-garsonu-work-and-travel-rehberi-ucretler`), **passport admin** (`zamlari-sonrasi-pasaport-almak-mantikli-mi`), and even **slang/social-media** (`zaddy-nedir`, `zesty-trendini-icerige-ekle`).

### 2.6 Lead gen
Primary CTA `TEKLİF AL` (Get Offer) → **external Zoho form (`zfrmz.com`)**, so fields are not on-domain. Secondary: `Ücretsiz Danışmanlık Al` in multiple placements, **WhatsApp 24/7** (+90 312 963 30 08). **Prices published openly on homepage**: Malta 699 €/4 weeks, Ireland 799 €/4 weeks, England 599 £/4 weeks, Canada 1,199 CAD/4 weeks, Dubai 699 $/4 weeks. No online booking/payment.

### 2.7 Multilingual
**No.** `hreflang="tr"`, `hreflang="tr-TR"`, `hreflang="x-default"` only — **a `.co.uk` domain serving 100% Turkish content.** Same strategic position as Happy Education.

### 2.8 Trust signals
`35.000+ Yerleştirilen öğrenci` (since 2005), `98% Memnuniyet oranı`, `7/24 Acil lokal destek`, accreditation mentions: British Council, English UK, ACELS, MEI. `/basinda-biz` press section (27 pages), `/lemon-academy-ogrenci-yorumlari`.
- **Evidence-backed:** the accreditation body names are externally checkable; press coverage pages; published prices (a real trust act).
- **Decorative:** 35,000+ students, 98% satisfaction — no methodology or source.
- **Schema is genuinely strong** (this is where they beat Academix): `FAQPage`, `Question`/`Answer`, `HowTo` + 6 × `HowToStep`, `BreadcrumbList`, `EducationalOrganization`, `LocalBusiness`, `GeoCoordinates`, `OpeningHoursSpecification`, `ContactPoint`, `WebSite` + `SearchAction`, `ImageObject`.

---

## 3. ENGLISH UK — `www.englishuk.com` (trade body, directory reference)

- **Sitemap `https://www.englishuk.com/sitemap.xml` — 289 URLs only.** `robots.txt` is entirely commented out (26 bytes).
- Nav is **audience-segmented, not product-segmented**: `/en/students`, `/en/agents`, `/en/members`, `/en/about-us`, `/en/training`, `/en/events`, `/en/course-finder`. Section sizes: members 35, students 27, about-us 18, agents 17, meet-the-team 14, training 5.
- **Depth 4** under students: `/en/students/where-in-the-uk/choosing-where-you-study/regions-of-the-uk`.
- **Geography is by UK REGION, not city** — a distinct pattern worth noting: `/en/students/where-in-the-uk/london`, `/study-english-in-central-england`, `/study-english-in-the-north-of-england`, `/study-english-in-northern-ireland`, `/study-english-in-south-east-england`, `/south-west-england-channel-islands`, `/study-english-in-the-south-of-england`.
- **Directory: `/en/agents/english-in-the-uk/language-centre-directory`. 268 centres displayed ("Displaying 1 - 20 of 268"); claims "over 300 member centres, all fully accredited by the British Council".**
- **Individual centre URL is `/member-directory?id=329` — a query-string ID, not a slug.** This is why only 289 URLs are in the sitemap despite 268+ centres: **the entire directory is invisible to search.** A major architectural anti-pattern to avoid.
- **Course Finder facets (verbatim form field names):** `type_of_course`, `course_type_option[]`, `months_open`, `course_length`, `age_group`, `maximum_class_size`, `course_hours_per_week`, `tuition_fees_per_week`, `begginers_accepted` (checkbox), `type_of_location`, `type_of_accommodation`, `disabled_access_provision`, `region`, `keywords`. Directory listing fields: name, street address, city, postcode, telephone, website, email.
- Directory filters: region dropdown (9 UK regions), A–Z alphabetical index with per-letter counts, keyword search.
- **Multilingual: legacy only.** `/ar/...` URLs exist in the sitemap but `/ar/`, `/tr/`, `/es/`, `/fr/`, `/zh/` all **301 to `/en/`** (verified by curl `url_effective`). English-only in practice.
- Trust: British Council accreditation is the entire proposition — fully evidence-backed and third-party verifiable.

---

## 4. PISA EDUCATION — `pisaeducation.com` (not a competitor; locale reference only)

Vietnamese→Korea agency. Sitemap index `sitemap_index.xml`: **post 102, page 23, category 10, author 2, blocks 9 — 146 URLs total.** Content Vietnamese (`/du-hoc-han-quoc/` = study in Korea).
**Useful only for its locale pattern:** default locale at bare root (Vietnamese, `/thu-vien/`, `/chuong-trinh/`, `/lien-he/`), secondary locales prefixed — `/en/about-us/`, `/en/course/`, `/en/library/`, `/en/study-program/`, `/en/contact-us/` and `/ko/` with **percent-encoded Hangul slugs** (`/ko/%ec%86%8c%ea%b0%9c/`). The Korean URLs demonstrate the failure mode to avoid: never let non-Latin slugs get percent-encoded into unreadable URLs. Category taxonomy is nested as path (`/du-hoc-han-quoc/truong-dai-hoc-han-quoc/`, `/hoc-bong-du-hoc/`, `/dieu-kien-du-hoc/`) — country → subtopic.

## 4b. OSCAR EDUCATION — `oscareducation.com` (not a competitor)

**Sitemap could not be retrieved — Cloudflare returns a 403 JS challenge to curl. Not sized; not guessing.** Homepage readable: Oscar Cultural Institute L.L.C., Dubai, since 1993, KHDA-approved. Nav verbatim: `HOME` · `JOB COURSES` · `DEPARTMENTS` (→ Computer & Information Technology, Accounts & Finance, Management Skills, Academic Tuition, Languages) · `DATA ANALYSIS` · `Job offers`. WooCommerce install (robots.txt disallows `?add-to-cart=`, `woocommerce_uploads`). English only. Trust: "Approved by KHDA, Govt. of Dubai-U.A.E." (evidence-backed), one 5-star testimonial (decorative). **Irrelevant to the Turkish→UK market.**

## 4c. STUDY IN UK — `www.studyinuk.com.tr` (added counter-example)

Nav: Countries (UK, Ireland, New Zealand, Australia) · Language Schools (Schools, Courses) · Universities · About Us · Blogs · Sign In (Agent / Student) · Contact Us. **URLs are numeric-ID and non-localised: `/School`, `/Cours` [sic], `/University`, `/Country/Detail/[number]`.** Has an agent/student login and "Free Application Service" with application tracking — the only competitor found with a **student portal**. English UI on a `.com.tr` domain. Adopts the same ID-based anti-pattern as English UK.

---

# SYNTHESIS

## A. Table-stakes IA patterns recurring across ALL credible competitors

Present in **both** Academix and Lemon (and echoed by English UK where applicable):

1. **Primary axis = level of study, not destination.** Both nav bars lead with product: Dil Okulu / Yaz Okulu / Lise / Foundation / Üniversite / Master-MBA / Sertifika (Academix) ≈ Dil Eğitimi / Lisans / Yüksek Lisans / Work&Study (Lemon). Destination is always the *second* axis.
2. **Three-level maximum depth.** Academix: 25/3,540/927 across 1/2/3 segments, zero deeper. Lemon: 375/803/149/4 across 1/2/3/4. Nobody goes past 3 in practice.
3. **A country×level hub page exists for every meaningful combination** (Academix has 20+; Lemon covers 11 countries under language alone).
4. **City-level landing pages between country and institution** (Academix `/londra-dil-okullari`; Lemon `/avustralya/sydney-dil-okullari`; English UK uses regions instead).
5. **Individual institution pages with slug URLs** — Academix ~1,400–1,600, Lemon ~200+ school pages.
6. **Multi-campus chains get a brand hub with per-branch children** (Academix `/kaplan-international-languages/{berkeley|toronto|london-covent-garden|...}`; Lemon repeats EC English and Sprachcaffe under each country).
7. **A visa content cluster is mandatory.** Academix `/yurtdisi-vize`; Lemon runs 451 visa + 210 residence + 150 consulate pages.
8. **A scholarship content type.** Academix 168 dedicated scholarship posts; Lemon `/yurtdisinda-burs-programi-bul` + `/yurtdisi-yuksek-lisans-burslari`.
9. **A free English level test as the top-of-funnel lead magnet.** Academix runs five (EN/IT/ES/DE + generic); Lemon `İngilizce Seviye Testi`. Universal.
10. **Enquiry form repeated top AND bottom of every institution page** (verified on both Academix templates).
11. **A student-reviews content type with names** (Academix 395 URLs; Lemon `/lemon-academy-ogrenci-yorumlari`).
12. **Press/about/HR corporate cluster** (Academix `Kurumsal`; Lemon `Kurumsal` + `/basinda-biz` 27 pages + `/insan-kaynaklari`).
13. **Turkish-language content only, even on `.co.uk` domains.** Lemon runs `hreflang tr / tr-TR / x-default` on a UK domain; Academix has no hreflang at all.
14. **Faceted search on {course type, duration, age, class size, price/week, location type, accommodation type, region}** — English UK's course-finder field names are effectively the industry-standard facet set.

**Happy Education currently fails 1, 2, 4, 5, 6, 7, 8, 9, 11.** Measured from `pages-analysis.json`: 331 records (313 pages, 18 posts); depth 148/118/65 at 1/2/3 segments — **147 pages sit at root depth-1**, including institution pages that should be nested (`abbey-college-cambridge`, `university-of-westminster-london`, `university-college-london`, `london-kings-college`, `tufts-university`, `barry-university-miami`, `north-london-grammar-school`, `st-giles-oxford-2`). Meanwhile `/universiteler/` (76) and `/dil-okullari/` (63) hold others — **the same content type lives at two different depths.** Duplicate-slug `-2` suffixes are everywhere (`aston-university-2`, `goldsmiths-university-of-london-2`, `royal-college-of-surgeons-2`, `yatili-okullar2`). LearnPress LMS residue is indexed (`lp-profile`, `lp-checkout`, `instructor`, `instructors`, `become_a_teacher`, `courses`, `term_conditions`).

## B. Academix's specific depth advantage

It is **not** page count — Lemon has 2× the URLs. Academix's advantage is **structured, comparable, decision-grade data on the institution page itself**, five things Lemon and Happy Education both lack:

1. **Third-party ranking triplet, dated** — QS 2025 / THE 2025 / US News 2025, three sources per university. Comparable across all 165 UK university pages.
2. **Entry requirements split UG vs PG with explicit IELTS bands** (6.0–7.0 / 6.5–7.5) — the single most-searched fact in this market, on-page.
3. **Fee ranges published on-page** for both levels (£20,750–£25,250 UG; £15,000–£37,000 PG) rather than gated.
4. **Programmes enumerated by faculty** (8 faculties for Leeds) — turns one institution page into a programme-discovery surface.
5. **Application deadlines + scholarships as fixed sections on every institution page**, so they're never "somewhere in the blog".

Plus **structural depth**: the 3-level chain pattern (`brand → branch`) with 443 school/branch pages, and **231 named counsellor pages** — a trust asset neither Lemon nor Happy Education has any equivalent of.

**Critically, Academix's depth is undermined by three fixable weaknesses Happy Education can beat immediately:** no author/date on any of 552 articles; no `FAQPage`/`Course`/`BreadcrumbList` schema (only `Organization`/`AggregateRating`/`ItemList`); and language-school prices hidden behind PDFs. Their sitemap `<lastmod>` values on hub pages are 2016–2017.

**"Academix-level depth" for the rebuild therefore = the 5 data blocks above rendered as *structured Sanity fields*, not prose** — so they can be compared, filtered, and emitted as `Course`/`EducationalOrganization` schema. That is the achievable leapfrog.

## C. What Lemon Academy does for search intent and outreach that is worth learning from

1. **Matrix-expand administrative intent, not just study intent.** 451 visa + 210 residence-permit + 150 consulate pages = ~811 URLs built from `country × question-type`. The question set (`-vize-ucreti`, `-vize-randevu`, `-vize-gerekli-evraklar`, `-vize-formu`, `-vize-dilekce-ornegi`, `-vize-basvuru-sureci`, `-vize-sss`, `-ogrenci-vizesi`, `-calisma-vizesi`, `-aile-birlesimi-vizesi`) is a directly reusable template. These capture users **earlier and more often** than "study in the UK" ever will.
2. **A rigid, high-quality article template applied at scale.** ~3,500 words, 14 sections, always including a **comparison table**, **step-by-step process**, **timing/deadlines**, and a **7-question FAQ**. Reproducible as a Sanity schema rather than a freeform rich-text field.
3. **Named author + `Son Güncelleme` (last-updated) date** — beats Academix on E-E-A-T with almost no cost.
4. **Schema-first**: `FAQPage`, `HowTo` + `HowToStep`, `BreadcrumbList`, `EducationalOrganization`, `LocalBusiness`, `GeoCoordinates`, `SearchAction`. This is what wins rich results and AI-answer citations.
5. **Publish prices openly** (699 €/4wk Malta, 599 £/4wk England etc.) and back them with **interactive tuition + accommodation calculators** on school pages.
6. **WhatsApp as a first-class channel**, 24/7, adjacent to every CTA — correct for the Turkish market.
7. **Adjacent-intent topic expansion**: travel/city guides, English-grammar lessons, Work&Travel job pages, passport admin. Broad top-of-funnel that later funnels into services.

**What NOT to learn:** the velocity is the tell — **1,277 → 2,135 → 2,061 → 1,468 posts in Dec 2025–Mar 2026**, then collapsing to ~120–220/month. That is mass automated generation, and it has pulled them into slang and lifestyle content (`zaddy-nedir-ve-nasil-olunur`, `zesty-trendini-icerige-ekle`) that has nothing to do with education and dilutes topical authority. Also: **posts sit flat at root with no `/blog/` prefix**, so 7,823 URLs compete with money pages for root-level relevance and the site has no crawlable topical hierarchy. Copy the template and the schema; do not copy the volume or the flat URL structure.

## D. Concrete GAPS — where a Turkish-market UK specialist can win

Each of these is a content type or cluster that **no competitor examined serves well**, verified by absence from their sitemaps/pages:

| # | Gap | Evidence of absence | Why Happy Education can win it |
|---|---|---|---|
| **D1** | **UK-specific compliance depth: CAS, Student Route, ATAS, Financial Requirement, BRP/eVisa, credibility interview.** | Lemon's 451 visa pages are **Schengen-shaped** (`almanya-vize`, `yunanistan-vize`, `italya-vize`…) — the matrix serves EU tourist/residence intent, not UK study compliance. Academix has just **13** `/yurtdisi-vize` URLs total. | A UK-entity consultancy has standing to own CAS/ATAS/maintenance-funds content that a Turkey-based agency structurally cannot. |
| **D2** | **Turkish qualification → UK entry mapping.** Lise diploması / YKS / AYT-TYT / IB / A-Level equivalency, and **why a Turkish student needs a Foundation or IY1**. | Academix has 140 `/yurtdisinda-foundation` pages but they are destination-shaped, not *"what does a Turkish diploma get you"*-shaped. No competitor has a qualification-mapping content type. | This is the #1 question of the exact target user and nobody answers it structurally. Highest-intent, lowest-competition cluster available. |
| **D3** | **Cost-of-living and total-cost modelling in TRY with FX exposure.** | Lemon publishes per-week course prices only; Academix publishes fee ranges but no living costs and no accommodation data (verified absent from the Leeds page). Neither models total first-year cost or currency risk. | Turkish families budget in lira against GBP. A dated, sourced total-cost calculator is a genuine differentiator and a natural lead magnet. |
| **D4** | **Accommodation as a first-class content type.** | **Verified absent from the Academix university page.** English UK only offers it as a *filter value*, not content. Lemon has an accommodation calculator but no accommodation pages. | Guarantor requirements, deposits, and the UK PBSA/homestay distinction are opaque to Turkish families. |
| **D5** | **Post-study work / Graduate Route / employability outcomes.** | No cluster found in any competitor sitemap. | The actual purchase driver for postgraduate applicants. |
| **D6** | **Programme-level pages (course pages), not just institution pages.** | Academix lists programmes as text inside faculty blocks on the institution page — **no programme URLs exist**. Lemon lists course *types* only. English UK's course-finder results are behind `?id=` query strings and uncrawlable. | Real search demand is `"ingiltere'de [subject] yüksek lisans"`. A `Course`-schema programme page type is an **entirely uncontested URL layer** in this market. |
| **D7** | **Under-18 / boarding + safeguarding.** | Academix has 106 `/yurtdisinda-lise` pages but no safeguarding/guardianship content. English UK has `care-of-under-18s` but only in its **agents** section, not for parents. | Happy Education already has `yatili-okullar2` (11) and school pages — but parent-facing guardianship (AEGIS), DBS, and airport-transfer content is missing market-wide. |
| **D8** | **Evidence-backed trust instead of unverifiable counts.** | Every competitor leads with round unsourced numbers (64,000+ / 300+ / 80+ / 35,000+ / 98%). | Publish **Companies House 11331426**, named-and-dated counsellor profiles with qualifications, verifiable accreditations, and a stated review methodology. Verifiable beats bigger. |
| **D9** | **Author/date/reviewer on editorial.** | **Academix shows none on 552 articles.** Lemon does it well — this is table stakes only against Lemon. | Cheap parity that beats the depth leader outright. |
| **D10** | **Rich schema on institution pages.** | Academix ships only `Organization`/`AggregateRating`/`ItemList`/`SiteNavigationElement`. | `EducationalOrganization` + `Course` + `FAQPage` + `BreadcrumbList` on every institution and programme page. |
| **D11** | **True TR/EN bilingual with correct hreflang.** | **Nobody does it.** Academix: no hreflang. Lemon: `tr`/`tr-TR`/`x-default` only. English UK: locales all 301 to `/en/`. Pisa's `/ko/` slugs are percent-encoded garbage. | A UK-registered entity serving a Turkish audience is the one player with a legitimate reason to run both — and it unlocks UK partner-school credibility in EN while keeping TR for families. |
| **D12** | **Comparison content as a page type** (`X vs Y` institutions, cities, routes). | Lemon does comparison *inside* articles (the Zurich table) but has no comparison page type; Academix has none. | High-intent, highly linkable, and directly serves the decision moment. |

## E. Recommended sitemap SHAPE for Happy Education

Locale-prefixed, product-first, **hard-capped at 4 segments**, with every institution reachable at exactly one canonical URL. Original structure — no competitor wording, layout, numbers, testimonials or partner claims reused.

```
/                                          TR default (x-default → tr)
/en/                                       EN mirror, full hreflang pairing tr ↔ en ↔ x-default

├─ /egitim/                                        [PRODUCT AXIS — level of study]
│   ├─ /egitim/dil-okulu/                          hub
│   │   ├─ /egitim/dil-okulu/ingiltere/            country×level hub
│   │   │   ├─ .../ingiltere/londra/               city hub  → lists schools + programmes
│   │   │   └─ .../ingiltere/manchester/
│   │   └─ /egitim/dil-okulu/irlanda/
│   ├─ /egitim/yaz-okulu/<ulke>/<sehir>/
│   ├─ /egitim/yatili-okul/<ulke>/<sehir>/         (D7 — replaces `yatili-okullar2`)
│   ├─ /egitim/foundation/<ulke>/
│   ├─ /egitim/lisans/<ulke>/
│   ├─ /egitim/yuksek-lisans/<ulke>/
│   └─ /egitim/sinav-hazirlik/<sinav>/             ielts | pte | sat | gmat …
│
├─ /kurumlar/                                      [INSTITUTION AXIS — canonical home]
│   ├─ /kurumlar/<kurum-slug>/                     e.g. /kurumlar/university-of-westminster/
│   │   ├─ /kurumlar/<kurum>/<kampus>/             multi-campus chains (A.6)
│   │   └─ /kurumlar/<kurum>/programlar/<program>/ ← D6: PROGRAMME LAYER (uncontested)
│   └─ Institution page sections, in order:
│      breadcrumb · identity & accreditation (linked, verifiable) · rankings (source + year)
│      · programmes (filterable, each linking to its own URL) · entry requirements TR-mapped
│      (D2) · English requirements by band · fees (level, year, currency) · total-cost incl.
│      living + TRY view (D3) · scholarships · accommodation (D4) · location & transport
│      · intakes & deadlines · graduate outcomes / Graduate Route (D5) · FAQ (FAQPage schema)
│      · related institutions & programmes · enquiry form (top + bottom)
│
├─ /sehirler/<sehir>/                              city guides: cost, transport, housing, life
│
├─ /rehber/                                        [EVIDENCE / COMPLIANCE — the moat]
│   ├─ /rehber/vize/                               UK-first, NOT Schengen-shaped (D1)
│   │   ├─ /rehber/vize/student-route/
│   │   ├─ /rehber/vize/cas/  · /atas/  · /maliyet-kaniti/  · /evisa-brp/
│   │   └─ /rehber/vize/child-student-route/
│   ├─ /rehber/denklik/                            Turkish qualification → UK (D2)
│   │   ├─ /rehber/denklik/lise-diplomasi/ · /yks/ · /ib/ · /a-level/
│   ├─ /rehber/maliyet/                            budgeting + TRY/GBP modelling (D3)
│   ├─ /rehber/konaklama/                          guarantor, deposits, PBSA vs homestay (D4)
│   ├─ /rehber/mezuniyet-sonrasi/                  Graduate Route, employability (D5)
│   ├─ /rehber/veliler/                            under-18 guardianship, safeguarding (D7)
│   └─ /rehber/burslar/<burs-slug>/                scholarships, each dated + sourced
│
├─ /karsilastir/<a>-vs-<b>/                        comparison page type (D12)
├─ /blog/<slug>/                                   NOT flat at root — preserves hierarchy
│   └─ /blog/kategori/<kategori>/
│
├─ /hizmetler/<hizmet>/                            service/commercial pages
├─ /basari-hikayeleri/<slug>/                      named, dated, consented outcomes (D8)
├─ /ekip/<danisman>/                               named counsellors, qualifications, dates
├─ /hakkimizda/  · /hakkimizda/akreditasyonlar/    Companies House 11331426, verifiable (D8)
├─ /iletisim/  · /seviye-testi/                    lead magnets (A.9, A.10)
└─ /araclar/maliyet-hesaplayici/                   total-cost calculator (D3, C.5)
```

**Reasoning, tied to evidence:**

- **`/egitim/` vs `/kurumlar/` split.** Both leaders fuse country into the product slug (`/ingilterede-universite/university-of-leeds`), which means an institution's URL is owned by one level of study — a university offering foundation *and* postgraduate needs two URLs or loses one. Separating the browse axis (`/egitim/`) from the canonical entity (`/kurumlar/`) gives every institution exactly one home and lets it be surfaced from many hubs. **This directly fixes Happy Education's worst current defect**: institution pages split between root depth-1 (`abbey-college-cambridge`, `university-college-london`, `london-kings-college`) and `/universiteler/` (76) and `/dil-okullari/` (63), with `-2` duplicate slugs throughout.
- **`/kurumlar/<kurum>/programlar/<program>/` is the strategic bet (D6).** Academix renders programmes as prose inside faculty blocks — zero programme URLs. English UK hides courses behind `?id=`. This layer is uncontested and matches how the market actually searches.
- **4-segment cap.** Matches the observed ceiling (Academix 0 URLs beyond 3; Lemon 4 URLs at depth 4) while buying one extra level for the programme layer.
- **`/blog/` prefix, deliberately unlike Lemon.** Their 7,823 root-level posts have no crawlable topical hierarchy and compete with money pages. A prefixed, categorised blog concedes nothing and gains structure.
- **`/rehber/` is the differentiator, not the blog.** Evergreen, structured, schema-marked compliance content — the cluster where a UK-registered entity has authority a Turkey-based agency cannot claim (D1, D2, D7).
- **Locale prefix `/en/` with TR at bare root**, following Pisa's *pattern* but with **Latin-only slugs and full hreflang reciprocity** — avoiding both Pisa's percent-encoding failure and the English UK failure where every locale 301s to `/en/`. **Nobody in this market runs true TR/EN (D11).**
- **Volume target:** to reach parity, plan ~1,200–1,800 institution + programme URLs (Academix's institution estimate is ~1,400–1,600) plus ~400–600 guide/article URLs. Current state is **331 pages with a 181-word median and 269 of 331 pages under 300 words** — so this is a rebuild of content depth, not a URL migration.

---

### Verification ledger

**VERIFIED** (fetched this session): all sitemap URL counts and per-section greps (Academix 4,492; Lemon 9,150 = 7,823 posts + 1,332 pages; English UK 289; Pisa 146); all `robots.txt` contents; Lemon's monthly `<lastmod>` publishing curve; hreflang tags on Academix (none) and Lemon (`tr`/`tr-TR`/`x-default`); JSON-LD `@type` inventories for both; English UK course-finder field names (from HTML source); English UK locale 301 behaviour (curl `url_effective`); Vertas Group's sector; Oscar's Dubai/KHDA identity; Pisa's Vietnam→Korea market; all Happy Education figures (from `/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/audit/pages-analysis.json`).

**VERIFIED via WebFetch** (single-pass page reads — section orders, nav labels, form fields, trust-signal wording, article structure): Academix homepage, Leeds page, Kaplan Covent Garden page, article index; Lemon homepage, Kaplan UK page, Zurich article; English UK centre directory; Oscar homepage; Study In UK homepage.

**NOT VERIFIED / UNKNOWN:** Oscar Education's sitemap and true page count (Cloudflare 403 — not estimated). "Vertas Education" as an education consultancy — **does not appear to exist; requires business verification of which company the brief meant.** Lemon's `TEKLİF AL` form fields (hosted off-domain on `zfrmz.com`). Whether Study In UK is formally the SI-UK Turkish arm (the page does not state it). All competitor self-reported counts (64,000+, 300+, 80+, 35,000+, 98%) are **their claims, not verified facts** — cited as claims only.

**INFERRED** (reasoning, not fact): that Lemon's Dec 2025–Mar 2026 velocity indicates automated generation (inferred from ~6,900 posts in 4 months + uniform template + slang/lifestyle drift); institution-page count estimates for Academix (~1,400–1,600, derived by summing sitemap section counts, since page type is not declared in the sitemap); all of sections A–E.