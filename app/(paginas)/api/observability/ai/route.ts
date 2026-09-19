import { NextResponse } from "next/server";
import { authorizeAdministratorApi } from "@/app/(paginas)/api/_shared/authorization";
import { observabilityErrorResponse } from "@/app/(paginas)/api/_shared/observability";
import { getAiHistory } from "@/services/Observabilidade";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeAdministratorApi();
  if (!authorization.ok) return authorization.response;

  const query = new URL(request.url).searchParams;
  const limit = readLimit(query.get("limit"), 50, 200);
  const correlationId = query.get("correlation_id")?.trim() ?? "";
  if (limit === null || correlationId.length > 128) {
    return NextResponse.json({ message: "Filtros de execuções de IA inválidos." }, { status: 400 });
  }

  const result = await getAiHistory(authorization.accessToken, {
    limit,
    ...(correlationId ? { correlationId } : {}),
  });
  if (!result.ok) {
    return observabilityErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível carregar as execuções de IA.",
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
