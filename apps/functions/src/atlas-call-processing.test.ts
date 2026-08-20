import { HttpRequest, InvocationContext } from "@azure/functions";
import { describe, expect, it } from "vitest";
import { createAtlasCallCompletedHandler } from "./functions/atlas-call-completed";
import { createProcessAtlasCallHandler } from "./functions/process-atlas-call-completed";
import { processAtlasCall } from "./services/atlas-call-processing";
import {
  storageKeyForCall,
  type AtlasCallCompletedEvent,
  type AtlasCallQueueMessage,
  type AtlasCallStorage,
} from "./storage/atlas-call-storage";

const event: AtlasCallCompletedEvent = {
  callId: "call-001",
  status: "Accepted",
  endedReason: "customer-ended-call",
  durationSeconds: 42,
  callSummary: "Customer requested product information.",
  callTranscript: "Synthetic transcript content.",
};

class MemoryStorage implements AtlasCallStorage {
  inbox = new Map<string, AtlasCallCompletedEvent>();
  states = new Map<string, Record<string, unknown>>();
  metadata = new Map<string, AtlasCallCompletedEvent>();
  transcripts = new Map<string, string>();
  queue: AtlasCallQueueMessage[] = [];
  failEnqueue = false;
  failTranscript = 0;
  failComplete = 0;

  async stage(value: AtlasCallCompletedEvent) {
    const message = {
      callId: value.callId,
      storageKey: storageKeyForCall(value.callId),
    };
    this.inbox.set(message.storageKey, value);
    return message;
  }

  async recordReceipt(message: AtlasCallQueueMessage) {
    if (!this.states.has(message.storageKey))
      this.states.set(message.storageKey, { processingState: "received" });
  }

  async enqueue(message: AtlasCallQueueMessage) {
    if (this.failEnqueue) throw new Error("queue unavailable");
    this.queue.push(message);
  }

  async isCompleted(message: AtlasCallQueueMessage) {
    return this.states.get(message.storageKey)?.processingState === "completed";
  }

  async load(message: AtlasCallQueueMessage) {
    const value = this.inbox.get(message.storageKey);
    if (!value) throw new Error("Missing inbox event");
    return value;
  }

  async markProcessing(message: AtlasCallQueueMessage, attempt: number) {
    this.states.set(message.storageKey, {
      processingState: "processing",
      attempt,
    });
  }

  async persistMetadata(value: AtlasCallCompletedEvent) {
    this.metadata.set(value.callId, value);
  }

  async persistTranscript(value: AtlasCallCompletedEvent) {
    if (this.failTranscript > 0) {
      this.failTranscript -= 1;
      throw new Error("transient transcript failure");
    }
    this.transcripts.set(value.callId, value.callTranscript);
  }

  async markCompleted(message: AtlasCallQueueMessage) {
    if (this.failComplete > 0) {
      this.failComplete -= 1;
      throw new Error("transient completion failure");
    }
    this.states.set(message.storageKey, { processingState: "completed" });
  }

  async markFailed(message: AtlasCallQueueMessage, attempt: number) {
    this.states.set(message.storageKey, {
      processingState: "failed",
      attempt,
    });
  }
}

function request(body: string, secret = "test-secret") {
  return new HttpRequest({
    method: "POST",
    url: `https://example.test/api/webhooks/atlas/call-completed/${secret}`,
    params: { secret },
    headers: { "content-type": "application/json" },
    body: { string: body },
  });
}

describe("Atlas call_completed ingestion", () => {
  it("durably accepts a valid webhook", async () => {
    const storage = new MemoryStorage();
    const handler = createAtlasCallCompletedHandler(storage, "test-secret");
    const response = await handler(
      request(JSON.stringify(event)),
      new InvocationContext(),
    );

    expect(response).toMatchObject({
      status: 200,
      jsonBody: { received: true },
    });
    expect(storage.queue).toHaveLength(1);
    expect(storage.states.get(storage.queue[0].storageKey)).toMatchObject({
      processingState: "received",
    });
  });

  it("does not acknowledge when the durable handoff fails", async () => {
    const storage = new MemoryStorage();
    storage.failEnqueue = true;
    const handler = createAtlasCallCompletedHandler(storage, "test-secret");

    const response = await handler(
      request(JSON.stringify(event)),
      new InvocationContext(),
    );

    expect(response).toMatchObject({
      status: 503,
      jsonBody: { error: "Webhook not accepted" },
    });
  });

  it("rejects an invalid secret", async () => {
    const handler = createAtlasCallCompletedHandler(
      new MemoryStorage(),
      "test-secret",
    );
    const response = await handler(
      request(JSON.stringify(event), "invalid"),
      new InvocationContext(),
    );
    expect(response.status).toBe(401);
  });

  it("rejects malformed JSON", async () => {
    const handler = createAtlasCallCompletedHandler(
      new MemoryStorage(),
      "test-secret",
    );
    const response = await handler(
      request("{not-json"),
      new InvocationContext(),
    );
    expect(response.status).toBe(400);
  });

  it("does not log transcript or customer phone", async () => {
    const entries: unknown[][] = [];
    const context = new InvocationContext({
      logHandler: (_level, ...args) => entries.push(args),
    });
    const handler = createAtlasCallCompletedHandler(
      new MemoryStorage(),
      "test-secret",
    );
    await handler(
      request(
        JSON.stringify({
          ...event,
          customerNumber: "+14155552671",
        }),
      ),
      context,
    );

    const logs = JSON.stringify(entries);
    expect(logs).toContain(event.callId);
    expect(logs).not.toContain(event.callTranscript);
    expect(logs).not.toContain("+14155552671");
  });

  it("processes duplicate callIds idempotently", async () => {
    const storage = new MemoryStorage();
    const handler = createAtlasCallCompletedHandler(storage, "test-secret");
    await handler(request(JSON.stringify(event)), new InvocationContext());
    await handler(request(JSON.stringify(event)), new InvocationContext());

    expect(storage.states).toHaveLength(1);
    expect(storage.queue).toHaveLength(2);
    await processAtlasCall(storage.queue[0], 1, storage);
    await processAtlasCall(storage.queue[1], 1, storage);
    expect(storage.metadata).toHaveLength(1);
    expect(storage.transcripts).toHaveLength(1);
  });

  it("persists metadata and transcript before completion", async () => {
    const storage = new MemoryStorage();
    const message = await storage.stage(event);
    await storage.recordReceipt(message);
    await processAtlasCall(message, 1, storage);

    expect(storage.metadata.get(event.callId)).toMatchObject({
      status: "Accepted",
      durationSeconds: 42,
    });
    expect(storage.transcripts.get(event.callId)).toBe(event.callTranscript);
    expect(storage.states.get(message.storageKey)).toMatchObject({
      processingState: "completed",
    });
  });

  it("retries safely when metadata succeeds and transcript fails", async () => {
    const storage = new MemoryStorage();
    storage.failTranscript = 1;
    const message = await storage.stage(event);
    await storage.recordReceipt(message);

    await expect(processAtlasCall(message, 1, storage)).rejects.toThrow();
    expect(storage.metadata.has(event.callId)).toBe(true);
    expect(storage.transcripts.has(event.callId)).toBe(false);
    expect(storage.states.get(message.storageKey)).toMatchObject({
      processingState: "failed",
    });

    await expect(
      processAtlasCall(message, 2, storage),
    ).resolves.toBeUndefined();
    expect(storage.transcripts.get(event.callId)).toBe(event.callTranscript);
    expect(storage.states.get(message.storageKey)).toMatchObject({
      processingState: "completed",
    });
  });

  it("retries safely when transcript succeeds and completion update fails", async () => {
    const storage = new MemoryStorage();
    storage.failComplete = 1;
    const message = await storage.stage(event);
    await storage.recordReceipt(message);

    await expect(processAtlasCall(message, 1, storage)).rejects.toThrow();
    expect(storage.transcripts.get(event.callId)).toBe(event.callTranscript);
    expect(storage.states.get(message.storageKey)).toMatchObject({
      processingState: "failed",
    });

    await expect(
      processAtlasCall(message, 2, storage),
    ).resolves.toBeUndefined();
    expect(storage.transcripts).toHaveLength(1);
    expect(storage.states.get(message.storageKey)).toMatchObject({
      processingState: "completed",
    });
  });

  it("leaves failed state after retries are exhausted", async () => {
    const storage = new MemoryStorage();
    storage.failTranscript = 1;
    const message = await storage.stage(event);
    await storage.recordReceipt(message);
    const logs: unknown[][] = [];
    const context = new InvocationContext({
      triggerMetadata: { dequeueCount: 5 },
      logHandler: (_level, ...args) => logs.push(args),
    });
    const handler = createProcessAtlasCallHandler(storage);

    await expect(handler(message, context)).rejects.toThrow(
      "Atlas call processing failed",
    );

    expect(storage.states.get(message.storageKey)).toEqual({
      processingState: "failed",
      attempt: 5,
    });
    expect(JSON.stringify(logs)).not.toContain(event.callTranscript);
  });
});
