import { NextResponse } from "next/server";
import { aiEvaluationErrorResponse } from "@/app/(paginas)/api/_shared/ai-evaluations";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { isUuid } from "@/components/avaliacao-ia";
import { createAiEvaluationVersion } from "@/services/AvaliacaoIa";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/ai-evaluations/[definitionId]/versions">,
) {
  const { definitionId } = await context.params;
  if (!isUuid(definitionId)) {
    return NextResponse.json({ message: "Avaliação inválida." }, { status: 400 });
  }

  const authorization = await authorizeInternalApi(["ai_evaluations.manage"]);
  if (!authorization.ok) return authorization.response;

  const result = await createAiEvaluationVersion(
    authorization.accessToken,
    definitionId,
  );
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível criar uma nova versão.",
    );
  }
  return NextResponse.json(result.data, { status: 201 });
}
