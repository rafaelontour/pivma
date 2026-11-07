import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { completeProcessParticipantRole } from "@/services/ParticipacaoProcesso";
import { PROCESS_PARTICIPANT_ROLES } from "@/types/ParticipacaoProcesso";
import type { ProcessParticipantRoleActionRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function POST(_request: Request, context: ProcessParticipantRoleActionRouteContext) {
  const { processId, roleKey } = await context.params;
  if (!isProcessCompositionUuid(processId) || !PROCESS_PARTICIPANT_ROLES.includes(roleKey as (typeof PROCESS_PARTICIPANT_ROLES)[number])) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores informados." }, { status: 422 });
  }
  const authorization = await authorizeProcessComposition(processId, "manage");
  if (!authorization.ok) return authorization.response;
  const result = await completeProcessParticipantRole(authorization.accessToken, processId, roleKey);
  if (!result.ok) return internalApiErrorResponse(result.status, {
    backendCode: result.code,
    backendMessage: result.message,
    cookieStore: authorization.cookieStore,
    fallbackMessage: "Não foi possível concluir a atribuição do cargo.",
  });
  return NextResponse.json(result.data);
}
