import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import {
  getSubmissionForm,
  saveSubmissionDraft,
  submitSubmission,
} from "@/services/Submissao";
import type {
  DynamicFormValue,
  SaveSubmissionDraftInput,
} from "@/types/Submissao";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/submissions/[processId]/form">,
) {
  const { processId } = await context.params;

  if (!isUuid(processId)) {
    return NextResponse.json(
      { message: "Submissão inválida." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );
  }

  const result = await getSubmissionForm(accessToken, processId);
  if (!result.ok) {
    return formErrorResponse(result.status, cookieStore, "consultar");
  }

  return NextResponse.json(result.data);
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/submissions/[processId]/form">,
) {
  const { processId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | SaveSubmissionDraftInput
    | null;

  if (!isUuid(processId) || !isValidValues(payload?.values)) {
    return NextResponse.json(
      { message: "Informe valores de rascunho válidos." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );
  }

  const result = await saveSubmissionDraft(
    accessToken,
    processId,
    payload,
  );
  if (!result.ok) {
    return formErrorResponse(result.status, cookieStore, "salvar");
  }

  return NextResponse.json(result.data);
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/submissions/[processId]/form">,
) {
  const { processId } = await context.params;
  const payload = (await request.json().catch(() => null)) as
    | SaveSubmissionDraftInput
    | null;

  if (!isUuid(processId) || !isValidValues(payload?.values)) {
    return NextResponse.json(
      { message: "Informe valores de submissão válidos." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json(
      { message: "Sessão não encontrada." },
      { status: 401 },
    );
  }

  const currentUser = await getCurrentUser(accessToken);

  if (!currentUser.ok) {
    return formErrorResponse(currentUser.status, cookieStore, "enviar");
  }

  const canSubmit = currentUser.data.access.scopes.some(
    (scope) =>
      scope.process_id === processId && scope.roles.includes("proponent"),
  );

  if (!canSubmit) {
    return NextResponse.json(
      { message: "Você não pode enviar esta submissão." },
      { status: 403 },
    );
  }

  const result = await submitSubmission(accessToken, processId, payload);

  if (!result.ok) {
    return formErrorResponse(result.status, cookieStore, "enviar");
  }

  return NextResponse.json(result.data);
}

function formErrorResponse(
  status: number | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
  operation: "consultar" | "salvar" | "enviar",
) {
  const fallbackMessage =
    operation === "salvar"
      ? "Não foi possível salvar o rascunho no momento."
      : operation === "enviar"
        ? "Não foi possível enviar a submissão no momento."
        : "Não foi possível carregar o formulário no momento.";

  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage,
    messages: {
      403: "Você não pode acessar este rascunho.",
      404: "O formulário deste rascunho não foi encontrado.",
      409: "Este formulário não aceita mais alterações.",
      422:
        operation === "enviar"
          ? "Preencha os campos obrigatórios antes de enviar para análise."
          : "Revise os valores informados no formulário.",
    },
  });
}

function isValidValues(
  value: unknown,
): value is Record<string, DynamicFormValue> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  return Object.entries(value).every(
    ([key, fieldValue]) =>
      key.length > 0 &&
      key.length <= 128 &&
      (fieldValue === null ||
        typeof fieldValue === "string" ||
        typeof fieldValue === "number" ||
        typeof fieldValue === "boolean"),
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
