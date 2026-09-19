import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { listPermissionDefinitions } from "@/services/Perfil";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await listPermissionDefinitions(accessToken);

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage:
        "Não foi possível consultar os códigos de permissão no momento.",
      messages: {
        403: "Você não tem permissão para consultar códigos de permissão.",
      },
    });
  }

  return NextResponse.json(result.data);
}
