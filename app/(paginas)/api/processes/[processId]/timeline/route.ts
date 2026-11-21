import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { getTriageTimeline } from "@/services/Triagem";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/processes/[processId]/timeline">) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Processo inválido." }, { status: 400 });
  }

  const authorization = await authorizeProcessComposition(processId, "read");
  if (!authorization.ok) return authorization.response;

  const result = await getTriageTimeline(authorization.accessToken, processId);
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      backendCode: result.code,
      backendMessage: result.message,
      cookieStore: authorization.cookieStore,
      fallbackMessage: "Não foi possível carregar o histórico da submissão.",
    });
  }

  return NextResponse.json(result.data);
}
