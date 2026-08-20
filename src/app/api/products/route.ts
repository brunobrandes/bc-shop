import { NextResponse } from "next/server";
import { listProducts } from "@/lib/products/catalog";

export function GET() {
  return NextResponse.json({ data: listProducts() });
}
