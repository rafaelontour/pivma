import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { getApiOrigin, http } from "./Http";
import { normalizeProcessInstance } from "./Processo";
import { getTriageTimeline } from "./Triagem";
import type { ProcessInstance } from "@/types/Processo";
import type { CurrentSessionUser } from "@/types/Autenticacao";
import type { ApiRecord, ServiceResult } from "@/types/Servico";
import type {
  CreateProcessDraftInput,
  DirectReviewInput,
  DirectReviewResult,
  SaveSubmissionDraftInput,
  SaveSubmissionDraftResult,
  SubmissionAttachmentDownload,
  SubmissionAttachmentRemovedResult,
  SubmissionAttachmentUploadResult,
  SubmissionForm,
  SubmissionPreEvaluation,
  SubmissionReturnReview,
  SubmissionReturnReviewInput,
  SubmissionReturnReviewResult,
  SubmissionTemplate,
  SubmitSubmissionResult,
} from "@/types/Submissao";

export const INITIAL_SUBMISSION_ACTIVITY_KEY = "proposal_submission";

const PROCESS_PAGE_SIZE = 100;
const SUBMISSION_FORM_LOOKUP_BATCH_SIZE = 8;

export async function listSubmissionTemplates(
  accessToken: string,
): Promise<ServiceResult<SubmissionTemplate[]>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>("/processes/templates", {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  const templates = isRecord(response.data) && Array.isArray(response.data.data)
    ? response.data.data
    : response.data;
  if (!Array.isArray(templates) || !templates.every(isTemplate)) {
    return { ok: false };
  }

  return { ok: true, data: templates };
}

export async function createSubmissionDraft(
  accessToken: string,
  input: CreateProcessDraftInput,
): Promise<ServiceResult<ProcessInstance>> {
  const [error, response] = await tryit(() =>
    http.post<unknown>(
      "/processes",
      {
        template_key: input.templateKey,
        title: input.title,
      },
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
          Origin: getApiOrigin(),
        },
      },
    ),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  const data = normalizeProcessInstance(response.data);
  if (!data) {
    return { ok: false };
  }

  return { ok: true, data };
}

export async function deleteSubmissionDraft(
  accessToken: string,
  processId: string,
): Promise<ServiceResult<null>> {
  const [error] = await tryit(() =>
    http.delete<void>(`/processes/${processId}`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
        Origin: getApiOrigin(),
      },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return { ok: true, data: null };
}

export async function listProponentSubmissionDrafts(
  accessToken: string,
  scopes: CurrentSessionUser["access"]["scopes"],
): Promise<ServiceResult<ProcessInstance[]>> {
  return listProponentProcessesBySubmissionState(accessToken, scopes, false);
}

export async function listProponentSubmittedProcesses(
  accessToken: string,
  scopes: CurrentSessionUser["access"]["scopes"],
): Promise<ServiceResult<ProcessInstance[]>> {
  return listProponentProcessesBySubmissionState(accessToken, scopes, true);
}

async function listProponentProcessesBySubmissionState(
  accessToken: string,
  scopes: CurrentSessionUser["access"]["scopes"],
  isSubmitted: boolean,
): Promise<ServiceResult<ProcessInstance[]>> {
  const proponentProcessIds = new Set(
    scopes
      .filter((scope) => scope.roles.includes("proponent"))
      .map((scope) => scope.process_id),
  );

  if (proponentProcessIds.size === 0) {
    return { ok: true, data: [] };
  }

  const processes: ProcessInstance[] = [];
  let page = 1;
  let visited = 0;
  let total = 0;

  do {
    const [error, response] = await tryit(() =>
      http.get<unknown>("/processes", {
        headers: { Cookie: `access_token=${accessToken}` },
        params: { page, per_page: PROCESS_PAGE_SIZE },
      }),
    )();

    if (error) {
      return { ok: false, status: getStatus(error) };
    }

    const processList = normalizeProcessList(response.data);
    if (!processList) {
      return { ok: false };
    }

    total = processList.total;
    visited += processList.items.length;
    processes.push(
      ...processList.items.filter(
        (process) => proponentProcessIds.has(process.id),
      ),
    );
    page += 1;

    if (processList.items.length === 0) {
      break;
    }
  } while (visited < total);

  const matchingProcesses: ProcessInstance[] = [];
  for (
    let index = 0;
    index < processes.length;
    index += SUBMISSION_FORM_LOOKUP_BATCH_SIZE
  ) {
    const batch = processes.slice(
      index,
      index + SUBMISSION_FORM_LOOKUP_BATCH_SIZE,
    );
    const forms = await Promise.all(
      batch.map((process) => getSubmissionForm(accessToken, process.id)),
    );
    const failedForm = forms.find((form) => !form.ok);
    if (failedForm && !failedForm.ok) {
      return { ok: false, status: failedForm.status };
    }

    const submissionHistory = await Promise.all(
      batch.map(async (process, batchIndex) => {
        const form = forms[batchIndex];
        if (!form.ok || form.data.is_submitted) return false;
        const timeline = await getTriageTimeline(accessToken, process.id);
        if (!timeline.ok) return true;
        return timeline.data.events.some((event) => event.event_type === "SUBMISSION_SUBMITTED");
      }),
    );

    batch.forEach((process, batchIndex) => {
      const form = forms[batchIndex];
      if (form.ok && form.data.is_submitted === isSubmitted) {
        matchingProcesses.push({ ...process, has_been_submitted: form.data.is_submitted || submissionHistory[batchIndex] });
      }
    });
  }

  return { ok: true, data: matchingProcesses };
}

export async function getSubmissionForm(
  accessToken: string,
  processId: string,
): Promise<ServiceResult<SubmissionForm>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>(
      `/processes/${processId}/activities/${INITIAL_SUBMISSION_ACTIVITY_KEY}/form`,
      { headers: { Cookie: `access_token=${accessToken}` } },
    ),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  if (!isSubmissionForm(response.data)) {
    return { ok: false };
  }

  return { ok: true, data: response.data };
}

export async function saveSubmissionDraft(
  accessToken: string,
  processId: string,
  input: SaveSubmissionDraftInput,
): Promise<ServiceResult<SaveSubmissionDraftResult>> {
  const [error, response] = await tryit(() =>
    http.put<unknown>(
      `/processes/${processId}/activities/${INITIAL_SUBMISSION_ACTIVITY_KEY}/form`,
      { values: input.values },
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
          Origin: getApiOrigin(),
        },
      },
    ),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  if (!isSaveResult(response.data)) {
    return { ok: false };
  }

  return { ok: true, data: response.data };
}

export async function submitSubmission(
  accessToken: string,
  processId: string,
  input: SaveSubmissionDraftInput,
): Promise<ServiceResult<SubmitSubmissionResult>> {
  const [error, response] = await tryit(() =>
    http.post<unknown>(
      `/processes/${processId}/activities/${INITIAL_SUBMISSION_ACTIVITY_KEY}/form`,
      { values: input.values },
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
          Origin: getApiOrigin(),
        },
      },
    ),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  if (!isSubmitResult(response.data)) {
    return { ok: false };
  }

  return { ok: true, data: response.data };
}

export async function getSubmissionPreEvaluation(
  accessToken: string,
  processId: string,
): Promise<ServiceResult<SubmissionPreEvaluation>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>(`/processes/${processId}/pre-evaluation`, {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
  )();
  if (error) {
    return { ok: false, status: getStatus(error) };
  }
  const data = normalizePreEvaluation(response.data);
  return data ? { ok: true, data } : { ok: false };
}

export async function requestSubmissionDirectReview(
  accessToken: string,
  processId: string,
  input: DirectReviewInput,
): Promise<ServiceResult<DirectReviewResult>> {
  const [error, response] = await tryit(() =>
    http.post<unknown>(
      `/processes/${processId}/submission/direct-review`,
      input,
      { headers: { Cookie: `access_token=${accessToken}`, Origin: getApiOrigin() } },
    ),
  )();
  if (error) return { ok: false, status: getStatus(error) };
  return isDirectReviewResult(response.data)
    ? { ok: true, data: response.data }
    : { ok: false };
}

export async function getSubmissionReturnReview(
  accessToken: string,
  processId: string,
): Promise<ServiceResult<SubmissionReturnReview>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>(`/processes/${processId}/return-review`, {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
  )();
  if (error) return { ok: false, status: getStatus(error) };
  const data = normalizeReturnReview(response.data);
  return data ? { ok: true, data } : { ok: false };
}

export async function decideSubmissionReturnReview(
  accessToken: string,
  processId: string,
  input: SubmissionReturnReviewInput,
): Promise<ServiceResult<SubmissionReturnReviewResult>> {
  const [error, response] = await tryit(() =>
    http.post<unknown>(`/processes/${processId}/return-review`, input, {
      headers: { Cookie: `access_token=${accessToken}`, Origin: getApiOrigin() },
    }),
  )();
  if (error) return { ok: false, status: getStatus(error) };
  return isReturnReviewResult(response.data)
    ? { ok: true, data: response.data }
    : { ok: false };
}

export async function uploadSubmissionAttachment(
  accessToken: string,
  processId: string,
  fieldKey: string,
  file: File,
): Promise<ServiceResult<SubmissionAttachmentUploadResult>> {
  const body = new FormData();
  body.append("file", file, file.name);
  const [error, response] = await tryit(() =>
    http.post<unknown>(attachmentPath(processId, fieldKey), body, {
      headers: { Cookie: `access_token=${accessToken}`, Origin: getApiOrigin() },
    }),
  )();
  if (error) return { ok: false, status: getStatus(error) };
  return isAttachmentUpload(response.data)
    ? { ok: true, data: response.data }
    : { ok: false };
}

export async function removeSubmissionAttachment(
  accessToken: string,
  processId: string,
  fieldKey: string,
): Promise<ServiceResult<SubmissionAttachmentRemovedResult>> {
  const [error, response] = await tryit(() =>
    http.delete<unknown>(attachmentPath(processId, fieldKey), {
      headers: { Cookie: `access_token=${accessToken}`, Origin: getApiOrigin() },
    }),
  )();
  if (error) return { ok: false, status: getStatus(error) };
  return isAttachmentRemoved(response.data)
    ? { ok: true, data: response.data }
    : { ok: false };
}

export async function downloadSubmissionAttachment(
  accessToken: string,
  processId: string,
  fieldKey: string,
): Promise<ServiceResult<SubmissionAttachmentDownload>> {
  const [error, response] = await tryit(() =>
    http.get<ArrayBuffer>(attachmentPath(processId, fieldKey), {
      headers: { Cookie: `access_token=${accessToken}` },
      responseType: "arraybuffer",
    }),
  )();
  if (error) return { ok: false, status: getStatus(error) };
  return {
    ok: true,
    data: {
      data: response.data,
      contentType: typeof response.headers["content-type"] === "string"
        ? response.headers["content-type"]
        : "application/octet-stream",
      contentDisposition: typeof response.headers["content-disposition"] === "string"
        ? response.headers["content-disposition"]
        : null,
    },
  };
}

function normalizePreEvaluation(value: unknown): SubmissionPreEvaluation | null {
  if (!isRecord(value) || typeof value.run_id !== "string" || typeof value.correlation_id !== "string" || typeof value.status !== "string" || typeof value.started_at !== "string" || !isPreEvaluationSummary(value.summary)) return null;
  const attentionPoints = value.attention_points ?? [];
  const evaluations = value.evaluations ?? [];
  const evaluatedContent = value.evaluated_content ?? [];
  if (!Array.isArray(attentionPoints) || !attentionPoints.every(isAttentionPoint) || !Array.isArray(evaluations) || !evaluations.every(isEvaluationVersionUsed) || !Array.isArray(evaluatedContent) || !evaluatedContent.every(isEvaluatedContentField)) return null;
  if (value.consolidated_result !== undefined && value.consolidated_result !== null && value.consolidated_result !== "positive" && value.consolidated_result !== "negative") return null;
  return {
    run_id: value.run_id,
    correlation_id: value.correlation_id,
    status: value.status,
    consolidated_result: value.consolidated_result as "positive" | "negative" | null | undefined,
    provider: optionalString(value.provider),
    models_used: isRecord(value.models_used) ? value.models_used : {},
    real_cost: typeof value.real_cost === "number" ? value.real_cost : 0,
    started_at: value.started_at,
    finished_at: optionalString(value.finished_at),
    error_summary: optionalString(value.error_summary),
    summary: value.summary,
    attention_points: attentionPoints,
    evaluations,
    evaluated_content: evaluatedContent,
    direct_review_request: isRecord(value.direct_review_request) ? value.direct_review_request : null,
  };
}

function isPreEvaluationSummary(value: unknown): value is SubmissionPreEvaluation["summary"] {
  return isRecord(value) && ["total", "compliant", "non_compliant", "partial", "indeterminate"].every((key) => typeof value[key] === "number");
}

function isAttentionPoint(value: unknown): value is NonNullable<SubmissionPreEvaluation["attention_points"]>[number] {
  return isRecord(value) && typeof value.item_id === "string" && typeof value.criterion_statement === "string" && typeof value.check_type === "string" && typeof value.severity === "string" && typeof value.conclusion === "string" && typeof value.is_alert === "boolean";
}

function isEvaluationVersionUsed(value: unknown): value is NonNullable<SubmissionPreEvaluation["evaluations"]>[number] {
  return isRecord(value) && typeof value.definition_name === "string" && typeof value.version_number === "number";
}

function isEvaluatedContentField(value: unknown): value is NonNullable<SubmissionPreEvaluation["evaluated_content"]>[number] {
  return isRecord(value) && typeof value.field_key === "string" && typeof value.label === "string";
}

function isDirectReviewResult(value: unknown): value is DirectReviewResult {
  return isRecord(value) && typeof value.process_status === "string" && typeof value.direct_review_request_id === "string";
}

function normalizeReturnReview(value: unknown): SubmissionReturnReview | null {
  if (!isRecord(value) || typeof value.run_number !== "number" || !isReturnReviewSource(value.source) || typeof value.opened_at !== "string" || !Array.isArray(value.available_choices) || !value.available_choices.every(isReturnReviewChoice)) return null;
  if (value.due_date !== undefined && value.due_date !== null && typeof value.due_date !== "string") return null;
  if (value.triage_decision !== undefined && value.triage_decision !== null && !isReturnReviewDecision(value.triage_decision)) return null;
  const preEvaluation = value.ai_pre_evaluation === undefined || value.ai_pre_evaluation === null
    ? null
    : normalizePreEvaluation(value.ai_pre_evaluation);
  if (value.ai_pre_evaluation !== undefined && value.ai_pre_evaluation !== null && !preEvaluation) return null;
  return {
    run_number: value.run_number,
    source: value.source,
    opened_at: value.opened_at,
    due_date: optionalString(value.due_date),
    available_choices: value.available_choices,
    ai_pre_evaluation: preEvaluation,
    triage_decision: value.triage_decision ?? null,
  };
}

function isReturnReviewDecision(value: unknown): value is NonNullable<SubmissionReturnReview["triage_decision"]> {
  return isRecord(value) && typeof value.outcome === "string" && typeof value.justification === "string" && typeof value.decided_at === "string";
}

function isReturnReviewResult(value: unknown): value is SubmissionReturnReviewResult {
  return isRecord(value) && isReturnReviewChoice(value.choice) && typeof value.process_status === "string" && (value.submission_run === undefined || value.submission_run === null || typeof value.submission_run === "number");
}

function isReturnReviewChoice(value: unknown): value is SubmissionReturnReviewResult["choice"] {
  return value === "REVISE" || value === "CONTEST_AI" || value === "WITHDRAW";
}

function isReturnReviewSource(value: unknown): value is SubmissionReturnReview["source"] {
  return value === "AI_PRE_EVALUATION" || value === "TRIAGE";
}

function isAttachmentUpload(value: unknown): value is SubmissionAttachmentUploadResult {
  return isRecord(value) && typeof value.field_key === "string" && isAttachment(value.attachment) && typeof value.replaced_previous === "boolean";
}

function isAttachmentRemoved(value: unknown): value is SubmissionAttachmentRemovedResult {
  return isRecord(value) && typeof value.field_key === "string" && typeof value.removed === "boolean";
}

function isAttachment(value: unknown) {
  return isRecord(value) && typeof value.artifact_id === "string" && typeof value.filename === "string" && typeof value.size === "number" && typeof value.extension === "string" && typeof value.checksum_sha256 === "string" && typeof value.uploaded_at === "string";
}

function attachmentPath(processId: string, fieldKey: string) {
  return `/processes/${processId}/activities/${INITIAL_SUBMISSION_ACTIVITY_KEY}/form/fields/${encodeURIComponent(fieldKey)}/attachment`;
}

function isTemplate(value: unknown): value is SubmissionTemplate {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.key === "string" &&
    typeof value.name === "string" &&
    (value.description === undefined ||
      value.description === null ||
      typeof value.description === "string") &&
    typeof value.is_active === "boolean"
  );
}

function normalizeProcessList(value: unknown): { items: ProcessInstance[]; total: number } | null {
  if (!isRecord(value)) return null;
  const itemsValue = Array.isArray(value.items)
    ? value.items
    : Array.isArray(value.data)
      ? value.data
      : null;
  const pagination = isRecord(value.pagination) ? value.pagination : null;
  const items = itemsValue?.map(normalizeProcessInstance) ?? null;
  if (
    !items ||
    items.some((item) => !item) ||
    !pagination ||
    typeof pagination.total_items !== "number"
  ) {
    return null;
  }
  return {
    items: items as ProcessInstance[],
    total: pagination.total_items,
  };
}

function isSubmissionForm(value: unknown): value is SubmissionForm {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.form_instance_id === "string" &&
    typeof value.template_key === "string" &&
    typeof value.is_submitted === "boolean" &&
    Array.isArray(value.fields) &&
    value.fields.every(isDynamicFormField) &&
    isRecord(value.values) &&
    isRecord(value.reviews)
  );
}

function isDynamicFormField(value: unknown) {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.field_key === "string" &&
    typeof value.label === "string" &&
    typeof value.field_type === "string" &&
    typeof value.is_required === "boolean" &&
    typeof value.order_index === "number" &&
    (value.help_text === undefined ||
      value.help_text === null ||
      typeof value.help_text === "string") &&
    (value.options === undefined ||
      value.options === null ||
      Array.isArray(value.options)) &&
    (value.validation_rules === undefined ||
      value.validation_rules === null ||
      isRecord(value.validation_rules)) &&
    (value.attachment === undefined || value.attachment === null || isAttachment(value.attachment))
  );
}

function isSaveResult(value: unknown): value is SaveSubmissionDraftResult {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    typeof value.form_instance_id === "string"
  );
}

function isSubmitResult(value: unknown): value is SubmitSubmissionResult {
  return (
    isRecord(value) &&
    typeof value.activity_key === "string" &&
    typeof value.run_number === "number" &&
    typeof value.status === "string" &&
    (value.artifact_id === undefined ||
      value.artifact_id === null ||
      typeof value.artifact_id === "string")
  );
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
