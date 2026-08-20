import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/firebase/admin";
import { callInsightsRequest } from "./client";

type Authorize = typeof authorizeAdminRequest;
type RequestInsights = typeof callInsightsRequest;

export function createAdminProxyHandler(
  path: (request: Request) => string,
  authorize: Authorize = authorizeAdminRequest,
  requestInsights: RequestInsights = callInsightsRequest,
) {
  return async function GET(request: Request) {
    const authorization = await authorize(request);
    if (!authorization.ok)
      return NextResponse.json(
        {
          error:
            authorization.status === 403
              ? "You do not have access to BC-Shop CallInsights."
              : "Authentication required",
        },
        { status: authorization.status },
      );

    try {
      const response = await requestInsights(path(request));
      return NextResponse.json(response.body, { status: response.status });
    } catch {
      return NextResponse.json(
        { error: "CallInsights is temporarily unavailable" },
        { status: 503 },
      );
    }
  };
}
