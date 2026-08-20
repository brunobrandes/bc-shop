import { HttpRequest } from "@azure/functions";
import { describe, expect, it } from "vitest";
import type {
  CallInsightDetail,
  CallInsightsOverview,
  CallInsightsPage,
} from "./call-insights/contracts";
import type { CallInsightsRepository } from "./call-insights/repository";
import {
  DefaultCallInsightsRepository,
  type CallEntity,
  type CallInsightsDataSource,
} from "./call-insights/repository";
import { createCallInsightsHandlers } from "./functions/call-insights";

const call: CallInsightDetail = {
  callId: "call-001",
  customerName: "Alex Morgan",
  status: "completed",
  durationSeconds: 120,
  callSummary: "Asked about a workstation.",
  receivedAt: "2026-08-20T15:00:00.000Z",
  processingStatus: "completed",
  hasTranscript: true,
  transcript: "Customer: I need a workstation.",
};

class MemoryRepository implements CallInsightsRepository {
  overviewValue: CallInsightsOverview = {
    totalCalls: 3,
    completedCalls: 2,
    failedCalls: 1,
    averageDurationSeconds: 90,
    recentCalls: [call],
  };
  pageValue: CallInsightsPage = {
    calls: [call],
    nextCursor: "next-page",
  };
  detailValue: CallInsightDetail | undefined = call;
  receivedLimit?: number;
  receivedCursor?: string;
  receivedSince?: Date;

  async overview(since: Date) {
    this.receivedSince = since;
    return this.overviewValue;
  }

  async list(since: Date, limit: number, cursor?: string) {
    this.receivedSince = since;
    this.receivedLimit = limit;
    this.receivedCursor = cursor;
    return this.pageValue;
  }

  async detail() {
    return this.detailValue;
  }
}

class MemoryDataSource implements CallInsightsDataSource {
  entities: CallEntity[] = [];
  nextCursor?: string;
  transcriptValue?: string;
  receivedLimit?: number;
  receivedCursor?: string;

  async *scan() {
    yield* this.entities;
  }

  async page(_since: Date, limit: number, cursor?: string) {
    this.receivedLimit = limit;
    this.receivedCursor = cursor;
    return {
      entities: this.entities.slice(0, limit),
      ...(this.nextCursor ? { nextCursor: this.nextCursor } : {}),
    };
  }

  async get() {
    return this.entities[0];
  }

  async transcript() {
    return this.transcriptValue;
  }
}

function request(
  path: string,
  key?: string,
  params: Record<string, string> = {},
) {
  return new HttpRequest({
    method: "GET",
    url: `https://example.test/api/internal/call-insights/${path}`,
    headers: key ? { "x-bc-admin-key": key } : undefined,
    params,
  });
}

describe("CallInsights internal API", () => {
  it("rejects a missing key", async () => {
    const handlers = createCallInsightsHandlers(
      new MemoryRepository(),
      "admin-key",
    );
    expect((await handlers.overview(request("overview"))).status).toBe(401);
  });

  it("rejects an invalid key", async () => {
    const handlers = createCallInsightsHandlers(
      new MemoryRepository(),
      "admin-key",
    );
    expect(
      (await handlers.overview(request("overview", "invalid"))).status,
    ).toBe(401);
  });

  it("returns overview metrics for a valid key", async () => {
    const handlers = createCallInsightsHandlers(
      new MemoryRepository(),
      "admin-key",
    );
    const response = await handlers.overview(
      request("overview?range=30d", "admin-key"),
    );
    expect(response).toMatchObject({
      status: 200,
      jsonBody: {
        totalCalls: 3,
        completedCalls: 2,
        failedCalls: 1,
        averageDurationSeconds: 90,
      },
    });
  });

  it("bounds call listing and forwards pagination", async () => {
    const repository = new MemoryRepository();
    const handlers = createCallInsightsHandlers(repository, "admin-key");
    const response = await handlers.calls(
      request("calls?range=7d&limit=25&cursor=current", "admin-key"),
    );
    expect(response.status).toBe(200);
    expect(repository.receivedLimit).toBe(25);
    expect(repository.receivedCursor).toBe("current");
    expect(repository.receivedSince).toBeInstanceOf(Date);
  });

  it("rejects an unbounded list limit", async () => {
    const handlers = createCallInsightsHandlers(
      new MemoryRepository(),
      "admin-key",
    );
    expect(
      (await handlers.calls(request("calls?range=30d&limit=500", "admin-key")))
        .status,
    ).toBe(400);
  });

  it("returns call detail with transcript", async () => {
    const handlers = createCallInsightsHandlers(
      new MemoryRepository(),
      "admin-key",
    );
    const response = await handlers.detail(
      request("calls/call-001", "admin-key", { callId: "call-001" }),
    );
    expect(response).toMatchObject({
      status: 200,
      jsonBody: { callId: "call-001", transcript: call.transcript },
    });
  });

  it("returns a call without transcript", async () => {
    const repository = new MemoryRepository();
    repository.detailValue = {
      ...call,
      hasTranscript: false,
      transcript: undefined,
    };
    const handlers = createCallInsightsHandlers(repository, "admin-key");
    const response = await handlers.detail(
      request("calls/call-001", "admin-key", { callId: "call-001" }),
    );
    expect(response).toMatchObject({
      status: 200,
      jsonBody: { hasTranscript: false },
    });
  });

  it("returns 404 for an unknown call", async () => {
    const repository = new MemoryRepository();
    repository.detailValue = undefined;
    const handlers = createCallInsightsHandlers(repository, "admin-key");
    expect(
      (
        await handlers.detail(
          request("calls/missing", "admin-key", { callId: "missing" }),
        )
      ).status,
    ).toBe(404);
  });

  it("does not return storage credentials or the admin key", async () => {
    const handlers = createCallInsightsHandlers(
      new MemoryRepository(),
      "highly-sensitive-admin-key",
    );
    const response = await handlers.detail(
      request("calls/call-001", "highly-sensitive-admin-key", {
        callId: "call-001",
      }),
    );
    const body = JSON.stringify(response.jsonBody);
    expect(body).not.toContain("highly-sensitive-admin-key");
    expect(body).not.toContain("AccountKey");
    expect(body).not.toContain("rowKey");
  });
});

describe("CallInsights repository", () => {
  const completed: CallEntity = {
    callId: "call-completed",
    processingState: "completed",
    durationSeconds: 120,
    receivedAt: "2026-08-20T12:00:00.000Z",
    transcriptBlob: "call-completed.txt",
  };

  it("calculates factual overview metrics", async () => {
    const source = new MemoryDataSource();
    source.entities = [
      completed,
      {
        callId: "call-failed",
        processingState: "failed",
        durationSeconds: 60,
        receivedAt: "2026-08-20T13:00:00.000Z",
      },
    ];
    const overview = await new DefaultCallInsightsRepository(source).overview(
      new Date("2026-07-20T00:00:00.000Z"),
    );
    expect(overview).toMatchObject({
      totalCalls: 2,
      completedCalls: 1,
      failedCalls: 1,
      averageDurationSeconds: 90,
    });
    expect(overview.recentCalls[0].callId).toBe("call-failed");
  });

  it("uses bounded page size and continuation cursor", async () => {
    const source = new MemoryDataSource();
    source.entities = [completed];
    source.nextCursor = "next";
    const page = await new DefaultCallInsightsRepository(source).list(
      new Date(),
      25,
      "current",
    );
    expect(source.receivedLimit).toBe(25);
    expect(source.receivedCursor).toBe("current");
    expect(page.nextCursor).toBe("next");
  });

  it("loads transcript only for call detail", async () => {
    const source = new MemoryDataSource();
    source.entities = [completed];
    source.transcriptValue = "Full private transcript";
    const repository = new DefaultCallInsightsRepository(source);
    const detail = await repository.detail("call-completed");
    expect(detail?.transcript).toBe("Full private transcript");
    expect((await repository.list(new Date(), 25)).calls[0]).not.toHaveProperty(
      "transcript",
    );
  });

  it("handles a missing transcript blob safely", async () => {
    const source = new MemoryDataSource();
    source.entities = [completed];
    const detail = await new DefaultCallInsightsRepository(source).detail(
      "call-completed",
    );
    expect(detail).toMatchObject({ hasTranscript: false });
    expect(detail).not.toHaveProperty("transcript");
  });
});
