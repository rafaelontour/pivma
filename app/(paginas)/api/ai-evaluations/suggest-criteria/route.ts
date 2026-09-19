import { NextResponse } from "next/server";
import { aiEvaluationErrorResponse } from "@/app/(paginas)/api/_shared/ai-evaluations";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { validateSuggestAiCriteria } from "@/components/avaliacao-ia";
import { suggestAiCriteria } from "@/services/AvaliacaoIa";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authorization = await authorizeInternalApi(["ai_evaluations.manage"]);
  if (!authorization.ok) return authorization.response;

  const validation = validateSuggestAiCriteria(
    await request.json().catch(() => null),
  );
  if (!validation.valid) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const result = await suggestAiCriteria(
    authorization.accessToken,
    validation.input,
  );
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível sugerir critérios no momento.",
    );
  }
  return NextResponse.json(result.data);
}
