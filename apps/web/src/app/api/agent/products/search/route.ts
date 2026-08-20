import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import {
  searchProducts,
  type ProductSearchFilters,
} from "@/lib/products/catalog";
import { productCategories, type ProductCategory } from "@/types/product";

const MAX_QUERY_LENGTH = 100;

function keysMatch(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
}

function parseFilters(body: unknown): ProductSearchFilters | undefined {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return undefined;
  const parameters = (body as Record<string, unknown>).parameters;
  if (parameters === undefined) return {};
  if (
    !parameters ||
    typeof parameters !== "object" ||
    Array.isArray(parameters)
  )
    return undefined;

  const { query, category, maxPrice } = parameters as Record<string, unknown>;
  if (
    query !== undefined &&
    (typeof query !== "string" || query.trim().length > MAX_QUERY_LENGTH)
  )
    return undefined;
  if (
    category !== undefined &&
    (typeof category !== "string" ||
      !productCategories.includes(category as ProductCategory))
  )
    return undefined;
  if (
    maxPrice !== undefined &&
    (typeof maxPrice !== "number" ||
      !Number.isFinite(maxPrice) ||
      maxPrice < 0 ||
      maxPrice > 1_000_000)
  )
    return undefined;

  return {
    ...(typeof query === "string" && query.trim()
      ? { query: query.trim() }
      : {}),
    ...(typeof category === "string"
      ? { category: category as ProductCategory }
      : {}),
    ...(typeof maxPrice === "number" ? { maxPrice } : {}),
  };
}

export async function POST(request: Request) {
  if (
    !keysMatch(
      request.headers.get("x-bc-agent-key"),
      process.env.BC_AGENT_API_KEY,
    )
  )
    return jsonError("UNAUTHORIZED", "Unauthorized", 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("INVALID_REQUEST", "Invalid request", 400);
  }

  const filters = parseFilters(body);
  if (!filters)
    return jsonError("INVALID_PARAMETERS", "Invalid parameters", 400);

  const products = searchProducts(filters).map((product) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    price: product.price,
    shortDescription: product.shortDescription,
    specs: product.specs,
  }));

  return NextResponse.json({ count: products.length, products });
}
