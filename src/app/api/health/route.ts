import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "bc-shop",
    timestamp: new Date().toISOString(),
  });
}
