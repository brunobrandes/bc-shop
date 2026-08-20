import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { atlas } from "@/lib/atlas/client";
import { getAtlasCampaignId } from "@/lib/atlas/config";
import { AtlasError } from "@/lib/atlas/errors";
import {
  buildCustomerInfo,
  type ScheduleCallRequest,
  validateScheduleCall,
} from "@/lib/contact/schedule-call";

export async function POST(request: Request) {
  let body: ScheduleCallRequest;
  try {
    body = (await request.json()) as ScheduleCallRequest;
  } catch {
    return jsonError("INVALID_REQUEST", "Invalid request.", 400);
  }

  const validation = validateScheduleCall(body);
  if (!validation.success)
    return jsonError("VALIDATION_ERROR", validation.message, 400);

  try {
    const result = await atlas.scheduleCall({
      campaignId: getAtlasCampaignId(),
      customerPhoneNumber: validation.data.phone,
      customerName: validation.data.name,
      customerInfo: buildCustomerInfo(
        validation.data.country,
        validation.data.currency,
        validation.data.reason,
        validation.data.message,
      ),
      // Already an absolute UTC instant; do not apply the Atlas campaign timezone.
      ...(validation.data.scheduledDate
        ? { scheduledDate: validation.data.scheduledDate }
        : {}),
    });

    return NextResponse.json({
      data: {
        accepted: true,
        ...(typeof result.sequenceNumber === "number"
          ? { sequenceNumber: result.sequenceNumber }
          : {}),
      },
    });
  } catch (error) {
    if (error instanceof AtlasError && error.code === "CONFIGURATION")
      return jsonError(
        "SERVICE_NOT_CONFIGURED",
        "Calls are not available yet.",
        503,
      );
    return jsonError(
      "CALL_REQUEST_FAILED",
      "We could not request the call. Please try again.",
      502,
    );
  }
}
