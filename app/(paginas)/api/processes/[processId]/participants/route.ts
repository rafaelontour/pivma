import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid, validateProcessParticipantAssignment } from "@/components/participacao-processo";
import { createProcessParticipant, listProcessParticipantHistory } from "@/services/ParticipacaoProcesso";
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
  const authorization = await authorizeProcessComposition(processId, "manage");
  if (!authorization.ok) return authorization.response;
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
