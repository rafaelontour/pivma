import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { canReadProcessKanban, deleteProcess, getProcess } from "@/services/Processo";
import { hasProcessKanbanAccess } from "@/types/Processo";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/processes/[processId]">,
) {
  const { processId } = await context.params;

  if (!isUuid(processId)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Processo inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  }

  const currentUser = await getCurrentUser(accessToken);

  if (!currentUser.ok) {
    return processErrorResponse(currentUser.status, cookieStore, currentUser.code);
  }

  if (!canReadProcessKanban(
    currentUser.data.access.global_permissions,
    currentUser.data.access.scopes,
    currentUser.data.access.profiles,
  )) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Você não tem permissão para consultar este processo." }, { status: 403 });
  }

  const result = await getProcess(accessToken, processId);

  if (!result.ok) {
    return processErrorResponse(
      result.status,
      cookieStore,
      result.code,
      result.message,
    );
  }

  return NextResponse.json(result.data);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/processes/[processId]">,
) {
  const { processId } = await context.params;
  if (!isUuid(processId)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Processo inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  }

  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser.ok) {
    return processErrorResponse(currentUser.status, cookieStore, currentUser.code);
  }
  if (!hasProcessKanbanAccess(
    currentUser.data.access.global_permissions,
    currentUser.data.access.profiles,
  )) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Somente a equipe BraCVAM pode excluir processos." }, { status: 403 });
  }

  const result = await deleteProcess(accessToken, processId);
  if (!result.ok) {
    return processErrorResponse(result.status, cookieStore, result.code, result.message);
  }
  return new NextResponse(null, { status: 204 });
}

function processErrorResponse(
  status: number | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  backendCode?: string,
  backendMessage?: string,
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    backendCode,
    backendMessage,
    fallbackMessage: "Não foi possível consultar o processo no momento.",
    messages: {
      403: "Você não tem permissão para consultar este processo.",
      404: "Processo não encontrado.",
    },
  });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
