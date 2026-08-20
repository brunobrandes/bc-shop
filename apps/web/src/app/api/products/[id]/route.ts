import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { findProductById } from "@/lib/products/catalog";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { id } = await params;
  const product = findProductById(id);
  return product
    ? NextResponse.json({ data: product })
    : jsonError("PRODUCT_NOT_FOUND", "Product not found", 404);
}
