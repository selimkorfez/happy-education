# PR #3 review guide — licensed media and publishing

Pull request: **#3 — Add licensed campus media and trust-led publishing**

Branch: `content/trust-media-overhaul`

This document is the review checklist for the third Happy Education website pass. PR #3 remains separate from `main` until the branch preview and automated checks are accepted.

## 1. What PR #3 changes

### Real university and destination photography

PR #3 replaces generic catalogue imagery with a controlled documentary-media system.

For institution pages/cards the order is:

1. cleared CMS photograph;
2. verified campus-specific public-reuse photograph;
3. verified photograph of the institution's city;
4. verified representative destination photograph;
5. editorial fallback only when the location cannot be resolved safely.

The UI explicitly labels documentary catalogue images as **Campus photo** or **Location photo**. A city/destination fallback is never presented as if it were a photograph of that university's campus.

### University catalogue

The English Universities browser keeps the Popular/A–Z/search behaviour from PR #2 and now supplies real licensed photography to the full pre-Sanity university catalogue.

Institution-specific campus images currently exist for:

- Anglia Ruskin University;
- University of Oxford;
- University of Cambridge;
- Imperial College London;
- King's College London;
- London School of Economics;
- University of Birmingham;
- University of Manchester;
- University of Bristol;
- University of Warwick;
- University of Edinburgh.

Institutions without a verified campus-specific photo receive a truthful city or country location image until an exact campus image is separately cleared.

### City previews

Country pages now have photo-led student-city galleries rather than text-only city lists.

Current university city previews:

- United Kingdom: London, Birmingham, Manchester, Edinburgh, Cardiff, Cambridge, Oxford, Bristol;
- United States: New York, Boston, Chicago, Los Angeles, San Francisco;
- Canada: Toronto, Vancouver, Montreal;
- Ireland: Dublin, Cork, Galway;
- Australia: Sydney, Melbourne, Brisbane, Perth;
- New Zealand: Auckland, Wellington, Christchurch.

Current language-school city previews:

- United Kingdom: London, Cambridge, Oxford, Manchester;
- Ireland: Dublin, Cork, Galway;
- United States: New York, Boston, Los Angeles, San Francisco;
- Canada: Toronto, Vancouver, Montreal;
- Malta: Valletta, Sliema, St Julian's;
- Australia: Sydney, Melbourne, Brisbane.

The city cards are deliberately not internal links yet. The site does not currently have authored city-detail routes, so PR #3 removes the previous false `/country/city` navigation pattern instead of creating links that can 404.

### Image rights and privacy

Production documentary images must come from a source with an explicit reuse basis. Current external media is registered with:

- creator;
- exact Wikimedia Commons source page;
- licence name;
- licence URL;
- alt text;
- campus/location classification;
- privacy classification.

The branch does not use Google Images, arbitrary university marketing downloads, social-media downloads or the uncleared legacy WordPress image library.

Images whose primary subject is an identifiable person are not admitted to this registry without a separate permission basis.

Full policy and current coverage: `docs/MEDIA_RIGHTS.md`.

## 2. Publishing workflow added by PR #3

### Blog/articles

Sanity Studio now has a **Publishing** area containing English and Turkish article lists. The article workflow is documented in `docs/BLOG_PUBLISHING.md`.

The workflow includes:

- real author attribution;
- separate EN/TR editorial trees;
- source checking for time-sensitive claims;
- media-rights checks;
- SEO/review fields;
- preview before publication.

### Student experiences

Student testimonials are not copied blindly from the legacy site.

A story is public only when:

- `verified == true`; and
- publication permission is recorded as written or verbal.

Any student photo must independently pass the normal media-rights gate.

The public route is:

- English: `/en/insights/student-stories`
- Turkish: `/tr/blog/ogrenci-hikayeleri`

Until approved records exist, the page shows an honest prepared-state rather than fabricated reviews.

Migration policy: `docs/TESTIMONIAL_MIGRATION.md`.

### Social-media content

PR #3 adds a curated social-content layer rather than a raw embedded feed.

Public routes:

- English: `/en/insights/from-our-socials`
- Turkish: `/tr/blog/sosyal-medyadan`

Each approved item can explain:

- which platform the original post is on;
- what the post is about;
- why Happy Education made it / why it matters;
- the topic;
- the original Happy Education post URL.

The website links to the original post rather than automatically loading tracker-heavy third-party embeds.

Workflow: `docs/SOCIAL_CONTENT.md`.

## 3. Navigation changes

The Insights top-level link remains the article/blog index.

Its disclosure contains the two distinct supporting hubs:

- From our socials;
- Student stories.

A duplicate child link to the same Insights index was removed because it produced duplicate hrefs and ambiguous keyboard/navigation behaviour.

## 4. Automated regression coverage

PR #3 adds browser coverage for the media and community changes.

The final branch must pass all existing checks plus tests confirming:

- the UK destination hero uses licensed documentary media;
- a mapped university uses its campus-specific image;
- the main English university catalogue contains no unresolved photo cards;
- university browse cards contain real images at catalogue scale;
- university cards say whether a photograph is campus-specific or a location image;
- all defined starter country city previews render real images;
- the city previews do not create false internal city links;
- legacy WordPress media does not appear on the audited pages;
- the social-content and student-story routes work;
- EN/TR community-page switching reaches the correct equivalent route.

## 5. Manual review routes

Review these in the final Vercel preview:

1. `/en/universities`
2. `/en/universities/united-kingdom`
3. `/en/universities/united-states`
4. `/en/universities/canada`
5. `/en/universities/ireland`
6. `/en/universities/australia`
7. `/en/universities/new-zealand`
8. `/en/language-schools/malta`
9. `/en/universities/united-kingdom/anglia-ruskin-university`
10. `/en/insights/from-our-socials`
11. `/en/insights/student-stories`

For the visual review, specifically check:

- image suitability and cropping at desktop/mobile widths;
- city variation rather than one repeated generic image;
- Campus photo / Location photo labelling;
- attribution legibility without dominating the card;
- no broken or blank images;
- no large unintended empty areas;
- no Turkish text on English pages;
- no dead city-preview links.

## 6. Non-goals of PR #3

PR #3 does **not** claim that all 126 migrated institutions now have a university-specific campus photograph. Exact campus media is used only where it has been individually verified. The rest deliberately receives clearly labelled location photography.

PR #3 also does not fabricate:

- student testimonials;
- social posts;
- rankings;
- live popularity data;
- partner relationships;
- fees or admissions facts.

Those remain data/editorial tasks with their own verification requirements.

## 7. Final merge gate

Before this PR is moved out of draft, confirm:

- [ ] Typecheck passes
- [ ] Lint passes
- [ ] Design-system contrast check passes
- [ ] Unit tests pass
- [ ] Production build passes
- [ ] Full end-to-end tests pass
- [ ] Accessibility tests pass
- [ ] Media regression tests pass
- [ ] Vercel preview deployment succeeds
- [ ] Manual preview spot-check completed
- [ ] PR body updated with final status and preview URL

Do not merge solely because the branch is technically mergeable. The user reviews the completed preview first.
