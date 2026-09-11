import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import {
  createPermissionProfile,
  listPermissionProfiles,
} from "@/services/Perfil";
import type { CreatePermissionProfileInput } from "@/types/Rbac";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await listPermissionProfiles(accessToken);

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage:
        "Não foi possível consultar os perfis de acesso no momento.",
      messages: {
        403: "Você não tem permissão para consultar perfis de acesso.",
      },
    });
  }

  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | CreatePermissionProfileInput
    | null;
  const name = typeof payload?.name === "string" ? payload.name.trim() : "";
  const description =
    typeof payload?.description === "string" ? payload.description.trim() : "";
  const permissionCodes = Array.isArray(payload?.permission_codes)
    ? payload.permission_codes
    : null;

  if (
    name.length < 3 ||
    name.length > 64 ||
    description.length < 1 ||
    description.length > 500 ||
    !permissionCodes ||
    permissionCodes.some(
      (code) => typeof code !== "string" || code.length < 1 || code.length > 100,
    )
  ) {
    return NextResponse.json(
      { message: "Revise o nome, a descrição e as permissões do perfil." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await createPermissionProfile(accessToken, {
    name,
    description,
    permission_codes: [...new Set(permissionCodes)],
  });

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage: "Não foi possível criar o perfil de acesso no momento.",
      messages: {
        403: "Você não tem permissão para criar perfis de acesso.",
        409: "Já existe um perfil com esse nome.",
        422: "Revise o nome, a descrição e as permissões do perfil.",
      },
    });
  }

  return NextResponse.json(result.data, { status: 201 });
}
