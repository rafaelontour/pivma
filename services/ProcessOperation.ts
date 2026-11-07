import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { http } from "./Http";
import type { ProcessOperationMethod } from "@/types/ProcessOperations";
import type { ApiRecord, ServiceResult } from "@/types/Servico";

export async function requestProcessOperation<T>(accessToken: string, method: ProcessOperationMethod, path: string, data?: unknown, params?: Record<string, string | number | boolean>): Promise<ServiceResult<T>> {
  if (!path.startsWith("/processes/") || path.includes("..") || path.includes("//")) return { ok: false };
  const [error, response] = await tryit(() => http.request<T>({ url: path, method, data, params, headers: { Cookie: `access_token=${accessToken}` } }))();
  if (error) return serviceError(error);
  return { ok: true, data: response.data === undefined ? null as T : response.data };
}

export async function downloadProcessOperation(accessToken: string, path: string): Promise<ServiceResult<{ bytes: ArrayBuffer; contentType?: string }>> {
  if (!path.startsWith("/processes/") || path.includes("..") || path.includes("//")) return { ok: false };
  const [error, response] = await tryit(() => http.get<ArrayBuffer>(path, { headers: { Cookie: `access_token=${accessToken}` }, responseType: "arraybuffer" }))();
  if (error) return serviceError(error);
  return { ok: true, data: { bytes: response.data, contentType: response.headers["content-type"] as string | undefined } };
}

export async function requestProcessFormOperation<T>(accessToken: string, path: string, data: FormData, method: "post" | "put" = "put"): Promise<ServiceResult<T>> {
  if (!path.startsWith("/processes/") || path.includes("..") || path.includes("//")) return { ok: false };
  const [error, response] = await tryit(() => http.request<T>({ url: path, method, data, headers: { Cookie: `access_token=${accessToken}`, "Content-Type": "multipart/form-data" } }))();
  if (error) return serviceError(error);
  return { ok: true, data: response.data };
}

function serviceError(error: Error): ServiceResult<never> {
  if (!isAxiosError(error)) return { ok: false };
  const data: unknown = error.response?.data;
  let body = data;
  if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
    try { body = JSON.parse(new TextDecoder().decode(data)) as unknown; } catch { body = null; }
  }
  const detail = isRecord(body) && isRecord(body.detail) ? body.detail : isRecord(body) ? body : null;
  return { ok: false, status: error.response?.status, ...(detail && typeof detail.code === "string" ? { code: detail.code } : {}), ...(detail && typeof detail.message === "string" ? { message: detail.message } : {}) };
}

function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
