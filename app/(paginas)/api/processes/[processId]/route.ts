import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/Autenticacao";
import { canReadProcessKanban, getProcess } from "@/services/Processo";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/processes/[processId]">,
) {
  const { processId } = await context.params;

  if (!isUuid(processId)) {
    return NextResponse.json({ message: "Processo inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const currentUser = await getCurrentUser(accessToken);

  if (!currentUser.ok) {
    if (currentUser.status === 401) {
      cookieStore.delete("access_token");
    }

    return processErrorResponse(currentUser.status);
  }

  if (!canReadProcessKanban(currentUser.data.access.global_permissions)) {
    return NextResponse.json(
      { message: "Você não tem permissão para consultar este processo." },
      { status: 403 },
    );
  }

  const result = await getProcess(accessToken, processId);

  if (!result.ok) {
    if (result.status === 401) {
      cookieStore.delete("access_token");
    }

    return processErrorResponse(result.status);
  }

  return NextResponse.json(result.data);
}

function processErrorResponse(status: number | undefined) {
  const responseStatus =
    status === 401 || status === 403 || status === 404 ? status : 502;
  const message =
    responseStatus === 401
      ? "Sua sessão não é mais válida."
      : responseStatus === 403
        ? "Você não tem permissão para consultar este processo."
        : responseStatus === 404
          ? "Processo não encontrado."
          : "Não foi possível consultar o processo no momento.";

  return NextResponse.json({ message }, { status: responseStatus });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
