import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { http } from "./Http";
import type { CollectionTemplate, CollectionTemplateColumn, CollectionTemplateColumnInput, CollectionTemplateInput, CollectionTemplateSummary } from "@/types/TemplateColeta";
import type { ApiRecord, ServiceResult } from "@/types/Servico";

const PAGE_SIZE = 100;

export async function listCollectionTemplates(accessToken: string): Promise<ServiceResult<CollectionTemplateSummary[]>> {
  const items: CollectionTemplateSummary[] = [];
  for (let page = 1; page < 1000; page += 1) {
    const result = await request<unknown>(accessToken, "get", "/collection-templates", undefined, { page, per_page: PAGE_SIZE });
    if (!result.ok) return result;
    if (!isRecord(result.data) || !Array.isArray(result.data.data) || !isRecord(result.data.pagination) || typeof result.data.pagination.has_next !== "boolean") return { ok: false };
    const normalized = result.data.data.map(normalizeTemplateSummary);
    if (normalized.some((item) => !item)) return { ok: false };
    items.push(...normalized as CollectionTemplateSummary[]);
    if (!result.data.pagination.has_next) return { ok: true, data: items };
  }
  return { ok: false, status: 502 };
}

export async function getCollectionTemplate(accessToken: string, templateId: string) {
  const result = await request<unknown>(accessToken, "get", `/collection-templates/${templateId}`);
  if (!result.ok) return result;
  const template = normalizeTemplate(result.data);
  return template ? { ok: true as const, data: template } : { ok: false as const };
}

export async function createCollectionTemplate(accessToken: string, input: CollectionTemplateInput) {
  return normalizeTemplateResult(await request<unknown>(accessToken, "post", "/collection-templates", input));
}

export async function updateCollectionTemplate(accessToken: string, templateId: string, input: Partial<CollectionTemplateInput>) {
  return normalizeTemplateResult(await request<unknown>(accessToken, "patch", `/collection-templates/${templateId}`, input));
}

export async function addCollectionTemplateColumn(accessToken: string, templateId: string, input: CollectionTemplateColumnInput) {
  const result = await request<unknown>(accessToken, "post", `/collection-templates/${templateId}/columns`, input);
  if (!result.ok) return result;
  const column = normalizeColumn(result.data);
  return column ? { ok: true as const, data: column } : { ok: false as const };
}

export async function updateCollectionTemplateColumn(accessToken: string, templateId: string, columnId: string, input: Partial<CollectionTemplateColumnInput>) {
  const result = await request<unknown>(accessToken, "patch", `/collection-templates/${templateId}/columns/${columnId}`, input);
  if (!result.ok) return result;
  const column = normalizeColumn(result.data);
  return column ? { ok: true as const, data: column } : { ok: false as const };
}

export async function deleteCollectionTemplateColumn(accessToken: string, templateId: string, columnId: string) {
  return request<null>(accessToken, "delete", `/collection-templates/${templateId}/columns/${columnId}`);
}

export async function downloadCollectionTemplate(accessToken: string, templateId: string, format: "csv" | "xlsx") {
  const [error, response] = await tryit(() => http.get<unknown>(`/collection-templates/${templateId}/file`, {
    headers: authHeaders(accessToken), params: { format }, responseType: "arraybuffer",
  }))();
  if (error) return serviceError(error);
  return { ok: true as const, data: { bytes: response.data as ArrayBuffer, contentType: response.headers["content-type"] as string | undefined, disposition: response.headers["content-disposition"] as string | undefined } };
}

async function request<T>(accessToken: string, method: "get" | "post" | "patch" | "delete", path: string, data?: unknown, params?: Record<string, number>) : Promise<ServiceResult<T>> {
  const [error, response] = await tryit(() => http.request<T>({ url: path, method, data, params, headers: authHeaders(accessToken) }))();
  if (error) return serviceError(error);
  return { ok: true, data: response.data === undefined ? null as T : response.data };
}

function normalizeTemplateResult(result: ServiceResult<unknown>): ServiceResult<CollectionTemplate> {
  if (!result.ok) return result;
  const template = normalizeTemplate(result.data);
  return template ? { ok: true, data: template } : { ok: false };
}

function normalizeTemplate(value: unknown): CollectionTemplate | null {
  if (!isRecord(value) || !Array.isArray(value.columns)) return null;
  const summary = normalizeTemplateSummary(value);
  const columns = value.columns.map(normalizeColumn);
  return summary && columns.every((column) => column !== null) ? { ...summary, columns: columns as CollectionTemplateColumn[] } : null;
}

function normalizeTemplateSummary(value: unknown): CollectionTemplateSummary | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" || (typeof value.description !== "string" && value.description !== null) || typeof value.min_experiments !== "number" || typeof value.min_replicates !== "number" || typeof value.locked !== "boolean" || typeof value.created_at !== "string" || (typeof value.updated_at !== "string" && value.updated_at !== null)) return null;
  return { id: value.id, name: value.name, description: value.description, min_experiments: value.min_experiments, min_replicates: value.min_replicates, locked: value.locked, created_at: value.created_at, updated_at: value.updated_at };
}

function normalizeColumn(value: unknown): CollectionTemplateColumn | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.key !== "string" || typeof value.label !== "string" || !["text", "integer", "decimal", "date", "select"].includes(String(value.type)) || typeof value.required !== "boolean" || (value.options !== null && (!Array.isArray(value.options) || !value.options.every((item) => typeof item === "string"))) || typeof value.position !== "number") return null;
  return { id: value.id, key: value.key, label: value.label, type: value.type as CollectionTemplateColumn["type"], required: value.required, options: value.options as string[] | null, position: value.position };
}

function authHeaders(accessToken: string) { return { Cookie: `access_token=${accessToken}` }; }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function serviceError(error: Error): ServiceResult<never> {
  if (!isAxiosError(error)) return { ok: false };
  const value = error.response?.data;
  let body: unknown = value;
  if (value instanceof ArrayBuffer || value instanceof Uint8Array) { try { body = JSON.parse(new TextDecoder().decode(value)) as unknown; } catch { body = null; } }
  const detail = isRecord(body) && isRecord(body.detail) ? body.detail : isRecord(body) ? body : null;
  return { ok: false, status: error.response?.status, ...(detail && typeof detail.code === "string" ? { code: detail.code } : {}), ...(detail && typeof detail.message === "string" ? { message: detail.message } : {}) };
}
