# ADR 0006: Monorepo with independent deployments

- Status: Accepted
- Date: 2026-08-20

## Context

The storefront and event processor share product context and engineering
standards but run on different platforms and have different release triggers.
They must remain independently testable and deployable without duplicating
repositories or coupling every release.

## Decision

Keep `apps/web`, `apps/functions`, and `infra` in one pnpm monorepo while
maintaining separate build artifacts and deployment workflows.

- Firebase App Hosting observes `main` and builds only `apps/web`.
- GitHub Actions validates, packages, and deploys only `apps/functions` to Azure.
- Bicep defines Azure resources and is deployed through GitHub-to-Azure OIDC.
- The Azure orchestration workflow deploys infrastructure before Functions and
  performs smoke checks; it observes but does not trigger Firebase rollouts.

## Consequences

- Shared TypeScript conventions and repository validation remain centralized.
- Web and Functions artifacts cannot accidentally include the other workload,
  infrastructure files, or local secrets.
- A web rollout and an Azure deployment are not presented as one atomic release.
- Each platform can be redeployed independently during incident recovery or
  configuration changes.
- OIDC avoids Azure client secrets and publish profiles in GitHub.
