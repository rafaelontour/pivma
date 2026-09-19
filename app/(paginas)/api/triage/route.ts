import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { triageErrorResponse } from "@/app/(paginas)/api/_shared/triage";
import { listTriageProcesses } from "@/services/Triagem";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeInternalApi(["triage.review"]);
  if (!authorization.ok) return authorization.response;
  const query = new URL(request.url).searchParams;
  const page = Number(query.get("page") ?? 1);
  const size = Number(query.get("size") ?? 100);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(size) || size < 1 || size > 100) return NextResponse.json({ message: "Paginação inválida." }, { status: 400 });
  const result = await listTriageProcesses(authorization.accessToken, page, size);
  if (!result.ok) return triageErrorResponse(result.status, authorization.cookieStore, "Não foi possível carregar a fila de triagem.");
  return NextResponse.json(result.data);
}
