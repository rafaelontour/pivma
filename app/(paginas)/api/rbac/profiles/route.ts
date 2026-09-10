import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { listPermissionProfiles } from "@/services/Perfil";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await listPermissionProfiles(accessToken);

  if (!result.ok) {
    if (result.status === 401) {
      cookieStore.delete("access_token");
    }

    return profileErrorResponse(result.status);
  }

  return NextResponse.json(result.data);
}

function profileErrorResponse(status: number | undefined) {
  const responseStatus = status === 401 || status === 403 ? status : 502;
  const message =
    responseStatus === 401
      ? "Sua sessão não é mais válida."
      : responseStatus === 403
        ? "Você não tem permissão para consultar perfis de acesso."
        : "Não foi possível consultar os perfis de acesso no momento.";

  return NextResponse.json({ message }, { status: responseStatus });
}
