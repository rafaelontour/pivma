import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { ProcessOperationRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function GET(request: Request, context: ProcessOperationRouteContext) {
  const { processId } = await context.params;
  const cas = new URL(request.url).searchParams.get("cas")?.trim() ?? "";
  if (!isProcessCompositionUuid(processId) || !cas || cas.length > 32) return validationError();
  const authorization = await authorizeProcessComposition(processId, "group_manager");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "get", `/processes/${processId}/samples/lookup`, undefined, { cas });
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível consultar as sugestões para o número CAS." });
  return NextResponse.json(result.data);
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Informe um número CAS válido." }, { status: 422 }); }
