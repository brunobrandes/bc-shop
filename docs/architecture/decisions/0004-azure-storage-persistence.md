# ADR 0004: Azure Storage persistence for call insights

- Status: Accepted
- Date: 2026-08-20

## Context

Call records combine small structured metadata with potentially large transcript
content. The initial solution needs deterministic lookup, simple time-range
listing, low operating cost, private object storage, and compatibility with the
Functions retry model. It does not require relational transactions, joins, or a
general-purpose analytics database.

## Decision

Use one Azure Storage Account with separate primitives:

- private Blob container for minimized webhook inbox envelopes;
- private Blob container for transcripts;
- `atlascalls` Table for status and queryable call metadata;
- processing and poison Storage Queues for asynchronous execution.

Table entities keep bounded operational and dashboard fields. Transcript text
is stored as UTF-8 text in Blob Storage and loaded only for the call-detail
view. A validated Atlas audio URL may be retained in Table metadata so the
authorized detail view can play the source recording. The audio binary is not
copied into BC-Shop Blob Storage. The full raw Atlas payload and customer phone
number are not persisted by this flow.

Azure Functions does not use its local filesystem as application storage. The
Function runtime receives its Storage connection through server-side app
settings, while the administrative web application reads data through the
protected CallInsights API. Administrators therefore do not require Azure
portal access or Storage Account credentials to use the dashboard.

## Consequences

- Storage cost and operational overhead remain low.
- Large text does not inflate metadata entities or overview queries.
- The same storage system supports durable ingestion, processing status, and
  CallInsights reads.
- Audio storage and delivery remain the responsibility of Atlas; BC-Shop stores
  only the validated reference required by the authorized detail experience.
- Query patterns must remain compatible with Table Storage partition and row
  keys; complex filtering and relationships are intentionally limited.

## Evolution criteria

Re-evaluate the data store when the product requires complex cross-entity
queries, transactional workflows, richer indexing, high-volume analytics,
multi-tenant isolation, or retention policies that are difficult to express
with the current model. At that point, a managed relational or document database
can become the primary metadata store while Blob Storage remains appropriate for
large transcript artifacts.

## Alternatives considered

- **Relational database:** deferred because current access patterns do not need
  relational joins or transactions.
- **Document database:** deferred because deterministic Table entities satisfy
  the present query model at lower complexity.
- **Store transcripts directly in Table Storage:** rejected because transcripts
  are variable and potentially large objects.
- **Copy Atlas audio into BC-Shop Blob Storage:** deferred because Atlas already
  owns and serves the recording. Copying it would require an explicit retention,
  consent, lifecycle, and access-control policy for duplicated media.
