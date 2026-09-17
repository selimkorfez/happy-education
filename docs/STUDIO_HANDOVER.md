# Happy Education Studio handover

This is the short operating guide for the person who manages website content.
The editor lives at `/studio` on the deployed website and uses a Sanity account.
No GitHub, Vercel or code access is required for everyday content work.

## First sign-in

1. Accept the Sanity project invitation using the same sign-in method every time.
2. Turn on two-factor authentication for that account.
3. Open the website's `/studio` address and sign in.
4. Confirm that the **Happy Education** workspace shows **Publishing**,
   **Universities & study content**, **Programmes & tours**, and
   **Editorial review queues**.

## Change the brand or homepage

Open **Brand, colours & global content**. This single screen controls the parts
that appear across the website:

- official logos for light and dark backgrounds, the compact mark, floating chat
  icon and browser favicon;
- the approved navy, orange and red-orange colours;
- telephone, WhatsApp number, email, company details and social links;
- main menu labels, header text, footer text and the WhatsApp opening message;
- homepage hero text, buttons, image, image label and image caption; and
- the heading, text, links and six images in **Find your route**.

Leave a replacement field empty to keep the supplied official brand artwork or
approved fallback copy. The website automatically chooses the light or white logo
for the surface behind it. Publish the settings document after making changes.

The site typeface is Nunito Sans, loaded and optimised as part of the application.
Changing to another typeface requires adding and testing that font in the website
code so visitors never receive a missing or unlicensed font.

## Change a page

Country, city, university, school, tour, summer programme, guide and article pages
are separate documents in their matching Studio section. Open a document to edit
its title, introduction, sections, buttons, SEO details and hero image. Page heroes
are shown as wide landscape banners, so use a landscape crop with the subject away
from the extreme edges.

Articles can be created, updated, unpublished or deleted under **Publishing**.
Use **Unpublish** when content may be needed again; deletion removes the document
from the editorial library.

The free Sanity plan includes the Administrator and Viewer roles. A staff member
who must create and publish content therefore needs Administrator access on that
plan. Upgrade to Growth and change them to Editor when restricted publishing
access is needed.

## Publish an article

1. Open **Publishing**, then choose the correct English or Turkish article list.
2. Create a document and complete the title, URL slug, excerpt, author, category,
   body and publication date.
3. Add an image only when its publication rights can be recorded.
4. Complete the editorial review fields for fees, visa rules, deadlines or any
   other fact that may change.
5. Save the draft, review it, then press **Publish**.

Use **Unpublish** when an article should disappear from the website but may be
needed again. Delete only after confirming it is no longer required.

## Images

Every image needs:

- useful alternative text describing what it shows;
- the copyright holder;
- the licence or permission terms; and
- **Cleared for publication** selected.

An uncleared image is deliberately hidden from the public website. Do not use an
image copied from Google, Pinterest, another website or social media unless Happy
Education has permission that can be recorded.

This rule also covers logos, favicons, the chat icon, homepage artwork and route
card images. The public website checks **Cleared for publication** and refuses to
render an uncleared replacement.

## Languages

English and Turkish versions are separate documents. Link equivalent versions to
the same translation group so the language switcher opens the matching page.
Never publish an automatic translation without a fluent editorial review.

## Changing a live URL

After changing a published page's slug, create a permanent redirect under
**Technical → Redirects** from the old path to the new path. This preserves old
links and search results.

## Review routine

- Check **Needs editorial review** every week.
- Check **Review overdue** every week.
- Recheck fees, dates, rankings, visa rules and work-rights claims against their
  original sources before their review date.
- Unpublish anything that cannot be verified promptly.

The detailed field-by-field guide is in `docs/CONTENT_MODEL.md`.
