# Deployment — public handover

Deployment requires owner-controlled hosting, CMS, DNS, and integration accounts. Set secret
values in the deployment provider, validate them before launch, and keep a tested rollback and
backup plan. Do not commit credentials or operational exports to this repository.

The authorised deployment plan contains specific account owners, DNS changes, security checks,
backup locations, and cutover decisions. Those details are intentionally omitted here. A
rebuild launch is not proof that the legacy platform or email domain has been remediated; the
site owner must verify those systems separately.
