import { NextResponse } from "next/server";
import { aiEvaluationErrorResponse } from "@/app/(paginas)/api/_shared/ai-evaluations";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { isUuid } from "@/components/avaliacao-ia";
import { publishAiEvaluationVersion } from "@/services/AvaliacaoIa";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  context: RouteContext<"/api/ai-evaluations/[definitionId]/versions/[versionNumber]/publish">,
) {
  const { definitionId, versionNumber: value } = await context.params;
  const versionNumber = Number(value);
  if (!isUuid(definitionId) || !Number.isInteger(versionNumber) || versionNumber < 1) {
    return NextResponse.json({ message: "Avaliação ou versão inválida." }, { status: 400 });
  }

  const authorization = await authorizeInternalApi(["ai_evaluations.manage"]);
  if (!authorization.ok) return authorization.response;

  const result = await publishAiEvaluationVersion(
    authorization.accessToken,
    definitionId,
    versionNumber,
  );
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível publicar a avaliação.",
    );
  }
  return NextResponse.json(result.data);
}
