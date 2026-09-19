import type { ReactNode } from "react";
import type {
  AiCriterion,
  AiEvaluationAssignment,
  AiEvaluationDefinitionSummary,
  AiEvaluationTestResult,
  AiEvaluationVersion,
} from "./AvaliacaoIa";

export type ProcessTemplateSummary = {
  id: string;
  key: string;
  name: string;
  description?: string | null;
  is_active: boolean;
};

export type ProcessTemplateDetail = {
  id: string;
  key: string;
  name: string;
  version_number: number;
  definition: Record<string, unknown>;
};

export type FormTemplateCatalogItem = {
  processKey: string;
  processName: string;
  key: string;
  name: string;
  description: string | null;
  version: number;
};

export type FormFieldType = string;

export type FormFieldOption = {
  value: string | number | boolean;
  label: string;
};

export type FormValidationRules = Record<string, unknown> & {
  min?: number;
  max?: number;
  min_length?: number;
  max_length?: number;
  allowed_extensions?: string[];
  max_size_mb?: number;
  section?: string;
};

export type FormTemplateField = {
  field_key: string;
  label: string;
  help_text: string | null;
  field_type: FormFieldType;
  is_required: boolean;
  order_index: number;
  section: string | null;
  options: FormFieldOption[] | null;
  validation_rules: FormValidationRules | null;
  ai_evaluation_enabled: boolean;
  ai_context_instructions: string | null;
  ai_validation_rules: Record<string, unknown> | null;
};

export type FormTemplateDetail = {
  id: string;
  key: string;
  name: string;
  version: number;
  description: string | null;
  fields: FormTemplateField[];
};

export type UpdateFormTemplateInput = {
  name: string;
  description: string | null;
  fields: FormTemplateField[];
};

export type FormEditorSection = {
  id: string;
  name: string;
  fields: FormTemplateField[];
};

export type FormEvaluationAssignment = AiEvaluationAssignment;

export type EvaluableFormField = {
  field_key: string;
  label: string;
  assignments: FormEvaluationAssignment[];
};

export type EvaluableFieldsResponse = {
  fields: EvaluableFormField[];
};

export type FormCatalogState =
  | { kind: "loading" }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: FormTemplateCatalogItem[] };

export type FormEditorState =
  | { kind: "closed" }
  | { kind: "loading"; item: FormTemplateCatalogItem }
  | { kind: "error"; item: FormTemplateCatalogItem; message: string }
  | {
      kind: "ready";
      item: FormTemplateCatalogItem;
      detail: FormTemplateDetail;
      sections: FormEditorSection[];
      assignments: Record<string, FormEvaluationAssignment[]>;
      isSaving: boolean;
    };

export type FormEditorProps = {
  state: Extract<FormEditorState, { kind: "ready" }>;
  canManageAi: boolean;
  hasPendingChanges?: boolean;
  onBack?: () => void;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onAddSection: () => void;
  onRenameSection: (sectionId: string, name: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onMoveSection: (sectionId: string, direction: -1 | 1) => void;
  onAddField: (sectionId: string) => void;
  onUpdateField: (
    sectionId: string,
    fieldIndex: number,
    field: FormTemplateField,
  ) => void;
  onRemoveField: (sectionId: string, fieldIndex: number) => void;
  onMoveField: (sectionId: string, fieldIndex: number, direction: -1 | 1) => void;
  onSave: () => void;
  onOpenAiModal?: (field: FormTemplateField) => void;
  onUnlinkAiRule?: (field: FormTemplateField, assignmentId: string) => void;
};

export type FormCatalogGridProps = {
  items: FormTemplateCatalogItem[];
  onSelect: (item: FormTemplateCatalogItem) => void;
  onRefresh: () => void;
};

export type FormWorkspaceHeaderProps = {
  item: FormTemplateCatalogItem;
  isSaving: boolean;
  onBack: () => void;
  onSave: () => void;
};

export type FormCatalogCardProps = {
  item: FormTemplateCatalogItem;
  onSelect: (item: FormTemplateCatalogItem) => void;
};

export type FormSectionEditorProps = {
  templateKey: string;
  section: FormEditorSection;
  sectionIndex: number;
  sectionCount: number;
  assignments: Record<string, FormEvaluationAssignment[]>;
  canManageAi: boolean;
  disabled: boolean;
  allFields?: FormTemplateField[];
  onRename: (name: string) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddField: () => void;
  onUpdateField: (fieldIndex: number, field: FormTemplateField) => void;
  onRemoveField: (fieldIndex: number) => void;
  onMoveField: (fieldIndex: number, direction: -1 | 1) => void;
  onOpenAiModal?: (field: FormTemplateField) => void;
  onUnlinkAiRule?: (field: FormTemplateField, assignmentId: string) => void;
};

export type FormFieldEditorProps = {
  templateKey: string;
  field: FormTemplateField;
  fieldIndex: number;
  sectionId: string;
  assignment: FormEvaluationAssignment[];
  canManageAi: boolean;
  disabled: boolean;
  allFields?: FormTemplateField[];
  onChange: (field: FormTemplateField) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onOpenAiModal?: () => void;
  onUnlinkAiRule?: (assignmentId: string) => void;
};

export type FormPageMessageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type FormSessionCapabilities = {
  permissions: string[];
};

export type FormOrderButtonsProps = {
  canMoveUp: boolean;
  canMoveDown: boolean;
  disabled: boolean;
  label: string;
  onMove: (direction: -1 | 1) => void;
};

export type FormEditorFieldProps = {
  label: string;
  inputId: string;
  help?: string;
  wide?: boolean;
  children: ReactNode;
};

export type FormRuleNumberInputProps = {
  field: FormTemplateField;
  rule: "min" | "max" | "min_length" | "max_length" | "max_size_mb";
  label: string;
  inputId: string;
  disabled: boolean;
  onChange: (field: FormTemplateField) => void;
};

export type FormModalProps = {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
};

export type FormConfirmDiscardDialogProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export type FormDefinitionValidation =
  | {
      valid: false;
      message: string;
    }
  | {
      valid: true;
      input: UpdateFormTemplateInput;
    };

export type FieldAiRuleScope = "field" | "cross_field" | "form";

export type FieldAiRuleSeverity =
  | "info"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type FieldAiRuleCheckType =
  | "presence"
  | "conformity"
  | "quality"
  | "comparison"
  | "cross_field_consistency";

export type FieldAiRuleDraftCriterion = {
  id: string;
  statement: string;
  check_type: FieldAiRuleCheckType;
  severity: FieldAiRuleSeverity;
  enabled: boolean;
};

export type FieldAiRuleQuickDraft = {
  name: string;
  objective: string;
  scope: FieldAiRuleScope;
  selectedFieldKeys: string[];
  criteria: FieldAiRuleDraftCriterion[];
};

export type FieldAiRuleModalTab =
  | "select_existing"
  | "preview"
  | "quick_create"
  | "advanced_create"
  | "test_playground";

export type FieldAiRuleOrchestratorStep =
  | "idle"
  | "creating_definition"
  | "saving_criteria"
  | "publishing"
  | "binding"
  | "completed"
  | "error";

export type FieldAiRuleOrchestratorState = {
  step: FieldAiRuleOrchestratorStep;
  errorMessage?: string | null;
  createdDefinitionId?: string | null;
  publishedVersionNumber?: number | null;
};

export type FieldAiRuleTestState = {
  status: "idle" | "running" | "success" | "error";
  sampleContent: string;
  result?: AiEvaluationTestResult | null;
  errorMessage?: string | null;
};

export type FieldAiRuleSectionProps = {
  templateKey: string;
  field: FormTemplateField;
  allFields: FormTemplateField[];
  assignment: FormEvaluationAssignment[];
  canManageAi: boolean;
  disabled: boolean;
  onToggleAi: (enabled: boolean) => void;
  onOpenRuleConfig: () => void;
  onUnlinkRule: (assignmentId: string) => void;
};

export type FieldAiRuleModalProps = {
  isOpen: boolean;
  templateKey: string;
  field: FormTemplateField;
  allFields: FormTemplateField[];
  existingAssignments: FormEvaluationAssignment[];
  onClose: () => void;
  onRuleLinked: (newAssignments: FormEvaluationAssignment[]) => void;
};

export type FieldAiRuleSelectExistingProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  definitions: AiEvaluationDefinitionSummary[];
  isLoading: boolean;
  onSelectDefinition: (definition: AiEvaluationDefinitionSummary) => void;
  onPreviewDefinition: (definition: AiEvaluationDefinitionSummary) => void;
  onCreateNewClick: () => void;
};

export type FieldAiRulePreviewProps = {
  definition: AiEvaluationDefinitionSummary;
  versionDetail: AiEvaluationVersion | null;
  isLoading: boolean;
  onBack: () => void;
  onUseRule: () => void;
  onDuplicateAndEdit: () => void;
};

export type FieldAiRuleQuickCreateProps = {
  draft: FieldAiRuleQuickDraft;
  allFields: FormTemplateField[];
  currentFieldKey: string;
  isGeneratingSuggestions: boolean;
  onDraftChange: (draft: FieldAiRuleQuickDraft) => void;
  onGenerateSuggestions: () => void;
  onProceedToTest: () => void;
  onCancel: () => void;
};

export type FieldAiRulePlaygroundProps = {
  testState: FieldAiRuleTestState;
  draft: FieldAiRuleQuickDraft;
  orchestratorState: FieldAiRuleOrchestratorState;
  onSampleContentChange: (content: string) => void;
  onRunTest: () => void;
  onBackToEdit: () => void;
  onSaveAndLink: () => void;
};

export type FieldAiRuleConfirmUnlinkDialogProps = {
  isOpen: boolean;
  ruleName: string;
  onCancel: () => void;
  onConfirm: () => void;
};
