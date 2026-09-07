# Legacy student testimonial migration

The old WordPress homepage contains student quotes. They are **not** automatically imported into the new site's public testimonial feed.

A quote should only be entered as a public `testimonial` document when a staff member can confirm:

1. the person was a genuine Happy Education student/client;
2. the quote is an accurate record of what they said;
3. publication permission is on file for the way their name will be displayed; and
4. if a student photograph is used, the photograph has its own cleared publication/rights record.

## Migration fields

For each approved quote, enter:

- locale;
- student name exactly as they have agreed it may be displayed;
- quote;
- programme/institution only if accurate;
- publication permission: written or recorded verbal;
- verified genuine = true;
- optional photo only after image rights are cleared.

The public query requires both `verified == true` and a permission status of `written` or `verbal`. Setting permission to `none` or clearing verification removes the quote from the public site on the next revalidation.

This lets Happy Education reuse genuine historic reviews without treating an old public webpage as proof of permanent consent.
