import "server-only";
import { getAtlasConfig, type AtlasConfig } from "./config";
import { AtlasError } from "./errors";
import type {
  InitiateWebChatInput,
  InitiateWebChatResponse,
  ScheduleCallInput,
  ScheduleCallResponse,
} from "./types";

type Fetch = typeof fetch;
type ClientOptions = {
  config?: AtlasConfig;
  fetch?: Fetch;
  timeoutMs?: number;
};

export class AtlasClient {
  private readonly config: AtlasConfig;
  private readonly fetcher: Fetch;
  private readonly timeoutMs: number;

  constructor(options: ClientOptions = {}) {
    this.config = options.config ?? getAtlasConfig();
    this.fetcher = options.fetch ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 10_000;
  }

  async initiateWebChat(
    input: InitiateWebChatInput,
  ): Promise<InitiateWebChatResponse> {
    if (!input.campaignId.trim())
      throw new AtlasError("CONFIGURATION", "Atlas campaign is not configured");
    return this.request(
      `/campaign-chat/${encodeURIComponent(input.campaignId)}`,
      {
        message: input.message,
        contactIdentifier: input.contactIdentifier,
      },
    );
  }

  async scheduleCall(input: ScheduleCallInput): Promise<ScheduleCallResponse> {
    return this.request("/campaign/createSchedule", input);
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(`${this.config.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "api-key": this.config.apiKey,
          "content-type": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok)
        throw new AtlasError(
          "UPSTREAM",
          "Atlas request failed",
          response.status,
        );
      try {
        return (await response.json()) as T;
      } catch (cause) {
        throw new AtlasError(
          "INVALID_RESPONSE",
          "Atlas returned an invalid response",
          response.status,
          { cause },
        );
      }
    } catch (cause) {
      if (cause instanceof AtlasError) throw cause;
      if (cause instanceof Error && cause.name === "AbortError")
        throw new AtlasError("TIMEOUT", "Atlas request timed out", undefined, {
          cause,
        });
      throw new AtlasError(
        "NETWORK",
        "Atlas is temporarily unavailable",
        undefined,
        { cause },
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const atlas = {
  initiateWebChat: (input: InitiateWebChatInput) =>
    new AtlasClient().initiateWebChat(input),
  scheduleCall: (input: ScheduleCallInput) =>
    new AtlasClient().scheduleCall(input),
};
