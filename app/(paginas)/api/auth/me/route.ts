import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await getCurrentUser(accessToken);

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      fallbackMessage: "O serviço de autenticação está indisponível no momento.",
      cookieStore,
    });
  }

  return NextResponse.json({
    id: result.data.user.id,
    username: result.data.user.username,
    email: result.data.user.email,
    full_name: result.data.user.full_name,
    permissions: result.data.access.global_permissions,
    profiles: result.data.access.profiles,
    isAdministrator:
      result.data.access.global_permissions.includes("rbac.read") ||
      result.data.access.profiles.some((profile) =>
        profile.name.toLocaleLowerCase("pt-BR").includes("admin"),
      ),
    roles: [
      ...new Set(
        result.data.access.scopes.flatMap((scope) => scope.roles),
      ),
    ],
  });
}
