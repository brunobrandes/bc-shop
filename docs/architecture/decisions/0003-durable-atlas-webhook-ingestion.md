# ADR 0003: Durable Atlas webhook ingestion

- Status: Accepted
- Date: 2026-08-20

## Context

Atlas can deliver a `call_completed` event containing a transcript that may be
large. Webhook delivery should be acknowledged quickly, while persistence and
future processing must tolerate transient failures and repeated delivery.

Performing all work inside the HTTP request would couple Atlas delivery to Blob
and Table processing latency and would provide no durable retry boundary.

## Decision

Use an Azure HTTP-triggered Function as a durable receiver and a Storage
Queue-triggered Function as the processor.

The receiver validates the route secret and payload, minimizes the accepted
event, writes it to a private inbox Blob, records receipt in Table Storage,
enqueues a small `{ callId, storageKey }` message, and only then returns `200`.

The minimized envelope contains the transcript and selected call metadata. If
Atlas supplies an audio URL, BC-Shop validates it as HTTP(S) and retains the
reference; the audio binary itself is not copied into BC-Shop storage.

The worker loads the staged event, writes call metadata and transcript, and
marks the call complete. Failures are rethrown so the Functions runtime applies
queue retries and eventually moves exhausted messages to the poison queue.

`callId` is transformed into a deterministic SHA-256 storage key. Repeated
deliveries and worker retries therefore target the same entities and blobs.
Completed calls are skipped, while other writes are deterministic upserts or
overwrites.

## Consequences

- Atlas receives a fast response only after durable handoff.
- Large transcripts do not travel inside queue messages.
- Transient failures are retried without custom retry infrastructure.
- Poison messages remain available for diagnosis and controlled replay.
- Duplicate Atlas deliveries do not create duplicate completed call records.
- The flow is eventually consistent: a received event may briefly appear in a
  processing state before CallInsights can display it.
- Function instances remain stateless. Durable state survives restarts,
  scale-out, and scale-to-zero because it is externalized to Azure Storage.

## Alternatives considered

- **Synchronous processing:** rejected because it makes webhook reliability
  depend on all downstream writes completing during the request.
- **Durable Functions:** not required for this short, linear workflow.
- **Service Bus:** capable but unnecessary for the current throughput and retry
  requirements; Storage Queue keeps cost and operational complexity lower.
