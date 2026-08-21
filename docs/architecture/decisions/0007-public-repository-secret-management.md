# ADR 0007: Secret management for a public repository

- Status: Accepted
- Date: 2026-08-20

## Context

BC-Shop source code is publicly readable. Security must therefore depend on
explicit identity, authorization, and secret-management boundaries rather than
repository visibility or obscured implementation details.

The solution deploys to Firebase and Azure, calls Atlas, accepts Atlas webhooks,
and exposes an authenticated administrative dashboard. These integrations need
independent credentials with different owners and rotation paths.

## Decision

Keep all runtime credentials outside Git and use platform-native secret and
workload identity capabilities.

- GitHub Actions authenticates to Azure with OpenID Connect and short-lived
  tokens. No Azure client secret, service-principal password, or publish profile
  is stored in GitHub.
- Sensitive workflow values use GitHub Actions Secrets. Non-sensitive resource
  identifiers use Repository Variables.
- Firebase App Hosting resolves server credentials from Google Cloud Secret
  Manager at runtime.
- Azure Bicep secure parameters configure Function app settings without writing
  their values to repository files or deployment artifacts.
- Local `.env*`, Function settings, service-account files, publish profiles, and
  generated administration scripts are excluded from Git.
- Build artifacts contain only the workload being deployed and never contain
  local environment files or credentials.
- Atlas scheduling, Action access, webhook authentication, and administrative
  API access use separate keys so each boundary can be rotated independently.

Firebase Web App values named `NEXT_PUBLIC_FIREBASE_*` are client configuration,
not server credentials. They are expected to be visible in browser bundles;
authorization remains enforced by Firebase tokens and server-side policy.

## Consequences

- Publishing the source does not publish deployment authority or runtime
  credentials.
- A workflow can deploy to Azure only when GitHub's OIDC assertion matches the
  configured repository and branch trust policy.
- Secret rotation does not require a source-code change, although a new rollout
  may be required for the platform to activate a new secret version.
- Logs, API responses, workflow outputs, and architecture documentation must not
  contain secret values.
- Platform access policies and secret grants are part of the production
  configuration and must be reviewed alongside application code.

## Alternatives considered

- **Credentials committed in configuration files:** rejected because repository
  history and forks make removal unreliable.
- **Long-lived Azure client secrets:** rejected in favor of federated workload
  identity and short-lived tokens.
- **One shared integration key:** rejected because it increases blast radius and
  prevents boundary-specific rotation.
