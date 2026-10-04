import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { apiOrigin, http } from "./Http";
import type { ProcessList } from "@/types/Processo";
import type { ApiRecord, ServiceResult } from "@/types/Servico";
import type {
  SaveTriageFeedbackInput,
  SaveTriageFeedbackResult,
  SaveTriageFieldReviewsInput,
  SaveTriageFieldReviewsResult,
  TriageDecisionInput,
  TriageDecisionResult,
  TriageTimeline,
  TriageTimelineEvent,
} from "@/types/Triagem";

export async function listTriageProcesses(accessToken: string, page: number, size: number): Promise<ServiceResult<ProcessList>> {
  const [error, response] = await tryit(() => http.get<unknown>("/processes", { headers: authHeaders(accessToken), params: { page, per_page: size } }))();
  if (error) return { ok: false, status: getStatus(error) };
  const data = normalizeProcessList(response.data);
  return data ? { ok: true, data } : { ok: false };
}

export async function saveTriageFieldReviews(accessToken: string, processId: string, input: SaveTriageFieldReviewsInput): Promise<ServiceResult<SaveTriageFieldReviewsResult>> {
  const [error, response] = await tryit(() => http.post<unknown>(`/processes/${processId}/triage/reviews`, input, { headers: mutationHeaders(accessToken) }))();
  if (error) return { ok: false, status: getStatus(error) };
  return isRecord(response.data) ? { ok: true, data: response.data } : { ok: true, data: {} };
}

export async function saveTriageFeedback(accessToken: string, processId: string, runId: string, input: SaveTriageFeedbackInput): Promise<ServiceResult<SaveTriageFeedbackResult>> {
  const [error, response] = await tryit(() => http.post<unknown>(`/processes/${processId}/pre-evaluation/${runId}/feedback`, input, { headers: mutationHeaders(accessToken) }))();
  if (error) return { ok: false, status: getStatus(error) };
  return isRecord(response.data) && typeof response.data.recorded === "number" ? { ok: true, data: { recorded: response.data.recorded } } : { ok: false };
}

export async function submitTriageDecision(accessToken: string, processId: string, input: TriageDecisionInput): Promise<ServiceResult<TriageDecisionResult>> {
  const [error, response] = await tryit(() => http.post<unknown>(`/processes/${processId}/triage/decision`, input, { headers: mutationHeaders(accessToken) }))();
  if (error) return { ok: false, status: getStatus(error) };
  return isDecision(response.data) ? { ok: true, data: response.data } : { ok: false };
}

export async function getTriageTimeline(accessToken: string, processId: string): Promise<ServiceResult<TriageTimeline>> {
  const [error, response] = await tryit(() => http.get<unknown>(`/processes/${processId}/timeline`, { headers: authHeaders(accessToken) }))();
  if (error) return { ok: false, status: getStatus(error) };
  const data = normalizeTimeline(response.data, processId);
  return data ? { ok: true, data } : { ok: false };
}

function normalizeProcessList(value: unknown): ProcessList | null {
  if (!isRecord(value) || !Array.isArray(value.data) || !isRecord(value.pagination)) return null;
  const items = value.data.map((item) => {
    if (!isRecord(item) || !isRecord(item.template)) return null;
    const template = item.template;
    if (typeof template.key !== "string" || typeof template.version !== "number") return null;
    const normalized = { ...item, template_key: template.key, version_number: template.version } as ApiRecord;
    return typeof normalized.id === "string" && typeof normalized.code === "string" && typeof normalized.title === "string" && typeof normalized.status === "string" && typeof normalized.template_key === "string" && typeof normalized.version_number === "number" ? normalized : null;
  });
  if (items.some((item) => !item) || typeof value.pagination.page !== "number" || typeof value.pagination.per_page !== "number" || typeof value.pagination.total_items !== "number") return null;
  return { items: items as ProcessList["items"], total: value.pagination.total_items, page: value.pagination.page, size: value.pagination.per_page };
}

function isDecision(value: unknown): value is TriageDecisionResult {
  return isRecord(value) && typeof value.process_id === "string" && typeof value.process_status === "string" && typeof value.decision_id === "string" && isDecisionOutcome(value.outcome) && (value.return_review_run === undefined || value.return_review_run === null || typeof value.return_review_run === "number");
}

function isDecisionOutcome(value: unknown): value is TriageDecisionResult["outcome"] {
  return value === "APPROVED" || value === "NEEDS_REVISION" || value === "REJECTED";
}

function isTimeline(value: unknown): value is TriageTimeline {
  return isRecord(value) && typeof value.process_id === "string" && typeof value.code === "string" && Array.isArray(value.events) && value.events.every(isTimelineEvent);
}

function normalizeTimeline(value: unknown, processId: string): TriageTimeline | null {
  if (isTimeline(value)) return { ...value, events: value.events.slice().sort(sortTimelineEvents) };
  if (!isRecord(value) || !Array.isArray(value.data) || !value.data.every(isTimelineEvent)) return null;
  return { process_id: processId, code: "", events: value.data.slice().sort(sortTimelineEvents) };
}

function sortTimelineEvents(first: TriageTimelineEvent, second: TriageTimelineEvent) {
  return new Date(second.occurred_at).getTime() - new Date(first.occurred_at).getTime();
}

function isTimelineEvent(value: unknown): value is TriageTimelineEvent {
  return isRecord(value) && typeof value.id === "string" && typeof value.event_type === "string" && typeof value.occurred_at === "string";
}

function authHeaders(accessToken: string) { return { Cookie: `access_token=${accessToken}` }; }
function mutationHeaders(accessToken: string) { return { ...authHeaders(accessToken), Origin: apiOrigin }; }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function getStatus(error: Error) { return isAxiosError(error) ? error.response?.status : undefined; }
