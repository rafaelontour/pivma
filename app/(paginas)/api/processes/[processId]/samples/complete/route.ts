import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { ProcessOperationRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function POST(_request: Request, context: ProcessOperationRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise o identificador do processo." }, { status: 422 });
  const authorization = await authorizeProcessComposition(processId, "group_manager");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "post", `/processes/${processId}/samples/complete`);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível concluir a definição das amostras." });
  return NextResponse.json(result.data);
}
