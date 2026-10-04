import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { http } from "./Http";
import { PROCESS_KANBAN_PERMISSION_CODES } from "@/types/Processo";
import type {
  ProcessInstance,
  ProcessList,
  ProcessListOptions,
} from "@/types/Processo";
import type { ApiRecord, ServiceResult } from "@/types/Servico";

export async function listProcesses(
  accessToken: string,
  options: ProcessListOptions,
): Promise<ServiceResult<ProcessList>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>("/processes", {
      headers: { Cookie: `access_token=${accessToken}` },
      params: {
        page: options.page,
        per_page: options.size,
        ...(options.status ? { status: options.status } : {}),
      },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  const data = normalizeProcessList(response.data);
  if (!data) {
    return { ok: false };
  }

  return { ok: true, data };
}

export async function getProcess(
  accessToken: string,
  processId: string,
): Promise<ServiceResult<ProcessInstance>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>(`/processes/${processId}`, {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
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

export function canReadProcessKanban(permissions: string[]) {
  return PROCESS_KANBAN_PERMISSION_CODES.some((permission) =>
    permissions.includes(permission),
  );
}

export function normalizeProcessList(value: unknown): ProcessList | null {
  if (!value || typeof value !== "object") return null;
  const response = value as ApiRecord;
  const items = Array.isArray(response.data)
    ? response.data.map(normalizeProcessInstance)
    : null;
  const pagination = response.pagination;
  if (
    !items ||
    items.some((item) => !item) ||
    !pagination ||
    typeof pagination !== "object" ||
    typeof (pagination as ApiRecord).page !== "number" ||
    typeof (pagination as ApiRecord).per_page !== "number" ||
    typeof (pagination as ApiRecord).total_items !== "number"
  ) return null;
  return {
    items: items as ProcessInstance[],
    total: (pagination as ApiRecord).total_items as number,
    page: (pagination as ApiRecord).page as number,
    size: (pagination as ApiRecord).per_page as number,
  };
}

export function normalizeProcessInstance(value: unknown): ProcessInstance | null {
  if (!value || typeof value !== "object") return null;
  const process = value as ApiRecord;
  const template = process.template;
  if (!template || typeof template !== "object") return null;
  const templateRecord = template as ApiRecord;
  if (
    typeof templateRecord.key !== "string" ||
    typeof templateRecord.version !== "number"
  ) return null;
  const normalized = {
    ...process,
    template_key: templateRecord.key,
    version_number: templateRecord.version,
  };
  return isProcessInstance(normalized) ? normalized : null;
}

function isProcessInstance(value: unknown): value is ProcessInstance {
  if (!value || typeof value !== "object") {
    return false;
  }

  const process = value as ApiRecord;
  return (
    typeof process.id === "string" &&
    typeof process.code === "string" &&
    typeof process.title === "string" &&
    typeof process.status === "string" &&
    typeof process.template_key === "string" &&
    typeof process.version_number === "number" &&
    isAvailableActions(process.available_actions) &&
    isOptionalNullableString(process.started_at) &&
    isOptionalNullableString(process.closed_at) &&
    isOptionalNullableString(process.closure_reason)
  );
}

function isAvailableActions(value: unknown) {
  return (
    value === undefined ||
    (Array.isArray(value) &&
      value.every((action) => action === "DELETE" || action === "ARCHIVE"))
  );
}

function isOptionalNullableString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
