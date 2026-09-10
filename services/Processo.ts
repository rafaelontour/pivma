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
      params: options,
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  if (!isProcessList(response.data)) {
    return { ok: false };
  }

  return { ok: true, data: response.data };
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

  if (!isProcessInstance(response.data)) {
    return { ok: false };
  }

  return { ok: true, data: response.data };
}

export function canReadProcessKanban(permissions: string[]) {
  return PROCESS_KANBAN_PERMISSION_CODES.some((permission) =>
    permissions.includes(permission),
  );
}

function isProcessList(value: unknown): value is ProcessList {
  if (!value || typeof value !== "object") {
    return false;
  }

  const list = value as ApiRecord;
  return (
    Array.isArray(list.items) &&
    list.items.every(isProcessInstance) &&
    typeof list.total === "number" &&
    typeof list.page === "number" &&
    typeof list.size === "number"
  );
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
    isOptionalNullableString(process.started_at) &&
    isOptionalNullableString(process.closed_at) &&
    isOptionalNullableString(process.closure_reason)
  );
}

function isOptionalNullableString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
