import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
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
    return internalApiErrorResponse(result.status, {
      fallbackMessage: "Não foi possível salvar as permissões do perfil no momento.",
      cookieStore,
      messages: {
        403: "Você não tem permissão para alterar este perfil.",
        404: "O perfil informado não foi encontrado.",
        409: "O perfil foi alterado durante a operação. Atualize e tente novamente.",
        422: "Revise os códigos de permissão informados.",
      },
    });
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
