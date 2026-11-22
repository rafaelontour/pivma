import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { http } from "./Http";
import type {
  ProcessTask,
  ProcessTaskDetail,
  ProcessTaskList,
  ProcessTaskListOptions,
  ProcessTaskStatus,
} from "@/types/Tarefa";
import type { ApiRecord, ServiceResult } from "@/types/Servico";

const TASK_STATUSES = new Set<ProcessTaskStatus>([
  "READY",
  "COMPLETED",
  "CANCELLED",
]);

export async function listCurrentTasks(
  accessToken: string,
  options: ProcessTaskListOptions,
): Promise<ServiceResult<ProcessTaskList>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>("/tasks", {
      headers: { Cookie: `access_token=${accessToken}` },
      params: {
        page: options.page,
        per_page: options.size,
        current_run: true,
      },
    }),
  )();

  if (error) return { ok: false, status: getStatus(error) };

  const data = normalizeTaskList(response.data);
  return data ? { ok: true, data } : { ok: false };
}

export async function getTaskDetail(accessToken: string, taskId: string): Promise<ServiceResult<ProcessTaskDetail>> {
  const [error, response] = await tryit(() => http.get<unknown>(`/tasks/${encodeURIComponent(taskId)}`, {
    headers: { Cookie: `access_token=${accessToken}` },
  }))();
  if (error) return { ok: false, status: getStatus(error) };
  const value = response.data;
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.process_id !== "string" ||
      typeof value.activity_key !== "string" || typeof value.activity_run_number !== "number" ||
      typeof value.title !== "string" || typeof value.status !== "string" ||
      typeof value.is_blocked !== "boolean" || typeof value.activity_run_status !== "string") return { ok: false };
  const laboratory = value.laboratory;
  if (laboratory !== undefined && laboratory !== null && (!isRecord(laboratory) || typeof laboratory.id !== "string" || typeof laboratory.name !== "string")) return { ok: false };
  return { ok: true, data: value as ProcessTaskDetail };
}

export function normalizeTaskList(value: unknown): ProcessTaskList | null {
  if (!isRecord(value) || !Array.isArray(value.data) || !isRecord(value.pagination)) {
    return null;
  }

  const items = value.data.map(normalizeTask);
  const pagination = value.pagination;
  if (
    items.some((item) => !item) ||
    typeof pagination.page !== "number" ||
    typeof pagination.per_page !== "number" ||
    typeof pagination.total_items !== "number"
  ) {
    return null;
  }

  return {
    items: items as ProcessTask[],
    total: pagination.total_items,
    page: pagination.page,
    size: pagination.per_page,
  };
}

function normalizeTask(value: unknown): ProcessTask | null {
  if (!isRecord(value) || !isRecord(value.process) || !isRecord(value.phase)) {
    return null;
  }

  const process = value.process;
  const phase = value.phase;
  if (
    typeof value.id !== "string" ||
    typeof process.id !== "string" ||
    typeof process.code !== "string" ||
    typeof process.title !== "string" ||
    typeof value.activity_key !== "string" ||
    typeof value.activity_run_number !== "number" ||
    typeof phase.key !== "string" ||
    typeof phase.order !== "number" ||
    typeof value.title !== "string" ||
    (value.assigned_role !== undefined &&
      value.assigned_role !== null &&
      typeof value.assigned_role !== "string") ||
    typeof value.status !== "string" ||
    !TASK_STATUSES.has(value.status as ProcessTaskStatus) ||
    (value.due_date !== undefined &&
      value.due_date !== null &&
      typeof value.due_date !== "string") ||
    typeof value.can_act !== "boolean"
  ) {
    return null;
  }

  return {
    ...value,
    assigned_role: value.assigned_role ?? null,
    due_date: value.due_date ?? null,
  } as ProcessTask;
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
