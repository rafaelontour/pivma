import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/app/(paginas)/api/_shared/request-origin";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { markAllAlertsRead } from "@/services/Alerta";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);
  if (!origin) return NextResponse.json({ code: "INVALID_ORIGIN", message: "A origem da solicitação não é válida." }, { status: 403 });
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  const session = await getCurrentUser(token);
  if (!session.ok) return internalApiErrorResponse(session.status, { cookieStore, fallbackMessage: "Não foi possível validar a sessão." });
  const result = await markAllAlertsRead(token, origin);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, cookieStore, fallbackMessage: "Não foi possível atualizar os avisos." });
  return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } });
}
