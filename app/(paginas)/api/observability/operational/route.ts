import { NextResponse } from "next/server";
import { authorizeAdministratorApi } from "@/app/(paginas)/api/_shared/authorization";
import { observabilityErrorResponse } from "@/app/(paginas)/api/_shared/observability";
import { getOperationalHistory } from "@/services/Observabilidade";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeAdministratorApi();
  if (!authorization.ok) return authorization.response;

  const query = new URL(request.url).searchParams;
  const limit = readLimit(query.get("limit"), 100, 500);
  const status = readFilter(query.get("status"));
  const operationType = readFilter(query.get("operation_type"));
  if (limit === null || status === null || operationType === null) {
    return NextResponse.json({ message: "Filtros operacionais inválidos." }, { status: 400 });
  }

  const result = await getOperationalHistory(authorization.accessToken, {
    limit,
    ...(status ? { status } : {}),
    ...(operationType ? { operationType } : {}),
  });
  if (!result.ok) {
    return observabilityErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível carregar os eventos operacionais.",
    );
  }
  return NextResponse.json(result.data);
}

function readLimit(value: string | null, fallback: number, maximum: number) {
  if (value === null) return fallback;
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= maximum ? parsed : null;
}

function readFilter(value: string | null) {
  const normalized = value?.trim() ?? "";
  return normalized.length <= 128 ? normalized : null;
}
