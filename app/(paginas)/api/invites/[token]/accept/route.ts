import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isValidToken } from "@/app/(paginas)/api/invites/[token]/route";
import { getCurrentUser } from "@/services/Autenticacao";
import { acceptParticipantInvite } from "@/services/ParticipacaoProcesso";
import type { InviteRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function POST(_request: Request, context: InviteRouteContext) {
  const { token } = await context.params;
  if (!isValidToken(token)) return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 422 });
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401 });
  const session = await getCurrentUser(accessToken);
  if (!session.ok) return internalApiErrorResponse(session.status, { cookieStore, fallbackMessage: "Não foi possível validar a sessão." });
  const result = await acceptParticipantInvite(accessToken, token);
  if (!result.ok) return internalApiErrorResponse(result.status, { cookieStore, backendCode: result.code, backendMessage: result.message, fallbackMessage: "Não foi possível aceitar este convite." });
  return NextResponse.json({ success: true });
}
