import type {
  AiPipelineExecution,
  AiStepExecution,
  OperationalEvent,
  OperationalFilters,
} from "@/types/Observabilidade";
import type { ApiRecord } from "@/types/Servico";

export const MAX_OPERATIONAL_EVENTS = 500;
export const MAX_AI_EXECUTIONS = 200;

export function parseSseData(value: string): unknown {
  try {
    const parsed = JSON.parse(value) as unknown;
    return isRecord(parsed) && "data" in parsed ? parsed.data : parsed;
  } catch {
    return null;
  }
}

export function isOperationalEvent(value: unknown): value is OperationalEvent {
  return (
    isRecord(value) &&
    typeof value.operation_type === "string" &&
    typeof value.correlation_id === "string" &&
    typeof value.total_duration_ms === "number" &&
    isOptionalString(value.event_id) &&
    isOptionalString(value.timestamp) &&
    isOptionalString(value.status) &&
    (value.metadata === undefined || isRecord(value.metadata))
  );
}

export function isAiStepExecution(value: unknown): value is AiStepExecution {
  return (
    isRecord(value) &&
    typeof value.correlation_id === "string" &&
    typeof value.field_key === "string" &&
    typeof value.step_order === "number" &&
    typeof value.step_name === "string" &&
    typeof value.step_duration_ms === "number"
  );
}

export function isAiPipelineExecution(
  value: unknown,
): value is AiPipelineExecution {
  return (
    isRecord(value) &&
    typeof value.correlation_id === "string" &&
    (value.steps === undefined ||
      (Array.isArray(value.steps) && value.steps.every(isAiStepExecution)))
  );
}

export function mergeOperationalEvents(
  current: OperationalEvent[],
  incoming: OperationalEvent[],
) {
  const byId = new Map(
    current.map((event) => [operationalEventKey(event), event]),
  );
  for (const event of incoming) byId.set(operationalEventKey(event), event);
  return [...byId.values()]
    .sort((first, second) => eventTime(second.timestamp) - eventTime(first.timestamp))
    .slice(0, MAX_OPERATIONAL_EVENTS);
}

export function operationalEventMatches(
  event: OperationalEvent,
  filters: OperationalFilters,
) {
  return (
    (!filters.status.trim() || event.status === filters.status.trim()) &&
    (!filters.operationType.trim() ||
      event.operation_type === filters.operationType.trim())
  );
}

export function mergeAiExecutions(
  current: AiPipelineExecution[],
  incoming: Array<AiPipelineExecution | AiStepExecution>,
) {
  const byCorrelation = new Map(
    current.map((execution) => [execution.correlation_id, execution]),
  );

  for (const item of incoming) {
    if (isAiStepExecution(item)) {
      const existing = byCorrelation.get(item.correlation_id);
      byCorrelation.set(item.correlation_id, {
        ...existing,
        correlation_id: item.correlation_id,
        pipeline_name: item.pipeline_name ?? existing?.pipeline_name,
        field_key: item.field_key || existing?.field_key,
        status: item.status ?? existing?.status,
        steps: mergeAiSteps(existing?.steps ?? [], [item]),
      });
      continue;
    }

    const existing = byCorrelation.get(item.correlation_id);
    byCorrelation.set(item.correlation_id, {
      ...existing,
      ...item,
      steps: mergeAiSteps(existing?.steps ?? [], item.steps ?? []),
    });
  }

  return [...byCorrelation.values()]
    .sort((first, second) => executionTime(second) - executionTime(first))
    .slice(0, MAX_AI_EXECUTIONS);
}

export function safePayload(value: unknown) {
  if (value === undefined || value === null) return "Conteúdo não disponibilizado.";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function mergeAiSteps(current: AiStepExecution[], incoming: AiStepExecution[]) {
  const byId = new Map(current.map((step) => [aiStepKey(step), step]));
  for (const step of incoming) byId.set(aiStepKey(step), step);
  return [...byId.values()].sort(
    (first, second) => first.step_order - second.step_order,
  );
}

function operationalEventKey(event: OperationalEvent) {
  return (
    event.event_id ??
    `${event.correlation_id}:${event.operation_type}:${event.timestamp ?? ""}:${event.resource_id ?? ""}`
  );
}

function aiStepKey(step: AiStepExecution) {
  return (
    step.event_id ??
    `${step.correlation_id}:${step.field_key}:${step.step_order}:${step.step_name}`
  );
}

function executionTime(execution: AiPipelineExecution) {
  return eventTime(execution.started_at ?? execution.completed_at ?? undefined);
}

function eventTime(value: string | undefined) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function isOptionalString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
