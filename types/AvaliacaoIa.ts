import type { ReactNode } from "react";

export type AiEvaluationMode = "simple" | "advanced";

export type AiEvaluationTargetType =
  | "field"
  | "field_set"
  | "document"
  | "form"
  | "process";

export type AiCriterionCheckType =
  | "presence"
  | "conformity"
  | "quality"
  | "comparison"
  | "cross_field_consistency";

export type AiCriterionPolarity = "positive" | "negative" | "consistency";

export type AiCriterionSeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type AiCriterionMissingInfoBehavior =
  | "non_compliant"
  | "indeterminate";

export type AiEvaluationConsolidatedResult = "positive" | "negative";

export type AiEvaluationReference = Record<string, unknown>;

export type AiCriterionInput = {
  id?: string | null;
  order_index?: number;
  statement: string;
  check_type: AiCriterionCheckType;
  polarity?: AiCriterionPolarity;
  required_evidence?: string | null;
  severity?: AiCriterionSeverity;
  on_missing_info?: AiCriterionMissingInfoBehavior;
  recommendation_hint?: string | null;
};

export type AiCriterion = {
  id: string;
  order_index: number;
  statement: string;
  check_type: string;
  polarity: string;
  required_evidence?: string | null;
  severity: string;
  on_missing_info: string;
  recommendation_hint?: string | null;
};

export type AiEvaluationVersionSummary = {
  version_number: number;
  status: string;
  criteria_count?: number;
  test_run_count?: number;
  published_at?: string | null;
};

export type AiEvaluationDefinitionSummary = {
  id: string;
  name: string;
  slug: string;
  mode: string;
  latest_version?: AiEvaluationVersionSummary | null;
  published_versions?: number;
  assignments_count?: number;
};

export type AiEvaluationDefinitionPage = {
  offset: number;
  limit: number;
  items: AiEvaluationDefinitionSummary[];
};

export type AiEvaluationListOptions = {
  search?: string;
  offset: number;
  limit: number;
};

export type AiEvaluationDefinition = {
  id: string;
  name: string;
  slug: string;
  mode: string;
  description?: string | null;
  versions?: AiEvaluationVersionSummary[];
};

export type AiEvaluationVersion = {
  version_number: number;
  status: string;
  objective: string;
  references?: AiEvaluationReference[];
  test_run_count: number;
  published_at?: string | null;
  criteria?: AiCriterion[];
};

export type CreateAiEvaluationInput = {
  name: string;
  description?: string | null;
  mode?: AiEvaluationMode;
  objective: string;
};

export type PatchAiEvaluationVersionInput = {
  objective?: string | null;
  references?: string[] | null;
  criteria?: AiCriterionInput[] | null;
};

export type SuggestAiCriteriaInput = {
  objective: string;
  target_type: AiEvaluationTargetType;
};

export type SuggestedAiCriterion = {
  statement: string;
  check_type: string;
  polarity: string;
  suggested_severity: string;
};

export type SuggestAiCriteriaResult = {
  suggestions?: SuggestedAiCriterion[];
};

export type AiEvaluationTestInput = {
  sample_content: string;
};

export type AiCriterionTestResult = {
  criterion_id?: string | null;
  statement: string;
  check_type: string;
  severity: string;
  conclusion: string;
  is_alert: boolean;
  evidence_excerpt?: string | null;
  evidence_location?: string | null;
  justification?: string | null;
  recommendation?: string | null;
};

export type AiEvaluationTestResult = {
  results?: AiCriterionTestResult[];
  consolidated_result: AiEvaluationConsolidatedResult;
  real_cost: number;
};

export type PublishAiEvaluationResult = {
  version_number: number;
  status: string;
  published_at?: string | null;
  test_warning: boolean;
};

export type AiEvaluationAssignmentInput = {
  definition_id: string;
  pinned_version_id?: string | null;
  target_type: AiEvaluationTargetType;
  field_keys?: string[];
  enabled?: boolean;
};

export type AiEvaluationAssignment = {
  id: string;
  definition_id: string;
  definition_name: string;
  pinned_version_id?: string | null;
  effective_version_number?: number | null;
  target_type: string;
  field_keys?: string[];
  enabled: boolean;
};

export type AiEvaluationAssignments = {
  template_key: string;
  assignments?: AiEvaluationAssignment[];
};

export type ReplaceAiEvaluationAssignmentsInput = {
  assignments?: AiEvaluationAssignmentInput[];
};

export type AiEvaluationAssignmentContext = {
  templateKey: string;
  fieldKey: string;
};

export type AiEvaluationOrphanResolution = "" | "preserve" | "remove";

export type AiEvaluationAssignmentManagerState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      assignments: AiEvaluationAssignment[];
      definitions: AiEvaluationDefinitionSummary[];
      validFieldKeys: string[];
      selectedDefinitionIds: string[];
      orphanAssignmentIds: string[];
      orphanResolution: AiEvaluationOrphanResolution;
      isSaving: boolean;
    };

export type AiEvaluationAssignmentManagerProps = {
  context: AiEvaluationAssignmentContext;
};

export type AiEvaluationApiError = {
  message: string;
  status?: number;
  fieldErrors?: Record<string, string[]>;
};

export type AiEvaluationLibraryState =
  | { kind: "loading" }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string }
  | { kind: "ready"; page: AiEvaluationDefinitionPage };

export type AiEvaluationEditorState =
  | { kind: "closed" }
  | { kind: "loading"; definitionId: string }
  | { kind: "error"; definitionId: string; message: string }
  | {
      kind: "ready";
      definition: AiEvaluationDefinition;
      version: AiEvaluationVersion;
      isSaving: boolean;
      isSuggesting: boolean;
      isTesting: boolean;
      isPublishing: boolean;
      testResult: AiEvaluationTestResult | null;
    };

export type AiEvaluationCreateDraft = {
  name: string;
  description: string;
  mode: AiEvaluationMode;
  objective: string;
};

export type AiEvaluationEditorPanelProps = {
  state: Exclude<AiEvaluationEditorState, { kind: "closed" }>;
  canManage: boolean;
  onRetry: (definitionId: string) => void;
  onObjectiveChange: (objective: string) => void;
  onCriterionChange: (criterionId: string, criterion: AiCriterion) => void;
  onCriterionAdd: () => void;
  onCriterionRemove: (criterionId: string) => void;
  onCriterionMove: (criterionId: string, direction: -1 | 1) => void;
  onSave: () => Promise<void>;
  onSuggest: () => Promise<void>;
  onTest: (sampleContent: string) => Promise<void>;
  onPublish: () => Promise<void>;
  onCreateVersion: () => Promise<void>;
};

export type AiEvaluationCreateFormProps = {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (draft: AiEvaluationCreateDraft) => Promise<boolean>;
};

export type AiSelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: T[];
  disabled: boolean;
  onChange: (value: T) => void;
};

export type AiCriterionEditorProps = {
  criterion: AiCriterion;
  index: number;
  total: number;
  disabled: boolean;
  onChange: (criterion: AiCriterion) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
};

export type AiEvaluationTestResultPanelProps = {
  result: AiEvaluationTestResult;
};

export type AiEvaluationPublishDialogProps = {
  isOpen: boolean;
  isPublishing: boolean;
  versionNumber: number;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export type AiEvaluationLibraryCardProps = {
  definition: AiEvaluationDefinitionSummary;
  selected: boolean;
  onSelect: (definition: AiEvaluationDefinitionSummary) => void;
};

export type AiEvaluationLibraryMessageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type AiCriterionCardProps = {
  criterion: AiCriterion;
};

export type AiEvaluationMetricProps = {
  icon: ReactNode;
  label: string;
  value: string;
};
