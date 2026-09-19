import "server-only";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "./responses";
import { getCurrentUser } from "@/services/Autenticacao";
import type { InternalApiAuthorization } from "@/types/Api";

export async function authorizeInternalApi(
  acceptedPermissions: string[],
): Promise<InternalApiAuthorization> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Sessão não encontrada." },
        { status: 401 },
      ),
    };
  }

  const session = await getCurrentUser(accessToken);
  if (!session.ok) {
    return {
      ok: false,
      response: internalApiErrorResponse(session.status, {
        cookieStore,
        fallbackMessage: "Não foi possível validar a autorização no momento.",
      }),
    };
  }

  const permissions = session.data.access.global_permissions;
  if (
    acceptedPermissions.length > 0 &&
    !acceptedPermissions.some((permission) => permissions.includes(permission))
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Você não tem permissão para realizar esta operação." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, accessToken, cookieStore };
}

export async function authorizeAdministratorApi(): Promise<InternalApiAuthorization> {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Sessão não encontrada." },
        { status: 401 },
      ),
    };
  }

  const session = await getCurrentUser(accessToken);
  if (!session.ok) {
    return {
      ok: false,
      response: internalApiErrorResponse(session.status, {
        cookieStore,
        fallbackMessage: "Não foi possível validar a autorização no momento.",
      }),
    };
  }

  const isAdministrator =
    session.data.access.global_permissions.includes("rbac.read") ||
    session.data.access.profiles.some((profile) =>
      profile.name.toLocaleLowerCase("pt-BR").includes("admin"),
    );

  if (!isAdministrator) {
    return {
      ok: false,
      response: NextResponse.json(
        { message: "Você não tem permissão para acessar a observabilidade." },
        { status: 403 },
      ),
    };
  }

  return { ok: true, accessToken, cookieStore };
}
