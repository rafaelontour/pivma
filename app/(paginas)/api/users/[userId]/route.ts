import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { updateUser } from "@/services/Usuario";
import type { UpdateUserInput } from "@/types/Usuario";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/users/[userId]">,
) {
  const { userId } = await context.params;
  const payload = (await request.json().catch(() => null)) as UpdateUserInput | null;
  const fullName =
    typeof payload?.full_name === "string" ? payload.full_name.trim() : "";

  if (!isUuid(userId) || fullName.length < 1 || fullName.length > 255) {
    return NextResponse.json(
      { message: "Informe um usuário e um nome completo válidos." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await updateUser(accessToken, userId, { full_name: fullName });

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage: "Não foi possível atualizar o nome no momento.",
      messages: {
        403: "Você não tem permissão para alterar usuários.",
        404: "O usuário informado não foi encontrado.",
        409: "O usuário foi alterado durante a operação. Atualize e tente novamente.",
        422: "Informe um nome completo válido.",
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
