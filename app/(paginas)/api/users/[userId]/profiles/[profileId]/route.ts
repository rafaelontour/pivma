import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import {
  getUserAccess,
  grantUserProfile,
  revokeUserProfile,
} from "@/services/Perfil";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/users/[userId]/profiles/[profileId]">,
) {
  const { userId, profileId } = await context.params;

  if (!isUuid(userId) || !isUuid(profileId)) {
    return NextResponse.json({ message: "Usuário ou perfil inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await grantUserProfile(accessToken, userId, profileId);

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      fallbackMessage: "Não foi possível atribuir o perfil de acesso no momento.",
      cookieStore,
      messages: {
        403: "Você não tem permissão para atribuir perfis de acesso.",
        404: "O usuário ou perfil informado não foi encontrado.",
        409: "Este perfil já está atribuído ao usuário.",
        422: "O perfil não pode ser atribuído a este usuário.",
      },
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/users/[userId]/profiles/[profileId]">,
) {
  const { userId, profileId } = await context.params;

  if (!isUuid(userId) || !isUuid(profileId)) {
    return NextResponse.json({ message: "Usuário ou perfil inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const accessResult = await getUserAccess(accessToken, userId);

  if (!accessResult.ok) {
    return internalApiErrorResponse(accessResult.status, {
      fallbackMessage: "Não foi possível validar os cargos do usuário no momento.",
      cookieStore,
      messages: {
        403: "Você não tem permissão para consultar os perfis deste usuário.",
        404: "O usuário informado não foi encontrado.",
      },
    });
  }

  if (accessResult.data.profiles.length <= 1) {
    return NextResponse.json(
      { message: "Todo usuário precisa manter pelo menos um cargo atribuído." },
      { status: 400 },
    );
  }

  const result = await revokeUserProfile(accessToken, userId, profileId);

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      fallbackMessage: "Não foi possível remover o perfil de acesso no momento.",
      cookieStore,
      messages: {
        403: "Você não tem permissão para remover perfis de acesso.",
        404: "O usuário ou perfil informado não foi encontrado.",
        409: "Este perfil não está mais atribuído ao usuário.",
        422: "O perfil não pode ser removido deste usuário.",
      },
    });
  }

  return new NextResponse(null, { status: 204 });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
