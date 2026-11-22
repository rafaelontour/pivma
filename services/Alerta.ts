import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { http } from "./Http";
import { normalizeAlertList, normalizeAlertReadAll, normalizeUserAlert } from "@/types/Alerta";
import type { AlertListOptions, AlertListResponse, AlertReadAllResponse, UserAlert } from "@/types/Alerta";
import type { ServiceResult } from "@/types/Servico";

export async function listAlerts(accessToken: string, options: AlertListOptions): Promise<ServiceResult<AlertListResponse>> {
  const [error, response] = await tryit(() => http.get<unknown>("/alerts", {
    headers: { Cookie: `access_token=${accessToken}` },
    params: { page: options.page, per_page: options.perPage, ...(options.unread === undefined ? {} : { unread: options.unread }) },
  }))();
  if (error) return failure(error);
  const data = normalizeAlertList(response.data);
  return data ? { ok: true, data } : { ok: false };
}

export async function markAlertRead(accessToken: string, alertId: string, origin: string): Promise<ServiceResult<UserAlert>> {
  const [error, response] = await tryit(() => http.post<unknown>(`/alerts/${encodeURIComponent(alertId)}/read`, undefined, {
    headers: { Cookie: `access_token=${accessToken}`, Origin: origin },
  }))();
  if (error) return failure(error);
  const data = normalizeUserAlert(response.data);
  return data ? { ok: true, data } : { ok: false };
}

export async function markAllAlertsRead(accessToken: string, origin: string): Promise<ServiceResult<AlertReadAllResponse>> {
  const [error, response] = await tryit(() => http.post<unknown>("/alerts/read-all", undefined, {
    headers: { Cookie: `access_token=${accessToken}`, Origin: origin },
  }))();
  if (error) return failure(error);
  const data = normalizeAlertReadAll(response.data);
  return data ? { ok: true, data } : { ok: false };
}

function failure(error: Error): ServiceResult<never> {
  if (!isAxiosError(error)) return { ok: false };
  const detail = error.response?.data && typeof error.response.data === "object"
    ? (error.response.data as Record<string, unknown>).detail : null;
  const code = detail && typeof detail === "object" && typeof (detail as Record<string, unknown>).code === "string"
    ? (detail as Record<string, unknown>).code as string : undefined;
  const message = detail && typeof detail === "object" && typeof (detail as Record<string, unknown>).message === "string"
    ? (detail as Record<string, unknown>).message as string : undefined;
  return { ok: false, status: error.response?.status, code, message };
}
