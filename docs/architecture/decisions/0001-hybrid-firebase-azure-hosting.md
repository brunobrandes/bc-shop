# ADR 0001: Hybrid Firebase and Azure hosting

- Status: Accepted
- Date: 2026-08-20

## Context

BC-Shop contains two workloads with different operational needs: a dynamic
Next.js storefront and asynchronous processing for Atlas events.

An isolated Azure subscription was created for the solution. Azure App Service
provisioning was evaluated for the web workload, but regional App Service VM
quota was zero for the available subscriptions and requested SKUs. Template
preflight consistently rejected the App Service Plan before creating an
application resource. Changing App Service tiers did not provide a genuinely
different capacity path.

The web application needs SSR, App Router route handlers, server-side secrets,
automatic HTTPS, GitHub-based rollouts, and managed user authentication.

## Decision

Host `apps/web` on Firebase App Hosting and host `apps/functions` on Azure
Functions Flex Consumption.

Firebase App Hosting preserves the current dynamic Next.js application and
provides a managed build, rollout, HTTPS, secret integration, and Firebase
Authentication path. This allowed the web and administrative experience to be
validated without depending on unavailable App Service regional VM quota.

Azure Functions Flex Consumption uses a separate serverless capacity and quota
model from App Service regional VMs. It remains a natural fit for the Atlas
webhook and queue-triggered processing.

## Consequences

- The solution is intentionally multi-cloud.
- Firebase and Azure have separate deployment and operational surfaces.
- Server-side contracts and secrets must be configured consistently across both
  environments.
- The storefront does not depend on Azure App Service availability.
- The Functions workload can scale independently from web traffic.
- A future move to a single cloud remains possible because the workloads have
  explicit HTTP and storage boundaries.

## Alternatives considered

- **Azure App Service for Next.js:** rejected because the required regional VM
  capacity was unavailable to the project subscriptions.
- **Azure Static Web Apps:** rejected because the application relies on dynamic
  Next.js server behavior and server-side route handlers.
- **Container Apps for the web:** technically viable, but it would introduce
  container image management and a larger operational surface than required.
- **Firebase for all processing:** rejected because the Azure Functions and
  Azure Storage event-processing foundation already provides the desired retry
  and persistence model.
