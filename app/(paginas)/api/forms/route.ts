import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { listFormTemplateCatalog } from "@/services/Formulario";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await listFormTemplateCatalog(accessToken);
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage: "Não foi possível carregar o catálogo de formulários.",
      messages: { 403: "Você não tem permissão para consultar formulários." },
    });
  }

  return NextResponse.json(result.data);
}
