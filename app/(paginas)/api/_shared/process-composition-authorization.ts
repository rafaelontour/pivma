import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "./responses";
import { getCurrentUser } from "@/services/Autenticacao";
import type { CurrentSessionUser } from "@/types/Autenticacao";

export async function authorizeProcessComposition(processId: string, operation: "read" | "proponent" | "group_manager" | "manage" | "triage" | "sample_group" | "laboratory") {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return { ok: false as const, response: NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 }) };
  }

  const session = await getCurrentUser(accessToken);
  if (!session.ok) {
    return { ok: false as const, response: internalApiErrorResponse(session.status, { cookieStore, fallbackMessage: "Não foi possível validar a sessão para acessar a composição do processo." }) };
  }

  const roles = Array.from(new Set(session.data.access.scopes
    .filter((item) => item.process_id === processId)
    .flatMap((item) => item.roles)));
  const canRead = roles.length > 0 ||
    session.data.access.global_permissions.includes("triage.review");
  const canProponentAssign = roles.includes("proponent");
  const canGroupManagerAssign = roles.includes("group_manager");
  const canManage = canProponentAssign || canGroupManagerAssign || session.data.access.global_permissions.includes("triage.review");
  const canReview = session.data.access.global_permissions.includes("triage.review");
  const canSelectSamples = roles.includes("sample_selection_group");
  const canRegisterReceipt = roles.includes("lead_laboratory") || roles.includes("participating_laboratory");
  const allowed = operation === "read" ? canRead : operation === "proponent" ? canProponentAssign : operation === "group_manager" ? canGroupManagerAssign : operation === "triage" ? canReview : operation === "sample_group" ? canSelectSamples : operation === "laboratory" ? canRegisterReceipt : canManage;

  if (!allowed) {
    return { ok: false as const, response: NextResponse.json({ code: "FORBIDDEN", message: "Você não tem acesso à composição deste processo." }, { status: 403 }) };
  }

  return { ok: true as const, accessToken, cookieStore, session: session.data as CurrentSessionUser, roles };
}
