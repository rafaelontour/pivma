import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { canActOnAssignment, completeProcessParticipantRole, getProcessComposition, listProcessTasks } from "@/services/ParticipacaoProcesso";
import { PROCESS_PARTICIPANT_ROLES } from "@/types/ParticipacaoProcesso";
import type { ProcessParticipantRoleActionRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function POST(_request: Request, context: ProcessParticipantRoleActionRouteContext) {
  const { processId, roleKey } = await context.params;
  if (!isProcessCompositionUuid(processId) || !PROCESS_PARTICIPANT_ROLES.includes(roleKey as (typeof PROCESS_PARTICIPANT_ROLES)[number])) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores informados." }, { status: 422 });
  }
  const authorization = await authorizeProcessComposition(processId, "triage");
  if (!authorization.ok) return authorization.response;
  const [composition, tasks] = await Promise.all([
    getProcessComposition(authorization.accessToken, processId, authorization.session.access.scopes, authorization.session.access.global_permissions.includes("triage.review"), authorization.session.access.global_permissions.includes("process.participants.manage")),
    listProcessTasks(authorization.accessToken, processId),
  ]);
  const failure = !composition.ok ? composition : !tasks.ok ? tasks : null;
  if (failure && !failure.ok) return internalApiErrorResponse(failure.status, {
    backendCode: failure.code,
    backendMessage: failure.message,
    cookieStore: authorization.cookieStore,
    fallbackMessage: "Não foi possível validar a atribuição do cargo.",
  });
  const taskKey = `assign_${roleKey}`;
  const hasActionableTask = tasks.ok && canActOnAssignment(tasks.data, taskKey, authorization.roles, authorization.session.access.global_permissions.includes("triage.review"));
  const hasActiveParticipant = composition.ok && composition.data.participants.some((participant) => participant.role_key === roleKey && participant.active);
  const hasPendingInvite = composition.ok && composition.data.invites.some((invite) => invite.role_key === roleKey && invite.status === "pending" && !invite.expired);
  if (!hasActionableTask || !hasActiveParticipant || hasPendingInvite) {
    return NextResponse.json({ code: "CONFLICT", message: "Esta etapa não pode ser concluída no momento." }, { status: 409 });
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
