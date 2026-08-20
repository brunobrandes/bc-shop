# Azure Functions webhook E2E tests

This Postman collection exercises the deployed BC-Shop Atlas webhook over HTTP. It does not call Atlas and does not require application code changes.

## Setup

1. Import `atlas-call-completed.postman_collection.json` into Postman.
2. Import `azure-functions.postman_environment.example.json`.
3. Duplicate the imported environment and set:
   - `functionBaseUrl` to the Function App origin, without a trailing slash.
   - `atlasWebhookSecret` to the deployed `ATLAS_WEBHOOK_SECRET`.
4. Keep the environment copy local. Never commit or export its real secret.
5. Run the complete collection.

Example base URL:

```text
https://your-function-app.azurewebsites.net
```

The collection covers invalid authentication, malformed JSON, invalid payloads, one valid event, and a valid event array. Valid synthetic events enter the real Storage-backed ingestion pipeline, but the collection never calls Atlas or any other downstream system.

An HTTP `200` confirms that the minimized event was durably staged, its receipt was recorded, and a processing message was queued. Processing continues asynchronously. In Azure Storage, the matching Table entity should eventually reach `processingState: completed`; failed messages are retried and then moved to the queue's `-poison` queue by the Functions runtime.

## Expected result

All requests should pass their embedded Postman assertions:

- invalid secret: `401`
- malformed JSON: `400`
- empty array: `400`
- missing `callId`: `400`
- valid single event: `200` with `{ "received": true }`
- valid event array: `200` with `{ "received": true }`
