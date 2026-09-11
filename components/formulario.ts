import type {
  FormDefinitionValidation,
  FormEditorSection,
  FormFieldOption,
  FormTemplateField,
  UpdateFormTemplateInput,
} from "@/types/Formulario";
import type { ApiRecord } from "@/types/Servico";
import type {
  DynamicFormField,
  DynamicFormOption,
  DynamicFormOptionValue,
  DynamicFormValidationResult,
  DynamicFormValue,
  SubmissionFieldInputs,
  SubmissionForm,
} from "@/types/Submissao";

export const FORM_FIELD_TYPES = [
  "text",
  "textarea",
  "select",
  "integer",
  "float",
  "boolean",
  "date",
  "file_upload",
] as const;

export function groupFormSections(fields: FormTemplateField[]) {
  const sections: FormEditorSection[] = [];

  for (const field of [...fields].sort((left, right) => left.order_index - right.order_index)) {
    const name = field.section?.trim() || "Geral";
    let section = sections.find((candidate) => candidate.name === name);

    if (!section) {
      section = { id: createSectionId(name, sections.length), name, fields: [] };
      sections.push(section);
    }

    section.fields.push({ ...field, section: name });
  }

  return sections.length > 0
    ? sections
    : [{ id: createSectionId("Geral", 0), name: "Geral", fields: [] }];
}

export function flattenFormSections(sections: FormEditorSection[]) {
  return sections.flatMap((section) =>
    section.fields.map((field) => ({ ...field, section: section.name })),
  );
}

export function createEmptyFormSection(index: number): FormEditorSection {
  const name = `Nova seção ${index + 1}`;
  return { id: createSectionId(name, Date.now()), name, fields: [] };
}

export function createEmptyFormField(index: number, section: string): FormTemplateField {
  return {
    field_key: `campo_${index + 1}`,
    label: `Novo campo ${index + 1}`,
    help_text: null,
    field_type: "text",
    is_required: false,
    order_index: index + 1,
    section,
    options: null,
    validation_rules: { section },
    ai_evaluation_enabled: false,
    ai_context_instructions: null,
    ai_validation_rules: null,
  };
}

export function normalizeFormForSave(
  detail: UpdateFormTemplateInput,
): UpdateFormTemplateInput {
  return {
    name: detail.name.trim(),
    description: detail.description?.trim() || null,
    fields: detail.fields.map((field, index) => ({
      ...field,
      field_key: field.field_key.trim(),
      label: field.label.trim(),
      help_text: field.help_text?.trim() || null,
      section: field.section?.trim() || "Geral",
      order_index: index + 1,
      validation_rules: {
        ...(field.validation_rules ?? {}),
        section: field.section?.trim() || "Geral",
      },
      ai_context_instructions: field.ai_context_instructions?.trim() || null,
    })),
  };
}

export function validateFormDefinition(value: unknown): FormDefinitionValidation {
  if (!isRecord(value) || typeof value.name !== "string" || !Array.isArray(value.fields)) {
    return { valid: false, message: "Informe os metadados e os campos do formulário." };
  }

  const description =
    typeof value.description === "string" || value.description === null
      ? value.description
      : null;
  const fields = value.fields.map(normalizeFieldInput);

  if (value.name.trim().length < 1) {
    return { valid: false, message: "O nome do formulário é obrigatório." };
  }

  if (fields.some((field) => field === null)) {
    return { valid: false, message: "Há campos com formato inválido na definição." };
  }

  const input = normalizeFormForSave({
    name: value.name,
    description,
    fields: fields as FormTemplateField[],
  });
  const keys = new Set<string>();

  for (const field of input.fields) {
    if (!/^[a-z0-9_]+$/.test(field.field_key)) {
      return {
        valid: false,
        message: `A chave “${field.field_key || "vazia"}” deve usar apenas letras minúsculas, números e sublinhados.`,
      };
    }

    if (keys.has(field.field_key)) {
      return { valid: false, message: `A chave “${field.field_key}” está duplicada.` };
    }
    keys.add(field.field_key);

    if (!field.label || !field.section) {
      return { valid: false, message: `Revise o rótulo e a seção do campo “${field.field_key}”.` };
    }

    if (!FORM_FIELD_TYPES.includes(field.field_type as (typeof FORM_FIELD_TYPES)[number])) {
      return { valid: false, message: `O tipo “${field.field_type}” não é suportado.` };
    }

    if (field.field_type === "select") {
      if (!field.options || field.options.length === 0) {
        return { valid: false, message: `Inclua ao menos uma opção em “${field.label}”.` };
      }
      const optionValues = new Set(field.options.map((option) => String(option.value)));
      if (optionValues.size !== field.options.length) {
        return { valid: false, message: `As opções de “${field.label}” devem ter valores únicos.` };
      }
    }

    const minimum = field.validation_rules?.min;
    const maximum = field.validation_rules?.max;
    if (typeof minimum === "number" && typeof maximum === "number" && minimum > maximum) {
      return { valid: false, message: `O mínimo de “${field.label}” não pode superar o máximo.` };
    }
  }

  return { valid: true, input };
}

export function parseFieldOptions(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf("|");
      const optionValue = separator >= 0 ? line.slice(0, separator).trim() : line;
      const label = separator >= 0 ? line.slice(separator + 1).trim() : line;
      return { value: optionValue, label: label || optionValue };
    });
}

export function formatFieldOptions(options: FormFieldOption[] | null) {
  return (options ?? [])
    .map((option) => `${String(option.value)}|${option.label}`)
    .join("\n");
}

export function buildDynamicFormInputs(form: SubmissionForm) {
  const inputs: SubmissionFieldInputs = {};

  for (const field of form.fields) {
    const value = form.values[field.field_key];

    if (field.field_type === "file_upload" && field.attachment) {
      inputs[field.field_key] = field.attachment.artifact_id;
    } else if (field.field_type === "boolean") {
      inputs[field.field_key] = value === true;
    } else if (field.field_type === "select" && isDynamicFormOptionValue(value)) {
      inputs[field.field_key] = serializeDynamicFormOption(value);
    } else if (typeof value === "string" || typeof value === "number") {
      inputs[field.field_key] = String(value);
    }
  }

  return inputs;
}

export function buildDynamicFormValues(
  fields: DynamicFormField[],
  inputs: SubmissionFieldInputs,
  includeFileReferences: boolean,
) {
  void includeFileReferences;
  const values: Record<string, DynamicFormValue> = {};

  for (const field of fields) {
    if (field.field_type === "file_upload") {
      continue;
    }

    if (
      !isSupportedDynamicFormField(field.field_type) ||
      !Object.hasOwn(inputs, field.field_key)
    ) {
      continue;
    }

    const value = inputs[field.field_key];

    if (field.field_type === "integer" || field.field_type === "float") {
      const normalized = typeof value === "string" ? value.trim() : "";
      values[field.field_key] = normalized === "" ? null : Number(normalized);
      continue;
    }

    if (field.field_type === "select" && typeof value === "string") {
      const option = getDynamicFormOptions(field.options).find(
        (candidate) => serializeDynamicFormOption(candidate.value) === value,
      );
      values[field.field_key] = option?.value ?? null;
      continue;
    }

    values[field.field_key] = value;
  }

  return values;
}

export function validateDynamicFormValues(
  fields: DynamicFormField[],
  inputs: SubmissionFieldInputs,
): DynamicFormValidationResult {
  for (const field of [...fields].sort(
    (first, second) => first.order_index - second.order_index,
  )) {
    const value = inputs[field.field_key];

    if (!isSupportedDynamicFormField(field.field_type)) {
      if (field.is_required) {
        return {
          valid: false,
          fieldKey: field.field_key,
          message: `O campo obrigatório “${field.label}” usa um tipo ainda não suportado.`,
        };
      }
      continue;
    }

    if (field.field_type === "file_upload") {
      if (field.is_required && !hasDynamicFormFileReference(value)) {
        return {
          valid: false,
          fieldKey: field.field_key,
          message: `Selecione o arquivo obrigatório: ${field.label}.`,
        };
      }
      continue;
    }

    if (field.field_type === "boolean") {
      if (field.is_required && typeof value !== "boolean") {
        return requiredFieldError(field);
      }
      continue;
    }

    const textValue = typeof value === "string" ? value.trim() : "";
    if (field.is_required && textValue === "") {
      return requiredFieldError(field);
    }

    if (textValue === "") {
      continue;
    }

    if (field.field_type === "integer" || field.field_type === "float") {
      const numericValue = Number(textValue);
      if (!Number.isFinite(numericValue)) {
        return fieldValidationError(field, "Informe um número válido");
      }
      if (field.field_type === "integer" && !Number.isInteger(numericValue)) {
        return fieldValidationError(field, "Informe um número inteiro");
      }

      const minimum = getDynamicFormNumericRule(field, "min");
      const maximum = getDynamicFormNumericRule(field, "max");
      if (minimum !== undefined && numericValue < minimum) {
        return fieldValidationError(field, `Informe um valor maior ou igual a ${minimum}`);
      }
      if (maximum !== undefined && numericValue > maximum) {
        return fieldValidationError(field, `Informe um valor menor ou igual a ${maximum}`);
      }
    }

    const minimumLength = getDynamicFormNumericRule(field, "min_length");
    const maximumLength = getDynamicFormNumericRule(field, "max_length");
    if (minimumLength !== undefined && textValue.length < minimumLength) {
      return fieldValidationError(
        field,
        `Informe ao menos ${minimumLength} caracteres`,
      );
    }
    if (maximumLength !== undefined && textValue.length > maximumLength) {
      return fieldValidationError(
        field,
        `Informe no máximo ${maximumLength} caracteres`,
      );
    }

    if (
      field.field_type === "select" &&
      !getDynamicFormOptions(field.options).some(
        (option) => serializeDynamicFormOption(option.value) === value,
      )
    ) {
      return fieldValidationError(field, "Selecione uma opção válida");
    }
  }

  return { valid: true };
}

export function getDynamicFormOptions(
  options: unknown[] | null | undefined,
): DynamicFormOption[] {
  if (!Array.isArray(options)) {
    return [];
  }

  const normalized: DynamicFormOption[] = [];
  for (const option of options) {
    if (isDynamicFormOptionValue(option)) {
      normalized.push({ value: option, label: String(option) });
    } else if (
      isRecord(option) &&
      isDynamicFormOptionValue(option.value)
    ) {
      normalized.push({
        value: option.value,
        label: typeof option.label === "string" ? option.label : String(option.value),
      });
    }
  }
  return normalized;
}

export function serializeDynamicFormOption(value: DynamicFormOptionValue) {
  return JSON.stringify([typeof value, value]);
}

export function isSupportedDynamicFormField(fieldType: string) {
  return [...FORM_FIELD_TYPES].includes(
    fieldType as (typeof FORM_FIELD_TYPES)[number],
  );
}

export function hasDynamicFormFileReference(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

export function getDynamicFormAllowedFileExtensions(field: DynamicFormField) {
  const extensions = field.validation_rules?.allowed_extensions;

  if (!Array.isArray(extensions)) {
    return [];
  }

  return extensions
    .filter((extension): extension is string => typeof extension === "string")
    .map((extension) => extension.trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean);
}

export function getDynamicFormMaximumFileSizeMb(field: DynamicFormField) {
  const maximum = field.validation_rules?.max_size_mb;
  return typeof maximum === "number" && maximum > 0 ? maximum : undefined;
}

export function validateDynamicFormFile(file: File, field: DynamicFormField) {
  const extensions = getDynamicFormAllowedFileExtensions(field);
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : undefined;

  if (extensions.length > 0 && (!extension || !extensions.includes(extension))) {
    return `Selecione um arquivo nos formatos: ${extensions
      .map((value) => value.toUpperCase())
      .join(", ")}.`;
  }

  const maximumSizeMb = getDynamicFormMaximumFileSizeMb(field);
  if (maximumSizeMb && file.size > maximumSizeMb * 1024 * 1024) {
    return `O arquivo deve ter no máximo ${maximumSizeMb} MB.`;
  }

  return null;
}

export function getDynamicFormNumericRule(
  field: DynamicFormField,
  rule: "min" | "max" | "min_length" | "max_length",
) {
  const value = field.validation_rules?.[rule];
  return typeof value === "number" ? value : undefined;
}

function requiredFieldError(field: DynamicFormField): DynamicFormValidationResult {
  return fieldValidationError(field, "Este campo é obrigatório");
}

function fieldValidationError(
  field: DynamicFormField,
  message: string,
): DynamicFormValidationResult {
  return {
    valid: false,
    fieldKey: field.field_key,
    message: `${message}: ${field.label}.`,
  };
}

function isDynamicFormOptionValue(
  value: unknown,
): value is DynamicFormOptionValue {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function normalizeFieldInput(value: unknown): FormTemplateField | null {
  if (
    !isRecord(value) ||
    typeof value.field_key !== "string" ||
    typeof value.label !== "string" ||
    typeof value.field_type !== "string"
  ) {
    return null;
  }

  return {
    field_key: value.field_key,
    label: value.label,
    help_text: typeof value.help_text === "string" ? value.help_text : null,
    field_type: value.field_type,
    is_required: value.is_required === true,
    order_index: typeof value.order_index === "number" ? value.order_index : 0,
    section: typeof value.section === "string" ? value.section : "Geral",
    options: normalizeOptions(value.options),
    validation_rules: isRecord(value.validation_rules) ? value.validation_rules : null,
    ai_evaluation_enabled: value.ai_evaluation_enabled === true,
    ai_context_instructions:
      typeof value.ai_context_instructions === "string"
        ? value.ai_context_instructions
        : null,
    ai_validation_rules: isRecord(value.ai_validation_rules)
      ? value.ai_validation_rules
      : null,
  };
}

function normalizeOptions(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const options: FormFieldOption[] = [];
  for (const option of value) {
    if (
      isRecord(option) &&
      (typeof option.value === "string" ||
        typeof option.value === "number" ||
        typeof option.value === "boolean")
    ) {
      options.push({
        value: option.value,
        label: typeof option.label === "string" ? option.label : String(option.value),
      });
    }
  }
  return options;
}

function createSectionId(name: string, index: number) {
  return `${name.toLocaleLowerCase("pt-BR").replaceAll(/[^a-z0-9]+/g, "-")}-${index}`;
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
