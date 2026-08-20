export type CallProcessingStatus =
  "received" | "processing" | "completed" | "failed";

export type CallInsight = {
  callId: string;
  campaignId?: string;
  customerName?: string;
  status?: string;
  endedReason?: string;
  durationSeconds?: number;
  callSummary?: string;
  startedAt?: string;
  endedAt?: string;
  receivedAt?: string;
  processingStatus: CallProcessingStatus;
  audioUrl?: string;
  hasTranscript: boolean;
};

export type CallInsightDetail = CallInsight & { transcript?: string };

export type CallInsightsOverview = {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  averageDurationSeconds: number;
  recentCalls: CallInsight[];
};

export type CallInsightsPage = {
  calls: CallInsight[];
  nextCursor?: string;
};
