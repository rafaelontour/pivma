import type { ProcessInstance } from "./Processo";

export type SubmissionTemplate = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  is_active: boolean;
};

export type DynamicFormValue = string | number | boolean | null;

export type DynamicFormOptionValue = string | number | boolean;

export type DynamicFormOption = {
  value: DynamicFormOptionValue;
  label: string;
};

export type DynamicFormField = {
  field_key: string;
  label: string;
  help_text?: string | null;
  field_type: string;
  is_required: boolean;
  order_index: number;
  section?: string | null;
  options?: unknown[] | null;
  validation_rules?: Record<string, unknown> | null;
  ai_evaluation_enabled?: boolean;
  attachment?: SubmissionAttachment | null;
};

export type SubmissionAttachment = {
  artifact_id: string;
  filename: string;
  size: number;
  mime_type?: string | null;
  extension: string;
  checksum_sha256: string;
  uploaded_at: string;
};

export type SubmissionAttachmentUploadResult = {
  field_key: string;
  attachment: SubmissionAttachment;
  replaced_previous: boolean;
};

export type SubmissionAttachmentRemovedResult = {
  field_key: string;
  removed: boolean;
};

export type SubmissionAttachmentDownload = {
  data: ArrayBuffer;
  contentType: string;
  contentDisposition: string | null;
};

export type PreEvaluationSummary = {
  total: number;
  compliant: number;
  non_compliant: number;
  partial: number;
  indeterminate: number;
};

export type PreEvaluationAttentionPoint = {
  item_id: string;
  criterion_id?: string | null;
  criterion_statement: string;
  check_type: string;
  severity: string;
  conclusion: string;
  is_alert: boolean;
  evidence_excerpt?: string | null;
  evidence_location?: string | null;
  justification?: string | null;
  recommendation?: string | null;
  inference_confidence?: number | null;
  evidence_completeness?: string | null;
  references?: Record<string, unknown>[];
};

export type PreEvaluationVersionUsed = {
  definition_name: string;
  version_number: number;
  references?: Record<string, unknown>[];
};

export type PreEvaluationContentField = {
  field_key: string;
  label: string;
  value?: unknown;
};

export type SubmissionPreEvaluation = {
  run_id: string;
  correlation_id: string;
  status: string;
  consolidated_result?: "positive" | "negative" | null;
  provider?: string | null;
  models_used?: Record<string, unknown>;
  real_cost: number;
  started_at: string;
  finished_at?: string | null;
  error_summary?: string | null;
  summary: PreEvaluationSummary;
  attention_points?: PreEvaluationAttentionPoint[];
  evaluations?: PreEvaluationVersionUsed[];
  evaluated_content?: PreEvaluationContentField[];
  direct_review_request?: Record<string, unknown> | null;
};

export type DirectReviewInput = {
  justification?: string | null;
};

export type DirectReviewResult = {
  process_status: string;
  direct_review_request_id: string;
};

export type DynamicFormReview = {
  status: string;
  comments?: string | null;
  reviewed_at?: string | null;
};

export type SubmissionForm = {
  form_instance_id: string;
  template_key: string;
  is_submitted: boolean;
  fields: DynamicFormField[];
  values: Record<string, unknown>;
  reviews: Record<string, DynamicFormReview>;
};

export type CreateSubmissionDraftInput = {
  templateKey: string;
  title: string;
};

export type CreateProcessDraftInput = {
  templateKey: string;
  title: string;
};

export type SaveSubmissionDraftInput = {
  values: Record<string, DynamicFormValue>;
};

export type SaveSubmissionDraftResult = {
  message: string;
  form_instance_id: string;
};

export type SubmitSubmissionResult = {
  activity_key: string;
  run_number: number;
  status: string;
  artifact_id?: string | null;
};

export type SubmissionAcceptedEvent = {
  processId: string;
  process: ProcessInstance | null;
};

export type SubmissionFormOperation = "idle" | "saving" | "submitting";

export type SubmissionFormViewMode = "draft" | "submitted";

export type SubmissionCatalogState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; templates: SubmissionTemplate[] };

export type SubmissionDraftsState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; drafts: ProcessInstance[] };

export type SubmittedSubmissionsState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; submissions: ProcessInstance[] };

export type SubmissionTab = "drafts" | "submitted" | "templates";

export type SubmissionDialogState =
  | { kind: "closed" }
  | {
      kind: "error";
      template: SubmissionTemplate;
      process: ProcessInstance;
      viewMode: SubmissionFormViewMode;
      message: string;
    }
  | {
      kind: "ready";
      template: SubmissionTemplate;
      process: ProcessInstance;
      viewMode: SubmissionFormViewMode;
      form: SubmissionForm;
    };

export type SubmissionFieldInputValue = string | boolean;

export type SubmissionFieldInputs = Record<
  string,
  SubmissionFieldInputValue
>;

export type SubmissionAttachments = Record<
  string,
  SubmissionAttachment | null
>;

export type SubmissionFormSection = {
  key: string;
  name: string;
  fields: DynamicFormField[];
};

export type DynamicFormValidationMode = "partial" | "complete";

export type DynamicFormValidationErrors = Record<string, string>;

export type SubmissionTemplateCardProps = {
  template: SubmissionTemplate;
  isCreating: boolean;
  isCreationLocked: boolean;
  onSelect: (template: SubmissionTemplate) => void;
};

export type SubmissionIdentificationDialogProps = {
  template: SubmissionTemplate;
  title: string;
  isCreating: boolean;
  onTitleChange: (title: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export type SubmissionCatalogMessageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type SubmissionFormDialogProps = {
  state: Exclude<SubmissionDialogState, { kind: "closed" }>;
  onClose: () => void;
  onRetry: () => void;
  onSaved: () => void;
  onSubmitted: (event: SubmissionAcceptedEvent) => void;
};

export type SubmissionDraftCardProps = {
  draft: ProcessInstance;
  templateName: string;
  isOpening: boolean;
  isOpeningLocked: boolean;
  onOpen: (draft: ProcessInstance) => void;
};

export type SubmittedSubmissionCardProps = {
  submission: ProcessInstance;
  templateName: string;
  onProcessChanged: () => void;
};

export type DynamicFormFieldControlProps = {
  field: DynamicFormField;
  value: SubmissionFieldInputValue | undefined;
  error?: string;
  attachment?: SubmissionAttachment | null;
  disabled: boolean;
  onChange: (value: SubmissionFieldInputValue) => void;
  onAttachmentChange?: (attachment: SubmissionAttachment | null) => void;
  processId?: string;
};

export type DynamicFormFieldValueProps = {
  field: DynamicFormField;
  value: unknown;
};

export type DynamicFormFieldLabelProps = {
  field: DynamicFormField;
  fieldId: string;
};

export type DynamicFormFieldHelpProps = {
  field: DynamicFormField;
  helpId: string | undefined;
};

export type DynamicFormFieldErrorProps = {
  error: string | undefined;
  errorId: string | undefined;
};

export type DynamicFormValidationResult = {
  valid: boolean;
  errors: DynamicFormValidationErrors;
  firstFieldKey: string | null;
};

export type SubmissionDialogContentProps = {
  processId: string;
  form: SubmissionForm;
  inputs: SubmissionFieldInputs;
  operation: SubmissionFormOperation;
  onFieldChange: (
    fieldKey: string,
    value: SubmissionFieldInputValue,
  ) => void;
  onSave: () => void;
  onSubmit: () => void;
};

export type SubmissionTrackingCardProps = {
  submission: ProcessInstance;
  templateName: string;
  isOpening: boolean;
  isOpeningLocked: boolean;
  onOpen: (submission: ProcessInstance) => void;
  onProcessChanged: () => void;
};

export type SubmissionPreEvaluationPanelProps = {
  evaluation: SubmissionPreEvaluation;
  compact?: boolean;
};

export type DirectReviewDialogProps = {
  process: ProcessInstance;
  isOpen: boolean;
  onClose: () => void;
  onConfirmed: () => void;
};
