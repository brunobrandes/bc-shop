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
    return jsonError("INVALID_REQUEST", "Dados inválidos.", 400);
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
        validation.data.reason,
        validation.data.message,
        validation.data.locale,
        validation.data.currency,
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
    const english = body.locale === "en";
    if (error instanceof AtlasError && error.code === "CONFIGURATION")
      return jsonError(
        "SERVICE_NOT_CONFIGURED",
        english
          ? "Calls are not available yet."
          : "As ligações ainda não estão disponíveis.",
        503,
      );
    return jsonError(
      "CALL_REQUEST_FAILED",
      english
        ? "We could not request the call. Please try again."
        : "Não foi possível solicitar a ligação. Tente novamente.",
      502,
    );
  }
}
