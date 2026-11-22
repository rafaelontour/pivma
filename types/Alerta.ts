export type AlertKind =
  | "task_opened"
  | "submission_status_changed"
  | "structure_approved"
  | "process_withdrawn"
  | "assignment_created"
  | "assignment_revoked"
  | "assignment_effectiveness_changed"
  | "laboratory_run_completed"
  | "laboratory_run_waived"
  | "sample_nonconformity_decided";

export type AlertParameter = string | number | boolean | null;

export type AlertTarget = {
  type: string;
  process_id: string;
  id: string | null;
};

export type UserAlert = {
  id: string;
  kind: string;
  target: AlertTarget;
  params: Record<string, AlertParameter>;
  read_at: string | null;
  created_at: string;
};

export type AlertListResponse = {
  data: UserAlert[];
  pagination: {
    page: number;
    per_page: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
  filters_applied: { unread: boolean | null };
  sort: { by: "created_at"; order: "desc" };
  unread_count: number;
};

export type AlertListOptions = {
  page: number;
  perPage: number;
  unread?: boolean;
};

export type AlertReadAllResponse = { updated: number };

export function reconcileAlertRead(list: AlertListResponse, alertId: string, readAt: string, unreadOnly: boolean): AlertListResponse {
  const wasUnread = list.data.some((alert) => alert.id === alertId && alert.read_at === null);
  return {
    ...list,
    data: unreadOnly
      ? list.data.filter((alert) => alert.id !== alertId)
      : list.data.map((alert) => alert.id === alertId && alert.read_at === null ? { ...alert, read_at: readAt } : alert),
    unread_count: wasUnread ? Math.max(0, list.unread_count - 1) : list.unread_count,
  };
}

export function reconcileAllAlertsRead(list: AlertListResponse, readAt: string, unreadOnly: boolean): AlertListResponse {
  return {
    ...list,
    data: unreadOnly ? [] : list.data.map((alert) => alert.read_at === null ? { ...alert, read_at: readAt } : alert),
    unread_count: 0,
  };
}

export type AlertPanelState = "closed" | "loading" | "ready" | "error";
export type AlertCenterProps = { module: import("./AreaAutenticada").AuthenticatedModule };
export type AlertReadRouteContext = { params: Promise<{ alertId: string }> };

export function resolveAlertDestination(target: AlertTarget, module: import("./AreaAutenticada").AuthenticatedModule, activityKey?: string): string | null {
  if (!isUuid(target.process_id)) return null;
  const processId = encodeURIComponent(target.process_id);
  if (target.type === "process") {
    return module === "proponent" ? `/submissoes?processId=${processId}`
      : module === "sponsor" ? `/acompanhamento/${processId}`
        : module === "group_manager" ? `/grupo/${processId}` : `/processos?processId=${processId}`;
  }
  if (target.type === "sample_receipt") {
    return target.id && isUuid(target.id) ? `/processos/${processId}/recebimento-amostras?vialId=${encodeURIComponent(target.id)}` : null;
  }
  if (target.type !== "task" || !target.id || !isUuid(target.id) || !activityKey) return null;
  return activityKey === "triage_evaluation" ? `/triagem?processId=${processId}`
    : activityKey === "submission_return_review" ? `/submissoes?processId=${processId}`
      : activityKey.startsWith("assign_") ? `/processos/${processId}/composicao`
        : activityKey === "structure_approval" ? `/processos/${processId}/amostras`
          : activityKey === "sample_receipt_resolution" ? `/processos/${processId}/amostras`
            : module === "sponsor" ? `/acompanhamento/${processId}`
              : module === "group_manager" ? `/grupo/${processId}` : `/processos?processId=${processId}`;
}

export function normalizeAlertDate(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/.test(value)) return null;
  const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/.test(value);
  const date = new Date(hasTimezone ? value : `${value}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function normalizeUserAlert(value: unknown): UserAlert | null {
  if (!isRecord(value) || !isRecord(value.target) || !isRecord(value.params)) return null;
  const { target } = value;
  if (typeof value.id !== "string" || typeof value.kind !== "string" ||
      typeof target.type !== "string" || typeof target.process_id !== "string" ||
      !(typeof target.id === "string" || target.id === null) ||
      !(typeof value.read_at === "string" || value.read_at === null) ||
      typeof value.created_at !== "string") return null;

  const params: Record<string, AlertParameter> = {};
  for (const [key, param] of Object.entries(value.params)) {
    if (typeof param === "string" || typeof param === "number" || typeof param === "boolean" || param === null) params[key] = param;
    else return null;
  }
  const createdAt = normalizeAlertDate(value.created_at);
  const readAt = value.read_at === null ? null : normalizeAlertDate(value.read_at);
  if (!createdAt || (value.read_at !== null && !readAt)) return null;
  return { id: value.id, kind: value.kind, target: { type: target.type, process_id: target.process_id, id: target.id }, params, read_at: readAt, created_at: createdAt };
}

export function normalizeAlertList(value: unknown): AlertListResponse | null {
  if (!isRecord(value) || !Array.isArray(value.data) || !isRecord(value.pagination) || !isRecord(value.filters_applied) || !isRecord(value.sort)) return null;
  const alerts = value.data.map(normalizeUserAlert);
  const p = value.pagination;
  if (alerts.some((alert) => !alert) || !numberFields(p, ["page", "per_page", "total_items", "total_pages"]) ||
      (p.page as number) < 1 || (p.per_page as number) < 1 ||
      typeof p.has_next !== "boolean" || typeof p.has_prev !== "boolean" ||
      !(value.filters_applied.unread === null || typeof value.filters_applied.unread === "boolean") ||
      value.sort.by !== "created_at" || value.sort.order !== "desc" || !Number.isInteger(value.unread_count) || (value.unread_count as number) < 0) return null;
  return { data: alerts as UserAlert[], pagination: { page: p.page as number, per_page: p.per_page as number, total_items: p.total_items as number, total_pages: p.total_pages as number, has_next: p.has_next, has_prev: p.has_prev }, filters_applied: { unread: value.filters_applied.unread }, sort: { by: "created_at", order: "desc" }, unread_count: value.unread_count as number };
}

export function normalizeAlertReadAll(value: unknown): AlertReadAllResponse | null {
  return isRecord(value) && Number.isInteger(value.updated) && (value.updated as number) >= 0 ? { updated: value.updated as number } : null;
}

function numberFields(value: Record<string, unknown>, fields: string[]) {
  return fields.every((field) => Number.isInteger(value[field]) && (value[field] as number) >= 0);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
