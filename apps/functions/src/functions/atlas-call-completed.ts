import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from "@azure/functions";
import { timingSafeEqual } from "node:crypto";
import { acceptAtlasEvents } from "../services/atlas-call-processing";
import {
  getAtlasCallStorage,
  type AtlasCallCompletedEvent,
  type AtlasCallStorage,
} from "../storage/atlas-call-storage";

function secretsMatch(
  received: string | undefined,
  expected: string | undefined,
) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function safeHttpUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

export function extractEvent(
  value: unknown,
): AtlasCallCompletedEvent | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;

  const event = value as Record<string, unknown>;
  if (
    typeof event.callId !== "string" ||
    !event.callId.trim() ||
    event.callId.length > 256
  )
    return undefined;
  if (
    event.callTranscript !== undefined &&
    typeof event.callTranscript !== "string"
  )
    return undefined;

  return {
    callId: event.callId.trim(),
    ...(typeof event.campaignId === "string"
      ? { campaignId: event.campaignId }
      : {}),
    ...(typeof event.customerName === "string"
      ? { customerName: event.customerName }
      : {}),
    ...(typeof event.status === "string" ? { status: event.status } : {}),
    ...(typeof event.endedReason === "string"
      ? { endedReason: event.endedReason }
      : {}),
    ...(typeof event.durationSeconds === "number" &&
    Number.isFinite(event.durationSeconds)
      ? { durationSeconds: event.durationSeconds }
      : {}),
    ...(typeof event.callSummary === "string"
      ? { callSummary: event.callSummary }
      : {}),
    ...(typeof event.startedAt === "string"
      ? { startedAt: event.startedAt }
      : {}),
    ...(typeof event.endedAt === "string" ? { endedAt: event.endedAt } : {}),
    ...(safeHttpUrl(event.audioUrl)
      ? { audioUrl: safeHttpUrl(event.audioUrl) }
      : {}),
    callTranscript:
      typeof event.callTranscript === "string" ? event.callTranscript : "",
  };
}

export function createAtlasCallCompletedHandler(
  storageSource: AtlasCallStorage | (() => AtlasCallStorage),
  webhookSecret: string | undefined,
) {
  return async function atlasCallCompleted(
    request: HttpRequest,
    context: InvocationContext,
  ): Promise<HttpResponseInit> {
    if (!secretsMatch(request.params.secret, webhookSecret)) {
      return { status: 401, jsonBody: { error: "Unauthorized" } };
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return { status: 400, jsonBody: { error: "Invalid request" } };
    }

    const rawEvents = Array.isArray(payload) ? payload : [payload];
    if (rawEvents.length === 0)
      return { status: 400, jsonBody: { error: "Invalid payload" } };

    const events = rawEvents.map(extractEvent);
    if (events.some((event) => event === undefined))
      return { status: 400, jsonBody: { error: "Invalid payload" } };

    try {
      const storage =
        typeof storageSource === "function" ? storageSource() : storageSource;
      await acceptAtlasEvents(events as AtlasCallCompletedEvent[], storage);
    } catch {
      return { status: 503, jsonBody: { error: "Webhook not accepted" } };
    }

    for (const event of events as AtlasCallCompletedEvent[]) {
      context.log("Atlas call_completed durably accepted", {
        callId: event.callId,
      });
    }

    return { status: 200, jsonBody: { received: true } };
  };
}

export async function atlasCallCompleted(
  request: HttpRequest,
  context: InvocationContext,
) {
  return createAtlasCallCompletedHandler(
    getAtlasCallStorage,
    process.env.ATLAS_WEBHOOK_SECRET,
  )(request, context);
}

app.http("atlas-call-completed", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "webhooks/atlas/call-completed/{secret}",
  handler: atlasCallCompleted,
});
