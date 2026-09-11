import type { ReactNode } from "react";
import type { AiEvaluationAssignment } from "./AvaliacaoIa";

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
  onRename: (name: string) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  onAddField: () => void;
  onUpdateField: (fieldIndex: number, field: FormTemplateField) => void;
  onRemoveField: (fieldIndex: number) => void;
  onMoveField: (fieldIndex: number, direction: -1 | 1) => void;
};

export type FormFieldEditorProps = {
  templateKey: string;
  field: FormTemplateField;
  fieldIndex: number;
  sectionId: string;
  assignment: FormEvaluationAssignment[];
  canManageAi: boolean;
  disabled: boolean;
  onChange: (field: FormTemplateField) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
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

export type FormDefinitionValidation = {
  valid: false;
  message: string;
} | {
  valid: true;
  input: UpdateFormTemplateInput;
};
