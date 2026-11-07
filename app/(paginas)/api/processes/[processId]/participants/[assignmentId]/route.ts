import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { revokeProcessParticipant } from "@/services/ParticipacaoProcesso";
import type { ProcessParticipantActionRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: ProcessParticipantActionRouteContext) {
  const { processId, assignmentId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(assignmentId)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores informados." }, { status: 422 });
  }
  const authorization = await authorizeProcessComposition(processId, "manage");
  if (!authorization.ok) return authorization.response;
  const result = await revokeProcessParticipant(authorization.accessToken, processId, assignmentId);
  if (!result.ok) return internalApiErrorResponse(result.status, {
    backendCode: result.code,
    backendMessage: result.message,
    cookieStore: authorization.cookieStore,
    fallbackMessage: "Não foi possível revogar a designação.",
  });
  return new NextResponse(null, { status: 204 });
}
