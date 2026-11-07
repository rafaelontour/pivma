import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { ApiRecord } from "@/types/Servico";
import type { ProcessOperationRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function GET(request: Request, context: ProcessOperationRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "sample_group");
  if (!authorization.ok) return authorization.response;
  const status = new URL(request.url).searchParams.get("status");
  if (status && status !== "open" && status !== "resolved") return validationError();
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "get", `/processes/${processId}/sample-receipt/nonconformities`, undefined, status ? { status } : undefined);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível consultar as inconformidades de recebimento." });
  if (!isRecord(result.data) || !Array.isArray(result.data.data) || !result.data.data.every(isRecord)) return internalApiErrorResponse(undefined, { cookieStore: authorization.cookieStore, fallbackMessage: "O serviço de recebimento retornou uma lista inválida de inconformidades." });
  return NextResponse.json({ data: result.data.data.map(normalizeNonconformity) });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os filtros ou o identificador do processo." }, { status: 422 }); }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function normalizeNonconformity(value: ApiRecord): ApiRecord {
  const result: ApiRecord = {};
  for (const key of ["id", "status", "alert", "code", "deviations", "opened_at", "decision", "justification", "lab_guidance", "decided_at", "replacement_code"]) if (key in value) result[key] = value[key];
  if (isRecord(value.expected_temperature)) result.expected_temperature = pick(value.expected_temperature, ["regime", "min", "max"]);
  if (isRecord(value.receipt)) result.receipt = pick(value.receipt, ["id", "opened_at", "temperature_celsius", "package_state", "notes", "conforming", "deviations", "registered_at"]);
  if (isRecord(value.laboratory)) result.laboratory = pick(value.laboratory, ["id", "name"]);
  if (isRecord(value.substance)) result.substance = pick(value.substance, ["id", "chemical_name", "cas_number", "reserve_vials_count"]);
  if (isRecord(value.decided_by)) result.decided_by = pick(value.decided_by, ["id", "full_name", "username"]);
  if (Array.isArray(value.photos)) result.photos = value.photos.filter(isRecord).map((photo) => pick(photo, ["id", "filename", "size", "uploaded_at"]));
  return result;
}
function pick(record: ApiRecord, keys: string[]) { const result: ApiRecord = {}; for (const key of keys) if (key in record) result[key] = record[key]; return result; }
