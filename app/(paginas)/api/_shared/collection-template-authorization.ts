import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "./responses";
import { getCurrentUser } from "@/services/Autenticacao";

export async function authorizeCollectionTemplates() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return { ok: false as const, response: NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 }) };
  const session = await getCurrentUser(accessToken);
  if (!session.ok) return { ok: false as const, response: internalApiErrorResponse(session.status, { backendCode: session.code, backendMessage: session.message, cookieStore, fallbackMessage: "Não foi possível validar a sessão." }) };
  return { ok: true as const, accessToken, cookieStore };
}

export function collectionTemplateError(status: number | undefined, code: string | undefined, message: string | undefined, cookieStore: Awaited<ReturnType<typeof import("next/headers").cookies>>) {
  return internalApiErrorResponse(status, { backendCode: code, backendMessage: message, cookieStore, fallbackMessage: "Não foi possível acessar os templates de coleta." });
}
