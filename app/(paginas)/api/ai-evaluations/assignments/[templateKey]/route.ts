import { NextResponse } from "next/server";
import { aiEvaluationErrorResponse } from "@/app/(paginas)/api/_shared/ai-evaluations";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { validateAiEvaluationAssignments } from "@/components/avaliacao-ia";
import {
  listAiEvaluationAssignments,
  replaceAiEvaluationAssignments,
} from "@/services/AvaliacaoIa";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/ai-evaluations/assignments/[templateKey]">,
) {
  const { templateKey } = await context.params;
  if (!isTechnicalKey(templateKey)) {
    return NextResponse.json({ message: "Formulário inválido." }, { status: 400 });
  }

  const authorization = await authorizeInternalApi([
    "ai_evaluations.read",
    "ai_evaluations.manage",
  ]);
  if (!authorization.ok) return authorization.response;
  const result = await listAiEvaluationAssignments(
    authorization.accessToken,
    templateKey,
  );
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível carregar as associações de IA.",
    );
  }
  return NextResponse.json(result.data);
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/ai-evaluations/assignments/[templateKey]">,
) {
  const { templateKey } = await context.params;
  if (!isTechnicalKey(templateKey)) {
    return NextResponse.json({ message: "Formulário inválido." }, { status: 400 });
  }

  const authorization = await authorizeInternalApi(["ai_evaluations.manage"]);
  if (!authorization.ok) return authorization.response;
  const validation = validateAiEvaluationAssignments(
    await request.json().catch(() => null),
  );
  if (!validation.valid) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const result = await replaceAiEvaluationAssignments(
    authorization.accessToken,
    templateKey,
    validation.input,
  );
  if (!result.ok) {
    return aiEvaluationErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível salvar as associações de IA.",
    );
  }
  return NextResponse.json(result.data);
}

function isTechnicalKey(value: string) {
  return /^[A-Za-z0-9._-]{1,128}$/.test(value);
}
