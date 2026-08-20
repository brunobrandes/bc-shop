import { app, type InvocationContext } from "@azure/functions";
import { processAtlasCall } from "../services/atlas-call-processing";
import {
  getAtlasCallStorage,
  type AtlasCallQueueMessage,
  type AtlasCallStorage,
} from "../storage/atlas-call-storage";

function parseMessage(value: unknown): AtlasCallQueueMessage {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
    throw new Error("Invalid queue message");
  const message = parsed as Record<string, unknown>;
  if (
    typeof message.callId !== "string" ||
    typeof message.storageKey !== "string"
  )
    throw new Error("Invalid queue message");
  return { callId: message.callId, storageKey: message.storageKey };
}

export function createProcessAtlasCallHandler(storage: AtlasCallStorage) {
  return async function processAtlasCallCompleted(
    queueEntry: unknown,
    context: InvocationContext,
  ) {
    const message = parseMessage(queueEntry);
    const dequeueCount = Number(context.triggerMetadata?.dequeueCount ?? 1);
    const attempt = Number.isFinite(dequeueCount) ? dequeueCount : 1;

    try {
      await processAtlasCall(message, attempt, storage);
      context.log("Atlas call_completed processing finished", {
        callId: message.callId,
      });
    } catch {
      context.error("Atlas call_completed processing failed", {
        callId: message.callId,
        attempt,
      });
      throw new Error("Atlas call processing failed");
    }
  };
}

export async function processAtlasCallCompleted(
  queueEntry: unknown,
  context: InvocationContext,
) {
  return createProcessAtlasCallHandler(getAtlasCallStorage())(
    queueEntry,
    context,
  );
}

app.storageQueue("process-atlas-call-completed", {
  queueName: "%ATLAS_PROCESSING_QUEUE%",
  connection: "AzureWebJobsStorage",
  handler: processAtlasCallCompleted,
});
