import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { updatePermissionProfile } from "@/services/Perfil";
import type { UpdatePermissionProfileInput } from "@/types/Rbac";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/rbac/profiles/[profileId]">,
) {
  const { profileId } = await context.params;
  const payload = (await request.json().catch(() => null)) as UpdatePermissionProfileInput | null;

  if (!isUuid(profileId) || !isValidPermissionCodes(payload?.permissionCodes)) {
    return NextResponse.json(
      { message: "Informe um perfil e códigos de permissão válidos." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await updatePermissionProfile(accessToken, profileId, payload);

  if (!result.ok) {
    if (result.status === 401) {
      cookieStore.delete("access_token");
    }

    const status = result.status === 401 || result.status === 403 ? result.status : 502;
    const message =
      status === 401
        ? "Sua sessão não é mais válida."
        : status === 403
          ? "Você não tem permissão para alterar este perfil."
          : "Não foi possível salvar as permissões do perfil no momento.";

    return NextResponse.json({ message }, { status });
  }

  return NextResponse.json(result.data);
}

function isValidPermissionCodes(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((permissionCode) => typeof permissionCode === "string" && permissionCode.length > 0)
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
