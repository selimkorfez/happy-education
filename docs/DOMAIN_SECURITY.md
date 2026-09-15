# Domain and email security

This public document records general principles only. The measured DNS baseline, authorised
senders, rollout dates, access arrangements, and incident evidence belong in a private plan
controlled by the domain owner.

## Ownership and verification

The domain owner should confirm who controls the registrar, DNS zone, mail providers, and
website hosting before making a change. Use the private assessment to verify the current state;
historical measurements in this repository must not be treated as live facts.

## Email authentication

Inventory every legitimate sender, configure SPF and DKIM for those services, monitor DMARC
reports, and tighten DMARC policy only after legitimate mail is shown to pass. Record each
change, its owner, its verification result, and a rollback path in the private plan.

## Website and registrar controls

Use least-privilege access and multifactor authentication for administrative accounts. Review
TLS, DNS, caching, and request protection with the authorised administrators. Keep operational
hostnames, rules, credentials, and incident details out of this public repository.

## Handover

The website rebuild does not by itself solve domain- or legacy-host issues. Complete and verify
those tasks as their own workstream before describing them as resolved.
