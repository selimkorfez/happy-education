# Happy Education launch readiness

Checked on 18 September 2026 against the linked Vercel project
`happy-education` and Sanity project `q1voz8ji`. This is the short operational
view for handover; `QA.md`, `SECURITY.md`, `DEPLOYMENT.md` and
`LEGAL_REVIEW.md` contain the detailed checks.

## Ready in the application

- Production build, TypeScript, lint, unit, browser, mobile-navigation and
  accessibility checks pass for the completed change.
- Per-request Content Security Policy uses a nonce; security headers cover MIME
  sniffing, framing, referrers, browser permissions and cross-origin isolation.
- Public forms check same-origin requests, validate and size-limit input, use a
  honeypot, support Turnstile when configured, and rate-limit repeated requests.
- Checkout amounts are selected on the server. The browser cannot provide a
  price. Stripe webhooks verify signatures and replayed events are idempotent.
- API and webhook responses are marked `no-store`.
- Sanity images render only after licence clearance is recorded. The live Sanity
  dataset has zero schema errors; legacy records lacking sources are visible in a
  dedicated editorial warning queue.
- Vercel's automatic DDoS mitigation is available without a custom rule. At the
  time of this check Attack Mode was off and no attack was reported.

## Firewall rollout staged for review

Two **log-only** Vercel Firewall rules are staged and have not been published:

1. `Monitor public form abuse` logs POST requests to `/api/enquiry`,
   `/api/newsletter` and `/api/checkout`.
2. `Monitor common exploit probes` logs requests for `/wp-admin`, `/.env`,
   `/.git/config` and `/phpmyadmin`.

Publishing these rules does not block visitors; it starts collecting matching
traffic in Vercel's Firewall view. Review that traffic before converting any rule
to rate-limit, challenge or deny. Do not put Stripe or Sanity webhooks behind a
generic rate limit or challenge.

## Owner checks before connecting the public domain

- Confirm production environment variables for Sanity, preview/revalidation,
  email delivery, newsletter signing, Turnstile and Stripe. Keep all secrets in
  Vercel, never in the repository or browser-visible variables.
- Confirm the Sanity publish webhook reaches the production `/api/revalidate`
  route and rejects an invalid secret.
- Confirm enquiry and consultation notifications arrive, and that SPF, DKIM and
  DMARC are aligned for the sending domain.
- Complete one Stripe test-mode payment and webhook replay test before adding
  live keys. If payments are not part of launch, keep the feature disabled.
- Have the English and Turkish legal drafts reviewed and accepted by the client
  and, where needed, a solicitor. Confirm the privacy notice names the actual
  email, CRM, analytics and payment processors in use.
- Invite each content editor to Sanity individually, enforce two-factor
  authentication, and remove unused members. Do not share one login.
- Run a final real-device check on one iPhone and one Android phone.
- Export a Sanity dataset backup and record the last known-good Vercel deployment
  before changing DNS.

Production DNS and `happyeducation.uk` are intentionally untouched. Connect or
change the domain only after the owner checks above are complete and a rollback
window has been agreed.
