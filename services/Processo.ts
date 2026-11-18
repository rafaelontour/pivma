import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { getApiOrigin, http } from "./Http";
import { listCurrentTasks } from "./Tarefa";
import { hasProcessKanbanAccess } from "@/types/Processo";
import type {
  ProcessInstance,
  ProcessList,
  ProcessListOptions,
} from "@/types/Processo";
import type { AssignedPermissionProfile } from "@/types/Rbac";
import type { SessionAccessScope } from "@/types/ParticipacaoEscopo";
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
    return {
      ok: false,
      status: getStatus(error),
      code: getBackendCode(error),
      message: getBackendMessage(error),
    };
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
    return {
      ok: false,
      status: getStatus(error),
      code: getBackendCode(error),
      message: getBackendMessage(error),
    };
  }

  const data = normalizeProcessInstance(response.data);
  if (!data) {
    return { ok: false };
  }

  return { ok: true, data };
}

export async function deleteProcess(
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
    return {
      ok: false,
      status: getStatus(error),
      code: getBackendCode(error),
      message: getBackendMessage(error),
    };
  }

  return { ok: true, data: null };
}

export function canReadProcessKanban(
  permissions: string[],
  scopes: SessionAccessScope[],
  profiles: Pick<AssignedPermissionProfile, "name">[] = [],
) {
  const hasProcessParticipantScope = scopes.some((scope) => scope.roles.length > 0);
  return hasProcessKanbanAccess(permissions, profiles) || hasProcessParticipantScope;
}

export async function listVisibleProcessesFallback(
  accessToken: string,
  scopes: SessionAccessScope[],
  includeTaskProcesses: boolean,
  options: ProcessListOptions,
): Promise<ServiceResult<ProcessList>> {
  const processIds = new Set(scopes.map((scope) => scope.process_id));

  if (includeTaskProcesses) {
    let taskPage = 1;
    let visitedTasks = 0;
    let totalTasks = 0;
    do {
      const tasks = await listCurrentTasks(accessToken, { page: taskPage, size: 100 });
      if (!tasks.ok) return tasks;
      tasks.data.items.forEach((task) => processIds.add(task.process.id));
      visitedTasks += tasks.data.items.length;
      totalTasks = tasks.data.total;
      taskPage += 1;
      if (tasks.data.items.length === 0) break;
    } while (visitedTasks < totalTasks);
  }

  const processIdList = Array.from(processIds);
  const processes: ProcessInstance[] = [];
  const batchSize = 10;
  for (let index = 0; index < processIdList.length; index += batchSize) {
    const batch = await Promise.all(
      processIdList.slice(index, index + batchSize).map((processId) =>
        getProcess(accessToken, processId)),
    );
    const failed = batch.find((result) => !result.ok);
    if (failed && !failed.ok) return failed;
    processes.push(...batch.flatMap((result) => result.ok ? [result.data] : []));
  }

  const filtered = options.status
    ? processes.filter((process) => process.status === options.status)
    : processes;
  filtered.sort((first, second) => first.code.localeCompare(second.code, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  }));
  const offset = (options.page - 1) * options.size;
  return {
    ok: true,
    data: {
      items: filtered.slice(offset, offset + options.size),
      total: filtered.length,
      page: options.page,
      size: options.size,
    },
  };
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

function getBackendCode(error: Error) {
  if (!isAxiosError(error)) return undefined;
  const responseData = error.response?.data;
  if (!responseData || typeof responseData !== "object") return undefined;
  const detail = (responseData as ApiRecord).detail;
  if (!detail || typeof detail !== "object") return undefined;
  const code = (detail as ApiRecord).code;
  return typeof code === "string" ? code : undefined;
}

function getBackendMessage(error: Error) {
  if (!isAxiosError(error)) return undefined;
  const responseData = error.response?.data;
  if (!responseData || typeof responseData !== "object") return undefined;
  const detail = (responseData as ApiRecord).detail;
  if (!detail || typeof detail !== "object") return undefined;
  const message = (detail as ApiRecord).message;
  return typeof message === "string" ? message : undefined;
}
