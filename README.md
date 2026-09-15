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

## Project status

This rebuild is still in development and has not been deployed. The source code and tests
are the current implementation. The [architecture](docs/ARCHITECTURE.md),
[deployment](docs/DEPLOYMENT.md), [migration](docs/MIGRATION.md), and
[application-security](docs/SECURITY.md) notes describe work needed before launch.
