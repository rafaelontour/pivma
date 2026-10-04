import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import {
  decideSubmissionReturnReview,
  getSubmissionReturnReview,
} from "@/services/Submissao";
import type {
  SubmissionReturnReviewChoice,
  SubmissionReturnReviewInput,
} from "@/types/Submissao";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/submissions/[processId]/return-review">,
) {
  const { processId } = await context.params;
  const session = await getProponentSession(processId);
  if (session instanceof NextResponse) return session;

  const result = await getSubmissionReturnReview(session.accessToken, processId);
  if (!result.ok) return returnReviewError(result.status, session.cookieStore, "consultar");
  return NextResponse.json(result.data);
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/submissions/[processId]/return-review">,
) {
  const { processId } = await context.params;
  const payload = await request.json().catch(() => null);
  if (!isReturnReviewInput(payload)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Informe uma decisão de retorno válida." }, { status: 400 });
  }
  const justification = payload.justification?.trim() || null;
  if ((justification?.length ?? 0) > 4000) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "A justificativa deve ter no máximo 4.000 caracteres." }, { status: 400 });
  }

  const session = await getProponentSession(processId);
  if (session instanceof NextResponse) return session;
  const result = await decideSubmissionReturnReview(session.accessToken, processId, {
    choice: payload.choice,
    justification,
  });
  if (!result.ok) return returnReviewError(result.status, session.cookieStore, "responder");
  return NextResponse.json(result.data);
}

async function getProponentSession(processId: string) {
  if (!isUuid(processId)) {
    return NextResponse.json({ code: "VALIDATION_ERROR", message: "Submissão inválida." }, { status: 400 });
  }
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  }
  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser.ok) return returnReviewError(currentUser.status, cookieStore, "consultar");
  const isProponent = currentUser.data.access.scopes.some(
    (scope) => scope.process_id === processId && scope.roles.includes("proponent"),
  );
  if (!isProponent) {
    return NextResponse.json({ code: "FORBIDDEN", message: "Você não pode responder ao retorno desta submissão." }, { status: 403 });
  }
  return { accessToken, cookieStore };
}

function returnReviewError(
  status: number | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  operation: "consultar" | "responder",
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage: operation === "responder" ? "Não foi possível registrar sua resposta ao retorno." : "Não foi possível consultar o retorno desta submissão.",
    messages: {
      403: "Você não pode responder ao retorno desta submissão.",
      404: "Não há um retorno pendente para esta submissão.",
      409: "Este retorno já foi respondido ou não aceita mais alterações.",
      422: "A resposta informada não é válida para este retorno.",
    },
  });
}

function isReturnReviewInput(value: unknown): value is SubmissionReturnReviewInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const input = value as Record<string, unknown>;
  return isReturnReviewChoice(input.choice) && (input.justification === undefined || input.justification === null || typeof input.justification === "string");
}

function isReturnReviewChoice(value: unknown): value is SubmissionReturnReviewChoice {
  return value === "REVISE" || value === "CONTEST_AI" || value === "WITHDRAW";
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
