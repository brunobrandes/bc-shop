# BC-Shop

BC-Shop is a pnpm monorepo containing a computer and technology hardware storefront hosted by Firebase App Hosting and an independent Azure Functions webhook entry point.

## Stack

Next.js App Router, React, Azure Functions v4, strict TypeScript, Tailwind CSS, pnpm workspaces, ESLint, Prettier, and Vitest.

## Repository layout

- `apps/web` — Next.js storefront, APIs, Atlas client, contact flow, and tests
- `apps/functions` — independently deployable Azure Functions app
- `infra` — Azure Bicep and local deployment helper
- `docs` — project documentation

## Getting started

Requires a current Node.js LTS release and pnpm.

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
pnpm --filter web dev
```

Open `http://localhost:3000`. Atlas credentials are optional for the storefront and tests.

The storefront is English-only at `/`, and the call-request flow is available at `/contact`.

## Environment

| Variable                     | Required                                 | Purpose                                                        |
| ---------------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `ATLAS_API_KEY`              | Only when calling Atlas                  | Server-side API credential                                     |
| `ATLAS_CAMPAIGN_ID`          | Only when initiating the configured chat | Atlas campaign identifier                                      |
| `ATLAS_BASE_URL`             | No                                       | Atlas API root; defaults to `https://api.youratlas.com/v1/api` |
| `BC_AGENT_API_KEY`           | For Atlas product-search Actions         | Server-side machine-to-machine key                             |
| `ADMIN_EMAILS`               | For CallInsights                         | Comma-separated server-side admin allowlist                    |
| `BC_ADMIN_API_KEY`           | For CallInsights                         | Next.js-to-Azure machine key                                   |
| `CALL_INSIGHTS_API_BASE_URL` | For CallInsights                         | Azure internal API base URL                                    |
| `NEXT_PUBLIC_FIREBASE_*`     | For CallInsights login                   | Public Firebase web application configuration                  |

Never prefix the API key with `NEXT_PUBLIC_`. Local `.env*` files are ignored; `.env.example` contains placeholders only.

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
pnpm format:check
```

The root scripts orchestrate the workspace. Package-specific checks can also be run with `pnpm --filter web <script>` and `pnpm --filter functions <script>`.

## APIs

- `GET /api/health` — service health and request-time timestamp
- `GET /api/products` — `{ "data": Product[] }`
- `GET /api/products/:id` — `{ "data": Product }`, or a consistent `404` error
- `POST /api/contact/call` — validates and requests an immediate or scheduled Atlas call
- `POST /api/agent/products/search` — authenticated Atlas Action over the canonical catalog
- `GET /api/admin/call-insights/*` — Firebase-authenticated admin proxy
- `GET /admin` — protected CallInsights dashboard

## Atlas boundary

`apps/web/src/lib/atlas` is imported server-side only. It validates configuration when the integration is used, attaches the `api-key` header, applies a timeout, and normalizes network/upstream failures. `AtlasClient.initiateWebChat` maps exactly to the documented `POST /campaign-chat/:campaignId` operation. There is intentionally no public chat API or browser-to-Atlas call in Stage 0.

## Stage 0 scope

There is no checkout, payments, CRM, complete chat, campaign provisioning, or AI-derived business analytics. Product detail buttons and the cart remain visual placeholders. See [the Stage 0 implementation notes](docs/stages/00-foundation.md).

## Deployment architecture

The two workloads deploy independently:

- `apps/web` runs as a dynamic Next.js application on Firebase App Hosting. SSR, App Router route handlers, and server-side environment variables are preserved.
- `apps/functions` runs on Azure Functions Flex Consumption FC1. Azure Bicep provisions its resource group, storage primitives, FC1 plan, and Function App.

There is no Azure App Service, Azure Web App, or Container Apps dependency for the storefront.

### Web — Firebase App Hosting

Use the Firebase console's native GitHub integration, which owns branch-triggered builds and rollouts:

1. Create or select a Firebase project and enable billing required by App Hosting.
2. Open **App Hosting**, create a backend, and connect `brunobrandes/bc-shop`.
3. Set the app root to `apps/web` and the live branch to `main`.
4. Keep automatic rollouts enabled.
5. Create the following Google Cloud Secret Manager secrets and grant the App Hosting backend access:

   ```text
   ATLAS_API_KEY
   ATLAS_CAMPAIGN_ID
   BC_AGENT_API_KEY
   ADMIN_EMAILS
   BC_ADMIN_API_KEY
   CALL_INSIGHTS_API_BASE_URL
   NEXT_PUBLIC_FIREBASE_API_KEY
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
   NEXT_PUBLIC_FIREBASE_PROJECT_ID
   NEXT_PUBLIC_FIREBASE_APP_ID
   ```

   `apps/web/apphosting.yaml` maps server credentials only into the runtime. Firebase web configuration is injected during build and runtime and is public after bundling; no server credential uses `NEXT_PUBLIC_`.

6. Enable Firebase Authentication with the Email/Password provider. Add the production App Hosting domain to Firebase Authentication's authorized domains. Firebase Admin uses the App Hosting runtime's Application Default Credentials; do not create a service-account JSON.

7. Set `ADMIN_EMAILS` to the comma-separated verified Firebase accounts allowed to access `/admin`. Set `CALL_INSIGHTS_API_BASE_URL` to `https://<function-app>.azurewebsites.net/api/internal/call-insights`.
8. Use the same independently generated `BC_ADMIN_API_KEY` value in Firebase Secret Manager and the GitHub Actions secret described below.
9. Push to `main`, wait for the Firebase rollout check, and copy the generated App Hosting URL.
10. Add that URL, including `https://`, as the non-secret GitHub repository variable `WEB_BASE_URL` and verify `GET <WEB_BASE_URL>/api/health`.

The repository keeps pnpm and its root workspace lockfile for monorepo development. `apps/web/package-lock.json` is intentionally scoped to Firebase App Hosting so its standalone build uses npm's physical dependency layout when `apps/web` is the configured root directory. Both lockfiles are generated from the same `apps/web/package.json`; no service-account JSON or Firebase credential belongs in this repository.

Firebase App Hosting rollouts are driven by commits to `main`; they are not represented as a synchronous reusable GitHub Actions job.

### Functions — Azure Flex Consumption

The webhook remains available at:

```text
POST https://<function-app>.azurewebsites.net/api/webhooks/atlas/call-completed/{secret}
```

Azure Bicep creates an FC1 Linux Function App using Node.js 24, its runtime storage account, deployment package container, Atlas call Table, private inbox/transcript containers, and processing/poison queues. It configures `ATLAS_WEBHOOK_SECRET` and `BC_ADMIN_API_KEY` as server-side application settings.

The webhook acknowledges Atlas only after a durable Storage handoff. Queue-trigger processing then persists call metadata and transcript with native retries and deterministic `callId` idempotency. See [Atlas call-completed ingestion](docs/architecture/atlas-call-ingestion.md).

GitHub Actions authenticates to Azure through OIDC and publishes the compiled Function artifact using One Deploy support in `Azure/functions-action`. No client secret or publish profile is used.

### Local Azure setup

Install Azure CLI with Bicep support, authenticate with your own developer identity, and create an ignored local configuration:

```bash
az login
cp infra/.env.example infra/.env.local
```

Fill the Function-only values in `infra/.env.local`, then deploy from the repository root:

```bash
./infra/deploy-local.sh
```

The helper checks required values and the active Azure CLI session, compiles Bicep, and performs a subscription-scope deployment. It does not implement or persist Azure authentication.

### GitHub OIDC

Create a Microsoft Entra application or user-assigned managed identity, grant it the minimum deployment role at the target subscription or resource-group scope, and add a federated credential for this repository and branch. For branch-based workflows, the subject is:

```text
repo:<owner>/<repository>:ref:refs/heads/main
```

Add these non-secret GitHub Actions variables:

```text
AZURE_CLIENT_ID
AZURE_TENANT_ID
AZURE_SUBSCRIPTION_ID
AZURE_LOCATION
AZURE_RESOURCE_GROUP
AZURE_FUNCTION_APP_NAME
WEB_BASE_URL
```

Add these GitHub Actions secrets for Azure:

```text
ATLAS_WEBHOOK_SECRET
BC_ADMIN_API_KEY
```

The same `BC_ADMIN_API_KEY` value must exist in Firebase Secret Manager so the Next.js server can call Azure. It is never sent to the browser. Other storefront secrets belong only to Firebase/Google Cloud Secret Manager.

No `AZURE_CLIENT_SECRET`, publish profile, or service-principal password is used.

### Deployment workflows

- `deploy-all.yml` deploys Azure infrastructure, then Functions, then checks the Function state. When `WEB_BASE_URL` is configured, it also checks the latest Firebase rollout at `/api/health`. It does not trigger or wait for Firebase.
- `deploy-infra.yml` is manually triggered. It logs in through OIDC, validates Bicep, and deploys the subscription-scope template.
- `deploy-functions.yml` validates and compiles `apps/functions` from the root workspace, creates its production artifact, and deploys only that artifact to the FC1 Function App when Function files change on `main`.

The Azure workflows remain independently dispatchable and reusable through `workflow_call`. Their dependency chain is `Function Infrastructure → Function Deploy → Smoke Tests`. Firebase independently observes `main` and reports rollout status through its GitHub check, so the mixed-cloud release is intentionally not presented as atomic.

Validation and build jobs run BC-Shop on Node.js 24. Azure deployment actions may independently report an action-runtime warning until their maintainers publish a newer supported major; that warning does not change the application or Azure runtime version.

Never commit real values from `.env.local`, `local.settings.json`, Azure credentials, Atlas credentials, webhook secrets, or publish profiles.

Architecture decisions and their tradeoffs are indexed in
[Architecture](docs/architecture/README.md).
