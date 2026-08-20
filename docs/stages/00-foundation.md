# Stage 0 — Application foundation

## Objective

Establish a clean, runnable BC-Shop application with a credible computer storefront, one canonical catalog, read-only product and health APIs, and a secure Atlas integration seam.

## Resulting architecture

- `src/app` — App Router storefront, shared layout, styles, and API route handlers.
- `src/components/store` — retail presentation plus the isolated sales-assistant trigger.
- `src/data/products.ts` — the only product dataset.
- `src/lib/products` — small, testable catalog query functions shared by UI and APIs.
- `src/lib/atlas` — server-only configuration, errors, types, and HTTP client.
- `src/types` — shared product domain types.

Server Components are used by default. The sales-assistant dialog is the only Client Component because it owns browser dialog state.

## Decisions

- Products remain in a typed in-memory module: persistence is outside this stage.
- API errors use `{ error: { code, message } }` and do not expose implementation details.
- Atlas configuration is lazy. Missing credentials do not break rendering or builds; they fail only when Atlas is invoked.
- Atlas response fields are not invented. The documented web-chat success body is represented as an empty object.
- Product visuals are CSS-built, avoiding third-party or copyrighted photography.

## Atlas boundary

The client implements only the documented `POST /campaign-chat/:campaignId` request with `message` and `contactIdentifier`. It safely encodes the campaign path segment, sends JSON with `api-key`, enforces a 10-second default timeout, and converts timeouts, network issues, non-2xx responses, and malformed JSON to typed internal errors. It never logs response bodies, headers, or secrets.

Environment variables:

- `ATLAS_API_KEY` — required only at the moment an Atlas client is created.
- `ATLAS_CAMPAIGN_ID` — separately validated for a future configured integration.
- `ATLAS_BASE_URL` — optional HTTPS URL, defaulting to the official API root.

## Endpoints

- `GET /api/health`
- `GET /api/products`
- `GET /api/products/[id]`

## Known limitations

The cart, product-detail actions, and sales-assistant dialog are presentation hooks only. There is no product persistence or filtering, no external Atlas invocation from an application route, and no full conversation interface.

## Next logical integration steps

Stage 1 can add a narrowly scoped server route or Server Action around `atlas.initiateWebChat`, define safe visitor identification, connect the placeholder dialog to that boundary, and handle the exact documented response behavior. Atlas campaign setup, webhooks, and broader channels should remain separate work.
