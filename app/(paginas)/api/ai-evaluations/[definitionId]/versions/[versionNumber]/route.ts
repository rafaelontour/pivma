import { NextResponse } from "next/server";
import { aiEvaluationErrorResponse } from "@/app/(paginas)/api/_shared/ai-evaluations";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import {
  isUuid,
  validatePatchAiEvaluationVersion,
} from "@/components/avaliacao-ia";
import {
  getAiEvaluationVersion,
  patchAiEvaluationVersion,
} from "@/services/AvaliacaoIa";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/ai-evaluations/[definitionId]/versions/[versionNumber]">,
) {
  const parameters = await getParameters(context);
  if (!parameters) {
    return NextResponse.json({ message: "Avaliação ou versão inválida." }, { status: 400 });
  }

  const authorization = await authorizeInternalApi([
    "ai_evaluations.read",
    "ai_evaluations.manage",
  ]);
  if (!authorization.ok) return authorization.response;

  const result = await getAiEvaluationVersion(
    authorization.accessToken,
    parameters.definitionId,
    parameters.versionNumber,
  );
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível carregar a versão da avaliação.",
    );
  }
  return NextResponse.json(result.data);
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/ai-evaluations/[definitionId]/versions/[versionNumber]">,
) {
  const parameters = await getParameters(context);
  if (!parameters) {
    return NextResponse.json({ message: "Avaliação ou versão inválida." }, { status: 400 });
  }

  const authorization = await authorizeInternalApi(["ai_evaluations.manage"]);
  if (!authorization.ok) return authorization.response;

  const validation = validatePatchAiEvaluationVersion(
    await request.json().catch(() => null),
  );
  if (!validation.valid) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const result = await patchAiEvaluationVersion(
    authorization.accessToken,
    parameters.definitionId,
    parameters.versionNumber,
    validation.input,
  );
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível salvar a versão da avaliação.",
    );
  }
  return NextResponse.json(result.data);
}

async function getParameters(
  context: RouteContext<"/api/ai-evaluations/[definitionId]/versions/[versionNumber]">,
) {
  const { definitionId, versionNumber: value } = await context.params;
  const versionNumber = Number(value);
  return isUuid(definitionId) && Number.isInteger(versionNumber) && versionNumber > 0
    ? { definitionId, versionNumber }
    : null;
}
