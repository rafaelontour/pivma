import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { requestSubmissionDirectReview } from "@/services/Submissao";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: RouteContext<"/api/submissions/[processId]/direct-review">,
) {
  const { processId } = await context.params;
  const payload = await request.json().catch(() => null);
  const justification = isRecord(payload) && typeof payload.justification === "string" ? payload.justification.trim() : null;
  if (!isUuid(processId) || (justification?.length ?? 0) > 2000) return NextResponse.json({ message: "Solicitação de revisão inválida." }, { status: 400 });
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  const result = await requestSubmissionDirectReview(accessToken, processId, { justification });
  if (!result.ok) return internalApiErrorResponse(result.status, {
    cookieStore,
    fallbackMessage: "Não foi possível solicitar a revisão humana.",
    messages: { 403: "Você não pode solicitar revisão desta submissão.", 404: "Submissão não encontrada.", 409: "O estado atual não permite revisão humana direta.", 422: "A solicitação de revisão foi rejeitada." },
  });
  return NextResponse.json(result.data);
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
