import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { getProcess } from "@/services/Processo";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/submissions/[processId]">,
) {
  const { processId } = await context.params;
  if (!isUuid(processId)) return NextResponse.json({ message: "Submissão inválida." }, { status: 400 });
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser.ok) return processError(currentUser.status, cookieStore);
  const isParticipant = currentUser.data.access.scopes.some((scope) => scope.process_id === processId && scope.roles.includes("proponent"));
  if (!isParticipant) return NextResponse.json({ message: "Você não pode consultar esta submissão." }, { status: 403 });
  const result = await getProcess(accessToken, processId);
  if (!result.ok) return processError(result.status, cookieStore);
  return NextResponse.json(result.data);
}

function processError(status: number | undefined, cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return internalApiErrorResponse(status, { cookieStore, fallbackMessage: "Não foi possível consultar a submissão.", messages: { 403: "Você não pode consultar esta submissão.", 404: "Submissão não encontrada." } });
}

function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
