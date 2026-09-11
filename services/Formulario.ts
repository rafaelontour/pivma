import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { apiOrigin, http } from "./Http";
import type {
  EvaluableFieldsResponse,
  FormEvaluationAssignment,
  FormFieldOption,
  FormTemplateCatalogItem,
  FormTemplateDetail,
  FormTemplateField,
  ProcessTemplateDetail,
  ProcessTemplateSummary,
  UpdateFormTemplateInput,
} from "@/types/Formulario";
import type { ApiRecord, ServiceResult } from "@/types/Servico";

export async function listFormTemplateCatalog(
  accessToken: string,
): Promise<ServiceResult<FormTemplateCatalogItem[]>> {
  const [templatesError, templatesResponse] = await tryit(() =>
    http.get<unknown>("/processes/templates", {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
  )();

  if (templatesError) {
    return { ok: false, status: getStatus(templatesError) };
  }

  if (!Array.isArray(templatesResponse.data) || !templatesResponse.data.every(isProcessTemplateSummary)) {
    return { ok: false };
  }

  const details = await Promise.all(
    templatesResponse.data.map((template) => getProcessTemplate(accessToken, template.key)),
  );
  const failedDetail = details.find((detail) => !detail.ok);

  if (failedDetail && !failedDetail.ok) {
    return { ok: false, status: failedDetail.status };
  }

  const items = details.flatMap((detail) =>
    detail.ok ? extractFormCatalog(detail.data) : [],
  );
  return { ok: true, data: items };
}

export async function getFormTemplate(
  accessToken: string,
  processKey: string,
  formKey: string,
): Promise<ServiceResult<FormTemplateDetail>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>(
      `/processes/templates/${encodeURIComponent(processKey)}/forms/${encodeURIComponent(formKey)}`,
      { headers: { Cookie: `access_token=${accessToken}` } },
    ),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  const detail = normalizeFormTemplate(response.data);
  return detail ? { ok: true, data: detail } : { ok: false };
}

export async function updateFormTemplate(
  accessToken: string,
  processKey: string,
  formKey: string,
  input: UpdateFormTemplateInput,
): Promise<ServiceResult<FormTemplateDetail>> {
  const [error, response] = await tryit(() =>
    http.put<unknown>(
      `/processes/templates/${encodeURIComponent(processKey)}/forms/${encodeURIComponent(formKey)}`,
      input,
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
          Origin: apiOrigin,
        },
      },
    ),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  const detail = normalizeFormTemplate(response.data);
  return detail ? { ok: true, data: detail } : { ok: false };
}

export async function listEvaluableFormFields(
  accessToken: string,
  formKey: string,
): Promise<ServiceResult<EvaluableFieldsResponse>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>(
      `/form-templates/${encodeURIComponent(formKey)}/evaluable-fields`,
      { headers: { Cookie: `access_token=${accessToken}` } },
    ),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  const evaluableFields = normalizeEvaluableFieldsResponse(response.data);
  return evaluableFields
    ? { ok: true, data: evaluableFields }
    : { ok: false };
}

async function getProcessTemplate(
  accessToken: string,
  key: string,
): Promise<ServiceResult<ProcessTemplateDetail>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>(`/processes/templates/${encodeURIComponent(key)}`, {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return isProcessTemplateDetail(response.data)
    ? { ok: true, data: response.data }
    : { ok: false };
}

function extractFormCatalog(detail: ProcessTemplateDetail) {
  const forms = detail.definition.forms;
  if (!Array.isArray(forms)) {
    return [];
  }

  const items: FormTemplateCatalogItem[] = [];
  for (const value of forms) {
    if (!isRecord(value) || typeof value.key !== "string" || typeof value.name !== "string") {
      continue;
    }

    items.push({
      processKey: detail.key,
      processName: detail.name,
      key: value.key,
      name: value.name,
      description: typeof value.description === "string" ? value.description : null,
      version: typeof value.version === "number" ? value.version : 1,
    });
  }

  return items;
}

function normalizeFormTemplate(value: unknown): FormTemplateDetail | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.key !== "string" ||
    typeof value.name !== "string" ||
    typeof value.version !== "number" ||
    !Array.isArray(value.fields)
  ) {
    return null;
  }

  const fields = value.fields.map(normalizeFormField);
  if (fields.some((field) => field === null)) {
    return null;
  }

  return {
    id: value.id,
    key: value.key,
    name: value.name,
    version: value.version,
    description: typeof value.description === "string" ? value.description : null,
    fields: fields as FormTemplateField[],
  };
}

function normalizeFormField(value: unknown): FormTemplateField | null {
  if (
    !isRecord(value) ||
    typeof value.field_key !== "string" ||
    typeof value.label !== "string"
  ) {
    return null;
  }

  return {
    field_key: value.field_key,
    label: value.label,
    help_text: typeof value.help_text === "string" ? value.help_text : null,
    field_type: typeof value.field_type === "string" ? value.field_type : "text",
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
    if (typeof option === "string" || typeof option === "number" || typeof option === "boolean") {
      options.push({ value: option, label: String(option) });
    } else if (
      isRecord(option) &&
      (typeof option.value === "string" || typeof option.value === "number" || typeof option.value === "boolean")
    ) {
      options.push({
        value: option.value,
        label: typeof option.label === "string" ? option.label : String(option.value),
      });
    }
  }
  return options;
}

function isProcessTemplateSummary(value: unknown): value is ProcessTemplateSummary {
  return isRecord(value) && typeof value.id === "string" && typeof value.key === "string" && typeof value.name === "string" && typeof value.is_active === "boolean";
}

function isProcessTemplateDetail(value: unknown): value is ProcessTemplateDetail {
  return isRecord(value) && typeof value.id === "string" && typeof value.key === "string" && typeof value.name === "string" && typeof value.version_number === "number" && isRecord(value.definition);
}

function normalizeEvaluableFieldsResponse(
  value: unknown,
): EvaluableFieldsResponse | null {
  if (!isRecord(value)) {
    return null;
  }

  const fields = value.fields ?? [];
  if (!Array.isArray(fields)) {
    return null;
  }

  const normalizedFields: EvaluableFieldsResponse["fields"] = [];
  for (const field of fields) {
    if (
      !isRecord(field) ||
      typeof field.field_key !== "string" ||
      typeof field.label !== "string"
    ) {
      return null;
    }

    const assignments = field.assignments ?? [];
    if (!Array.isArray(assignments) || !assignments.every(isFormAssignment)) {
      return null;
    }

    normalizedFields.push({
      field_key: field.field_key,
      label: field.label,
      assignments,
    });
  }

  return { fields: normalizedFields };
}

function isFormAssignment(value: unknown): value is FormEvaluationAssignment {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.definition_id === "string" &&
    typeof value.definition_name === "string" &&
    typeof value.target_type === "string" &&
    typeof value.enabled === "boolean" &&
    (value.pinned_version_id === undefined ||
      value.pinned_version_id === null ||
      typeof value.pinned_version_id === "string") &&
    (value.effective_version_number === undefined ||
      value.effective_version_number === null ||
      typeof value.effective_version_number === "number") &&
    (value.field_keys === undefined ||
      (Array.isArray(value.field_keys) &&
        value.field_keys.every((fieldKey) => typeof fieldKey === "string")))
  );
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
