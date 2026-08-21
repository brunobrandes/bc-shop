# ADR 0002: Firebase authentication for administration

- Status: Accepted
- Date: 2026-08-20

## Context

CallInsights contains customer call summaries and transcripts and must be
restricted to a small administrative audience. Building password storage,
credential verification, token issuance, and account management inside BC-Shop
would add security-sensitive application code.

## Decision

Use Firebase Authentication with the Email/Password provider for administrator
sign-in.

Authentication alone does not grant access. Every CallInsights API request
includes a Firebase ID token. The Next.js server verifies that token with
Firebase Admin, requires a verified email, and checks the normalized email
against the server-side `ADMIN_EMAILS` allowlist.

The browser never receives `BC_ADMIN_API_KEY`. After user authorization, the
Next.js server uses that independent machine credential to call the internal
Azure CallInsights API.

## Consequences

- BC-Shop does not store or verify passwords.
- The Google identity provider is not required or enabled for this flow.
- Removing an address from `ADMIN_EMAILS` revokes application authorization
  even if the Firebase account remains valid.
- Both the page experience and its data APIs require an authenticated,
  allowlisted user; hiding the dashboard UI is not the security boundary.
- Initial administrator accounts are provisioned operationally and never
  embedded in repository code.

## Alternatives considered

- **Google provider sign-in:** not selected because the required access model is
  explicit Email/Password accounts rather than an external identity provider.
- **Custom authentication:** rejected because it would duplicate mature
  credential and token security capabilities.
- **A shared dashboard password:** rejected because it provides weak identity,
  revocation, and audit properties.
