import "server-only";

import { Readable } from "node:stream";
import { isAxiosError } from "axios";
import { tryit } from "radash";
import { http } from "./Http";
import type {
  AiHistoryOptions,
  AiPipelineExecution,
  AiStepExecution,
  ObservabilityStream,
  OperationalEvent,
  OperationalHistoryOptions,
} from "@/types/Observabilidade";
import type { ApiRecord, ServiceResult } from "@/types/Servico";

export async function getOperationalHistory(
  accessToken: string,
  options: OperationalHistoryOptions,
): Promise<ServiceResult<OperationalEvent[]>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>("/admin/logs/operational", {
      headers: authHeaders(accessToken),
      params: {
        limit: options.limit,
        ...(options.status ? { status: options.status } : {}),
        ...(options.operationType
          ? { operation_type: options.operationType }
          : {}),
      },
    }),
  )();

  if (error) return { ok: false, status: getStatus(error) };
  if (!Array.isArray(response.data) || !response.data.every(isOperationalEvent)) {
    return { ok: false };
  }
  return { ok: true, data: response.data };
}

export async function getAiHistory(
  accessToken: string,
  options: AiHistoryOptions,
): Promise<ServiceResult<AiPipelineExecution[]>> {
  const [error, response] = await tryit(() =>
    http.get<unknown>("/admin/logs/ai", {
      headers: authHeaders(accessToken),
      params: {
        limit: options.limit,
        ...(options.correlationId
          ? { correlation_id: options.correlationId }
          : {}),
      },
    }),
  )();

  if (error) return { ok: false, status: getStatus(error) };
  if (!Array.isArray(response.data) || !response.data.every(isAiPipelineExecution)) {
    return { ok: false };
  }
  return { ok: true, data: response.data };
}

export async function openOperationalStream(
  accessToken: string,
  signal: AbortSignal,
) {
  return openStream("/admin/logs/operational/stream", accessToken, signal);
}

export async function openAiStream(
  accessToken: string,
  signal: AbortSignal,
) {
  return openStream("/admin/logs/ai/stream", accessToken, signal);
}

async function openStream(
  path: string,
  accessToken: string,
  signal: AbortSignal,
): Promise<ServiceResult<ObservabilityStream>> {
  const [error, response] = await tryit(() =>
    http.get<Readable>(path, {
      headers: { ...authHeaders(accessToken), Accept: "text/event-stream" },
      responseType: "stream",
      signal,
    }),
  )();

  if (error) return { ok: false, status: getStatus(error) };
  if (!(response.data instanceof Readable)) return { ok: false };
  return {
    ok: true,
    data: {
      body: Readable.toWeb(response.data) as ReadableStream<Uint8Array>,
    },
  };
}

function isOperationalEvent(value: unknown): value is OperationalEvent {
  if (!isRecord(value)) return false;
  return (
    typeof value.operation_type === "string" &&
    typeof value.correlation_id === "string" &&
    typeof value.total_duration_ms === "number" &&
    isOptionalString(value.event_id) &&
    isOptionalString(value.timestamp) &&
    isOptionalString(value.status) &&
    isOptionalRecord(value.metadata)
  );
}

function isAiPipelineExecution(value: unknown): value is AiPipelineExecution {
  if (!isRecord(value) || typeof value.correlation_id !== "string") return false;
  return (
    isOptionalString(value.pipeline_name) &&
    isOptionalString(value.status) &&
    (value.steps === undefined ||
      (Array.isArray(value.steps) && value.steps.every(isAiStepExecution)))
  );
}

function isAiStepExecution(value: unknown): value is AiStepExecution {
  if (!isRecord(value)) return false;
  return (
    typeof value.correlation_id === "string" &&
    typeof value.field_key === "string" &&
    typeof value.step_order === "number" &&
    typeof value.step_name === "string" &&
    typeof value.step_duration_ms === "number"
  );
}

function authHeaders(accessToken: string) {
  return { Cookie: `access_token=${accessToken}` };
}

function isOptionalString(value: unknown) {
  return value === undefined || value === null || typeof value === "string";
}

function isOptionalRecord(value: unknown) {
  return value === undefined || isRecord(value);
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
