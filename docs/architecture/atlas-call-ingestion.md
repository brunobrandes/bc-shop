# Atlas call-completed ingestion

This runtime design implements
[ADR 0003](decisions/0003-durable-atlas-webhook-ingestion.md) and
[ADR 0004](decisions/0004-azure-storage-persistence.md).

## Decision

BC-Shop uses an HTTP receiver plus Azure Storage Queue. This is the smallest model that acknowledges Atlas quickly after a durable handoff and provides native retry and poison-message behavior without Durable Functions.

## Processing flow

```text
Atlas webhook
  → authenticate and validate
  → write a minimized event envelope to atlas-webhook-inbox
  → create the atlascalls receipt entity
  → enqueue { callId, storageKey } in atlas-call-completed
  → return 200

Queue worker
  → mark processing
  → load the inbox envelope
  → upsert call metadata in atlascalls
  → overwrite atlas-transcripts/{storageKey}.txt
  → mark completed
```

The inbox envelope contains only `callId`, selected call metadata, summary,
transcript, and a validated HTTP(S) audio reference when Atlas provides one.
Customer phone and the full raw webhook are not retained. BC-Shop does not copy
or own the audio binary; Atlas remains the source for the referenced recording.

## Idempotency and failures

`storageKey` is the SHA-256 hash of `callId`. It deterministically identifies the Table entity, inbox blob, transcript blob, and queue message context. Duplicate deliveries may create duplicate queue messages, but completed calls are skipped and all writes are deterministic upserts or overwrites.

Table processing states are:

- `received` — staged and recorded by the HTTP receiver
- `processing` — claimed by a queue-trigger invocation
- `completed` — metadata and transcript are persisted
- `failed` — the latest processing attempt failed

Queue-trigger failures are thrown back to the Functions runtime. The runtime retries a message five times with a 30-second visibility timeout. After the fifth failure, it moves the message to `atlas-call-completed-poison`. The Table entity remains `failed`, and the poison message can be inspected and replayed by moving it back to `atlas-call-completed` after correcting the cause.

The receiver returns `200` only after the minimized inbox blob, receipt entity, and queue message are durable. If any handoff step fails it returns `503`, allowing Atlas to retry. No transcript, phone number, raw payload, or secret is written to application logs.

Durable Functions are intentionally not used: processing is a short linear sequence with deterministic writes and Storage Queue already supplies the required retry boundary.
