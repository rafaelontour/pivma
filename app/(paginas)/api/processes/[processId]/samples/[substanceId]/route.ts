import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { validateSampleSubstancePatch } from "@/components/process-operations";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { SampleSubstanceRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: SampleSubstanceRouteContext) {
  const { processId, substanceId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(substanceId)) return validationError();
  const parsed = validateSampleSubstancePatch(await request.json().catch(() => null));
  if (!parsed.valid) return NextResponse.json({ code: "VALIDATION_ERROR", message: parsed.message }, { status: 422 });
  const authorization = await authorizeProcessComposition(processId, "group_manager");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "patch", `/processes/${processId}/samples/${substanceId}`, parsed.input);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível atualizar a amostra." });
  return NextResponse.json(result.data);
}

export async function DELETE(_request: Request, context: SampleSubstanceRouteContext) {
  const { processId, substanceId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(substanceId)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "group_manager");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<null>(authorization.accessToken, "delete", `/processes/${processId}/samples/${substanceId}`);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível remover a amostra." });
  return new NextResponse(null, { status: 204 });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores informados." }, { status: 422 }); }
