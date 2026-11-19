import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { listUsers } from "@/services/Usuario";
import type { ProcessCompositionRouteContext, ProcessCompositionUserOption } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function GET(request: Request, context: ProcessCompositionRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();

  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  if (search.length < 2 || search.length > 255) return validationError();

  const authorization = await authorizeProcessComposition(processId, "manage");
  if (!authorization.ok) return authorization.response;

  const result = await listUsers(authorization.accessToken, {
    offset: 0,
    limit: 20,
    search,
    active: true,
  });
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore: authorization.cookieStore,
      fallbackMessage: "Não foi possível consultar os usuários no momento.",
      messages: { 403: "Você não tem permissão para consultar usuários." },
    });
  }

  const users: ProcessCompositionUserOption[] = result.data.items
    .filter((user) => user.active)
    .map(({ id, username, full_name, email }) => ({ id, username, full_name, email }));
  return NextResponse.json(users);
}

function validationError() {
  return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise a busca informada." }, { status: 422 });
}
