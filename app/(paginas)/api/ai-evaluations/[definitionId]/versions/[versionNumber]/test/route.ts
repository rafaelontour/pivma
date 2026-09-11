import { NextResponse } from "next/server";
import { aiEvaluationErrorResponse } from "@/app/(paginas)/api/_shared/ai-evaluations";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { isUuid, validateAiEvaluationTest } from "@/components/avaliacao-ia";
import { testAiEvaluationVersion } from "@/services/AvaliacaoIa";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: RouteContext<"/api/ai-evaluations/[definitionId]/versions/[versionNumber]/test">,
) {
  const { definitionId, versionNumber: value } = await context.params;
  const versionNumber = Number(value);
  if (!isUuid(definitionId) || !Number.isInteger(versionNumber) || versionNumber < 1) {
    return NextResponse.json({ message: "Avaliação ou versão inválida." }, { status: 400 });
  }

  const authorization = await authorizeInternalApi(["ai_evaluations.manage"]);
  if (!authorization.ok) return authorization.response;
  const validation = validateAiEvaluationTest(await request.json().catch(() => null));
  if (!validation.valid) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const result = await testAiEvaluationVersion(
    authorization.accessToken,
    definitionId,
    versionNumber,
    validation.input,
  );
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível testar a avaliação.",
    );
  }
  return NextResponse.json(result.data);
}
