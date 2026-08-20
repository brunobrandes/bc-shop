export type InitiateWebChatInput = {
  campaignId: string;
  message: string;
  contactIdentifier: string;
};

// The documented success body is an empty object; preserve it without invented fields.
export type InitiateWebChatResponse = Record<string, never>;

export type ScheduleCallInput = {
  campaignId: string;
  customerPhoneNumber: string;
  customerName: string;
  customerInfo: string;
  scheduledDate?: string;
};

export type ScheduleCallResponse = {
  sequenceNumber?: number;
};
