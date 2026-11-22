import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { listSponsorTracking } from "@/services/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const session = await getCurrentUser(accessToken);
  if (!session.ok) {
    return internalApiErrorResponse(session.status, {
      cookieStore,
      fallbackMessage: "Não foi possível validar a sessão do patrocinador.",
    });
  }

  const user = session.data.user ?? session.data;
  const userId = user.id ?? session.data.id;
  const hasSponsorScope = session.data.access.scopes.some((scope) =>
    scope.roles.includes("sponsor"),
  );
  if (!userId || !hasSponsorScope) {
    return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  }

  const result = await listSponsorTracking(
    accessToken,
    session.data.access.scopes,
    userId,
  );
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      backendCode: result.code,
      backendMessage: result.message,
      code: "UPSTREAM_UNAVAILABLE",
      fallbackMessage: "Não foi possível carregar os projetos patrocinados.",
    });
  }

  return NextResponse.json(result.data);
}
