import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid, validateProcessParticipantAssignment } from "@/components/participacao-processo";
import { canActOnAssignment, createProcessParticipant, listProcessParticipantHistory, listProcessTasks } from "@/services/ParticipacaoProcesso";
import { findActiveUserById } from "@/services/Usuario";
import type { ProcessCompositionRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function GET(_request: Request, context: ProcessCompositionRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "read");
  if (!authorization.ok) return authorization.response;
  const result = await listProcessParticipantHistory(authorization.accessToken, processId);
  if (!result.ok) return forwardError(result.status, result.code, result.message, authorization.cookieStore);
  return NextResponse.json(result.data);
}

export async function POST(request: Request, context: ProcessCompositionRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();
  const parsed = validateProcessParticipantAssignment(await request.json().catch(() => null));
  if (!parsed.valid) return validationError(parsed.message);
  const isInitialCompositionRole = parsed.input.role_key === "group_manager" || parsed.input.role_key === "sponsor";
  const authorization = await authorizeProcessComposition(processId, isInitialCompositionRole ? "triage" : "manage");
  if (!authorization.ok) return authorization.response;
  if (isInitialCompositionRole) {
    const tasks = await listProcessTasks(authorization.accessToken, processId);
    if (!tasks.ok) return forwardError(tasks.status, tasks.code, tasks.message, authorization.cookieStore);
    const taskKey = parsed.input.role_key === "group_manager" ? "assign_group_manager" : "assign_sponsor";
    if (!canActOnAssignment(tasks.data, taskKey, authorization.roles, authorization.session.access.global_permissions.includes("triage.review"))) {
      return NextResponse.json({ code: "CONFLICT", message: "Esta definição não está disponível para este processo no momento." }, { status: 409 });
    }
    const user = await findActiveUserById(authorization.accessToken, parsed.input.user_id);
    if (!user.ok) {
      if (user.status === 404) return validationError("Selecione uma conta ativa da plataforma.");
      return forwardError(user.status, user.code, user.message, authorization.cookieStore);
    }
  }
  const result = await createProcessParticipant(authorization.accessToken, processId, parsed.input);
  if (!result.ok) return forwardError(result.status, result.code, result.message, authorization.cookieStore);
  return NextResponse.json(result.data, { status: 201 });
}

function validationError(message = "Revise os dados informados.") {
  return NextResponse.json({ code: "VALIDATION_ERROR", message }, { status: 422 });
}

function forwardError(status: number | undefined, backendCode: string | undefined, backendMessage: string | undefined, cookieStore: Parameters<typeof internalApiErrorResponse>[1]["cookieStore"]) {
  return internalApiErrorResponse(status, {
    backendCode,
    backendMessage,
    cookieStore,
    fallbackMessage: "Não foi possível consultar ou atualizar os participantes do processo.",
  });
}
