import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { listCurrentTasks } from "@/services/Tarefa";

export const runtime = "nodejs";

const DEFAULT_PAGE = 1;
const DEFAULT_SIZE = 100;

export async function GET(request: Request) {
  const authorization = await authorizeInternalApi(["triage.review"]);
  if (!authorization.ok) return authorization.response;

  const query = new URL(request.url).searchParams;
  const page = readInteger(query.get("page"), DEFAULT_PAGE, 1);
  const size = readInteger(query.get("size"), DEFAULT_SIZE, 1, 100);
  if (page === null || size === null) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Paginação inválida." },
      { status: 400 },
    );
  }

  const result = await listCurrentTasks(authorization.accessToken, { page, size });
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore: authorization.cookieStore,
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
