import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { validateLaboratoryWaiver } from "@/components/process-operations";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { LaboratoryWaiverRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function POST(request: Request, context: LaboratoryWaiverRouteContext) {
  const { processId, phaseKey } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isSafeKey(phaseKey)) return validationError("Revise os identificadores informados.");
  const parsed = validateLaboratoryWaiver(await request.json().catch(() => null));
  if (!parsed.valid) return validationError(parsed.message);
  const authorization = await authorizeProcessComposition(processId, "triage");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "post", `/processes/${processId}/phases/${encodeURIComponent(phaseKey)}/laboratory-waivers`, parsed.input);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível dispensar a execução de um laboratório." });
  return NextResponse.json(result.data, { status: 201 });
}

function isSafeKey(value: string) { return /^[a-z0-9_.-]{1,128}$/i.test(value); }
function validationError(message: string) { return NextResponse.json({ code: "VALIDATION_ERROR", message }, { status: 422 }); }
