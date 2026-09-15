# Application security — public overview

The application validates requests, limits sensitive server operations to server routes,
does not place credentials in browser-visible environment variables, and uses a controlled
content-rendering pipeline. Secrets are configured outside version control.

The existing production platform and domain require a separate owner-led security review.
This application's controls do not secure systems it has not replaced. Specific historical
findings, affected infrastructure, account information, and verification evidence are held
in the private assessment, not in this public document. A fresh authorised review is needed
before making any assurance about the live environment.
