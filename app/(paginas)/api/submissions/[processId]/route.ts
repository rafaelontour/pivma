import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { getProcess } from "@/services/Processo";
import { getTriageTimeline } from "@/services/Triagem";
import {
  deleteSubmissionDraft,
  getSubmissionForm,
} from "@/services/Submissao";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/submissions/[processId]">,
) {
  const { processId } = await context.params;
  if (!isUuid(processId)) return NextResponse.json({ code: "VALIDATION_ERROR", message: "Submissão inválida." }, { status: 400 });
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) return NextResponse.json({ code: "AUTH_REQUIRED", message: "Sessão não encontrada." }, { status: 401 });
  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser.ok) return processError(currentUser.status, cookieStore);
  const isParticipant = currentUser.data.access.scopes.some((scope) => scope.process_id === processId && scope.roles.includes("proponent"));
  if (!isParticipant) return NextResponse.json({ code: "FORBIDDEN", message: "Você não pode consultar esta submissão." }, { status: 403 });
  const result = await getProcess(accessToken, processId);
  if (!result.ok) return processError(result.status, cookieStore);
  return NextResponse.json(result.data);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/submissions/[processId]">,
) {
  const { processId } = await context.params;
  if (!isUuid(processId)) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Submissão inválida." },
      { status: 400 },
    );
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json(
      { code: "AUTH_REQUIRED", message: "Sessão não encontrada." },
      { status: 401 },
    );
  }

  const currentUser = await getCurrentUser(accessToken);
  if (!currentUser.ok) {
    return deleteDraftError(currentUser.status, cookieStore);
  }

  const canDelete = currentUser.data.access.scopes.some(
    (scope) =>
      scope.process_id === processId && scope.roles.includes("proponent"),
  );
  if (!canDelete) {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Você não pode excluir este rascunho." },
      { status: 403 },
    );
  }

  const process = await getProcess(accessToken, processId);
  if (!process.ok) {
    return deleteDraftError(process.status, cookieStore);
  }
  if (!process.data.available_actions?.includes("DELETE")) {
    return NextResponse.json(
      {
        code: "CONFLICT",
        message: "Somente processos em rascunho podem ser excluídos.",
      },
      { status: 409 },
    );
  }


  const timeline = await getTriageTimeline(accessToken, processId);
  if (!timeline.ok) {
    return deleteDraftError(timeline.status, cookieStore);
  }
  if (timeline.data.events.some((event) => event.event_type === "SUBMISSION_SUBMITTED")) {
    return NextResponse.json(
      {
        code: "CONFLICT",
        message: "Uma submissão já enviada não pode ser excluída durante a correção.",
      },
      { status: 409 },
    );
  }

  const form = await getSubmissionForm(accessToken, processId);
  if (!form.ok) {
    return deleteDraftError(form.status, cookieStore);
  }
  if (form.data.is_submitted) {
    return NextResponse.json(
      {
        code: "CONFLICT",
        message: "Somente processos em rascunho podem ser excluídos.",
      },
      { status: 409 },
    );
  }

  const result = await deleteSubmissionDraft(accessToken, processId);
  if (!result.ok) {
    return deleteDraftError(result.status, cookieStore);
  }

  return new NextResponse(null, { status: 204 });
}

function processError(status: number | undefined, cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return internalApiErrorResponse(status, { cookieStore, fallbackMessage: "Não foi possível consultar a submissão.", messages: { 403: "Você não pode consultar esta submissão.", 404: "Submissão não encontrada." } });
}

function deleteDraftError(
  status: number | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage: "Não foi possível excluir o rascunho.",
    messages: {
      403: "Você não pode excluir este rascunho.",
      404: "Rascunho não encontrado.",
      409: "Este processo não pode mais ser excluído como rascunho.",
    },
  });
}

function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
