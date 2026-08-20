# HAPPY EDUCATION — BRAND IDENTITY & MEDIA ASSET AUDIT

## 0. HEADLINE FINDINGS

1. **No SVG logo exists anywhere.** Definitively verified — the whole media library contains 9 unique SVGs, all UI icons (phone/map/building/degree), zero logo vectors. Highest-resolution master is a 1131×1131 PNG.
2. **The authoritative brand palette is not on the website — it is in the print brochure.** The official `Happy-Education-Yaz-Okullari-2025-A4-print.pdf` declares exact spot colours: **orange `#F17924`** (217 fills) and **navy `#113458`** (105 fills). The website's Elementor globals were never configured past defaults.
3. **The brand typeface is Hurme Geometric Sans 1** (Light/Regular/Oblique/SemiBold/Bold/Black, all embedded in the 2025 brochure) — a commercial font not used anywhere on the live website, which loads Poppins/Roboto/Archivo/Playfair Display instead.
4. **English strapline discovered: "Education Beyond Boundaries"** (brochure cover) = the Turkish site header "SINIRLARIN ÖTESİNDE EĞİTİM".
5. **Alt-text coverage is 12 of 889 images (1.3%)** — effectively zero accessibility baseline.
6. **Only ~9 images in the entire 889-item library are genuine Happy Education photography.** The rest is partner-school marketing, licensed stock, screenshots and theme demo filler.
7. **The `/anasayfa/testimonial/` page is 100% theme demo content** ("Blaise Matuidi"). The **real** testimonials are 7 Turkish quotes on the homepage.
8. **Companies House VERIFIED**: HAPPY EDUCATION CONSULTANCY LTD, 11331426, registered office `16 Upper Woburn Place, London, England, WC1H 0AF` — exactly matching the published site address. Active, incorporated 26 April 2018.

---

## 1. LOGO INVENTORY

### 1a. Master lockup (symbol + wordmark)

| URL | Format | Canvas | Ink bbox | True AR | Live bytes | Alpha | Variant |
|---|---|---|---|---|---|---|---|
| `/wp-content/uploads/happyedu.logo_.png` | PNG-32 | 1131×1131 | **916×384** | **2.385:1** | 26,014 | Yes — 91.8% transparent, 0% white pixels | **LIGHT-BG master** (charcoal wordmark) |
| `/wp-content/uploads/cropped-happyedu.logo_.png` | PNG-32 | 512×512 | 505×212 | 2.382:1 | 10,001 | Yes, 88.1% transparent | LIGHT-BG (derived crop; WP site-icon crop) |
| `/wp-content/uploads/happylogo-1.png` | PNG-32 | 200×111 | 174×76 | 2.289:1 | 15,096 | Yes, 300 dpi flag | **LIGHT-BG — the one actually in the live header/footer** |
| `/wp-content/uploads/happylogo.png` | PNG-32 | 200×111 | 174×75 | 2.320:1 | 2,799 | Yes | LIGHT-BG (older, heavily compressed) |
| `/wp-content/uploads/happylogo-foot2.png` | PNG-32 | 200×111 | 174×75 | 2.320:1 | 2,962 | Yes — 48.8% of opaque px are pure `#FFFFFF` | **DARK-BG variant** (white wordmark + orange symbol) |
| `/wp-content/uploads/happylogofoot.png` | PNG-32 | 200×111 | 182×83 | 2.193:1 | 4,218 | Yes — mixed white halo + charcoal | LIGHT-BG with white outer glow/matte (for busy photo backgrounds) |

### 1b. Symbol-only mark (favicon / app icon)

| URL | Canvas | Ink bbox | AR | Bytes | Notes |
|---|---|---|---|---|---|
| `/wp-content/uploads/micon.png` | 336×335 | 253×318 | 0.796:1 (portrait) | 14,483 | Symbol only |
| `/wp-content/uploads/cropped-micon.png` | 512×512 | 386×486 | 0.794:1 | 32,018 | WP site icon source; served at 32/180/192/270 px |

Declared in live `<head>`: `cropped-micon-32x32.png`, `cropped-micon-192x192.png`, `apple-touch-icon cropped-micon-180x180.png`. **No `og:image` meta tag exists on the homepage.**

### 1c. Mark description (VERIFIED by visual inspection of the 1131px master)

- **Symbol + wordmark lockup**, horizontal, symbol left.
- Symbol: an orange rounded-square **open book / face** — a white crescent smile with a white circular eye, page-fan lines at the bottom, plus **two 4-point sparkles** upper-left and one small sparkle. The symbol carries a **diagonal gradient** (bottom-left deeper orange → top-right lighter amber).
- Wordmark: "HAPPY / EDUCATION" set in two stacked lines, all-caps, geometric sans, flat charcoal (no gradient), pointed-apex `A`.
- **Wordmark typeface: likely Hurme Geometric Sans 1 Black** — INFERRED, not proven. The brochure embeds `HurmeGeometricSans1-Black` and `ITCAvantGardePro-Bold`; both have the pointed geometric `A`. REQUIRES VERIFICATION with the designer.

### 1d. VECTOR — definitive answer

**NO SVG/EPS/AI logo exists on the site.** Evidence:
- `raw/wp/media.ndjson` `mime_type == image/svg+xml`: **9 unique files**, all icons — `2021/02/{building,phone,map,degree-icon1,degree-icon2,degree-icon3,degree-icon1-1,degree-icon2-1}.svg`, `2021/03/phone-icon2.svg`.
- Live-page `.svg` refs are only the cookie-plugin's `close.svg` / `revisit.svg` / `placeholder.svg`.
- Direct probes `happylogo.svg`, `happyedu.logo_.svg`, `logo.svg`, `happy-logo.svg` → **all HTTP 404**.

**ACTION REQUIRED (business):** obtain the original vector from whoever designed the 2025 brochure. Until then, the 1131×1131 PNG (916×384 usable ink, ~2.39:1) is the ceiling — adequate for web at 2× but **not** for print or large-format.

### 1e. Downloaded to `/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/audit/brand/`
`happyedu.logo_.png`, `cropped-happyedu.logo_.png`, `happylogo-1.png`, `happylogo.png`, `happylogo-foot2.png`, `happylogofoot.png`, `micon.png`, `cropped-micon.png`, `Happy-Education-Yaz-Okullari-2025-A4-print.pdf`, `Happy-Education-Bireysel-Yaz-Okullari-2026.pdf`
(also `happyedu-logo-1131.png` — byte-identical duplicate of `happyedu.logo_.png`, written by a concurrent process.)

---

## 2. GROUNDED PALETTE

### 2a. Evidence sources, in order of authority

**Source A — official print brochure** (`Happy-Education-Yaz-Okullari-2025-A4-print.pdf`, decompressed content-stream `scn` operators; strongest evidence — these are deliberate, designer-set values):

| Hex | PDF operand | Fill count | Role |
|---|---|---|---|
| **`#F17924`** | `0.944 0.475 0.143 scn` | 217 fill + 22 stroke (+28 as `#F17925`) | **Primary brand orange** |
| **`#113458`** | `0.068 0.205 0.345 scn` | 105 | **Secondary brand navy** |
| `#231F20` | `0.137 0.123 0.126 scn` | 23 | Rich black (text) |
| `#EF582B` | `0.939 0.347 0.169 scn` | 3 | Deep orange accent |
| `#CBCBCA` | `0.797 0.797 0.794 scn` | 859 | Light grey (rules/backgrounds) |
| `#E6E7E7` | — | 23 | Off-white grey |

**Source B — logo artwork pixel quantisation** (Pillow, `happyedu.logo_.png`, alpha>250, near-white excluded; 105,252 ink pixels):

- Wordmark charcoal **`#3A3A3C`** — 44.70% of all ink (single most-common exact colour; mean of 55,453 dark pixels = exactly `#3A3A3C`).
- Symbol gradient, sampled along the book diagonal bottom-left → top-right:
  `#EF5D2A` → `#F26828` → `#F47426` → `#F47A24` → `#F68023` → `#F68721` → **`#F68E1F`**
  Mean of 46,952 saturated orange pixels: **`#F27426`**.
- 8-colour median-cut of the ink: `#3A3A3C` 48.1%, `#F27727` 12.9%, `#F36B28` 12.7%, `#F58025` 10.7%, `#F36129` 5.4%, `#373738` 4.6%, `#F38B2A` 4.2%.

**Cross-check:** brochure `#F17924` sits inside the logo gradient range and within 3/255 of the logo mean `#F27426`. Brochure accent `#EF582B` is within 5/255 of the logo gradient dark end `#EF5D2A`. **The print palette and the artwork agree.**

**Source C — live site CSS** (weakest; largely unconfigured):
- Elementor kit `post-4.css`, selector `.elementor-kit-4`:
  `--e-global-color-primary:#6EC1E4` · `--e-global-color-secondary:#54595F` · `--e-global-color-text:#7A7A7A` — **all three are Elementor factory defaults, never changed.**
  `--e-global-color-012e4fc:#EA6C03` — the one custom global; an orange, but does **not** match the brochure or the artwork.
- `wp-content/uploads/elementor/css/global.css` → **HTTP 404** (no global stylesheet).
- Hex frequency across `post-{23,53,198,1510,12883,12949}.css`: `#8f979e`×202, `#ffffff`×179, `#000000`×116, **`#ee8c1c`×33**, `#4d46b5`×24, **`#132643`×14**, `#f78f1e`×13, `#f5f5f5`×12, `#ed8b1c`×8, `#5c55e1`×6, `#f68d1a`×4.
- Theme `courselog-custom.css` + child `style.css`: `#f14d5d`×7, `#2878eb`×5, `#767676`×5 — **theme boilerplate, unrelated to the brand.**

**Verdict on the site CSS:** four mutually inconsistent oranges (`#EA6C03`, `#EE8C1C`, `#F78F1E`, `#ED8B1C`, `#F68D1A`) and two navies (`#132643`, `#113458`). Do not carry any of these forward — use the brochure values.

### 2b. Proposed palette (every value evidenced)

| Token | Hex | Evidence |
|---|---|---|
| `brand-orange-500` | **`#F17924`** | Brochure `scn 0.944 0.475 0.143` ×217; ≈ logo orange mean `#F27426` |
| `brand-orange-grad-from` | **`#EF5D2A`** | Logo gradient bottom-left endpoint (pixel sample x175,y660) ≈ brochure `#EF582B` |
| `brand-orange-grad-to` | **`#F68E1F`** | Logo gradient top-right endpoint (pixel sample x340,y440) |
| `brand-navy-900` | **`#113458`** | Brochure `scn 0.068 0.205 0.345` ×105 |
| `brand-charcoal` | **`#3A3A3C`** | Logo wordmark, 44.7% of logo ink |
| `brand-ink` | **`#231F20`** | Brochure rich black ×23 |
| `brand-grey-200` | **`#CBCBCA`** | Brochure ×859 |

### 2c. WCAG 2.1 contrast ratios (computed, sRGB relative luminance)

**Against white `#FFFFFF`:**

| Colour | Ratio | Normal text | Large text (≥18.66px bold / 24px) | UI / graphic 3:1 |
|---|---|---|---|---|
| `#F17924` | **2.80:1** | FAIL | FAIL | **FAIL** |
| `#EF5D2A` / `#EF582B` | 3.35 / 3.44:1 | FAIL | AA | PASS |
| `#F68E1F` | 2.38:1 | FAIL | FAIL | FAIL |
| `#EA6C03` (Elementor) | 3.16:1 | FAIL | AA | PASS |
| `#EE8C1C` (most-used site orange) | 2.50:1 | FAIL | FAIL | FAIL |
| **`#113458`** | **12.68:1** | AAA | AAA | PASS |
| **`#3A3A3C`** | **11.35:1** | AAA | AAA | PASS |
| `#231F20` | 16.30:1 | AAA | AAA | PASS |
| `#CBCBCA` | 1.62:1 | FAIL | FAIL | FAIL |

**Against warm off-white `#FAF8F4`:**

| Colour | Ratio | Normal | Large | UI 3:1 |
|---|---|---|---|---|
| `#F17924` | **2.64:1** | FAIL | FAIL | **FAIL** |
| `#EF582B` | 3.25:1 | FAIL | AA | PASS |
| `#F68E1F` | 2.25:1 | FAIL | FAIL | FAIL |
| `#EA6C03` | 2.98:1 | FAIL | FAIL | **FAIL** (misses 3:1 by 0.02) |
| `#113458` | 11.96:1 | AAA | AAA | PASS |
| `#3A3A3C` | 10.70:1 | AAA | AAA | PASS |
| `#231F20` | 15.37:1 | AAA | AAA | PASS |

**White text on brand fills:** `#FFFFFF` on `#F17924` = **2.80:1 — FAILS even large text.** On `#EF582B` = 3.44:1 (large only). **Orange buttons with white labels are not accessible at any brand orange value.**

**Orange on dark:** `#F17924` on `#113458` = **4.53:1 (AA normal)**; on `#231F20` = 5.82:1 (AA normal). `#F68E1F` on `#113458` = 5.32:1.

### 2d. Usability verdict + derived accessible ramp

**`#F17924` is an ACCENT-ONLY colour on light backgrounds.** It cannot be used for body text, small labels, link text on white, icon strokes that must meet 1.4.11, or as a button fill with white text. It is safe for: large decorative headings ≥24px only if darkened, the logo/symbol, large flat shapes, image overlays, and — critically — **as a foreground on the navy, where it reaches AA (4.53:1).**

Derived ramp (same HSL hue as `#F17924`, lightness reduced):

| Token | Hex | vs `#FFFFFF` | vs `#FAF8F4` | white-on-it |
|---|---|---|---|---|
| `orange-500` (brand) | `#F17924` | 2.80:1 | 2.64:1 | 2.80:1 |
| `orange-600` | `#E0650E` | 3.48:1 | 3.28:1 | 3.48:1 — UI/large text OK |
| **`orange-700`** | **`#BB550C`** | **4.75:1** | **4.48:1** | 4.75:1 — **AA body text on white** |
| `orange-800` | `#9C470A` | 6.33:1 | 5.96:1 | 6.33:1 |
| `orange-900` | `#7D3808` | 8.60:1 | 8.11:1 | 8.60:1 — AAA |

Recommended assignment: **`#F17924` = brand/decorative accent · `#BB550C` = accessible interactive orange (links, small text, icon strokes) · `#113458` = button fill / navigation / body-adjacent dark · `#231F20` or `#3A3A3C` = body text.** Note `#BB550C` reaches 4.48:1 on `#FAF8F4` — 0.02 short of AA; use `#B5520B` or darker if the warm off-white becomes the page ground.

---

## 3. TYPOGRAPHY

### 3a. Fonts the LIVE SITE loads

| Family | Delivery | Weights / styles served | Where used |
|---|---|---|---|
| **Roboto** | Google Fonts CDN link **and** self-hosted `/uploads/elementor/google-fonts/css/roboto.css` (162 faces) | 100–900, normal + italic | 22 `font-family` declarations in Elementor page CSS |
| **Rubik** | Google Fonts CDN only (`courselog-fonts` handle) | 400,400i,500,500i,700,700i,900,900i | Theme default; **no `font-family:"Rubik"` found in any served CSS — loaded but apparently unused** |
| **Poppins** | Self-hosted, 54 faces | 100–900, normal + italic | **25 declarations — the most-used family on the site** |
| **Archivo** | Self-hosted, 54 faces | 100–900, normal + italic | 3 declarations |
| **Playfair Display** | Self-hosted, 48 faces | 400–900, normal + italic | 1 declaration |
| **Manrope** | Declared in theme `master.css` (×2) | — | Referenced but **not loaded** → falls back to system sans |
| Font Awesome 5 Free, ekiticons, courselog `iconfont` | Icon fonts | — | Elementor / ElementsKit / theme |

Live `<head>` external link (verbatim):
`https://fonts.googleapis.com/css?family=Roboto:300,300i,400,400i,500,500i,700,700i,900,900i|Rubik:400,400i,500,500i,700,700i,900,900i&ver=1.3.9`

No `--e-global-typography-*` custom properties exist anywhere — Elementor global typography was never configured.

### 3b. Fonts in the OFFICIAL 2025 BROCHURE (this is the real brand type)

Extracted from `/BaseFont` entries in the decompressed PDF streams:

- **`HurmeGeometricSans1-Light` / `-Regular` / `-RegularObl` / `-SemiBold` / `-Bold` / `-Black`** ← 6 weights, the dominant family
- `ITCAvantGardePro-Bold`, `ITCAvantGardePro-Bk`
- `Poppins-Regular` (×2 subsets)
- `ArialRoundedMTBold` (×2), `ArialMT`, `Arimo-Regular`, `Helvetica`, `MyriadPro-Regular`, `MyriadVariableConcept-Roman` (last four look like placed-artwork residue, not deliberate)

**Interpretation (INFERRED):** Hurme Geometric Sans 1 is the intended brand typeface; Poppins is the web substitute the site builder reached for. Hurme Geometric Sans 1 is a **commercial licence** (Hurme Design) and would need a webfont licence. Poppins (SIL OFL) is the closest free geometric substitute already in use and is a defensible continuation.

### 3c. Turkish glyph coverage — ASSESSED

Required: `ç ö ü ğ ş ı` + `Ç Ö Ü Ğ Ş İ` = U+00C7/E7, U+00D6/F6, U+00DC/FC, U+011E/011F, U+015E/015F, U+0130, U+0131.

| Family | Subsets shipped | latin (U+0000-00FF + U+0131) | latin-ext (U+0100-02BA) | Turkish verdict |
|---|---|---|---|---|
| Roboto | latin, latin-ext, cyrillic, cyrillic-ext, greek, greek-ext, vietnamese, math, symbols | Yes | Yes (18 faces) | **FULL** |
| Poppins | latin, latin-ext, devanagari | Yes | Yes (18 faces) | **FULL** |
| Archivo | latin, latin-ext, vietnamese | Yes | Yes (18 faces) | **FULL** |
| Playfair Display | latin, latin-ext, cyrillic, vietnamese | Yes | Yes (12 faces) | **FULL** |

All four self-hosted families cover Turkish. `ı` (U+0131) is explicitly in the `latin` unicode-range; `İ Ğ ğ Ş ş` fall in the `latin-ext` range, which is present in every family. **Risk:** the subsetting means the browser must fetch a *second* font file for any string containing `İ/Ğ/Ş` — which is nearly every Turkish heading. In the Next.js rebuild, use `next/font` with `subsets: ['latin','latin-ext']` explicitly, or the Turkish headings will FOUT.

Hurme Geometric Sans 1's Turkish coverage — **UNKNOWN / REQUIRES VERIFICATION** with the foundry before committing to it as a webfont.

---

## 4. PHOTOGRAPHY & MEDIA INVENTORY

Source: `raw/wp/media.ndjson` — 964 records, **889 unique `source_url`** (75 duplicate rows).

### 4a. By MIME type (unique URLs)

| MIME | Count | % |
|---|---|---|
| image/jpeg | 532 | 59.8% |
| image/png | 261 | 29.4% |
| image/webp | 82 | 9.2% |
| image/svg+xml | 9 | 1.0% |
| application/pdf | 5 | 0.6% |

Declared filesize total: **344.9 MB** (only for items where `media_details.filesize` is present).

### 4b. By pixel dimension

- 875 items carry dimensions; 14 do not (the 5 PDFs + 9 SVGs).
- Width percentiles: p10 **255** · p50 **1000** · p90 **2048** · p99 **2560** · max **3741**.
- **>2500px wide: 69 items** (7.9%) — essentially all WordPress `-scaled` 2560px derivatives of stock photos.
- **>1600px wide: 226 items** (25.8%).
- Largest single-dimension cluster: **104 items at exactly 1800×1200** — a batch-resized partner-school photo set from Nov–Dec 2023.
- Heaviest single files: `image1.png` 2,768 KB (1892×1326), `WhatsApp-Image-2023-01-16.jpeg` 1,413 KB, `DSC_1090.jpg` 1,234 KB.

### 4c. Alt text — the accessibility baseline

**12 of 889 (1.3%) have non-empty `alt_text`. 877 (98.7%) are empty.** Complete list of every image that has any alt text:

| ID | alt_text (verbatim) | URL |
|---|---|---|
| 10054 | `englishpathdublin1` | `/uploads/englishpathdublin11.png` |
| 10053 | `englishpath4` | `/uploads/englishpath4.jpg` |
| 10050 | `english-path-2` | `/uploads/english-path-2.jpg` |
| 10042 | `Learn English in Dublin - Ec English` | `/uploads/ecenglishdublincs.jpg` |
| 10041 | `Learn English in Dublin -EC English` | `/uploads/ecenglishdublinb.jpg` |
| 10038 | `Learn English in Dublin with EC English` | `/uploads/ecenglishdublin.jpg` |
| 10037 | `Learn English in Dublin EC English` | `/uploads/ecenglishdublina.jpg` |
| 10027 | `Kaplan International Dublin Home Stay` | `/uploads/kaplaninternationaldublinhomestay.jpg` |
| 10026 | `Kaplan International Dublin - Residence` | `/uploads/KaplaninternationaldublinResidence.jpg` |
| 10024 | `English School in Dublin - Kaplan International` | `/uploads/kaplanineternationaldublinb.jpg` |
| 10022 | `English School in Dublin - Kaplan International` | `/uploads/kaplaninternationaldublina.jpg` |
| 6798 | `Happy Education` | `/uploads/cropped-happyedu.logo_.png` |

3 of the 12 are just the filename repeated (useless). The other 9 are genuine but all from one Dublin content push. **The rebuild has essentially no alt text to preserve — this must be authored from scratch, in Turkish.**

Live-page alt attributes are marginally better than the library: the header logo carries `alt="Happy Education"`, but the 5 team headshots on `/anasayfa/iletisim/` all carry `alt=""`, and every partner logo in the homepage slider carries `alt=""`.

### 4d. Provenance classification

| Class | Count | Basis | Reuse verdict |
|---|---|---|---|
| **Partner/institution marketing supplied** | ~665 | Filenames name the school/university: `OHC-London-*`, `kaplan-english-school-*`, `London_Central_*`, `St-Giles-*`, `Stafford-*`, `CATS-Cambridge-*`, `University-of-*` (a 2023-12-30 batch of ~60 at 1000×667), `Sir-Edward-Ely-`, `Skola-Regents-Park-`, `Twin-*`, `Top-Up-*`. The 104-file 1800×1200 batch is this. | **Do not migrate blind.** These belong to the schools. Licence for continued use is UNKNOWN — REQUIRES VERIFICATION per partner. |
| **Screenshots** | 64 | `Ekran-goruntusu-YYYY-MM-DD-HHMMSS.png` (Turkish for "screen capture"), clustered 2023-12-12, 2025-11-21, 2025-11-24. Inspected one: a Turkish programme timetable table. Non-uniform dimensions (839×541 … 1760×629). | **Discard.** Re-author as real HTML tables/content. |
| **Licensed stock — Shutterstock** | 53 files / **49 distinct Shutterstock asset IDs** | `shutterstock_<id>[-1][-scaled].jpg`, mostly 2560px, uploaded 2025-07 and 2025-10/11 | **Licence UNKNOWN — REQUIRES VERIFICATION.** Filenames retaining the Shutterstock ID is the classic signature of an unlicensed comp download; it is also what you get from a legitimate download. Cannot be resolved from filenames alone. |
| **Other stock** | 4 | `pexels-yan-krukau-8199562-scaled.jpg`, `pexels-jopwell-2422294-scaled.jpg`, `rut-miit-oTglG1D4hRA-unsplash-scaled.jpg`, `AdobeStock_134401978-1-1024x670-1.webp` | Pexels/Unsplash are free-licence (OK). The AdobeStock one REQUIRES VERIFICATION. |
| **Theme demo filler** | 37 | `placeholder-1.png` … `placeholder-20.png` (all 1200×800, uploaded 2025-06-16/2025-07-28), `mt-sample-background.jpg`, `2021/03/testimonial_1.png`, `testimonial_2.png` | **Discard.** |
| **UI decoration** | 18 | `funfact_img-*.png`, `info-box-icon-21.png`, `about-us.icon-2-1.png`, `shape`/`pattern` files, the 9 SVG icons | **Discard** — replace with an icon system. |
| **Logos** | 9 | 6 Happy Education + `qq.png` (Kaplan), `stgile-1.png` (St Giles), `ihh.jpg` (International House), `ep.png`, `lsi.png` | See §5c |
| **GENUINE Happy Education photography** | **~9** | See 4e | **Migrate — this is the only first-party imagery that exists.** |

### 4e. Genuine Happy Education photography (visually inspected, contact sheets at `/scratchpad/probe/_contact_sheet.png`, `/scratchpad/probe2/_sheet2.png`, `/scratchpad/probe3/_sheet3.png`)

**HIGH CONFIDENCE — genuine, first-party:**
- **5 individual team headshots** (`sefa.jpg`, `Yusuf.jpg`, `fatih.jpg`, `semra.jpg`, `akjemal.jpg`, 255×308, all uploaded 2025-06-16) — distinct real people, real environments (night-time street with bokeh, office interior, studio grey), consistent editorial treatment. Plus a 2024-01-08 earlier set at 255×270 (`Sefa-Mutlu-Kocax-1.jpg` etc.). These are the same five people named on the About and Contact pages.
- **`20221207_135125.webp`** (680×510) — students posed round a Christmas tree in a school common room. Android camera filename, dated 2022-12-07.
- **`WhatsApp-Gorsel-2025-10-30-saat-13.21.42_ae422fe9.jpg`** (974×777) — group of students posing on the grass at the Houses of Parliament / Big Ben.
- **`WhatsApp-Image-2023-01-16-at-09.39.55.jpeg`** (1800×1200) — ~25 students in a lecture theatre, hands raised, clearly a real group event.
- **`image1.jpeg`** (1098×1130) — group of ~14 students in front of a London Routemaster bus.

**MEDIUM CONFIDENCE — likely group-programme photos but agency-supplied or cropped:** `image1.png` (1892×1326) is a screen-captured/annotated version of `image1.jpeg` with a Speaking/Listening/Reading/Writing UI overlay — a derivative, not an original.

**FALSE POSITIVES — "happy" in the filename but generic stock:** `happy-banner.jpg`, `happy-banner2.jpg`, `formhappy.jpg`, `happydil.jpg`, `happy-home-center-back.jpg`, `about.jpg`, `Education-Schoogalleryl.jpg`. Verified visually: all are generic student/graduation stock, some are composite collages of three stock images. The `happy` prefix refers to the site, not to Happy Education's own camera.

**Country/city hero and category images are all stock:** `usa-1.jpg` (Statue of Liberty), `londra.jpg` (London Eye), `avustralya-2.jpg` (Sydney Opera House), `cambridge.jpg`, `oxford.jpg`, `irlanda-2.jpg`, `tur.jpg` (tour bus), `universiteler.jpg` (Royal Holloway), `dil-okullari.jpg`/`grup.jpg`/`bireysel.jpg`/`yatili.jpg` (generic classroom stock).

**Honest uncertainty:** filename/dimension heuristics cannot prove authorship. A partner school could have supplied a WhatsApp image; a staff member could have taken a photo that ended up with a generic filename. The 5 headshots and the 4 group photos are the only cases where the visual content itself is decisive.

### 4f. Watermark / copied-imagery flags

| Flag | Count | Files | Concern |
|---|---|---|---|
| **Clipart-scraper filename** | 1 | `png-clipart-kaplan-international-english-santa-barbara-education-university-student-universal-logo-blue-text.png` (900×900) | Filename is the auto-generated slug of a free-clipart aggregator. **Third-party trademark obtained from an unlicensed source.** |
| **PageSpeed-proxied hotlink** | 1 | `200x60xstrathcrest-whitetext-202x60.png.pagespeed.ic_._6erJHGLhG.webp` | Saved from another site's Google PageSpeed cache — i.e. lifted from a third-party website. |
| **Online-converter output** | 4 | `ezgif-1-5fbcb66b09.jpg`, `ezgif-1-7d5886220d.jpg`, `ezgif-5-1d3b83face.jpg`, `ezgif-1-199a4dcc65.jpg` (all 1800×1200) | Round-tripped through ezgif.com — provenance destroyed, EXIF stripped. |
| **"Saved from web" default names** | 5 | `unnamed.webp`, `unnamed-1.webp`, `unnamed-2.webp`, `unnameddd.webp`, `unnamedggg.webp` | Typical of right-click-save from Google Images / email. |
| **Web-scraped optimised** | 3 | `Studio-Stay-4-min.jpg`, `Stuido-Stay-6-min.jpg`, `45057433824_fc2d967e02_z-min.jpg` | The last is a **Flickr** photo ID + Flickr's `_z` size suffix. |
| **Stock ID retained in filename** | 54 | 53 Shutterstock + 1 AdobeStock | See 4d |
| **Partner logo burned into photo** | 2 | `Top-Up-Analogo.jpg` (TopUp Learning logo overlaid), `Twin-Ana-Fotologo.jpg` (Twin logo overlaid) | Not a watermark removal issue, but these are partner-branded composites that must not be reused generically. |

No visual watermark detection was performed (would require per-image inspection of 889 files). **The above is filename/metadata evidence only.**

### 4g. Broken assets discovered

- **`ep.png` (134×81)** — pixel-inspected: contains **only** `#1F2A44` (navy) and transparent. **A solid navy rectangle — the English Path logo artwork is missing.**
- **`lsi.png` (134×81)** — contains only `#0519C2` (blue) and transparent. **A solid blue rectangle — the LSI logo artwork is missing.**
Both are live in the homepage partner-logo slider and render as coloured blocks.
- Media export completeness: of 655 distinct upload filenames referenced in page/post HTML, **79 are absent from `media.ndjson`** — mostly `-scaled` originals, but also `Akjemal-Allaberdiyevax.jpg` (id 5449, HTTP 200, 12,042 bytes) which is live on `/anasayfa/iletisim/`. Media IDs in the export span 239–14741 with gaps: **the export is a partial snapshot.**
- **310 of 889 (34.9%)** unique media items are orphaned — zero exact-filename references in any page or post HTML.

### 4h. Upload-date clustering (unique URLs)

`2023-12` 272 · `2025-07` 246 · `2023-11` 72 · `2025-11` 57 · `2025-06` 44 · `2024-09` 38 · `2024-01` 25 · `2021-03` 25 · `2025-05` 20 · `2024-06` 20 · `2025-10` 18 · `2025-08` 17 · `2024-11` 14 · `2021-02` 12 · `2025-03` 6 · `2024-08/03`, `2023-10` 1 each.

Reads as four distinct site-build efforts: **2021-02/03** (theme install, demo assets), **2023-11/12** (the big partner-school content push, 344 files), **2025-06/07** (a redesign — Shutterstock buy + placeholder filler + new team headshots), **2025-10/11** (a screenshot-driven content push).

---

## 5. THE 30 PRIORITY IMAGES TO CARRY OVER

Ranked. Everything not in this list should be re-shot, re-licensed, or dropped.

**Tier 1 — brand assets (must migrate, irreplaceable)**

| # | URL | Why |
|---|---|---|
| 1 | `https://happyeducation.uk/wp-content/uploads/happyedu.logo_.png` | 1131×1131, highest-resolution lockup master; only viable vector-tracing source |
| 2 | `https://happyeducation.uk/wp-content/uploads/happylogo-foot2.png` | Only dark-background (white wordmark) lockup that exists |
| 3 | `https://happyeducation.uk/wp-content/uploads/cropped-micon.png` | 512×512 symbol-only mark — favicon, app icon, avatar, social profile |
| 4 | `https://happyeducation.uk/wp-content/uploads/micon.png` | 336×335 symbol, un-cropped (full sparkle bleed) |
| 5 | `https://happyeducation.uk/wp-content/uploads/happylogo-1.png` | The exact file the current header uses — needed for pixel-identical migration/redirect |
| 6 | `https://happyeducation.uk/wp-content/uploads/happylogofoot.png` | Lockup with white halo, for over-photo placement |
| 7 | `https://happyeducation.uk/wp-content/uploads/Happy-Education-Yaz-Okullari-2025-A4-print.pdf` | **The brand bible** — source of `#F17924`, `#113458`, Hurme Geometric Sans, and the "Education Beyond Boundaries" strapline |
| 8 | `https://happyeducation.uk/wp-content/uploads/Happy-Education-Bireysel-Yaz-Okullari-2026.pdf` | Current 2026 programme brochure, 35 MB — live downloadable collateral |

**Tier 2 — genuine first-party photography (irreplaceable without a re-shoot)**

| # | URL | Why |
|---|---|---|
| 9 | `.../uploads/sefa.jpg` | Sefa Mutlu Koca headshot, 255×308, 2025 set |
| 10 | `.../uploads/Yusuf.jpg` | Yusuf Baş headshot |
| 11 | `.../uploads/fatih.jpg` | Fatih Özdemir headshot |
| 12 | `.../uploads/semra.jpg` | Semra Atilay headshot |
| 13 | `.../uploads/akjemal.jpg` | Akjemal Allaberdiyeva headshot |
| 14 | `.../uploads/Sefa-Mutlu-Kocax-1.jpg` | 2024 alternate headshot (the one live on `/iletisim/`) |
| 15 | `.../uploads/Yusuf-Basx-1.jpg` | 2024 alternate |
| 16 | `.../uploads/Fatih-Ozdemirx-1.jpg` | 2024 alternate |
| 17 | `.../uploads/Semra-Atilayx-1.jpg` | 2024 alternate |
| 18 | `.../uploads/Akjemal-Allaberdiyevax.jpg` | 2024 alternate — **live but absent from the media export**; fetch directly |
| 19 | `.../uploads/WhatsApp-Image-2023-01-16-at-09.39.55.jpeg` | 1800×1200, ~25 students in a lecture theatre — the single best "real students" shot |
| 20 | `.../uploads/image1.jpeg` | 1098×1130, group in front of a London Routemaster — strong hero candidate |
| 21 | `.../uploads/WhatsApp-Gorsel-2025-10-30-saat-13.21.42_ae422fe9.jpg` | 974×777, group at the Houses of Parliament, most recent (2025-10-30) |
| 22 | `.../uploads/20221207_135125.webp` | 680×510, students round a Christmas tree — warm, human, low-res but genuine |

**Tier 3 — partner logos (needed for the credibility strip; each needs permission)**

| # | URL | Why |
|---|---|---|
| 23 | `.../uploads/qq.png` | Kaplan International English logo, 661×236 — the largest, cleanest partner logo on the site |
| 24 | `.../uploads/stgile-1.png` | St Giles logo (134×81 — too small; re-source from St Giles) |
| 25 | `.../uploads/ihh.jpg` | International House logo, 299×168 (JPEG — needs a transparent PNG/SVG re-source) |

**Tier 4 — high-usage institution photography (migrate only after per-partner licence confirmation)**

| # | URL | Why |
|---|---|---|
| 26 | `.../uploads/London.jpg` | 1800×1200; **25 exact-filename references** — the most-reused editorial image on the site |
| 27 | `.../uploads/London_Central_School_Exterior_With_Studentsx.jpg` | 1800×1200, St Giles London Central exterior with students; 5 refs |
| 28 | `.../uploads/CATS-Cambridge-1.jpg` | 1800×1200, CATS Cambridge; 5 refs; anchors the boarding-school section |
| 29 | `.../uploads/OHC-London-26x.jpg` | 1800×1200, Oxford House College London; 5 refs |
| 30 | `.../uploads/Sir-Edward-Ely-.jpg` | 1800×1200; 8 refs — the second-most-referenced image |

**Explicitly NOT on this list, and why:** every `shutterstock_*` file (licence unverified), all 64 `Ekran-goruntusu-*` screenshots, all 37 `placeholder-*.png`, `2021/03/testimonial_{1,2}.png`, `png-clipart-kaplan-*.png`, the `.pagespeed.` hotlink, the 4 `ezgif-*` files, the 5 `unnamed*` files, `ep.png` and `lsi.png` (broken solid rectangles), and every `happy-*`/`about.jpg`/country-hero stock image.

---

## 6. CONTACT, OFFICES, SOCIAL — VERBATIM

Sources: `https://happyeducation.uk/` , `https://happyeducation.uk/anasayfa/iletisim/` , `https://happyeducation.uk/anasayfa/hakkimizda/` (fetched 2026-08-20; local copies in `/scratchpad/audit/live/`).

### 6a. Phone / email / WhatsApp

| Field | Published value (verbatim) | Where |
|---|---|---|
| Telefon | `+44 7735 826785` | Contact page "Merkez Ofis" block; global footer |
| Telefon (alt formatting) | `+44 7735 826 785` | Homepage "Bizi Arayın!" block |
| E-Posta | `admin@happyeducation.uk` | Contact page; global footer |
| WhatsApp | `https://wa.me/+447735826785` | Floating widget on every page, 4 occurrences |
| WhatsApp CTA text | `Danışmanlarımızla iletişime geçin!` | Floating widget |

**There is exactly ONE phone number on the entire site.** It is a **UK mobile (+44 7…)**, not a landline. No Turkish/Istanbul phone number is published anywhere. `info@happyeducation.uk` appears once in the WP export but is **not** rendered on any live page.

### 6b. Offices

**London (global footer, "Adres"), verbatim including the line break:**
```
16 Upper Woburn Place, Londra, İngiltere
WC1H 0AF, Birleşik Krallık
```
Map: `https://maps.app.goo.gl/Q92b6tynTJRGVFUw8?g_st=iw`

**Istanbul (global footer, "Konum"), verbatim including the line break:**
```
Altunizade Mah. Kısıklı Cad. No:28 
Üsküdar, İstanbul
```
Map: `https://maps.app.goo.gl/EXy3NJtP7imJHrAi7`

**"Merkez Ofis" (head office) block on `/anasayfa/iletisim/`:** contains only a `Konum` link (`https://maps.app.goo.gl/cAgrbFRUF5HWYkcx9`), `Telefon +44 7735 826785`, `E-Posta admin@happyeducation.uk`. **No street address is printed in this block** — a content gap. Which of the three Google Maps short-links resolves to which building was not de-referenced.

**CROSS-VERIFIED:** Companies House (`https://find-and-update.company-information.service.gov.uk/company/11331426`, fetched live) returns **HAPPY EDUCATION CONSULTANCY LTD**, company number **11331426**, registered office **`16 Upper Woburn Place, London, England, WC1H 0AF`**, status **Active**, **incorporated 26 April 2018**. The registered office matches the published London address character-for-character, and the incorporation date corroborates the About page's "2018'de … kurulmuş".

The site itself **never publishes** the legal entity name, company number, or VAT number in any footer or imprint. The number `11331426` appears on the site exactly once — inside `/policy/`, where a template-fill error has substituted the Companies House URL for the site URL: *"Bu Gizlilik Politikası, https://find-and-update.company-information.service.gov.uk/company/11331426 adresini ziyaret ettiğinizde…"*. **This is a bug to fix, and a UK-law gap: a limited company's website must state the registered name, number, and registered office.**

### 6c. Working hours — published on the HOMEPAGE only, verbatim

```
Çalışma Saatleri
Yaz Saati 9.30 - 17.30
Kış Saati 9.00 - 17.00
```
(Preceded by `Tüm sorularınız için buradayız – bizimle iletişime geçin!` and followed by `Bizi Arayın!` `+44 7735 826 785`.)

Note: the same widget in the archived WP export (`pages.ndjson`, page 12883) has an **empty** `<p>` under the heading — the live version is newer. The hours are **not** on the Contact page. No timezone is stated, and no dates define "Yaz"/"Kış".

### 6d. Social media — complete list of external profile URLs on live pages

| Platform | URL | Occurrences |
|---|---|---|
| Instagram | `https://www.instagram.com/happyeducationturkiye/` | 13 |
| Facebook | `https://www.facebook.com/HappyEdUK` | 13 |
| LinkedIn | `https://www.linkedin.com/company/happyeducation` | 12 (+1 with trailing slash) |

**No YouTube, no TikTok, no X/Twitter, no Telegram, no Pinterest** anywhere on the site. Note the naming inconsistency: Instagram is `happyeducationturkiye` (Türkiye-facing) while Facebook is `HappyEdUK` (UK-facing).

The `Takip Et` ("Follow us") block on the Contact page contains **only the Facebook link** — Instagram and LinkedIn are missing from it, a bug.

Also present: an Instagram Feed Pro plugin (`instagram-feed-pro/css/sbi-styles.min.css`) and Google Tag Manager container `GTM-PCTZXT3Z`.

### 6e. Named team members

From `/anasayfa/hakkimizda/` and `/anasayfa/iletisim/` (roles differ slightly between the two pages — reported verbatim from each):

| Name | Role on /hakkimizda/ | Role on /iletisim/ | Photo (live, `alt=""`) |
|---|---|---|---|
| **Sefa Mutlu Koca** | `Müdür` | `Yönetici` | `/uploads/Sefa-Mutlu-Kocax-1.jpg` (255×270) |
| **Yusuf Baş** | `Üniversite ve Yatılı Okullar Koordinatörü` | same | `/uploads/Yusuf-Basx-1.jpg` |
| **Fatih Özdemir** | `Dil Kursları ve Yaz Okulları Koordinatörü` | same | `/uploads/Fatih-Ozdemirx-1.jpg` |
| **Semra Atilay** | `Sosyal Medya Yöneticisi` | same | `/uploads/Semra-Atilayx-1.jpg` |
| **Akjemal Allaberdiyeva** | `Yönetim Danışmanı` | `Yönetim Danışman` (typo, no final "ı") | `/uploads/Akjemal-Allaberdiyevax.jpg` |

Newer 255×308 headshots of the same five exist at `/uploads/{sefa,Yusuf,fatih,semra,akjemal}.jpg` (2025-06-16) but are not the ones currently rendered on `/iletisim/`. No email, phone, or LinkedIn is published for any individual. Corroborated indirectly by testimonial BAYRAM, who thanks "Sefa Bey" and "Fatih Bey" by name.

### 6f. About-page claims — each REQUIRES VERIFICATION

Verbatim from `/anasayfa/hakkimizda/`:

- `Happy Education, 2018'de Londra merkezli olarak kurulmuş…` — **CORROBORATED** by Companies House (incorporated 26 April 2018). ✔
- `…dünyanın en saygın üniversitelerinde lisans ve yüksek lisans eğitimi almaya hak kazanan 500'den fazla öğrenciye tüm başvuru süreçlerinde danışmanlık hizmeti verdik.` — **REQUIRES VERIFICATION** (500+ university students).
- `…700'den fazla öğrencinin İngiltere, Kanada, Malta ve İrlanda gibi ülkelerdeki prestijli yaz okulları ve dil kurslarında eğitim alarak…` — **REQUIRES VERIFICATION** (700+ summer-school/language students).
- `Yaz okulu programlarımız Endonezya, Romanya, Kazakistan, Azerbaycan, Almanya, Türkiye ve daha birçok ülkeden öğrenci tarafından tercih ediliyor.` — **REQUIRES VERIFICATION**.
- `Vizyonumuz, dünyanın dört bir yanından öğrencilere **ücretsiz** ve güvenilir eğitim danışmanlığı sunmak…` — the free-of-charge claim. **REQUIRES VERIFICATION** and has consumer-law implications if commission-funded; the funding model must be disclosed.
- Four animated counters labelled `Ülke` (countries), `Üniversite`, `Lise`, `Öğreci` [sic — misspelling of `Öğrenci`]. **All four render as `0 +`** in the fetched HTML and no `data-to-value` attribute was found. **The actual target numbers are UNKNOWN** — either JS-injected at runtime or genuinely unset. REQUIRES the business to supply real figures.

### 6g. Accreditation / partner claims — precisely what is claimed, and about whom

**CRITICAL DISTINCTION: Happy Education makes NO accreditation claim about itself anywhere on the site.** Every accreditation mention describes a **partner school**. Counts from `raw/wp/pages.ndjson`: "British Council" ×14, "English UK" ×4, "UKVI" ×1, "ICEF" 0, "IALC" 0, "Quality English" 0, "AIRC" 0, "BAC" 0, "ISO 9001" 0, "NARIC" 0, "TÜRSAB/UED" 0.

Representative verbatim claims (each **REQUIRES VERIFICATION** with the named school, not with Happy Education):

| Claim (verbatim excerpt) | Subject | Status |
|---|---|---|
| `Kaplan International Oxford, … saygın British Council ile English UK akreditasyonlarına sahiptir` | Kaplan Oxford | REQUIRES VERIFICATION |
| `Kaplan International, … British Council ve English UK gibi kurumlar tarafından akredite edilmiş bir markadır` | Kaplan (global) | REQUIRES VERIFICATION |
| `Edskills Language School, 2012 yılında kurulmuş olup, 2016'dan bu yana British Council akreditasyonuna sahiptir` | Edskills Birmingham | REQUIRES VERIFICATION |
| `Oxford House College, British Council tarafından akredite edilmiş ve English UK üyesi bir okul olup, her yıl 7.000'den fazla uluslararası öğrenciye eğitim vermektedir` | OHC | REQUIRES VERIFICATION |
| `British Council akreditasyonu ve English UK üyeliği ile kalitesini belgeleyen Stafford House London…` | Stafford House | REQUIRES VERIFICATION |
| `British Council tarafından akredite edilen ve English UK üyesi olan St Giles London Central…` | St Giles | REQUIRES VERIFICATION |
| `British Council akreditasyonuna sahip Kaplan International London…` | Kaplan London | REQUIRES VERIFICATION |
| `[Vancouver school] Languages Canada, ALTO, British Council ve Cambridge gibi önemli kuruluşlar tarafından akredite edilmiştir` | Vancouver school | REQUIRES VERIFICATION |
| `EC Malta … British Council, Eaquals, ALTO ve FELTOM gibi kuruluşlar tarafından tanınan okul…` | EC Malta | REQUIRES VERIFICATION |
| `British Council accredited, draws thousands of international students yearly.` (English, summer-school page) | unnamed school | REQUIRES VERIFICATION |
| `Foundation için en az 11 yıl ya da 12 yıl okumuş olma şartı ve en az 4.5 UKVI IELTS şartı gerekmektedir.` | UKVI IELTS requirement | **Factual/regulatory claim about UK immigration rules — REQUIRES VERIFICATION against current UKVI guidance** |

**Partner/credibility logo strip on the homepage** (ElementsKit client-logo slider) contains **5 third-party logos**, all with `alt=""`:
`qq.png` (Kaplan International English, 661×236) · `ep.png` (English Path — **BROKEN, renders as a solid navy rectangle**) · `lsi.png` (LSI — **BROKEN, solid blue rectangle**) · `ihh.jpg` (International House, 299×168) · `stgile-1.png` (St Giles, 134×81).
**These are third-party trademarks displayed without any stated permission — REQUIRES VERIFICATION that Happy Education holds agent/partner agreements permitting logo use with each of Kaplan, English Path, LSI, International House and St Giles.**

---

## 7. TESTIMONIALS — VERBATIM

### 7a. `/anasayfa/testimonial/` (page id 3836) — **FABRICATED THEME DEMO. DO NOT MIGRATE.**

Two entries, identical text:

> **Quote:** `It's very simple but the rewards are great. I'm a novice at this programming, thanks to Happy Education.`
> **Name:** `Mehmet Akif Turgut` — **Role:** `Postgraduate Student` — **Photo:** `/uploads/2021/03/testimonial_1.png` (229×252)

> **Quote:** `It's very simple but the rewards are great. I'm a novice at this programming, thanks to Happy Education.`
> **Name:** `Blaise Matuidi` — **Role:** `Postgraduate Student` — **Photo:** `/uploads/2021/03/testimonial_2.png` (229×252)

**Assessment: NOT GENUINE.** Four independent tells — (1) the two quotes are byte-identical; (2) the text is boilerplate about *programming*, irrelevant to education consultancy; (3) "Blaise Matuidi" is a well-known French footballer; (4) both photos live under `/uploads/2021/03/` alongside `testimonia-icon.png` and `left-quotes-sign.png` — the ElementsKit demo-import batch from the theme install. **Delete this page and 301 it.**

### 7b. Homepage testimonial slider — **7 entries, appear GENUINE**

Verbatim, in slider order (name / institution attribution / quote). **No photos** — the slider carries only the site logo as a fallback client-logo.

1. **DİLARA** — `(Westminster Üniversitesinde - Yüksek Lisans )`
   > `Happy Education'ın desteği ile vize sürecimi ve üniversite başvuru sürecimi rahatlıkla tamamladım. Eğitim hedeflerimi başarmamda bana yardımcı olan Happy Education'a teşekkür ederim.`

2. **MELİKE** — `(Into City of London'da İnsan Hakları ve Hukuk/ hazırlık yılı)`
   > `Romanya'da lise bitirdikten sonra Happy Education'ın yardımları ile İngiltere'de eğitimime devam ettim. İlgileri için çok teşekkür ederim, hepinize gönül rahatlığıyla tavsiye ederim.`

3. **ZEYNEP** — `(City Üniversitesi - Biyomedikal Mühendisliği)`
   > `Happy Education'ın yardımlarıyla Londra'ya geldim ve City Üniversitesi Biyomedikal Mühendisliği bölümünden mezun oldum. Happy Education'a çok teşekkür ederim.`

4. **FEYZA** — `(UAL - Grafik ve Medya Tasarım)`
   > `Hayalimdeki Grafik ve Medya tasarım bölümünden kabul almamda bana yardım eden ve üniversiteye başvuru sürecinde beni çok destekleyen Happy Education'a teşekkür ederim.`

5. **ESRA** — `(English Path - Toronto'da dil kursu öğrencisi)`
   > `Happy Education'ı seçtiğim için çok mutluyum bana çok yardımcı oldular.`

6. **BAYRAM** — `(Westminister Üniversitesi)` *[sic — "Westminister" misspelt; entry 1 spells it "Westminster"]*
   > `Bu maceramda emeği geçen öncelikle Sefa Bey'e ve tüm aşamalarda destek olan Fatih Bey'e çok teşekkür ederim. Happy Education iyi ki varsın.`

7. **ASLI** — `(Stafford House'da dil kursu öğrencisi )`
   > `Happy Education'a beni buraya kolaylıkla ve güvenle getirdikleri için teşekkür ederim.`

**Assessment: PLAUSIBLY GENUINE.** Seven distinct texts, varied length (from 9 words to 30), varied register, specific and internally consistent institutions (Westminster, INTO City of London, City, UAL, English Path Toronto, Stafford House — all of which appear elsewhere as partner schools), natural Turkish including a colloquialism ("iyi ki varsın"), and entry 6 names two staff members who are independently listed on the About page. The inconsistent spelling and stray spaces are what hand-entered real content looks like.

**Caveats:** first names only, no surnames, no photos, no dates, no graduation years, no verifiable identity — so they are **unverifiable as written** and would not satisfy an ASA substantiation request. **REQUIRES VERIFICATION**: obtain written consent plus at minimum a surname initial, year, and ideally a photo for each before republishing. For the rebuild, model these as Sanity documents with `name`, `institution`, `programme`, `year`, `photo`, `consentOnFile: boolean`.

---

## 8. LOCAL PATHS OF EVERYTHING DOWNLOADED

**Brand assets** — `/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/audit/brand/`
`happyedu.logo_.png` · `happyedu-logo-1131.png` (duplicate) · `cropped-happyedu.logo_.png` · `happylogo-1.png` · `happylogo.png` · `happylogo-foot2.png` · `happylogofoot.png` · `micon.png` · `cropped-micon.png` · `Happy-Education-Yaz-Okullari-2025-A4-print.pdf` · `Happy-Education-Bireysel-Yaz-Okullari-2026.pdf`

**Live HTML / CSS / font manifests** — `/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/audit/live/`
`home.html` · `iletisim.html` + `iletisim.txt` · `hakkimizda.html` + `hakkimizda.txt` · `testimonial.html` + `testimonial.txt` · `ch.html` (Companies House record) · `post-{4,23,53,198,1510,12883,12949}.css` · `master.css` · `courselog-custom.css` · `child-style.css` · `font-{archivo,playfairdisplay,poppins,roboto}.css` · `elementor-global.css` (404 body — discard) · `about.html`, `contact.html`, `anasayfa.html` (404 bodies)

**Derived analysis JSON** — `/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/audit/`
`media-uniq.json` (889 deduped media records) · `media-cat.json` (provenance classification) · `media-usage.json` (exact-filename reference counts per asset)

**Visual verification contact sheets**
`/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/probe/_contact_sheet.png` (17 team/brand candidates)
`/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/probe2/_sheet2.png` (15 first-party/partner-photo candidates)
`/private/tmp/claude-501/-Users-nuriyilmaz-HappyEdu/ad4f1e77-9060-4942-b35f-5b667f2eeeec/scratchpad/probe3/_sheet3.png` (14 hero/category images — all confirmed stock)
plus the individual source JPEG/PNG/WEBP files in each `probe*/` directory.

---

## 9. OPEN ITEMS FOR BUSINESS VERIFICATION

| # | Item | Why it blocks the rebuild |
|---|---|---|
| 1 | **Original vector logo (AI/EPS/SVG)** from the brochure designer | No vector exists on the site; PNG ceiling is 916×384 |
| 2 | **Hurme Geometric Sans 1 webfont licence** — or approval to standardise on Poppins | Determines the whole type system |
| 3 | **Shutterstock licence records** for the 49 distinct asset IDs | Cannot migrate 53 images without proof |
| 4 | **Written partner-logo permission** from Kaplan, English Path, LSI, International House, St Giles | Trademarks currently displayed with no stated basis |
| 5 | **Per-school image licences** for the ~665 partner marketing photos | 75% of the library |
| 6 | Correct **English Path and LSI logo files** | Current files are blank coloured rectangles |
| 7 | **Real counter figures** for Ülke / Üniversite / Lise / Öğrenci | Currently render as `0 +` |
| 8 | **Substantiation for "500+" and "700+" student claims**, and for the "ücretsiz" (free) service claim | ASA/consumer-law exposure |
| 9 | **Testimonial consent + surnames/years** for the 7 homepage quotes | Unverifiable as published |
| 10 | **Istanbul office phone number**; confirmation of which Google Maps pin is the "Merkez Ofis" | Contact page has a location link with no address |
| 11 | **Legal footer**: registered name, company number 11331426, registered office | Currently absent; UK requirement for a limited company |
| 12 | Fix `/policy/` — the Companies House URL is substituted for the site URL | Live content bug |
| 13 | Decide whether `admin@` or a role-based address (`info@`, `basvuru@`) is the public contact | Only `admin@happyeducation.uk` is published |
| 14 | Turkish alt text for every migrated image | 98.7% of the library has none |