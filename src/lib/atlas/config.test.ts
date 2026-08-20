import { describe, expect, it } from "vitest";
import { DEFAULT_ATLAS_BASE_URL, getAtlasConfig } from "./config";

describe("Atlas configuration", () => {
  it("requires an API key at the integration boundary", () =>
    expect(() => getAtlasConfig({})).toThrow("Atlas is not configured"));
  it("uses the official default base URL", () =>
    expect(getAtlasConfig({ ATLAS_API_KEY: "test" }).baseUrl).toBe(
      DEFAULT_ATLAS_BASE_URL,
    ));
  it("rejects non-HTTPS base URLs", () =>
    expect(() =>
      getAtlasConfig({
        ATLAS_API_KEY: "test",
        ATLAS_BASE_URL: "http://example.com",
      }),
    ).toThrow("must use HTTPS"));
});
