import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
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
    return processErrorResponse(currentUser.status, cookieStore);
  }

  if (!canReadProcessKanban(currentUser.data.access.global_permissions)) {
    return NextResponse.json(
      { message: "Você não tem permissão para consultar este processo." },
      { status: 403 },
    );
  }

  const result = await getProcess(accessToken, processId);

  if (!result.ok) {
    return processErrorResponse(result.status, cookieStore);
  }

  return NextResponse.json(result.data);
}

function processErrorResponse(
  status: number | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return internalApiErrorResponse(status, {
    cookieStore,
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
