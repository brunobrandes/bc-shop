import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { findProductById, listProducts } from "@/lib/products/catalog";
import { POST } from "./route";

const configuredKey = "test-agent-key";
const previousKey = process.env.BC_AGENT_API_KEY;

function request(body: unknown, key?: string) {
  const headers = new Headers({ "content-type": "application/json" });
  if (key) headers.set("x-bc-agent-key", key);
  return new Request("http://localhost/api/agent/products/search", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/agent/products/search", () => {
  beforeAll(() => {
    process.env.BC_AGENT_API_KEY = configuredKey;
  });
  afterAll(() => {
    if (previousKey === undefined) delete process.env.BC_AGENT_API_KEY;
    else process.env.BC_AGENT_API_KEY = previousKey;
  });

  it("rejects a missing agent key", async () => {
    const response = await POST(request({}));
    expect(response.status).toBe(401);
  });

  it("rejects an invalid agent key without exposing secrets", async () => {
    const response = await POST(request({}, "wrong-key"));
    expect(response.status).toBe(401);
    const body = JSON.stringify(await response.json());
    expect(body).not.toContain(configuredKey);
    expect(body).not.toContain("wrong-key");
  });

  it("accepts a valid key and returns the canonical catalog projection", async () => {
    const response = await POST(request({}, configuredKey));
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      count: number;
      products: Array<Record<string, unknown>>;
    };
    expect(body.count).toBe(listProducts().length);
    expect(body.products[0]).toMatchObject({
      id: listProducts()[0].id,
      price: listProducts()[0].price,
    });
    expect(body.products[0]).not.toHaveProperty("slug");
    expect(body.products[0]).not.toHaveProperty("featured");
  });

  it("filters by query across relevant product fields", async () => {
    const response = await POST(
      request({ parameters: { query: "RTX 4070" } }, configuredKey),
    );
    await expect(response.json()).resolves.toMatchObject({
      count: 1,
      products: [{ id: "bc-creator-pro" }],
    });
  });

  it("filters by category", async () => {
    const response = await POST(
      request({ parameters: { category: "gaming" } }, configuredKey),
    );
    await expect(response.json()).resolves.toMatchObject({
      count: 1,
      products: [{ id: "bc-gamer-x" }],
    });
  });

  it("filters by canonical BRL maxPrice", async () => {
    const response = await POST(
      request({ parameters: { maxPrice: 3000 } }, configuredKey),
    );
    const body = (await response.json()) as {
      count: number;
      products: Array<{ price: { amount: number; currency: string } }>;
    };
    expect(body.count).toBeGreaterThan(0);
    expect(body.products.every((product) => product.price.amount <= 3000)).toBe(
      true,
    );
    expect(
      body.products.every((product) => product.price.currency === "BRL"),
    ).toBe(true);
  });

  it("returns an empty successful result when nothing matches", async () => {
    const response = await POST(
      request({ parameters: { query: "does-not-exist" } }, configuredKey),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ count: 0, products: [] });
  });

  it("reuses exact canonical product values", async () => {
    const canonical = findProductById("bc-office-pro");
    const response = await POST(
      request({ parameters: { query: "BC Office Pro" } }, configuredKey),
    );
    const body = (await response.json()) as {
      products: Array<Record<string, unknown>>;
    };
    expect(body.products[0]).toMatchObject({
      id: canonical?.id,
      shortDescription: canonical?.shortDescription,
      specs: canonical?.specs,
      price: canonical?.price,
    });
  });

  it("does not use or return language context", async () => {
    const response = await POST(
      request(
        {
          language: "pt",
          locale: "pt-BR",
          parameters: { query: "BC Office Pro", language: "pt" },
        },
        configuredKey,
      ),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(JSON.stringify(body)).not.toMatch(/language|locale/i);
  });
});
