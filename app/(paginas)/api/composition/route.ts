import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { listCompositionIndex } from "@/services/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });

  const session = await getCurrentUser(accessToken);
  if (!session.ok) return internalApiErrorResponse(session.status, { cookieStore, fallbackMessage: "Não foi possível carregar os processos disponíveis para composição." });

  const result = await listCompositionIndex(accessToken, session.data.access.scopes);
  if (!result.ok) return internalApiErrorResponse(result.status, { cookieStore, fallbackMessage: "Não foi possível carregar os processos disponíveis para composição." });
  return NextResponse.json(result.data);
}
