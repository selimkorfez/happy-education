# Deployment — public handover

Deployment requires owner-controlled hosting, CMS, DNS, and integration accounts. Set secret
values in the deployment provider, validate them before launch, and keep a tested rollback and
backup plan. Do not commit credentials or operational exports to this repository.

The rebuild is not deployed yet. Connect the repository to the chosen hosting account,
configure its environment, run the build and tests, and review the first deployment before
connecting a public domain.
