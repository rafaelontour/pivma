import { NextResponse } from "next/server";
import { previewParticipantInvite } from "@/services/ParticipacaoProcesso";
import type { InviteRouteContext } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function GET(_request: Request, context: InviteRouteContext) {
  const { token } = await context.params;
  if (!isValidToken(token)) return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 422 });
  const result = await previewParticipantInvite(token);
  if (!result.ok) return NextResponse.json({ code: result.code ?? "INVITE_UNAVAILABLE", message: "Não foi possível consultar este convite." }, { status: result.status ?? 502 });
  return NextResponse.json(result.data, { headers: { "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}

export function isValidToken(value: string) {
  return value.length >= 16 && value.length <= 512 && /^[A-Za-z0-9._~-]+$/.test(value);
}
