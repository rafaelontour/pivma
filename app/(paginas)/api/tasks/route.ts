import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { listCurrentTasks } from "@/services/Tarefa";
import { hasProcessKanbanAccess } from "@/types/Processo";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 100;

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Sessão não encontrada." },
      { status: 401 },
    );
  }

  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser.ok) {
    return internalApiErrorResponse(currentUser.status, {
      cookieStore,
      fallbackMessage: "Não foi possível validar a autorização no momento.",
    });
  }
  if (!hasProcessKanbanAccess(
    currentUser.data.access.global_permissions,
    currentUser.data.access.profiles,
  )) {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Você não tem permissão para consultar processos." },
      { status: 403 },
    );
  }

  const query = new URL(request.url).searchParams;
  const page = readInteger(query.get("page"), DEFAULT_PAGE, 1);
  const size = readInteger(query.get("size"), DEFAULT_SIZE, 1, 100);
  if (page === null || size === null) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Paginação inválida." },
      { status: 400 },
    );
  }

  const result = await listCurrentTasks(accessToken, { page, size });
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage: "Não foi possível consultar as tarefas no momento.",
    });
  }

  return NextResponse.json(result.data);
}

function readInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= minimum && parsed <= maximum ? parsed : null;
}
