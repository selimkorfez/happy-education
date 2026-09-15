# Application security — public overview

The application validates requests, limits sensitive server operations to server routes,
does not place credentials in browser-visible environment variables, and uses a controlled
content-rendering pipeline. Secrets are configured outside version control.

Before launch, verify the deployed environment, access controls, integration settings,
and application behaviour with current tests. This document describes the rebuild only.
