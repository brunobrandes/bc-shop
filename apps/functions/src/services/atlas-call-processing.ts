import type {
  AtlasCallCompletedEvent,
  AtlasCallQueueMessage,
  AtlasCallStorage,
} from "../storage/atlas-call-storage";

export async function acceptAtlasEvents(
  events: AtlasCallCompletedEvent[],
  storage: AtlasCallStorage,
) {
  for (const event of events) {
    const message = await storage.stage(event);
    await storage.recordReceipt(message);
    await storage.enqueue(message);
  }
}

export async function processAtlasCall(
  message: AtlasCallQueueMessage,
  attempt: number,
  storage: AtlasCallStorage,
) {
  if (await storage.isCompleted(message)) return;

  try {
    await storage.markProcessing(message, attempt);
    const event = await storage.load(message);
    await storage.persistMetadata(event);
    await storage.persistTranscript(event);
    await storage.markCompleted(message);
  } catch (error) {
    try {
      await storage.markFailed(message, attempt);
    } catch {
      // Preserve the original error so the queue runtime retries the message.
    }
    throw error;
  }
}
