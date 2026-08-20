# BC-Shop

BC-Shop is the production-oriented foundation for a computer and technology hardware storefront. Stage 0 includes a polished catalog, simple read-only APIs, and a server-only boundary for a future Atlas sales assistant.

## Stack

Next.js App Router, React, strict TypeScript, Tailwind CSS, pnpm, ESLint, Prettier, and Vitest.

## Getting started

Requires a current Node.js LTS release and pnpm.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open `http://localhost:3000`. Atlas credentials are optional for the storefront and tests.

The call-request flow is available in English at `/en/contact` and Portuguese at `/pt/contact`. `/contact` redirects to the English version.

## Environment

| Variable            | Required                                 | Purpose                                                        |
| ------------------- | ---------------------------------------- | -------------------------------------------------------------- |
| `ATLAS_API_KEY`     | Only when calling Atlas                  | Server-side API credential                                     |
| `ATLAS_CAMPAIGN_ID` | Only when initiating the configured chat | Atlas campaign identifier                                      |
| `ATLAS_BASE_URL`    | No                                       | Atlas API root; defaults to `https://api.youratlas.com/v1/api` |
| `BC_AGENT_API_KEY`  | For Atlas product-search Actions         | Server-side machine-to-machine key                             |

Never prefix the API key with `NEXT_PUBLIC_`. Local `.env*` files are ignored; `.env.example` contains placeholders only.

## Commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm start
```

## APIs

- `GET /api/health` — service health and request-time timestamp
- `GET /api/products` — `{ "data": Product[] }`
- `GET /api/products/:id` — `{ "data": Product }`, or a consistent `404` error
- `POST /api/contact/call` — validates and requests an immediate or scheduled Atlas call
- `POST /api/agent/products/search` — authenticated Atlas Action over the canonical catalog

## Atlas boundary

`src/lib/atlas` is imported server-side only. It validates configuration when the integration is used, attaches the `api-key` header, applies a timeout, and normalizes network/upstream failures. `AtlasClient.initiateWebChat` maps exactly to the documented `POST /campaign-chat/:campaignId` operation. There is intentionally no public chat API or browser-to-Atlas call in Stage 0.

## Stage 0 scope

There is no authentication, database, persisted cart, checkout, payments, CRM, admin, complete chat, campaign provisioning, webhooks, or AI recommendation logic. Product detail buttons and the cart are visual placeholders. See [the Stage 0 implementation notes](docs/stages/00-foundation.md).

## Azure deployment

Both workloads use Node.js 24 on Linux. Bicep provisions one resource group, a Basic App Service plan, the Next.js Web App, the independent Function App, and the Function runtime storage account.

### Local Azure setup

Install Azure CLI with Bicep support, authenticate with your own developer identity, and create an ignored local configuration:

```bash
az login
cp infra/.env.example infra/.env.local
```

Fill `infra/.env.local`, then deploy from the repository root:

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
AZURE_WEB_APP_NAME
AZURE_FUNCTION_APP_NAME
```

Add these GitHub Actions secrets:

```text
ATLAS_API_KEY
ATLAS_CAMPAIGN_ID_PT
ATLAS_CAMPAIGN_ID_EN
BC_AGENT_API_KEY
ATLAS_WEBHOOK_SECRET
```

No `AZURE_CLIENT_SECRET`, publish profile, or service-principal password is used.

### Deployment workflows

- `deploy-infra.yml` is manually triggered. It logs in through OIDC, validates Bicep, and deploys the subscription-scope template.
- `deploy-web.yml` validates the Next.js project, creates a standalone artifact, and deploys only that artifact to App Service when relevant web files change on `main`.
- `deploy-functions.yml` validates and compiles `bc-shop-functions`, creates its production artifact, and deploys only that artifact to the Function App when Function files change on `main`.

Never commit real values from `.env.local`, `local.settings.json`, Azure credentials, Atlas credentials, webhook secrets, or publish profiles.
