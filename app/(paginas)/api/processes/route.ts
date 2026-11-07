import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import {
  canReadProcessKanban,
  listProcesses,
  listVisibleProcessesFallback,
} from "@/services/Processo";
import { hasProcessKanbanAccess } from "@/types/Processo";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 100;

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = readInteger(searchParams.get("page"), DEFAULT_PAGE, 1);
  const size = readInteger(searchParams.get("size"), DEFAULT_SIZE, 1, 100);
  const status = searchParams.get("status")?.trim();

  if (page === null || size === null || (status && status.length > 128)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Parâmetros de paginação ou estado inválidos." }, { status: 400 });
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
    return NextResponse.json({ code: "FORBIDDEN", message: "Você não tem permissão para consultar processos." }, { status: 403 });
  }

  const options = {
    page,
    size,
    ...(status ? { status } : {}),
  };
  const result = await listProcesses(accessToken, options);

  if (!result.ok) {
    if (result.code === "internal_error") {
      const fallback = await listVisibleProcessesFallback(
        accessToken,
        currentUser.data.access.scopes,
        hasProcessKanbanAccess(
          currentUser.data.access.global_permissions,
          currentUser.data.access.profiles,
        ),
        options,
      );
      if (fallback.ok) return NextResponse.json(fallback.data);
    }
    return processErrorResponse(
      result.status,
      cookieStore,
      result.code,
      result.message,
    );
  }

  return NextResponse.json(result.data);
}

function readInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  if (value === null) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = Number(value);
  return parsed >= minimum && parsed <= maximum ? parsed : null;
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
    fallbackMessage: "Não foi possível consultar os processos no momento.",
    messages: {
      403: "Você não tem permissão para consultar processos.",
    },
  });
}
