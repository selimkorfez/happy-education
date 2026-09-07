# Publicly reusable university and destination photography

The new Happy Education website does not treat an image being visible online as permission to reuse it. This document defines the media rules implemented in PR #3 and the current documentary-photo coverage used by the English catalogue.

## Accepted sources

For documentary campus/city photography, use one of:

- public-domain / CC0 media;
- Creative Commons media that permits commercial reuse, with all required attribution and share-alike obligations followed;
- imagery owned or commissioned by Happy Education with the permission record retained;
- institution-supplied media where Happy Education has explicit written permission to publish it.

The code-side public-media registry is `src/lib/media/licensed-media.ts`.

Each registered external photograph records:

- exact source page;
- creator;
- licence name;
- licence deed URL;
- descriptive alt text;
- whether it is a verified campus image or a broader city/location image;
- an explicit privacy classification confirming identifiable people are not the subject.

The UI keeps this distinction visible. Institution cards label documentary images as **Campus photo** or **Location photo**, and Creative Commons attribution remains traceable from the rendered image.

## Rejected sources

Do not source production media by copying from:

- Google Images;
- an institution website without explicit reuse terms;
- Instagram, TikTok or another social platform simply because the post is public;
- the old WordPress library unless the rights record has been reconstructed and cleared;
- stock-preview/watermarked imagery;
- a photograph whose identifiable person is the subject when no appropriate permission/model-release basis is known.

The legacy WordPress media host is deliberately not an approved production-media source for the rebuilt catalogue.

## Fallback hierarchy

### Institution page or institution card

1. cleared CMS image;
2. verified institution-specific public-reuse campus photograph;
3. verified photograph of the institution's stated city;
4. verified representative destination photograph for the institution's country;
5. commissioned Happy Education editorial fallback only when the location itself cannot be resolved safely.

A city or destination fallback is never labelled as a campus photograph.

### Destination page

1. cleared CMS image;
2. verified representative study-city photograph;
3. commissioned Happy Education editorial fallback.

A country page's photograph is never described as a photograph of the whole country. The alt text names the actual city/building pictured.

## Current institution-specific campus coverage

The registry currently has verified campus-specific media for:

- Anglia Ruskin University;
- University of Oxford;
- University of Cambridge;
- Imperial College London;
- King's College London;
- London School of Economics / London School of Economics and Political Science;
- University of Birmingham;
- University of Manchester;
- University of Bristol;
- University of Warwick;
- University of Edinburgh.

Every other university exposed by the current English pre-Sanity catalogue still receives a real licensed photograph through the city/destination fallback hierarchy. That fallback is intentionally labelled **Location photo** until a university-specific campus image is separately verified.

## Current city and destination coverage

The verified city/location library currently covers:

### United Kingdom

London, Oxford, Cambridge, Birmingham, Manchester, Edinburgh, Cardiff, Bristol, Leicester, Nottingham, Sheffield, Leeds and Liverpool.

### Ireland

Dublin, Cork and Galway.

### United States

New York, Boston, Chicago, Los Angeles and San Francisco.

### Canada

Toronto, Vancouver and Montreal.

### Australia

Sydney, Melbourne, Brisbane and Perth.

### New Zealand

Auckland, Wellington and Christchurch.

### Malta

Valletta, Sliema and St Julian's.

### Other migrated destinations

Nicosia/Cyprus, St George's/Grenada, and a non-architectural UAE desert landscape.

The UAE fallback intentionally avoids making a skyline/building photograph the default public-reuse choice where local freedom-of-panorama rules may create unnecessary uncertainty.

## Country-to-photo mapping

Current representative destination imagery is:

- United Kingdom -> London;
- United States -> New York;
- Canada -> Toronto;
- Ireland -> Dublin;
- Australia -> Sydney;
- New Zealand -> Auckland;
- Malta -> Valletta;
- Cyprus -> Nicosia;
- Grenada -> St George's;
- United Arab Emirates -> UAE desert landscape.

These mappings provide a truthful geographic fallback. They do not imply that the pictured location is the campus of every institution in that country.

## City previews

Starter English country pages now contain real student-city preview sections. The current preview sets are:

- UK universities: London, Birmingham, Manchester, Edinburgh, Cardiff, Cambridge, Oxford, Bristol;
- US universities: New York, Boston, Chicago, Los Angeles, San Francisco;
- Canada universities: Toronto, Vancouver, Montreal;
- Ireland universities: Dublin, Cork, Galway;
- Australia universities: Sydney, Melbourne, Brisbane, Perth;
- New Zealand universities: Auckland, Wellington, Christchurch;
- UK language schools: London, Cambridge, Oxford, Manchester;
- Ireland language schools: Dublin, Cork, Galway;
- US language schools: New York, Boston, Los Angeles, San Francisco;
- Canada language schools: Toronto, Vancouver, Montreal;
- Malta language schools: Valletta, Sliema, St Julian's;
- Australia language schools: Sydney, Melbourne, Brisbane.

City preview cards are deliberately **not links** until genuine city-detail routes exist. The earlier implementation could create `/country/city` links that looked navigable but had no guaranteed destination. PR #3 removes that false interaction rather than hiding a 404 behind a photograph.

## Rendering and attribution

`MediaFrame` renders the external documentary source with:

- meaningful alt text;
- creator credit;
- source-page link;
- licence label and licence link.

`next.config.ts` allowlists only the audited Wikimedia host paths in addition to Sanity. Arbitrary third-party image domains remain blocked.

Next Image optimisation serves the image through the site's own `/_next/image` route, so remote originals are resized/cached rather than loaded at their full source dimensions on every visit.

## Adding another Wikimedia Commons photograph

Before adding a file to the registry:

1. Open the file's own Wikimedia Commons description page.
2. Confirm the uploader/source and licence on that exact file page.
3. Confirm the licence permits the intended commercial website reuse.
4. Prefer architecture/cityscape imagery where identifiable people are incidental or absent.
5. Record the exact creator, source page, licence and licence URL in the registry.
6. Write literal alt text describing what the photograph actually shows.
7. Mark it as `campus` only if the source clearly identifies the university/campus shown; otherwise use `city`.
8. Run the media regression suite and inspect the Vercel preview.

Do not infer the licence from a Commons category, search-result thumbnail or a similar-looking file.

## Regression requirements

The browser suite checks that:

- the main English university catalogue has no `Photo being verified` cards;
- the university catalogue renders real images at scale;
- a mapped university uses its campus-specific photograph;
- each starter country city gallery renders the expected number of real images;
- Malta renders all three city previews;
- city preview cards do not create false internal city-detail links;
- no legacy `happyeducation.uk/wp-content` image is used on the audited routes;
- the UI distinguishes campus and location photography.
