import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { validateProcessCompositionInvite, isProcessCompositionUuid } from "@/components/participacao-processo";
import { canActOnAssignment, createProcessParticipantInvite, getProcessComposition, hasDuplicateProcessParticipantInvite, listActiveLaboratories, listProcessTasks } from "@/services/ParticipacaoProcesso";
import type { SessionCookieWriter } from "@/types/Api";
import type { ProcessCompositionRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function GET(_request: Request, context: ProcessCompositionRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();

  const authorization = await authorizeProcessComposition(processId, "read");
  if (!authorization.ok) return authorization.response;
  const result = await getProcessComposition(authorization.accessToken, processId, authorization.session.access.scopes, authorization.session.access.global_permissions.includes("triage.review"));
  if (!result.ok) return compositionError(result.status, authorization.cookieStore, result.code, result.message);
  return NextResponse.json(result.data);
}

export async function POST(request: Request, context: ProcessCompositionRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();

  const input = validateProcessCompositionInvite(await request.json().catch(() => null));
  if (!input.valid) return validationError(input.message);
  const operation = input.input.role_key === "sponsor" || input.input.role_key === "group_manager" ? "triage" : "group_manager";
  const authorization = await authorizeProcessComposition(processId, operation);
  if (!authorization.ok) return authorization.response;

  if (operation === "triage") {
    const tasks = await listProcessTasks(authorization.accessToken, processId);
    if (!tasks.ok) return compositionError(tasks.status, authorization.cookieStore, tasks.code, tasks.message);
    const taskKey = input.input.role_key === "sponsor" ? "assign_sponsor" : "assign_group_manager";
    if (!canActOnAssignment(tasks.data, taskKey, authorization.roles, authorization.session.access.global_permissions.includes("triage.review"))) {
      return NextResponse.json({ code: "CONFLICT", message: "Esta definição não está disponível para este processo no momento." }, { status: 409 });
    }
  } else if (input.input.role_key === "participating_laboratory" || input.input.role_key === "lead_laboratory") {
    const laboratories = await listActiveLaboratories(authorization.accessToken);
    if (!laboratories.ok) return compositionError(laboratories.status, authorization.cookieStore, laboratories.code, laboratories.message);
    if (!laboratories.data.some((laboratory) => laboratory.id === input.input.laboratory_id && laboratory.active)) {
      return NextResponse.json({ code: "VALIDATION_ERROR", message: "Selecione um laboratório ativo." }, { status: 422 });
    }
  }

  const duplicate = await hasDuplicateProcessParticipantInvite(authorization.accessToken, processId, input.input);
  if (!duplicate.ok) return compositionError(duplicate.status, authorization.cookieStore, duplicate.code, duplicate.message);
  if (duplicate.data) return NextResponse.json({ code: "CONFLICT", message: "Já existe um convite ou designação para esta pessoa, função e laboratório." }, { status: 409 });

  const created = await createProcessParticipantInvite(authorization.accessToken, processId, input.input);
  if (!created.ok) return compositionError(created.status, authorization.cookieStore, created.code, created.message);
  return NextResponse.json(created.data, { status: 201 });
}

function validationError(message = "Revise os dados informados.") {
  return NextResponse.json({ code: "VALIDATION_ERROR", message }, { status: 422 });
}

function compositionError(status: number | undefined, cookieStore: SessionCookieWriter, backendCode?: string, backendMessage?: string) {
  return internalApiErrorResponse(status, {
    cookieStore,
    backendCode,
    backendMessage,
    fallbackMessage: "Não foi possível consultar ou atualizar a composição do processo no momento.",
    messages: {
      403: "Você não tem permissão para consultar ou atualizar a composição deste processo.",
      404: "O processo ou recurso solicitado não foi encontrado.",
      409: "A composição mudou. Atualize os dados e tente novamente.",
      422: "Revise os dados da designação e tente novamente.",
      429: "Muitas solicitações foram realizadas. Aguarde antes de tentar novamente.",
    },
  });
}
