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
  options?: unknown[] | null;
  validation_rules?: Record<string, unknown> | null;
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

export type SubmissionFormOperation = "idle" | "saving" | "submitting";

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
      message: string;
    }
  | {
      kind: "ready";
      template: SubmissionTemplate;
      process: ProcessInstance;
      form: SubmissionForm;
    };

export type SubmissionFieldInputValue = string | boolean;

export type SubmissionFieldInputs = Record<
  string,
  SubmissionFieldInputValue
>;

export type SubmissionTemplateCardProps = {
  template: SubmissionTemplate;
  isCreating: boolean;
  isCreationLocked: boolean;
  onSelect: (template: SubmissionTemplate) => void;
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
  onSubmitted: () => void;
};

export type SubmissionDraftCardProps = {
  draft: ProcessInstance;
  templateName: string;
  isOpening: boolean;
  isOpeningLocked: boolean;
  onOpen: (draft: ProcessInstance) => void;
  onDelete: (draft: ProcessInstance) => void;
};

export type SubmittedSubmissionCardProps = {
  submission: ProcessInstance;
  templateName: string;
};

export type SubmissionDeleteDialogProps = {
  draft: ProcessInstance;
  onClose: () => void;
  onDeleted: (draftId: string) => void;
};

export type DynamicFormFieldControlProps = {
  field: DynamicFormField;
  value: SubmissionFieldInputValue | undefined;
  disabled: boolean;
  onChange: (value: SubmissionFieldInputValue) => void;
};

export type SubmissionDialogContentProps = {
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
