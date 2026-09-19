import { NextResponse } from "next/server";
import { aiEvaluationErrorResponse } from "@/app/(paginas)/api/_shared/ai-evaluations";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { validateCreateAiEvaluation } from "@/components/avaliacao-ia";
import {
  createAiEvaluation,
  listAiEvaluations,
} from "@/services/AvaliacaoIa";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authorization = await authorizeInternalApi([
    "ai_evaluations.read",
    "ai_evaluations.manage",
  ]);
  if (!authorization.ok) return authorization.response;

  const searchParams = new URL(request.url).searchParams;
  const search = searchParams.get("search")?.trim() || undefined;
  const offset = Number(searchParams.get("offset") ?? 0);
  const limit = Number(searchParams.get("limit") ?? 50);
  if (
    !Number.isInteger(offset) ||
    offset < 0 ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 100
  ) {
    return NextResponse.json({ message: "Paginação inválida." }, { status: 400 });
  }

  const result = await listAiEvaluations(authorization.accessToken, {
    search,
    offset,
    limit,
  });
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível carregar a biblioteca de avaliações.",
    );
  }
  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const authorization = await authorizeInternalApi(["ai_evaluations.manage"]);
  if (!authorization.ok) return authorization.response;

  const validation = validateCreateAiEvaluation(
    await request.json().catch(() => null),
  );
  if (!validation.valid) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const result = await createAiEvaluation(
    authorization.accessToken,
    validation.input,
  );
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível criar a avaliação.",
    );
  }
  return NextResponse.json(result.data, { status: 201 });
}
