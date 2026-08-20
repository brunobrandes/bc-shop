import { TableClient } from "@azure/data-tables";
import { BlobServiceClient } from "@azure/storage-blob";
import { storageKeyForCall } from "../storage/atlas-call-storage";
import type {
  CallInsight,
  CallInsightDetail,
  CallInsightsOverview,
  CallInsightsPage,
  CallProcessingStatus,
} from "./contracts";

export type CallEntity = Record<string, unknown>;

export interface CallInsightsDataSource {
  scan(since: Date): AsyncIterable<CallEntity>;
  page(
    since: Date,
    limit: number,
    cursor?: string,
  ): Promise<{
    entities: CallEntity[];
    nextCursor?: string;
  }>;
  get(storageKey: string): Promise<CallEntity | undefined>;
  transcript(storageKey: string): Promise<string | undefined>;
}

export interface CallInsightsRepository {
  overview(since: Date): Promise<CallInsightsOverview>;
  list(since: Date, limit: number, cursor?: string): Promise<CallInsightsPage>;
  detail(callId: string): Promise<CallInsightDetail | undefined>;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function processingStatus(value: unknown): CallProcessingStatus {
  return value === "received" ||
    value === "processing" ||
    value === "completed" ||
    value === "failed"
    ? value
    : "received";
}

export function toCallInsight(entity: CallEntity): CallInsight {
  const transcriptBlob = stringValue(entity.transcriptBlob);
  return {
    callId: stringValue(entity.callId) || "",
    ...(stringValue(entity.campaignId)
      ? { campaignId: stringValue(entity.campaignId) }
      : {}),
    ...(stringValue(entity.customerName)
      ? { customerName: stringValue(entity.customerName) }
      : {}),
    ...(stringValue(entity.callStatus)
      ? { status: stringValue(entity.callStatus) }
      : {}),
    ...(stringValue(entity.endedReason)
      ? { endedReason: stringValue(entity.endedReason) }
      : {}),
    ...(numberValue(entity.durationSeconds) !== undefined
      ? { durationSeconds: numberValue(entity.durationSeconds) }
      : {}),
    ...(stringValue(entity.callSummary)
      ? { callSummary: stringValue(entity.callSummary) }
      : {}),
    ...(stringValue(entity.startedAt)
      ? { startedAt: stringValue(entity.startedAt) }
      : {}),
    ...(stringValue(entity.endedAt)
      ? { endedAt: stringValue(entity.endedAt) }
      : {}),
    ...(stringValue(entity.receivedAt)
      ? { receivedAt: stringValue(entity.receivedAt) }
      : {}),
    processingStatus: processingStatus(entity.processingState),
    ...(stringValue(entity.audioUrl)
      ? { audioUrl: stringValue(entity.audioUrl) }
      : {}),
    hasTranscript: Boolean(transcriptBlob),
  };
}

function byMostRecent(a: CallInsight, b: CallInsight) {
  const aDate = a.startedAt || a.endedAt || a.receivedAt || "";
  const bDate = b.startedAt || b.endedAt || b.receivedAt || "";
  return bDate.localeCompare(aDate);
}

function isNotFound(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    (error as { statusCode?: unknown }).statusCode === 404
  );
}

export class DefaultCallInsightsRepository implements CallInsightsRepository {
  constructor(private readonly source: CallInsightsDataSource) {}

  async overview(since: Date) {
    let totalCalls = 0;
    let completedCalls = 0;
    let failedCalls = 0;
    let totalDuration = 0;
    let durationCount = 0;
    const recentCalls: CallInsight[] = [];

    for await (const entity of this.source.scan(since)) {
      const call = toCallInsight(entity);
      if (!call.callId) continue;
      totalCalls += 1;
      if (call.processingStatus === "completed") completedCalls += 1;
      if (call.processingStatus === "failed") failedCalls += 1;
      if (call.durationSeconds !== undefined) {
        totalDuration += call.durationSeconds;
        durationCount += 1;
      }
      recentCalls.push(call);
      recentCalls.sort(byMostRecent);
      if (recentCalls.length > 5) recentCalls.pop();
    }

    return {
      totalCalls,
      completedCalls,
      failedCalls,
      averageDurationSeconds:
        durationCount === 0 ? 0 : Math.round(totalDuration / durationCount),
      recentCalls,
    };
  }

  async list(since: Date, limit: number, cursor?: string) {
    const page = await this.source.page(since, limit, cursor);
    return {
      calls: page.entities
        .map(toCallInsight)
        .filter((call) => call.callId)
        .sort(byMostRecent),
      ...(page.nextCursor ? { nextCursor: page.nextCursor } : {}),
    };
  }

  async detail(callId: string): Promise<CallInsightDetail | undefined> {
    const storageKey = storageKeyForCall(callId);
    const entity = await this.source.get(storageKey);
    if (!entity) return undefined;
    const call = toCallInsight(entity);
    if (!call.callId) return undefined;
    if (!call.hasTranscript) return call;
    const transcript = await this.source.transcript(storageKey);
    return transcript === undefined
      ? { ...call, hasTranscript: false }
      : { ...call, transcript };
  }
}

class AzureCallInsightsDataSource implements CallInsightsDataSource {
  private readonly table: TableClient;
  private readonly transcripts;

  constructor(connectionString: string, env = process.env) {
    const tableName = env.ATLAS_CALLS_TABLE || "atlascalls";
    const transcriptContainer =
      env.ATLAS_TRANSCRIPTS_CONTAINER || "atlas-transcripts";
    this.table = TableClient.fromConnectionString(connectionString, tableName);
    this.transcripts =
      BlobServiceClient.fromConnectionString(
        connectionString,
      ).getContainerClient(transcriptContainer);
  }

  private filter(since: Date) {
    return `PartitionKey eq 'calls' and receivedAt ge '${since.toISOString()}'`;
  }

  scan(since: Date) {
    return this.table.listEntities<Record<string, unknown>>({
      queryOptions: { filter: this.filter(since) },
    });
  }

  async page(since: Date, limit: number, cursor?: string) {
    const pages = this.table
      .listEntities<Record<string, unknown>>({
        queryOptions: { filter: this.filter(since) },
      })
      .byPage({ continuationToken: cursor, maxPageSize: limit });
    const firstPage = await pages.next();
    if (firstPage.done) return { entities: [] };
    return {
      entities: [...firstPage.value],
      ...(firstPage.value.continuationToken
        ? { nextCursor: firstPage.value.continuationToken }
        : {}),
    };
  }

  async get(storageKey: string) {
    try {
      return await this.table.getEntity<Record<string, unknown>>(
        "calls",
        storageKey,
      );
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  }

  async transcript(storageKey: string) {
    try {
      const transcript = await this.transcripts
        .getBlockBlobClient(`${storageKey}.txt`)
        .downloadToBuffer();
      return transcript.toString("utf8");
    } catch (error) {
      if (isNotFound(error)) return undefined;
      throw error;
    }
  }
}

export class AzureCallInsightsRepository extends DefaultCallInsightsRepository {
  constructor(connectionString: string, env = process.env) {
    super(new AzureCallInsightsDataSource(connectionString, env));
  }
}

let repository: CallInsightsRepository | undefined;

export function getCallInsightsRepository() {
  if (repository) return repository;
  const connectionString = process.env.AzureWebJobsStorage;
  if (!connectionString) throw new Error("Storage is not configured");
  repository = new AzureCallInsightsRepository(connectionString);
  return repository;
}
