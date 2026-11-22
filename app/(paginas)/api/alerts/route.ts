import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { listAlerts } from "@/services/Alerta";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  const session = await getCurrentUser(token);
  if (!session.ok) return internalApiErrorResponse(session.status, { cookieStore, fallbackMessage: "Não foi possível validar a sessão." });

  const query = new URL(request.url).searchParams;
  const page = readInteger(query.get("page"), 1, 1);
  const perPage = readInteger(query.get("per_page"), 20, 1, 100);
  const unreadRaw = query.get("unread");
  if (page === null || perPage === null || (unreadRaw !== null && unreadRaw !== "true" && unreadRaw !== "false")) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Filtros inválidos." }, { status: 422 });
  }
  const result = await listAlerts(token, { page, perPage, ...(unreadRaw === null ? {} : { unread: unreadRaw === "true" }) });
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, cookieStore, fallbackMessage: "Não foi possível consultar os avisos." });
  return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } });
}

function readInteger(raw: string | null, fallback: number, min: number, max = Number.MAX_SAFE_INTEGER) {
  if (raw === null) return fallback;
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return value >= min && value <= max ? value : null;
}
