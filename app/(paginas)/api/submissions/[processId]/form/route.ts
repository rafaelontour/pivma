import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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
  if (status === 401) {
    cookieStore.delete("access_token");
  }

  const responseStatus = getResponseStatus(status);
  const message = getErrorMessage(responseStatus, operation);
  return NextResponse.json({ message }, { status: responseStatus });
}

function getResponseStatus(status: number | undefined) {
  if (
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 409 ||
    status === 422
  ) {
    return status;
  }

  return 502;
}

function getErrorMessage(
  status: number,
  operation: "consultar" | "salvar" | "enviar",
) {
  if (status === 401) return "Sua sessão não é mais válida.";
  if (status === 403) return "Você não pode acessar este rascunho.";
  if (status === 404) return "O formulário deste rascunho não foi encontrado.";
  if (status === 409) return "Este formulário não aceita mais alterações.";
  if (status === 422) {
    return operation === "enviar"
      ? "Preencha os campos obrigatórios antes de enviar para análise."
      : "Revise os valores informados no formulário.";
  }

  if (operation === "salvar") {
    return "Não foi possível salvar o rascunho no momento.";
  }

  return operation === "enviar"
    ? "Não foi possível enviar a submissão no momento."
    : "Não foi possível carregar o formulário no momento.";
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
