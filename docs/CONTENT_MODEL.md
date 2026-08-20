# Content model

The Sanity schema, what every field is for, and how to publish. It has two audiences: the second
half is written for members of staff who do not write code.

- Sections 1 to 8: the model and the rules it enforces
- Section 9: **step-by-step walkthroughs for editors**

Schema files: `sanity/schemas/documents/core.ts`, `sanity/schemas/documents/content.ts`,
`sanity/schemas/objects/*.ts`, shared fields in `sanity/schemas/shared.ts`, Studio navigation in
`sanity/lib/structure.ts`.

---

## 1. The locale model

**Each language is a separate document.** There is no field-level translation. A Turkish page and
its English counterpart are two documents that both point at the same `translationGroup`.

```
translationGroup: "Destination - United Kingdom"
        |
        +-- destination  locale: tr  slug: ingiltere
        +-- destination  locale: en  slug: united-kingdom
```

### Why it is built this way

**The two trees are not translations of each other.** Turkish is the primary market, with 331 pages
of history and existing search rankings. The English tree is thinner and structured differently.
Treating one as a translation of the other would misrepresent both.

**Slugs must differ per locale.** `/tr/universiteler/ingiltere` is a URL the current site already
ranks for. Preserving it is worth real traffic. Field-level localisation makes per-locale slugs
awkward and tends to push everyone towards one shared slug, which throws that away.

**Editors should see one language at a time.** Someone writing Turkish should open a Turkish
document, not a form with half its fields in a language they are not writing. The Studio's desk
(`sanity/lib/structure.ts`) reinforces this: the top level splits into "Türkçe içerik" and
"English content" before it splits by document type.

**Nothing is machine-translated.** A Turkish document is written in Turkish, as Turkish, not as a
word-for-word rendering of the English.

### What the translation group buys

The language switcher. Because `/en/universities/united-kingdom` and `/tr/universiteler/ingiltere`
share no URL segment, swapping segments client-side cannot work. The switcher asks the server,
which walks document to group to sibling and redirects to the real equivalent page. Without a
group, that switch falls back to the section index (still useful) and then to the home page (a last
resort the model exists to avoid).

**Practical rule for editors: create the translation group first, then point both language versions
at it.** A document with no group is not broken, but its language switcher will not land on the
right page.

### Fields every localisable document shares

Defined once in `sanity/schemas/shared.ts`:

| Field | Type | Rules |
|---|---|---|
| `locale` | string, radio | **Required.** `en` or `tr`. Defaults to `tr`, because Turkish is the larger tree. |
| `slug` | slug | **Required.** Max 96 characters. Generated from the title. |
| `translationGroup` | reference | Optional but strongly expected. A hard (non-weak) reference. |
| `seo` | `seo` object | Optional. Falls back to the document's own title and excerpt. |
| `review` | `reviewMeta` object | Optional in the schema, required in practice for time-sensitive content. |

**Slug generation handles Turkish properly.** Turkish characters transliterate to ASCII before
slugification: `ı`→`i`, `İ`→`i`, `ğ`→`g`, `ş`→`s`, `ç`→`c`, `ö`→`o`, `ü`→`u`. So "İngiltere"
becomes `ingiltere`, not the broken `i̇ngiltere` a naive `toLowerCase()` produces. This matters:
a mangled slug is a permanent URL defect.

**Field groups.** Long documents use consistent tabs so they stay navigable: Content (default),
Details, Related, Editorial, SEO. Summer programmes and tours add a Safeguarding tab.

---

## 2. Object types

Reusable shapes, defined in `sanity/schemas/objects/`.

### `source`

The provenance of a single fact.

| Field | Type | Rules |
|---|---|---|
| `label` | string | **Required.** e.g. "UK Home Office, Student visa guidance" |
| `url` | url | **Required.** `http` or `https` only. |
| `accessed` | date | **Required.** When someone actually looked at it. |

All three are required together. A URL with no date is not a source; it is a link that was true at
some unknown point.

### `reviewMeta`

Editorial provenance, surfaced to the reader by the `ReviewMeta` component.

| Field | Type | Purpose |
|---|---|---|
| `lastReviewed` | date | When a person last checked this against its sources. |
| `reviewedBy` | reference to `author` | Only name someone who genuinely reviewed it. |
| `nextReviewDue` | date | Drives the "Review overdue" list in the Studio. |
| `timeSensitive` | boolean | Tick for visa rules, fees, prices, work rights, deadlines. |
| `sources` | array of `source` | **Validated: if `timeSensitive` is ticked, at least one source is required.** |
| `editorialFlag` | text | Migration notes and unresolved questions. Anything written here appears in the "Needs editorial review" list and blocks the pre-launch check. |

`reviewedBy` has **no fallback name**, deliberately. An unearned reviewer credit is a false trust
signal, and search engines and readers both treat a named reviewer as evidence of expertise.

### `sourcedFact`

A single fact that carries its own provenance. Used in fee tables, English requirements and price
lists, which is exactly the content that goes stale fastest.

| Field | Rules |
|---|---|
| `label` | **Required.** e.g. "Tuition, international undergraduate" |
| `value` | **Required.** e.g. "£24,500" |
| `note` | Optional qualifier. e.g. "per year, 2026/27 entry" |
| `source` | A `source` object |

### `imageWithMeta`

Every image on the site uses this type. Two fields are load-bearing; see section 5.

| Field | Rules |
|---|---|
| `alt` | **Required unless `decorative` is ticked.** Custom validation also rejects generic values such as "image", "photo", "picture" or "logo". |
| `decorative` | Opt-in. Emits `alt=""`. |
| `caption` | Optional, rendered under the image. |
| `licence.holder` | Who owns the image. |
| `licence.terms` | e.g. "Owned outright", "Supplied by the school for marketing use", "Stock licence #12345". |
| `licence.cleared` | **Defaults to false. The image does not appear on the public site until this is ticked.** |

Hotspot and crop are enabled, and the image URL builder respects them, so the editor's chosen focal
point survives cropping to any aspect ratio.

### `richText` (Portable Text)

Deliberately constrained. Editors get headings, lists, links, tables, images, quotes and callouts,
and nothing that can inject markup.

- **Styles:** Paragraph, H2, H3, H4, Quote. **H1 is absent on purpose**, because the page template
  owns the single H1 and an editor cannot be allowed to break the heading outline.
- **Marks:** bold, italic.
- **Annotations:** `internalLink` (a reference to another document, so the link cannot rot when a
  slug changes) and `externalLink` (a URL restricted at the schema level to `http`, `https`,
  `mailto`, `tel`).
- **Blocks:** `imageWithMeta`, `table` (headers, rows, caption, optional `source`), `callout`
  (tone: Note / Important / Official guidance).

**There is no HTML block and no raw embed type.** No CMS value can ever reach
`dangerouslySetInnerHTML`. Legacy WordPress shortcodes and plugin markup are stripped during
migration rather than being given a home here.

### `seo`

Everything optional. Empty fields fall back to the document's own title and excerpt, so an editor
never has to fill this in to get sensible metadata.

| Field | Guidance |
|---|---|
| `title` | Aim for 50 to 60 characters. Warns over 70. |
| `description` | Aim for 140 to 160 characters. Warns over 180. |
| `image` | Social sharing image. Falls back to the page image. |
| `noIndex` | Only for pages that genuinely should not be indexed. |

Both length rules are **warnings, not errors**. A truncated meta title is a cosmetic problem, not a
reason to block publishing.

### `faqItem`

`question` (string, required) and `answer` (rich text, required). Rendered as native
`<details>` elements and used to emit FAQPage structured data, but only when real questions exist.

### `cta`

`label` and `href`, both required. The field description carries the writing rule: say what
happens ("Speak to a university adviser"), not "Get started" or "Learn more".

---

## 3. Core documents

`sanity/schemas/documents/core.ts`

### `siteSettings` (singleton)

Removed from the "create new" menu so nobody can make a second one. Grouped into Identity,
Contact, Social and Default SEO.

Identity holds `tradingName`, `legalName` ("Must match the Companies House register exactly"),
`companyNumber`, `registeredOffice` and `logo`. Contact holds `phone`, `whatsapp` (digits only,
including country code), `email`, `workingHours` (an array of `sourcedFact`, label = day range,
value = hours) and references to `office` documents. Social is a list of platform plus HTTPS-only
URL, with the constraint stated in the field description: **only Happy Education accounts.
Partner-school profiles must never be listed here.**

The `registeredOffice` description carries the rule that matters: this is a serviced address and
must never be described as a staffed office.

### `translationGroup`

One field, `title`, an internal name only editors see, such as "Destination, United Kingdom". The
document holds no content. It exists purely as the shared identity two language versions point at.

### `category`

Editorial categories for the blog's topic clusters. `locale`, `title`, `slug`, `description`,
`translationGroup`.

### `author`

Real Happy Education people. There is no facility for inventing an expert byline.

| Field | Notes |
|---|---|
| `name` | **Required.** |
| `slug` | **Required**, generated from the name. |
| `role` | Their actual role, e.g. "University applications adviser". |
| `bio`, `photo` | Optional. |
| `consentOnFile` | **Defaults to false.** Required under UK GDPR before a name or photograph is published. |

`author` is also the target of `reviewMeta.reviewedBy`, so the reviewer credit on any page resolves
to a real person.

### `teamMember`

Similar to `author` but for the About page rather than bylines: `name`, `role`, `locale`, `bio`,
`photo`, `order`, and the same `consentOnFile` gate.

### `office`

| Field | Notes |
|---|---|
| `name` | **Required.** |
| `kind` | **Required.** Registered office (not staffed) / Staffed office visitors can attend / Correspondence only. |
| `address` | **Required.** |
| `country`, `phone`, `email`, `mapUrl` | Optional. |
| `verified` | Defaults to false. Tick when the business has confirmed the address. |

**`kind` is published, not internal.** The registered office is a Regus serviced address shared
with roughly 2,600 other registered companies. Describing it as a staffed office would be a
misleading commercial claim, so the schema makes the distinction a required, structured choice
rather than something that depends on how the copy happens to be worded.

### `testimonial` ("Student experience")

Two gates before anything appears publicly.

| Field | Notes |
|---|---|
| `studentName` | **Required.** "As the student has agreed it should appear. Do not add a surname they did not give." |
| `quote` | **Required.** |
| `programme` | Only if the student stated it. |
| `permissionStatus` | **Required.** Written permission on file / Verbal permission recorded / Not obtained (default). |
| `verified` | **Defaults to false. Unverified entries never appear on the site.** |

The Studio preview appends "NOT VERIFIED, hidden" to the subtitle of anything not ticked, so the
state is visible in a list without opening the document.

Context for why this is strict: the legacy site's `/anasayfa/testimonial/` page was **100 percent
theme demo content**, including a fictional testimonial attributed to "Blaise Matuidi". The real
testimonials were seven Turkish quotes elsewhere on the homepage. Fake testimonials are a
consumer-protection problem, not a styling one.

### `partner`

| Field | Notes |
|---|---|
| `name` | **Required.** |
| `logo`, `website` | Optional. |
| `relationship` | **Required.** Signed representation agreement / Students placed, no formal agreement / No relationship, listed for information only. |
| `logoUsagePermitted` | **Defaults to false.** Trademarks are not usable by default. |

**Only institutions with a signed agreement may appear in a "partners" display.** The others are
informational listings. A "trusted by" wall of university logos with no agreement behind it makes
two false claims at once, one about the relationship and one about the right to use the mark.

### `legalPage`

`locale`, `title`, `slug`, plus `key` (**required**, one of the eleven keys in `src/lib/legal.ts`:
privacy, cookies, terms, serviceTerms, paymentTerms, refunds, appointments, disclaimer,
accessibility, complaints, safeguarding), `body`, `effectiveDate`, and:

`solicitorApproved` (**defaults to false**). Drafts generated during the rebuild are not legal
advice. The Studio preview shows "DRAFT, not approved" until this is ticked.

The slugs are fixed per locale in `src/lib/legal.ts` (`privacy-policy` / `gizlilik-politikasi`, and
so on) and the footer renders that registry directly, so a missing legal document surfaces as a
broken link in the link checker rather than quietly disappearing.

### `redirect`

`from` and `to` (both **required**, both validated to start with `/`), `permanent` (defaults to
true, meaning 301) and `reason`.

Create one whenever a published URL changes. `docs/audit/redirects-draft.csv` holds 395 rows
prepared from the legacy site: 336 required mappings, 43 legacy aliases and 16 internal targets
that currently 404.

---

## 4. Content documents

`sanity/schemas/documents/content.ts`

### `destination` (country or city)

The editorial backbone. This is what ranks for "study in the UK" style queries and what links out
to the institutions.

| Field | Group | Notes |
|---|---|---|
| `kind` | Content | **Required.** Country or City. |
| `parent` | Content | Reference to another destination. Shown only when `kind` is City. Produces `/en/universities/united-kingdom/london`. |
| `section` | Content | **Required.** Universities / Language schools / Boarding schools / Summer schools. Decides which URL section the page lives under. |
| `heroImage`, `intro` | Content | `intro` is a short standfirst, two or three sentences. |
| `whyStudyHere`, `educationSystem`, `applicationJourney` | Content | Rich text. |
| `entryRequirements`, `scholarships`, `accommodation` | Details | Rich text. |
| `englishRequirements` | Details | Array of `sourcedFact`. |
| `costs` | Details | Array of `sourcedFact`. "Every figure needs a source and a date. These go stale quickly." |
| `visaOverview` | Details | Rich text. **See the constraint below.** |
| `keyCities`, `institutions`, `relatedArticles` | Related | References. |
| `faqs`, `cta` | | |

**The `visaOverview` constraint is a legal one, not a style preference.** No IAA (formerly OISC)
registration is confirmed for this company, and under the Immigration and Asylum Act 1999 giving
immigration advice in the course of a business requires it. The field description states the rule:
describe the process, link to the official government source, do not give personalised advice, and
never state or imply a guaranteed outcome. The same applies anywhere else visa content appears.

### `institution` ("University")

Shares a common block with the other institution-shaped types: `destination` reference, `city`,
`country`, `heroImage`, `logo`, `officialWebsite`, `overview`, `accommodation`, `fees`
(`sourcedFact` array), `faqs`, `relatedArticles`, `cta`.

Two field descriptions carry rules: `logo` is "only if permission to display the institution's logo
has been confirmed", and `officialWebsite` notes that "none of the legacy pages carried this, so it
must be sourced" (which is why the 313 extracted institution records in
`docs/audit/institutions-extracted.json` carry field-level provenance).

University-specific: `founded`, `subjectAreas`, `degreeLevels` (Foundation / Bachelor / Master /
Doctorate / Pre-sessional English), `intakes`, `entryGuidance`, `englishRequirements`,
`scholarships`, and:

**`rankings`** requires all five of `organisation`, `year`, `category`, `position` and `source`.
A ranking without its exact category and year is not information, it is decoration, and it becomes
wrong within twelve months. The field description says it plainly: only add one if you will
maintain it.

### `languageSchool`

Same shared institution block, plus `courseTypes` (General English, Intensive English, IELTS
preparation, Business English, Academic English, Cambridge exam preparation, One-to-one),
`lessonsPerWeek`, `levels`, `minimumAge`, `facilities`, `socialProgramme`, `startDates`, and:

**`accreditations`**, each with `body`, `verified` (defaults to false) and `source`. The field
description is emphatic and worth repeating: **these are the school's accreditations, not Happy
Education's.** Happy Education holds no British Council, English UK, ICEF or BAC accreditation, and
none may be claimed anywhere on the site. Unverified entries show "NOT VERIFIED, hidden" in the
Studio.

### `boardingSchool`

Same shared block, plus `ageRange`, `curriculum` (GCSE / A Level / IB / BTEC / Foundation /
Pre-GCSE), `boardingOptions`, `admissions`, and `safeguardingNote`, which describes what **the
school** is responsible for. The field description: do not make safety guarantees on the school's
behalf.

### `summerProgramme`

These involve minors, so the schema separates marketing from the information a parent actually
needs. It has an extra **Safeguarding** tab.

Content and Details: `format` (**required**, Individual or Group), `destination`, `city`,
`heroImage`, `overview`, `ageRange`, `dates`, `duration`, `academicFocus`, `languageLevel`,
`lessonsPerWeek`, `accommodation`, `meals`, `activities`, `excursions`, `included`, `excluded`,
`price` (`sourcedFact` array, current season only).

Safeguarding tab, and these are the fields that matter most:

| Field | Purpose |
|---|---|
| `providerResponsibilities` | What the school or provider is responsible for. |
| `happyEducationResponsibilities` | What Happy Education is responsible for. "Be precise and do not overstate." |
| `parentalRequirements` | Consent, documentation and travel requirements for parents. |
| `cancellationPolicy` | |

Separating the two responsibility fields forces an answer to the question a parent sending a
fifteen-year-old abroad is actually asking: when something goes wrong, who is accountable for what.

### `tour`

`destination`, `heroImage`, `overview`, `itinerary`, `dates`, `ageEligibility`, `included`,
`excluded`, `price`, `availability` (Open for enquiries / Waiting list / Closed),
`cancellationTerms`, and `safeguardingNote` (required when minors travel).

The `availability` description forbids a specific dark pattern: **never display a places-remaining
count that is not generated from real availability.** Fake scarcity is a banned practice under
consumer protection rules, not merely a tacky one.

### `article`

`excerpt`, `leadImage`, `author` (reference: "A real member of staff. Never invent a byline."),
`category`, `tags`, `body`, `showTableOfContents` (built from the H2s), `publishedAt`
(**required**), `updatedAt`, `readingMinutes` (calculated on import; leave empty to hide), `faqs`,
`relatedArticles`, `relatedDestinations`, `cta`.

The blog is the strongest asset carried over from the legacy site: eighteen substantial Turkish
articles, none of which were ever in the sitemap.

### `guide`, `service`, `page`

Prose-shaped types sharing `summary` or `intro`, `heroImage`, `body`, `faqs`, `cta`.

`page` additionally has `pageKey` (about / contact / consultation / search) for the fixed pages the
code routes to directly. A page with a `pageKey` is found by that key rather than by slug, so the
route works before anyone has decided on a slug.

### `appointmentType` and `paymentService`

Both hold the commercial truth in the CMS so that prices and durations can change without a deploy.

`appointmentType`: `title`, `slug`, `description`, `durationMinutes` (**required**, minimum 15),
`priceMinor` (**required**, minimum 0, in pence or kuruş; zero for a free consultation), `currency`
(GBP / EUR / USD / TRY), `refundable`, `cancellationPolicy`, `active`.

`paymentService`: `title`, `slug`, `reference` (**required**, a stable internal code such as
`application-service`, used by the checkout), `description`, `whatItCovers`, `priceMinor`
(**required**), `currency`, `refundable`, `refundPolicy`, `active` (**defaults to false**, so a
newly imported service is never live by accident).

**Both price fields carry the same note: "Authoritative: the browser cannot change it."** The client
sends only the reference; the server reads the price from the document and builds the payment
session from that. A checkout that accepts a client-supplied amount is a free-goods vulnerability.

---

## 5. The licence gate on images

**An image does not appear on the public site until `licence.cleared` is ticked.**

`MediaFrame` (`src/components/ui/MediaFrame.tsx`) checks `image.licence.cleared === true`. If it is
not true, it renders a composed brand panel instead: a flat orange block at low opacity with a
rule, no gradient and no glow. Outside production the panel is labelled ("Image withheld: licence
not cleared") so nobody mistakes it for finished work. In production it is simply a graphic block.

**Why this exists.** The audit of the legacy media library found 889 unique images, of which roughly
nine are genuine Happy Education photography. The rest is partner-school marketing material,
commercial stock of unknown licence status, screenshots, and theme demo filler. The homepage banner
is a studio stock shot. One partner logo's filename literally begins `png-clipart-`. Alt-text
coverage across the whole library was 12 images out of 889.

Rebuilding the site and carrying that library across unchanged would carry the same copyright
exposure forward with a fresh coat of paint. The gate makes the safe outcome the default one.

**Alt text is enforced at upload.** `alt` is required unless `decorative` is ticked, and the
validator also rejects the generic escape hatches ("image", "photo", "picture", "logo"). There is no
way to accidentally omit alt text, and marking something decorative is an explicit, visible choice.

---

## 6. Verification gates

Five places where the schema requires someone to confirm something before it is published. In every
case the field defaults to the safe value and the front end treats "not ticked" as "do not render".

| Type | Field | Default | What it gates |
|---|---|---|---|
| `imageWithMeta` | `licence.cleared` | false | Whether the image renders at all |
| `testimonial` | `verified` + `permissionStatus` | false / "Not obtained" | Whether a student quote appears |
| `partner` | `relationship` + `logoUsagePermitted` | required choice / false | Whether an institution can appear as a partner, and whether its logo can be shown |
| `author`, `teamMember` | `consentOnFile` | false | Whether a person's name and photograph are published (UK GDPR) |
| `languageSchool` | `accreditations[].verified` | false | Whether an accreditation claim is displayed |
| `legalPage` | `solicitorApproved` | false | Flags text that has not been through legal review |

There is a sixth gate that lives in code rather than the CMS. `src/lib/business-facts.ts` holds
every real-world claim about the business as `{ value, status, source, checked }`, and
`publicValue()` returns `null` unless `status` is `'verified'`. Components render nothing when it
returns null; they must never substitute a placeholder. The blocked list (`BLOCKED_CLAIMS`) covers
student counts, institution counts, countries served, success and visa-approval rates,
years-of-experience figures, accreditations, awards, press mentions and review scores. See the
README.

---

## 7. Which content needs sources

`reviewMeta` is available on every localisable document, but it is **required in practice** wherever
the content covers a fact that changes.

**Always tick `timeSensitive` and supply at least one source** (the schema enforces the source once
the box is ticked) for:

- `destination`: `costs`, `englishRequirements`, `entryRequirements`, `visaOverview`, `scholarships`
- `institution`: `fees`, `englishRequirements`, `rankings`, `intakes`, `entryGuidance`
- `languageSchool`: `fees`, `accreditations`, `minimumAge`, `startDates`
- `boardingSchool`: `fees`, `ageRange`, `admissions`, `curriculum`
- `summerProgramme`: `price`, `dates`, `ageRange`
- `tour`: `price`, `dates`, `availability`
- `article`: any article covering visa rules, fees, work rights or application deadlines
- `legalPage`: always, alongside `effectiveDate`

Content of this kind drives decisions worth tens of thousands of pounds, and the facts in it expire.
The `ReviewMeta` component surfaces the review date, the reviewer and the source list on the page,
so a reader can judge how current the information is instead of guessing.

**Also set `nextReviewDue`.** The Studio has a "Review overdue" list that filters on it, so overdue
content is findable without anyone writing a query. Suggested intervals: visa and immigration
content every 3 months, fees and prices every 6 months or each admissions cycle, general guidance
every 12 months.

**`editorialFlag`** is for anything unresolved: a figure that could not be sourced during migration,
a claim that needs the client to confirm it, a page that needs rewriting. Anything written there
puts the document in the Studio's "Needs editorial review" list and blocks the pre-launch check.
Use it freely. An honest flag is far better than a guess in the body text.

---

## 8. Finding things in the Studio

`sanity/lib/structure.ts` arranges the desk the way the team thinks about the site rather than as a
flat alphabetical list of twenty-two document types:

```
Site settings
---
Türkçe içerik      -> Destinations, Universities, Language schools, Boarding schools,
                      Summer programmes, Tours, Articles, Categories, Student guides,
                      Services, Pages, Legal pages          (filtered to locale = tr)
English content    -> the same list                         (filtered to locale = en)
---
People and organisations  -> Authors, Team members, Offices, Partner institutions,
                             Student experiences
Bookings and payments     -> Appointment types, Payable services
Technical                 -> Redirects, Translation groups
---
Needs editorial review    -> anything with an editorialFlag
Review overdue            -> anything whose nextReviewDue has passed
```

The last two lists are the ones to check weekly.

---

## 9. How to publish

Written for anyone on the team, no technical background assumed.

### Before you start

1. Go to **`/studio`** on the site (for example `https://happyeducation.uk/studio`) and sign in with
   your Sanity account.
2. Decide **which language** you are writing. You will create one document per language.
3. Everything saves as you type. **Nothing is public until you press Publish.**

---

### A. Publish a new destination (a country page)

A destination is a country or city page, for example "Study in the United Kingdom".

**Step 1. Create the translation group first.**

Go to **Technical → Translation groups → the plus button**. In *Internal name*, type something you
will recognise later, such as `Destination, Ireland`. Publish it. Nobody outside the team ever
sees this.

**Step 2. Create the Turkish page.**

Go to **Türkçe içerik → Destinations → the plus button**.

- **Language:** Türkçe.
- **Title:** the country name as it should appear as the page heading, e.g. `İrlanda`.
- **URL slug:** press *Generate*. It will produce `irlanda`. Turkish characters are handled
  automatically. **Do not change a slug after the page is live** without asking a developer to add
  a redirect, or every existing link to it will break.
- **Kind:** Country.
- **Appears under:** which section of the site this belongs to (Universities, Language schools,
  Boarding schools or Summer schools). This decides the page's web address, so get it right first
  time.
- **Intro:** two or three sentences. This appears under the heading and is often what shows up in
  Google.
- Fill in **Why study here**, **Education system** and **Application journey** in the Content tab.

**Step 3. The Details tab, where the care is needed.**

- **Fees and living costs** and **English requirements** are lists of facts. For each one add a
  *Label* ("Tuition, international undergraduate"), a *Value* ("€12,000"), an optional *Note*
  ("per year, 2026/27 entry") and a **Source**: the name of the page you got it from, its web
  address, and the date you looked at it. All three parts of a source are required.
- **Visa overview:** describe the process and **link to the official government page**. Do not tell
  a reader what they personally should do, and never say or imply that a visa will be granted.
  Happy Education is not registered to give immigration advice, so this content must describe
  administrative support only and must say that the decision rests with the relevant government
  authority.

**Step 4. Editorial tab.**

- Tick **Contains time-sensitive facts** (a destination page always does).
- Add at least one **Source**. The system will not let you leave this empty once the box is ticked.
- Set **Last reviewed** to today.
- Set **Next review due**, typically six months out.
- If anything is unresolved, write it in **Needs editorial attention**. It will appear in the review
  list and remind someone.

**Step 5. Link it and publish.**

Set **Translation group** to the group you made in step 1. Press **Publish**.

**Step 6. Repeat for English.**

Go to **English content → Destinations → plus**. Same process, but written in English, with the
slug `ireland`, and **pointing at the same translation group**. That is what makes the EN/TR toggle
land on the right page instead of the home page.

---

### B. Publish a new institution (a university or school)

**Step 1.** Choose the right type. **Universities** for a university, **Language schools** for a
language school, **Boarding schools** for a boarding school. They look similar but have different
fields, and the type decides the page's web address.

**Step 2.** Create it under the correct language section, then fill in:

- **Title:** the institution's own name, spelled the way the institution spells it.
- **URL slug:** press *Generate*.
- **Destination:** link it to the country page. This is what makes it appear in that country's
  listing.
- **City** and **Country**.
- **Official website:** the institution's own site. Please find and add this, because none of the
  old pages had it.
- **Logo:** only if we have written permission to display it. If in doubt, leave it empty. Ticking
  *Logo usage permitted* on a partner record without permission is a trademark problem.
- **Overview:** what the place actually is, in your own words.

**Step 3. Details.**

- **Fees:** the same label / value / note / source pattern as above. Every fee needs a source.
- **Rankings** (universities only): you must supply the organisation, the year, the exact category
  and the position, plus a source. All five. If you cannot fill all five, do not add the ranking.
  A ranking with a missing year is misleading, and one nobody updates becomes wrong within a year.
- **Accreditations** (language schools only): these are **the school's** accreditations, never Happy
  Education's. Add the body, a source, and tick *Verified* only after you have confirmed it on the
  accrediting organisation's own website. Unverified entries do not appear on the site.

**Step 4.** Editorial tab as in section A. Fees are always time-sensitive.

**Step 5.** Set the translation group, publish, then create the other language version pointing at
the same group.

---

### C. Publish an article

**Step 1.** Go to the right language section, then **Articles → plus**.

**Step 2. Content.**

- **Title:** what the piece is actually about. Write it for a parent or a student searching, not for
  us.
- **URL slug:** press *Generate*.
- **Excerpt:** two or three sentences. This is what shows on the blog listing and often in Google.
- **Lead image:** see "Adding an image" below.
- **Author:** must be a real member of staff who exists as an Author record. If they are not in the
  list, create the Author record first, and tick *Consent on file* only once that person has agreed
  to appear on the public site.
- **Category** and **Tags**.
- **Published at:** required.
- **Show table of contents:** turn on for long pieces. The list is built automatically from your
  Heading 2s.

**Step 3. Writing in the body field.**

- Use **Heading 2** for main sections and **Heading 3** underneath. **There is no Heading 1** on
  purpose: the page title is already the H1, and having two breaks the page structure for screen
  readers and search engines.
- To link to another page **on this site**, select the text and choose **Link to a page on this
  site**, then pick the document. Do not paste a web address for an internal page. Linking to the
  document means the link keeps working if that page's address ever changes.
- To link elsewhere, use **Link to another site**. Only normal web addresses, email and phone links
  are accepted.
- **Callout** for something the reader must not miss. Use the *Official guidance* tone when you are
  pointing at a government source.
- **Comparison table** where a comparison genuinely helps. Do not turn prose into a table. Add a
  source if the numbers came from somewhere.

**Step 4. Editorial tab.** If the article mentions visa rules, fees, work rights or deadlines, tick
**Contains time-sensitive facts** and add your sources. Set **Last reviewed** and **Next review
due**.

**Step 5.** Publish. If there is an equivalent article in the other language, create a translation
group and point both at it.

---

### D. Adding an image

Every image asks for three things, and all three matter.

1. **Alt text.** Describe what the image shows, for someone who cannot see it. "Students walking
   through a university quadrangle in Dublin", not "image" or "photo". The system will reject those
   generic words. If the image is purely decorative and adds nothing, tick **Decorative only** and
   leave alt text empty. That is a deliberate choice, not a shortcut.

2. **Caption.** Optional. Shown under the image.

3. **Licence and provenance.** *Copyright holder*: who owns it ("Happy Education", "University of
   Sussex"). *Licence terms*: how we are allowed to use it ("Owned outright", "Supplied by the
   school for marketing use", "Stock licence #12345"). Then **Cleared for publication**.

**The image will not appear on the website until *Cleared for publication* is ticked.** A grey and
orange panel appears instead. This is intentional. Only tick it when you are certain we hold the
right to publish that image. If you are not sure, leave it unticked and ask.

---

### E. Things you must never publish

Ask before writing any of these, because they are either unverified or legally risky:

- Numbers of students, universities, schools or countries ("500+ students", "200+ universities",
  "20+ countries"). None can be evidenced.
- Any success rate, acceptance rate or visa approval rate.
- Any "X years of experience" figure. The company was incorporated in April 2018; say "established
  in 2018" and let the reader do the arithmetic.
- Any accreditation or membership for Happy Education itself: British Council, English UK, ICEF,
  BAC, IAA/OISC. None is confirmed.
- Any award, press mention or "as seen in".
- Any review score. No profile was located anywhere.
- Any institution described as a partner without a signed agreement.
- The registered office described as our office, headquarters, or a place students can visit. It is
  a registered address only.
- Any promise or prediction about a visa outcome.
- Anyone's name or photograph without their recorded consent.

If a piece of content needs one of these to work, the content needs rewriting, not the rule.

---

### F. Changing a page's address

Slugs are permanent once a page is live. If one genuinely must change:

1. Note the old address exactly, including the language prefix, e.g. `/tr/universiteler/eski-slug`.
2. Change the slug and publish.
3. Go to **Technical → Redirects → plus**. Put the old path in **Old path**, the new one in
   **New path**, and leave **Permanent** ticked.

Skipping step 3 means every existing link, bookmark and search result for that page breaks.
