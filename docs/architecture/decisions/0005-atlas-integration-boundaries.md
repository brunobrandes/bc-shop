# ADR 0005: Trusted Atlas integration boundaries

- Status: Accepted
- Date: 2026-08-20

## Context

BC-Shop integrates with Atlas in three directions: customers request calls,
Atlas agents search products during calls, and Atlas posts completion events.
Each direction has different trust and authentication requirements.

## Decision

Keep all Atlas credentials and privileged operations behind server boundaries.

- The browser calls `POST /api/contact/call`; only the Next.js server calls the
  Atlas scheduling endpoint with `ATLAS_API_KEY`.
- Atlas Actions call `POST /api/agent/products/search` with the independent
  `x-bc-agent-key` machine credential. The endpoint exposes only bounded search
  parameters and canonical public product fields.
- Atlas completion events call the anonymous Azure Function route containing a
  high-entropy secret. The function validates that secret with a timing-safe
  comparison before accepting content.
- The administrative web API verifies a Firebase user token, then uses a
  separate `BC_ADMIN_API_KEY` for Next.js-to-Azure requests.

Secrets are independent, server-side only, excluded from artifacts, and sourced
from Firebase Secret Manager, GitHub Actions Secrets, or Azure app settings.

## Consequences

- No Atlas or machine API key is shipped to browser JavaScript.
- Compromise or rotation of one integration credential does not require reusing
  or exposing another credential.
- Product Action responses cannot fabricate stock, discounts, delivery dates,
  or promotional pricing.
- Atlas remains the system responsible for scheduling and executing calls;
  BC-Shop stores only the completion data required by CallInsights.
