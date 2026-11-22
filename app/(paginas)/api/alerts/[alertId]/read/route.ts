import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/app/(paginas)/api/_shared/request-origin";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { markAlertRead } from "@/services/Alerta";
import type { AlertReadRouteContext } from "@/types/Alerta";

export const runtime = "nodejs";

export async function POST(request: Request, context: AlertReadRouteContext) {
  const { alertId } = await context.params;
  if (!isUuid(alertId)) return NextResponse.json({ code: "VALIDATION_ERROR", message: "Identificador inválido." }, { status: 422 });
  const origin = getRequestOrigin(request);
  if (!origin) return NextResponse.json({ code: "INVALID_ORIGIN", message: "A origem da solicitação não é válida." }, { status: 403 });
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  if (!token) return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  const session = await getCurrentUser(token);
  if (!session.ok) return internalApiErrorResponse(session.status, { cookieStore, fallbackMessage: "Não foi possível validar a sessão." });
  const result = await markAlertRead(token, alertId, origin);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, cookieStore, fallbackMessage: "Este aviso não está mais disponível." });
  return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
