import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { ApiRecord } from "@/types/Servico";
import type { ProcessOperationRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function GET(_request: Request, context: ProcessOperationRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "read");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "get", `/processes/${processId}/sample-receipt/vials`);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível consultar os frascos recebidos." });
  if (!isRecord(result.data) || !Array.isArray(result.data.data) || !result.data.data.every(isRecord)) return internalApiErrorResponse(undefined, { cookieStore: authorization.cookieStore, fallbackMessage: "O serviço de recebimento retornou uma lista inválida de frascos." });
  return NextResponse.json({ data: result.data.data.map(normalizeVial) });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise o identificador do processo." }, { status: 422 }); }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function normalizeVial(value: ApiRecord): ApiRecord {
  const result: ApiRecord = {};
  for (const key of ["code", "status", "lot", "safe_handling_instructions", "ghs_hazard_pictograms", "storage_temperature_regime", "storage_temperature_min", "storage_temperature_max", "vial_nominal_quantity", "vial_unit", "packaging_type", "expiration_date", "lab_guidance"]) if (key in value) result[key] = value[key];
  if (isRecord(value.laboratory)) result.laboratory = pick(value.laboratory, ["id", "name"]);
  if (isRecord(value.receipt)) result.receipt = pick(value.receipt, ["id", "opened_at", "temperature_celsius", "package_state", "notes", "conforming", "deviations", "registered_at"]);
  if (Array.isArray(value.photos)) result.photos = value.photos.filter(isRecord).map((photo) => pick(photo, ["id", "filename", "size", "uploaded_at"]));
  return result;
}
function pick(record: ApiRecord, keys: string[]) { const result: ApiRecord = {}; for (const key of keys) if (key in record) result[key] = record[key]; return result; }
