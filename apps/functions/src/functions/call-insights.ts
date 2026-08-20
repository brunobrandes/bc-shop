import {
  app,
  type HttpRequest,
  type HttpResponseInit,
  type InvocationContext,
} from "@azure/functions";
import { timingSafeEqual } from "node:crypto";
import {
  getCallInsightsRepository,
  type CallInsightsRepository,
} from "../call-insights/repository";

const DEFAULT_LIMIT = 25;
const MAX_LIMIT = 50;
const MAX_CALL_ID_LENGTH = 256;
const MAX_CURSOR_LENGTH = 2048;

function keysMatch(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

function rangeStart(value: string | null) {
  const days = value === "7d" ? 7 : value === null || value === "30d" ? 30 : 0;
  if (!days) return undefined;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function limitValue(value: string | null) {
  if (value === null) return DEFAULT_LIMIT;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= MAX_LIMIT
    ? parsed
    : undefined;
}

function authorize(request: HttpRequest, expectedKey: string | undefined) {
  return keysMatch(request.headers.get("x-bc-admin-key"), expectedKey);
}

export function createCallInsightsHandlers(
  repositorySource: CallInsightsRepository | (() => CallInsightsRepository),
  adminKey: string | undefined,
) {
  const repository = () =>
    typeof repositorySource === "function"
      ? repositorySource()
      : repositorySource;

  const overview = async (request: HttpRequest): Promise<HttpResponseInit> => {
    if (!authorize(request, adminKey))
      return { status: 401, jsonBody: { error: "Unauthorized" } };
    const since = rangeStart(request.query.get("range"));
    if (!since) return { status: 400, jsonBody: { error: "Invalid range" } };
    try {
      return { status: 200, jsonBody: await repository().overview(since) };
    } catch {
      return { status: 503, jsonBody: { error: "Insights unavailable" } };
    }
  };

  const calls = async (request: HttpRequest): Promise<HttpResponseInit> => {
    if (!authorize(request, adminKey))
      return { status: 401, jsonBody: { error: "Unauthorized" } };
    const since = rangeStart(request.query.get("range"));
    const limit = limitValue(request.query.get("limit"));
    const cursor = request.query.get("cursor") || undefined;
    if (!since || !limit || (cursor && cursor.length > MAX_CURSOR_LENGTH))
      return { status: 400, jsonBody: { error: "Invalid query" } };
    try {
      return {
        status: 200,
        jsonBody: await repository().list(since, limit, cursor),
      };
    } catch {
      return { status: 503, jsonBody: { error: "Insights unavailable" } };
    }
  };

  const detail = async (request: HttpRequest): Promise<HttpResponseInit> => {
    if (!authorize(request, adminKey))
      return { status: 401, jsonBody: { error: "Unauthorized" } };
    const callId = request.params.callId?.trim();
    if (!callId || callId.length > MAX_CALL_ID_LENGTH)
      return { status: 400, jsonBody: { error: "Invalid call" } };
    try {
      const call = await repository().detail(callId);
      return call
        ? { status: 200, jsonBody: call }
        : { status: 404, jsonBody: { error: "Call not found" } };
    } catch {
      return { status: 503, jsonBody: { error: "Insights unavailable" } };
    }
  };

  return { overview, calls, detail };
}

const handlers = createCallInsightsHandlers(
  getCallInsightsRepository,
  process.env.BC_ADMIN_API_KEY,
);

app.http("call-insights-overview", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "internal/call-insights/overview",
  handler: handlers.overview,
});

app.http("call-insights-calls", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "internal/call-insights/calls",
  handler: handlers.calls,
});

app.http("call-insights-call-detail", {
  methods: ["GET"],
  authLevel: "anonymous",
  route: "internal/call-insights/calls/{callId}",
  handler: handlers.detail,
});
