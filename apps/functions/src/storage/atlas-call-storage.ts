import { createHash } from "node:crypto";
import { TableClient, type TableEntity } from "@azure/data-tables";
import { BlobServiceClient } from "@azure/storage-blob";
import { QueueClient } from "@azure/storage-queue";

export type AtlasCallCompletedEvent = {
  callId: string;
  status?: string;
  endedReason?: string;
  durationSeconds?: number;
  callSummary?: string;
  callTranscript: string;
};

export type AtlasCallQueueMessage = {
  callId: string;
  storageKey: string;
};

export interface AtlasCallStorage {
  stage(event: AtlasCallCompletedEvent): Promise<AtlasCallQueueMessage>;
  recordReceipt(message: AtlasCallQueueMessage): Promise<void>;
  enqueue(message: AtlasCallQueueMessage): Promise<void>;
  isCompleted(message: AtlasCallQueueMessage): Promise<boolean>;
  load(message: AtlasCallQueueMessage): Promise<AtlasCallCompletedEvent>;
  markProcessing(
    message: AtlasCallQueueMessage,
    attempt: number,
  ): Promise<void>;
  persistMetadata(event: AtlasCallCompletedEvent): Promise<void>;
  persistTranscript(event: AtlasCallCompletedEvent): Promise<void>;
  markCompleted(message: AtlasCallQueueMessage): Promise<void>;
  markFailed(message: AtlasCallQueueMessage, attempt: number): Promise<void>;
}

const partitionKey = "calls";

export function storageKeyForCall(callId: string) {
  return createHash("sha256").update(callId).digest("hex");
}

function isConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: unknown }).statusCode === 409
  );
}

export class AzureAtlasCallStorage implements AtlasCallStorage {
  private readonly table: TableClient;
  private readonly inbox;
  private readonly transcripts;
  private readonly queue: QueueClient;

  constructor(connectionString: string, env = process.env) {
    const tableName = env.ATLAS_CALLS_TABLE || "atlascalls";
    const inboxContainer = env.ATLAS_INBOX_CONTAINER || "atlas-webhook-inbox";
    const transcriptContainer =
      env.ATLAS_TRANSCRIPTS_CONTAINER || "atlas-transcripts";
    const queueName = env.ATLAS_PROCESSING_QUEUE || "atlas-call-completed";
    const blobService =
      BlobServiceClient.fromConnectionString(connectionString);

    this.table = TableClient.fromConnectionString(connectionString, tableName);
    this.inbox = blobService.getContainerClient(inboxContainer);
    this.transcripts = blobService.getContainerClient(transcriptContainer);
    this.queue = new QueueClient(connectionString, queueName);
  }

  async stage(event: AtlasCallCompletedEvent) {
    const storageKey = storageKeyForCall(event.callId);
    await this.inbox
      .getBlockBlobClient(`${storageKey}.json`)
      .uploadData(Buffer.from(JSON.stringify(event)), {
        blobHTTPHeaders: { blobContentType: "application/json" },
      });
    return { callId: event.callId, storageKey };
  }

  async recordReceipt(message: AtlasCallQueueMessage) {
    try {
      await this.table.createEntity({
        partitionKey,
        rowKey: message.storageKey,
        callId: message.callId,
        processingState: "received",
        receivedAt: new Date().toISOString(),
      });
    } catch (error) {
      if (!isConflict(error)) throw error;
    }
  }

  async enqueue(message: AtlasCallQueueMessage) {
    await this.queue.sendMessage(JSON.stringify(message));
  }

  async isCompleted(message: AtlasCallQueueMessage) {
    const entity = await this.table.getEntity<TableEntity>(
      partitionKey,
      message.storageKey,
    );
    return entity.processingState === "completed";
  }

  async load(message: AtlasCallQueueMessage) {
    const buffer = await this.inbox
      .getBlockBlobClient(`${message.storageKey}.json`)
      .downloadToBuffer();
    return JSON.parse(buffer.toString("utf8")) as AtlasCallCompletedEvent;
  }

  async markProcessing(message: AtlasCallQueueMessage, attempt: number) {
    await this.table.upsertEntity(
      {
        partitionKey,
        rowKey: message.storageKey,
        processingState: "processing",
        processingStartedAt: new Date().toISOString(),
        attemptCount: attempt,
        lastError: "",
      },
      "Merge",
    );
  }

  async persistMetadata(event: AtlasCallCompletedEvent) {
    const entity: TableEntity = {
      partitionKey,
      rowKey: storageKeyForCall(event.callId),
      callId: event.callId,
      ...(event.status ? { callStatus: event.status } : {}),
      ...(event.endedReason ? { endedReason: event.endedReason } : {}),
      ...(event.durationSeconds !== undefined
        ? { durationSeconds: event.durationSeconds }
        : {}),
      ...(event.callSummary ? { callSummary: event.callSummary } : {}),
    };
    await this.table.upsertEntity(entity, "Merge");
  }

  async persistTranscript(event: AtlasCallCompletedEvent) {
    const storageKey = storageKeyForCall(event.callId);
    await this.transcripts
      .getBlockBlobClient(`${storageKey}.txt`)
      .uploadData(Buffer.from(event.callTranscript), {
        blobHTTPHeaders: {
          blobContentType: "text/plain; charset=utf-8",
        },
      });
  }

  async markCompleted(message: AtlasCallQueueMessage) {
    await this.table.upsertEntity(
      {
        partitionKey,
        rowKey: message.storageKey,
        processingState: "completed",
        completedAt: new Date().toISOString(),
        transcriptBlob: `${message.storageKey}.txt`,
        lastError: "",
      },
      "Merge",
    );
  }

  async markFailed(message: AtlasCallQueueMessage, attempt: number) {
    await this.table.upsertEntity(
      {
        partitionKey,
        rowKey: message.storageKey,
        processingState: "failed",
        failedAt: new Date().toISOString(),
        attemptCount: attempt,
        lastError:
          "Processing failed; inspect the poison queue if retries are exhausted.",
      },
      "Merge",
    );
  }
}

let storage: AtlasCallStorage | undefined;

export function getAtlasCallStorage() {
  if (storage) return storage;
  const connectionString = process.env.AzureWebJobsStorage;
  if (!connectionString) throw new Error("Storage is not configured");
  storage = new AzureAtlasCallStorage(connectionString);
  return storage;
}
