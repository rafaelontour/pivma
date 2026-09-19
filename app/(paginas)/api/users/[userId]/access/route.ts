import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getUserAccess } from "@/services/Perfil";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/users/[userId]/access">,
) {
  const { userId } = await context.params;

  if (!isUuid(userId)) {
    return NextResponse.json({ message: "Usuário inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await getUserAccess(accessToken, userId);

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage:
        "Não foi possível consultar os perfis do usuário no momento.",
      messages: {
        403: "Você não tem permissão para consultar os perfis deste usuário.",
        404: "Usuário não encontrado.",
      },
    });
  }

  return NextResponse.json(result.data);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
