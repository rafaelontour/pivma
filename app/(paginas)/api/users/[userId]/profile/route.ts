import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { getUserProfileDetails } from "@/services/Usuario";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/users/[userId]/profile">) {
  const { userId } = await context.params;
  if (!isUuid(userId)) return NextResponse.json({ code: "VALIDATION_ERROR", message: "Usuário inválido." }, { status: 400 });
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser.ok || !currentUser.data.access.global_permissions.includes("users.manage")) {
    return internalApiErrorResponse(currentUser.ok ? 403 : currentUser.status, { cookieStore, fallbackMessage: "Você não tem permissão para consultar este perfil.", messages: { 403: "Você não tem permissão para consultar este perfil." } });
  }
  const result = await getUserProfileDetails(accessToken, userId);
  if (!result.ok) return internalApiErrorResponse(result.status, { cookieStore, fallbackMessage: "Não foi possível consultar o perfil do usuário no momento.", messages: { 403: "Você não tem permissão para consultar este perfil.", 404: "Usuário não encontrado." } });
  return NextResponse.json(result.data);
}

function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
