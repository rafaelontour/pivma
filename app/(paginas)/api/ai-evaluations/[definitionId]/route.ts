import { NextResponse } from "next/server";
import { aiEvaluationErrorResponse } from "@/app/(paginas)/api/_shared/ai-evaluations";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { isUuid } from "@/components/avaliacao-ia";
import { getAiEvaluation } from "@/services/AvaliacaoIa";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/ai-evaluations/[definitionId]">,
) {
  const { definitionId } = await context.params;
  if (!isUuid(definitionId)) {
    return NextResponse.json({ message: "Avaliação inválida." }, { status: 400 });
  }

  const authorization = await authorizeInternalApi([
    "ai_evaluations.read",
    "ai_evaluations.manage",
  ]);
  if (!authorization.ok) return authorization.response;

  const result = await getAiEvaluation(authorization.accessToken, definitionId);
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível carregar a avaliação.",
    );
  }
  return NextResponse.json(result.data);
}
