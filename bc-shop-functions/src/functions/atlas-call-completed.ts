import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from "@azure/functions";
import { timingSafeEqual } from "node:crypto";

type AtlasCallCompletedLog = {
  callId: string;
  status?: string;
  endedReason?: string;
  durationSeconds?: number;
  callSummary?: string;
};

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

function extractEvent(value: unknown): AtlasCallCompletedLog | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return undefined;

  const event = value as Record<string, unknown>;
  if (typeof event.callId !== "string" || !event.callId.trim())
    return undefined;

  return {
    callId: event.callId,
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
  };
}

export async function atlasCallCompleted(
  request: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  if (!secretsMatch(request.params.secret, process.env.ATLAS_WEBHOOK_SECRET)) {
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

  for (const event of events as AtlasCallCompletedLog[]) {
    context.log("Atlas call_completed received", event);
  }

  return { status: 200, jsonBody: { received: true } };
}

app.http("atlas-call-completed", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "webhooks/atlas/call-completed/{secret}",
  handler: atlasCallCompleted,
});
