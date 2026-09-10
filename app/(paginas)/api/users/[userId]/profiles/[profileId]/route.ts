import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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
    if (result.status === 401) {
      cookieStore.delete("access_token");
    }

    const responseStatus = result.status === 401 || result.status === 403 ? result.status : 502;
    const message =
      responseStatus === 401
        ? "Sua sessão não é mais válida."
        : responseStatus === 403
          ? "Você não tem permissão para atribuir perfis de acesso."
          : "Não foi possível atribuir o perfil de acesso no momento.";

    return NextResponse.json({ message }, { status: responseStatus });
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
    if (accessResult.status === 401) {
      cookieStore.delete("access_token");
    }

    const responseStatus =
      accessResult.status === 401 || accessResult.status === 403
        ? accessResult.status
        : 502;
    const message =
      responseStatus === 401
        ? "Sua sessão não é mais válida."
        : responseStatus === 403
          ? "Você não tem permissão para consultar os perfis deste usuário."
          : "Não foi possível validar os cargos do usuário no momento.";

    return NextResponse.json({ message }, { status: responseStatus });
  }

  if (accessResult.data.profiles.length <= 1) {
    return NextResponse.json(
      { message: "Todo usuário precisa manter pelo menos um cargo atribuído." },
      { status: 400 },
    );
  }

  const result = await revokeUserProfile(accessToken, userId, profileId);

  if (!result.ok) {
    if (result.status === 401) {
      cookieStore.delete("access_token");
    }

    const responseStatus = result.status === 401 || result.status === 403 ? result.status : 502;
    const message =
      responseStatus === 401
        ? "Sua sessão não é mais válida."
        : responseStatus === 403
          ? "Você não tem permissão para remover perfis de acesso."
          : "Não foi possível remover o perfil de acesso no momento.";

    return NextResponse.json({ message }, { status: responseStatus });
  }

  return new NextResponse(null, { status: 204 });
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
