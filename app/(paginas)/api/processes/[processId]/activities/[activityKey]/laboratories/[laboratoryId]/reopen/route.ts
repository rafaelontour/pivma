import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { validateLaboratoryReopen } from "@/components/process-operations";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { LaboratoryReopenRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function POST(request: Request, context: LaboratoryReopenRouteContext) {
  const { processId, activityKey, laboratoryId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(laboratoryId) || !/^[a-z0-9_.-]{1,128}$/i.test(activityKey)) return validationError("Revise os identificadores informados.");
  const parsed = validateLaboratoryReopen(await request.json().catch(() => null));
  if (!parsed.valid) return validationError(parsed.message);
  const authorization = await authorizeProcessComposition(processId, "triage");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "post", `/processes/${processId}/activities/${encodeURIComponent(activityKey)}/laboratories/${laboratoryId}/reopen`, parsed.input);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível reabrir a execução do laboratório." });
  return NextResponse.json(result.data, { status: 201 });
}

function validationError(message: string) { return NextResponse.json({ code: "VALIDATION_ERROR", message }, { status: 422 }); }
