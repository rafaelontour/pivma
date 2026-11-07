import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { validateSampleSubstance } from "@/components/process-operations";
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
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "get", `/processes/${processId}/samples`);
  if (!result.ok) return operationError(result.status, result.code, result.message, authorization.cookieStore);
  if (!isRecord(result.data) || typeof result.data.activity_status !== "string" || !Array.isArray(result.data.substances) || !result.data.substances.every(isRecord)) return operationError(undefined, undefined, undefined, authorization.cookieStore);
  const revealKey = authorization.roles.includes("sample_selection_group");
  const isLaboratory = authorization.roles.includes("lead_laboratory") || authorization.roles.includes("participating_laboratory");
  const canEditSamples = authorization.roles.includes("group_manager");
  const canReview = authorization.session.access.global_permissions.includes("triage.review");
  const substances = result.data.substances.map((item) => normalizeSubstance(item, { revealKey, revealIdentity: !isLaboratory && (canEditSamples || revealKey) }));
  return NextResponse.json({ activity_status: result.data.activity_status, substances, permissions: { canEditSamples, canDecideStructure: canReview, canRegisterReceipt: isLaboratory, canDecideNonconformity: revealKey, canManageExecution: canReview } });
}

export async function POST(request: Request, context: ProcessOperationRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();
  const parsed = validateSampleSubstance(await request.json().catch(() => null));
  if (!parsed.valid) return NextResponse.json({ code: "VALIDATION_ERROR", message: parsed.message }, { status: 422 });
  const authorization = await authorizeProcessComposition(processId, "group_manager");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "post", `/processes/${processId}/samples`, parsed.input);
  if (!result.ok) return operationError(result.status, result.code, result.message, authorization.cookieStore);
  return NextResponse.json(result.data, { status: 201 });
}

function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function normalizeSubstance(value: ApiRecord, access: { revealKey: boolean; revealIdentity: boolean }): ApiRecord {
  const result: ApiRecord = {};
  const sharedFields = ["id", "lot", "safe_handling_instructions", "ghs_hazard_pictograms", "storage_temperature_regime", "storage_temperature_min", "storage_temperature_max", "vial_nominal_quantity", "vial_unit", "packaging_type", "expiration_date", "purity", "solubility"];
  for (const key of sharedFields) if (key in value) result[key] = value[key];
  if (access.revealIdentity) for (const key of ["chemical_name", "cas_number"]) if (key in value) result[key] = value[key];
  if (access.revealKey && "reference_classification" in value) result.reference_classification = value.reference_classification;
  if (access.revealIdentity && isRecord(value.sds)) result.sds = pick(value.sds, ["id", "filename", "size", "uploaded_at"]);
  if (access.revealKey && Array.isArray(value.blind_codes)) result.blind_codes = value.blind_codes.filter(isRecord).map((code) => pick(code, ["code", "laboratory_id", "laboratory_name"]));
  return result;
}
function pick(record: ApiRecord, keys: string[]) { const result: ApiRecord = {}; for (const key of keys) if (key in record) result[key] = record[key]; return result; }
function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise o identificador do processo." }, { status: 422 }); }
function operationError(status: number | undefined, backendCode: string | undefined, backendMessage: string | undefined, cookieStore: Parameters<typeof internalApiErrorResponse>[1]["cookieStore"]) {
  return internalApiErrorResponse(status, { backendCode, backendMessage, cookieStore, fallbackMessage: "Não foi possível carregar ou atualizar as amostras do processo." });
}
