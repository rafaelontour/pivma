import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { canReadProcessKanban, listProcesses } from "@/services/Processo";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 100;

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = readInteger(searchParams.get("page"), DEFAULT_PAGE, 1);
  const size = readInteger(searchParams.get("size"), DEFAULT_SIZE, 1, 100);
  const status = searchParams.get("status")?.trim();

  if (page === null || size === null || (status && status.length > 128)) {
    return NextResponse.json(
      { message: "Parâmetros de paginação ou estado inválidos." },
      { status: 400 },
    );
  }

  const currentUser = await getCurrentUser(accessToken);

  if (!currentUser.ok) {
    return processErrorResponse(currentUser.status, cookieStore);
  }

  if (!canReadProcessKanban(currentUser.data.access.global_permissions)) {
    return NextResponse.json(
      { message: "Você não tem permissão para consultar processos." },
      { status: 403 },
    );
  }

  const result = await listProcesses(accessToken, {
    page,
    size,
    ...(status ? { status } : {}),
  });

  if (!result.ok) {
    return processErrorResponse(result.status, cookieStore);
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
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage: "Não foi possível consultar os processos no momento.",
    messages: {
      403: "Você não tem permissão para consultar processos.",
    },
  });
}
