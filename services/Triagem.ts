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
  const [error, response] = await tryit(() => http.get<unknown>("/processes", { headers: authHeaders(accessToken), params: { status: "TRIAGE", page, size } }))();
  if (error) return { ok: false, status: getStatus(error) };
  return isProcessList(response.data) ? { ok: true, data: response.data } : { ok: false };
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
  return isTimeline(response.data) ? { ok: true, data: { ...response.data, events: response.data.events.slice().sort((first, second) => new Date(second.occurred_at).getTime() - new Date(first.occurred_at).getTime()) } } : { ok: false };
}

function isProcessList(value: unknown): value is ProcessList {
  return isRecord(value) && Array.isArray(value.items) && value.items.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.code === "string" && typeof item.title === "string" && typeof item.status === "string" && typeof item.template_key === "string" && typeof item.version_number === "number") && typeof value.total === "number" && typeof value.page === "number" && typeof value.size === "number";
}

function isDecision(value: unknown): value is TriageDecisionResult {
  return isRecord(value) && typeof value.process_id === "string" && typeof value.new_process_status === "string" && typeof value.decision_id === "string" && typeof value.outcome === "string";
}

function isTimeline(value: unknown): value is TriageTimeline {
  return isRecord(value) && typeof value.process_id === "string" && typeof value.code === "string" && Array.isArray(value.events) && value.events.every(isTimelineEvent);
}

function isTimelineEvent(value: unknown): value is TriageTimelineEvent {
  return isRecord(value) && typeof value.id === "string" && typeof value.event_type === "string" && typeof value.occurred_at === "string";
}

function authHeaders(accessToken: string) { return { Cookie: `access_token=${accessToken}` }; }
function mutationHeaders(accessToken: string) { return { ...authHeaders(accessToken), Origin: apiOrigin }; }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function getStatus(error: Error) { return isAxiosError(error) ? error.response?.status : undefined; }
