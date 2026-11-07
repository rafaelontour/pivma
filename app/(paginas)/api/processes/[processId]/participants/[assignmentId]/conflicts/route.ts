import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid, validateProcessParticipantConflict } from "@/components/participacao-processo";
import { declareProcessParticipantConflict } from "@/services/ParticipacaoProcesso";
import type { ProcessParticipantActionRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function POST(request: Request, context: ProcessParticipantActionRouteContext) {
  const { processId, assignmentId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(assignmentId)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores informados." }, { status: 422 });
  }
  const parsed = validateProcessParticipantConflict(await request.json().catch(() => null));
  if (!parsed.valid) return NextResponse.json({ code: "VALIDATION_ERROR", message: parsed.message }, { status: 422 });
  const authorization = await authorizeProcessComposition(processId, "manage");
  if (!authorization.ok) return authorization.response;
  const result = await declareProcessParticipantConflict(authorization.accessToken, processId, assignmentId, parsed.input);
  if (!result.ok) return internalApiErrorResponse(result.status, {
    backendCode: result.code,
    backendMessage: result.message,
    cookieStore: authorization.cookieStore,
    fallbackMessage: "Não foi possível registrar a declaração de conflito.",
  });
  return NextResponse.json(result.data, { status: 201 });
}
