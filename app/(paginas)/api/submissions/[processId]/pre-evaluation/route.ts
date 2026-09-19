import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getSubmissionPreEvaluation } from "@/services/Submissao";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/submissions/[processId]/pre-evaluation">,
) {
  const { processId } = await context.params;
  if (!isUuid(processId)) return NextResponse.json({ message: "Submissão inválida." }, { status: 400 });
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  const result = await getSubmissionPreEvaluation(accessToken, processId);
  if (!result.ok) return internalApiErrorResponse(result.status, {
    cookieStore,
    fallbackMessage: "Não foi possível consultar a pré-avaliação.",
    messages: { 403: "Você não pode consultar esta pré-avaliação.", 404: "Ainda não existe pré-avaliação para esta submissão.", 409: "A pré-avaliação ainda não está disponível." },
  });
  return NextResponse.json(result.data);
}

function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
