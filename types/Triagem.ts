import type { ProcessInstance } from "./Processo";
import type { SubmissionForm, SubmissionPreEvaluation } from "./Submissao";

export type TriageFieldReviewStatus = "APPROVED" | "NEEDS_REVISION" | "REJECTED";
export type TriageFeedbackVerdict = "agree" | "disagree" | "inconclusive";
export type TriageDecisionOutcome = "APPROVED" | "NEEDS_REVISION" | "REJECTED";

export type TriageFieldReviewInput = {
  field_key: string;
  status: TriageFieldReviewStatus;
  comments?: string | null;
};

export type SaveTriageFieldReviewsInput = { reviews: TriageFieldReviewInput[] };
export type SaveTriageFieldReviewsResult = Record<string, unknown>;

export type TriageFeedbackItemInput = {
  item_id: string;
  verdict: TriageFeedbackVerdict;
  reason?: string | null;
};

export type SaveTriageFeedbackInput = { items: TriageFeedbackItemInput[] };
export type SaveTriageFeedbackResult = { recorded: number };

export type TriageDecisionInput = {
  outcome: TriageDecisionOutcome;
  justification: string;
};

export type TriageDecisionResult = {
  process_id: string;
  new_process_status: string;
  decision_id: string;
  outcome: string;
  next_activity_run?: number | null;
};

export type TriageTimelineEvent = {
  id: string;
  event_type: string;
  user_id?: string | null;
  activity_run_id?: string | null;
  occurred_at: string;
  context_data?: Record<string, unknown> | null;
};

export type TriageTimeline = {
  process_id: string;
  code: string;
  events: TriageTimelineEvent[];
};

export type TriageSnapshot = {
  process: ProcessInstance;
  form: SubmissionForm;
  preEvaluation: SubmissionPreEvaluation | null;
  timeline: TriageTimeline;
};

export type TriageQueueState =
  | { kind: "loading" }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string }
  | { kind: "ready"; processes: ProcessInstance[] };

export type TriageWorkspaceState =
  | { kind: "closed" }
  | { kind: "loading"; process: ProcessInstance }
  | { kind: "error"; process: ProcessInstance; message: string }
  | {
      kind: "ready";
      snapshot: TriageSnapshot;
      reviews: Record<string, TriageFieldReviewInput>;
      feedback: Record<string, TriageFeedbackItemInput>;
      isSavingReviews: boolean;
      isSavingFeedback: boolean;
      isDeciding: boolean;
    };

export type TriageQueueCardProps = {
  process: ProcessInstance;
  selected: boolean;
  onSelect: (process: ProcessInstance) => void;
};

export type TriageReviewPanelProps = {
  state: Exclude<TriageWorkspaceState, { kind: "closed" }>;
  onRetry: () => void;
  onReviewChange: (fieldKey: string, status: TriageFieldReviewStatus, comments: string) => void;
  onFeedbackChange: (itemId: string, verdict: TriageFeedbackVerdict, reason: string) => void;
  onSaveReviews: () => void;
  onSaveFeedback: () => void;
  onDecision: (input: TriageDecisionInput) => Promise<boolean>;
};

export type TriageFieldCardProps = {
  field: SubmissionForm["fields"][number];
  value: unknown;
  review: TriageFieldReviewInput | undefined;
  disabled: boolean;
  onChange: (status: TriageFieldReviewStatus, comments: string) => void;
};

export type TriageAiReportProps = {
  evaluation: SubmissionPreEvaluation | null;
  feedback: Record<string, TriageFeedbackItemInput>;
  disabled: boolean;
  onChange: (itemId: string, verdict: TriageFeedbackVerdict, reason: string) => void;
};

export type TriageDecisionDialogProps = {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: TriageDecisionInput) => Promise<boolean>;
};

export type TriageLoadingProps = {
  label: string;
};

export type TriageMessageProps = {
  message: string;
  action?: () => void;
};
