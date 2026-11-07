import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { revokeProcessParticipantInvite } from "@/services/ParticipacaoProcesso";
import type { ProcessParticipantInviteActionRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function POST(_request: Request, context: ProcessParticipantInviteActionRouteContext) {
  const { processId, inviteId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(inviteId)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "manage");
  if (!authorization.ok) return authorization.response;
  const result = await revokeProcessParticipantInvite(authorization.accessToken, processId, inviteId);
  if (!result.ok) return internalApiErrorResponse(result.status, {
    backendCode: result.code,
    backendMessage: result.message,
    cookieStore: authorization.cookieStore,
    fallbackMessage: "Não foi possível revogar o convite.",
  });
  return new NextResponse(null, { status: 204 });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores informados." }, { status: 422 }); }
