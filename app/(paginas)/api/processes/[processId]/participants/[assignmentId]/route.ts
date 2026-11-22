import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { getRequestOrigin } from "@/app/(paginas)/api/_shared/request-origin";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { revokeProcessParticipant } from "@/services/ParticipacaoProcesso";
import type { ProcessParticipantActionRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function DELETE(request: Request, context: ProcessParticipantActionRouteContext) {
  const { processId, assignmentId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(assignmentId)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores informados." }, { status: 422 });
  }
  const authorization = await authorizeProcessComposition(processId, "manage");
  if (!authorization.ok) return authorization.response;
  const origin = getRequestOrigin(request);
  if (!origin) return NextResponse.json({ code: "INVALID_ORIGIN", message: "A origem da solicitação não é válida." }, { status: 403 });
  const result = await revokeProcessParticipant(authorization.accessToken, processId, assignmentId, origin);
  if (!result.ok) return internalApiErrorResponse(result.status, {
    backendCode: result.code,
    backendMessage: result.message,
    cookieStore: authorization.cookieStore,
    fallbackMessage: "Não foi possível revogar a designação.",
  });
  return new NextResponse(null, { status: 204 });
}
