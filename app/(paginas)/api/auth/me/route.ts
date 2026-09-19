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

  const user = result.data.user ?? result.data;

  return NextResponse.json({
    id: user.id ?? result.data.id ?? "",
    username: user.username ?? result.data.username ?? "",
    email: user.email ?? result.data.email ?? "",
    full_name: user.full_name ?? result.data.full_name ?? null,
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
