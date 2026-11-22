import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { getTaskDetail } from "@/services/Tarefa";
import type { TaskDetailRouteContext } from "@/types/Tarefa";

export const runtime = "nodejs";

export async function GET(_request: Request, context: TaskDetailRouteContext) {
  const { taskId } = await context.params;
  if (!isUuid(taskId)) return NextResponse.json({ code: "VALIDATION_ERROR", message: "Identificador inválido." }, { status: 422 });
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  const session = await getCurrentUser(accessToken);
  if (!session.ok) return internalApiErrorResponse(session.status, { cookieStore, fallbackMessage: "Não foi possível validar a sessão." });
  const result = await getTaskDetail(accessToken, taskId);
  if (!result.ok) return internalApiErrorResponse(result.status, { cookieStore, fallbackMessage: "Esta tarefa não está mais disponível." });
  return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store" } });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
