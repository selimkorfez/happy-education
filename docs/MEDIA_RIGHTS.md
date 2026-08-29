# Publicly reusable university and destination photography

The new website does not treat an image being visible online as permission to reuse it.

## Accepted sources

For documentary campus/city photography, use one of:

- public-domain / CC0 media;
- Creative Commons media that permits commercial reuse, with all required attribution and share-alike obligations followed;
- imagery owned or commissioned by Happy Education with the permission record retained;
- institution-supplied media where Happy Education has explicit written permission to publish it.

The current code-side public-media registry is `src/lib/media/licensed-media.ts`.

Each registered external photograph records:

- exact source page;
- creator;
- licence name;
- licence deed URL;
- descriptive alt text;
- whether it is a campus image or city image;
- an explicit privacy classification confirming identifiable people are not the subject.

The UI renders a source/licence credit for these images rather than dropping the attribution after import.

## Rejected sources

Do not source production media by copying from:

- Google Images;
- an institution website without explicit reuse terms;
- Instagram, TikTok or another social platform simply because the post is public;
- the old WordPress library unless the rights record has been reconstructed and cleared;
- stock-preview/watermarked imagery;
- a photograph whose identifiable person is the subject when no appropriate permission/model-release basis is known.

## Fallback hierarchy

Institution page:

1. cleared CMS image;
2. verified institution-specific public reuse photograph;
3. verified city photograph;
4. commissioned Happy Education editorial illustration.

Destination page:

1. cleared CMS image;
2. verified representative study-city photograph;
3. commissioned Happy Education editorial illustration.

A country page's photograph is never described as a photograph of the whole country. The alt text names the actual city/building pictured.

## Adding another Wikimedia Commons photograph

Before adding a file to the registry:

1. Open the file's own Wikimedia Commons description page.
2. Confirm the uploader/source and licence on that exact file page.
3. Confirm the licence permits the intended commercial website reuse.
4. Prefer architecture/cityscape imagery where identifiable people are incidental or absent.
5. Record the exact creator, source page, licence and licence URL in the registry.
6. Write literal alt text describing what the photograph actually shows.
7. Run the media regression suite and inspect the Vercel preview.

Do not infer the licence from a Commons category, search-result thumbnail or a similar-looking file.
