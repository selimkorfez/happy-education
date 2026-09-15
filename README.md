# Happy Education

A bilingual education-consultancy website rebuild using Next.js and a Sanity-backed content
model. This repository contains application source, tests, and public-facing project notes.

## Local development

Use the Node version required by `package.json`:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

`npm run build` runs a production build. Integration credentials belong in local environment
files or the deployment provider, never in Git.

## Security and handover

The existing production platform and domain have a separate, owner-led remediation workstream.
This rebuild does not fix systems it has not replaced. Historical operational findings and
account exports are not appropriate for a public source repository; see the
[legacy-site handover](docs/URGENT-LEGACY-SITE.md) and [domain-security principles](docs/DOMAIN_SECURITY.md).
Only authorised administrators should use the private assessment to confirm current status.

High-level [architecture](docs/ARCHITECTURE.md), [deployment](docs/DEPLOYMENT.md),
[migration](docs/MIGRATION.md), and [application-security](docs/SECURITY.md) notes are available
without client operational details. Public repository history may still contain older copies;
the owner should decide whether repository privacy or coordinated history cleanup is required.
