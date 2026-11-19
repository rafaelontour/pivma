import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { completeProcessParticipantRole, getProcessComposition } from "@/services/ParticipacaoProcesso";
import { PROCESS_PARTICIPANT_ROLES } from "@/types/ParticipacaoProcesso";
import type { ProcessParticipantRoleActionRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function POST(_request: Request, context: ProcessParticipantRoleActionRouteContext) {
  const { processId, roleKey } = await context.params;
  if (!isProcessCompositionUuid(processId) || !PROCESS_PARTICIPANT_ROLES.includes(roleKey as (typeof PROCESS_PARTICIPANT_ROLES)[number])) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores informados." }, { status: 422 });
  }
  const isInitialCompositionRole = roleKey === "group_manager" || roleKey === "sponsor";
  const authorization = await authorizeProcessComposition(processId, isInitialCompositionRole ? "triage" : "manage");
  if (!authorization.ok) return authorization.response;
  if (isInitialCompositionRole) {
    const composition = await getProcessComposition(
      authorization.accessToken,
      processId,
      authorization.session.access.scopes,
      authorization.session.access.global_permissions.includes("triage.review"),
    );
    if (!composition.ok) return internalApiErrorResponse(composition.status, {
      backendCode: composition.code,
      backendMessage: composition.message,
      cookieStore: authorization.cookieStore,
      fallbackMessage: "Não foi possível validar a atribuição do cargo.",
    });
    const canComplete = roleKey === "group_manager"
      ? composition.data.capabilities.canAssignGroupManager
      : composition.data.capabilities.canAssignSponsor;
    const hasActiveParticipant = composition.data.participants.some((participant) => participant.role_key === roleKey && participant.active);
    if (!canComplete || !hasActiveParticipant) {
      return NextResponse.json({ code: "CONFLICT", message: "Esta etapa não pode ser concluída no momento." }, { status: 409 });
    }
  }
  const result = await completeProcessParticipantRole(authorization.accessToken, processId, roleKey);
  if (!result.ok) return internalApiErrorResponse(result.status, {
    backendCode: result.code,
    backendMessage: result.message,
    cookieStore: authorization.cookieStore,
    fallbackMessage: "Não foi possível concluir a atribuição do cargo.",
  });
  return NextResponse.json(result.data);
}
