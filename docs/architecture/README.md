# Architecture

This directory describes the current BC-Shop architecture and the decisions
that shaped it.

## Runtime architecture

```mermaid
flowchart LR
    customer["Customer"]
    administrator["Administrator"]

    subgraph firebase["Firebase / Google Cloud"]
        web["Next.js on Firebase App Hosting"]
        storefront["Storefront and Contact UI"]
        contactApi["Contact API"]
        productApi["Product Search Action API"]
        catalog["Canonical Product Catalog"]
        dashboard["CallInsights Dashboard"]
        adminApi["Protected Admin API"]
        auth["Firebase Authentication<br/>Email and Password"]
        firebaseSecrets["Google Cloud Secret Manager"]

        web --- storefront
        web --- contactApi
        web --- productApi
        web --- dashboard
        web --- adminApi
        productApi --> catalog
        firebaseSecrets -.->|"Runtime secrets"| web
    end

    subgraph atlas["YourAtlas"]
        campaign["Voice AI Campaign"]
        action["Product Search Action"]
        completed["call_completed Webhook"]
        recording["Atlas-hosted Recording"]

        campaign --> action
        campaign --> completed
        campaign --> recording
    end

    subgraph azure["Microsoft Azure"]
        subgraph functions["Azure Functions Flex Consumption"]
            receiver["Webhook Receiver<br/>Validate and stage"]
            worker["Queue Worker<br/>Retry and idempotency"]
            insights["Internal CallInsights API"]
        end

        subgraph storage["Azure Storage Account"]
            inbox["Private Inbox Blob<br/>Minimized event JSON"]
            queue["Processing Queue"]
            poison["Poison Queue"]
            table["Table Storage<br/>Metadata, status and audio URL"]
            transcripts["Private Transcript Blob<br/>UTF-8 text files"]
        end
    end

    customer --> storefront
    storefront --> contactApi
    contactApi -->|"Server-side Atlas API key"| campaign

    action -->|"x-bc-agent-key"| productApi
    productApi -->|"Matching products"| action

    completed -->|"Route secret"| receiver
    receiver -->|"Stage before HTTP 200"| inbox
    receiver -->|"Record receipt"| table
    receiver --> queue
    queue --> worker
    inbox -->|"Load staged event"| worker
    worker --> table
    worker --> transcripts
    worker -.->|"Retries exhausted"| poison
    table -.->|"References"| recording

    administrator --> dashboard
    dashboard -->|"Sign in"| auth
    dashboard -->|"Firebase ID token"| adminApi
    adminApi -->|"Verify token and allowlist"| auth
    adminApi -->|"x-bc-admin-key"| insights
    table --> insights
    transcripts -->|"Detail requests only"| insights
    insights --> adminApi
```

BC-Shop uses Firebase App Hosting for the dynamic Next.js application and
Firebase Authentication. Azure Functions and Azure Storage provide durable,
retryable processing for YourAtlas call-completion events. Atlas continues to
host call recordings; BC-Shop stores a validated audio reference and persists
the transcript as private Blob content.

## Delivery and secret management

```mermaid
flowchart LR
    repository["Public GitHub Repository<br/>pnpm monorepo"]

    subgraph webDelivery["Web delivery"]
        firebaseRollout["Firebase App Hosting<br/>Native GitHub rollout"]
        secretManager["Google Cloud Secret Manager"]
        webRuntime["apps/web"]

        firebaseRollout --> webRuntime
        secretManager -->|"Runtime secret references"| webRuntime
    end

    subgraph azureDelivery["Azure delivery"]
        actions["GitHub Actions"]
        oidc["GitHub to Azure OIDC<br/>Short-lived token"]
        repositorySecrets["GitHub Actions Secrets"]
        bicep["Bicep deployment"]
        functionArtifact["Isolated Functions artifact"]
        azureResources["Function App and Storage"]

        actions --> oidc
        repositorySecrets --> actions
        actions --> bicep
        actions --> functionArtifact
        oidc -->|"Authorizes deployment"| azureResources
        bicep --> azureResources
        functionArtifact --> azureResources
    end

    repository -->|"main branch"| firebaseRollout
    repository --> actions
```

The public repository contains source code and non-sensitive configuration only.
Firebase runtime secrets are resolved from Google Cloud Secret Manager. Azure
deployments use GitHub OIDC instead of client secrets or publish profiles, and
sensitive workflow values remain in GitHub Actions Secrets.

## Architecture decision records

| ADR                                                           | Decision                                                                                      |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [0001](decisions/0001-hybrid-firebase-azure-hosting.md)       | Host the web application on Firebase and event processing on Azure Functions Flex Consumption |
| [0002](decisions/0002-firebase-admin-authentication.md)       | Use Firebase Email/Password authentication with server-side authorization                     |
| [0003](decisions/0003-durable-atlas-webhook-ingestion.md)     | Decouple Atlas webhook receipt from processing with durable Storage Queue ingestion           |
| [0004](decisions/0004-azure-storage-persistence.md)           | Use Azure Blob Storage and Table Storage for call data in the initial architecture            |
| [0005](decisions/0005-atlas-integration-boundaries.md)        | Keep Atlas credentials and machine endpoints behind trusted server boundaries                 |
| [0006](decisions/0006-monorepo-independent-deployments.md)    | Keep one monorepo with independently deployable web and Functions workloads                   |
| [0007](decisions/0007-public-repository-secret-management.md) | Keep deployment identity and runtime secrets outside the public repository                    |

Detailed runtime behavior is documented in
[Atlas call-completed ingestion](atlas-call-ingestion.md).
