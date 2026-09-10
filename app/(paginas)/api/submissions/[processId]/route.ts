import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/Autenticacao";
import { getProcess } from "@/services/Processo";
import { deleteSubmissionDraft } from "@/services/Submissao";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/submissions/[processId]">,
) {
  const { processId } = await context.params;

  if (!isUuid(processId)) {
    return NextResponse.json(
      { message: "Rascunho inválido." },
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
    return deletionErrorResponse(currentUser.status, cookieStore);
  }

  const ownsDraft = currentUser.data.access.scopes.some(
    (scope) =>
      scope.process_id === processId && scope.roles.includes("proponent"),
  );

  if (!ownsDraft) {
    return NextResponse.json(
      { message: "Você não pode excluir este rascunho." },
      { status: 403 },
    );
  }

  const process = await getProcess(accessToken, processId);

  if (!process.ok) {
    return deletionErrorResponse(process.status, cookieStore);
  }

  if (process.data.status !== "SUBMISSION") {
    return NextResponse.json(
      { message: "Somente rascunhos em preenchimento podem ser excluídos." },
      { status: 409 },
    );
  }

  const result = await deleteSubmissionDraft(accessToken, processId);

  if (!result.ok) {
    return deletionErrorResponse(result.status, cookieStore);
  }

  return NextResponse.json({ message: "Rascunho excluído com sucesso." });
}

function deletionErrorResponse(
  status: number | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  if (status === 401) {
    cookieStore.delete("access_token");
  }

  if (status === 401) {
    return NextResponse.json(
      { message: "Sua sessão não é mais válida." },
      { status },
    );
  }

  if (status === 403 || status === 404 || status === 409) {
    const message = status === 403
      ? "Você não pode excluir este rascunho."
      : status === 404
        ? "Este rascunho não foi encontrado."
        : "Este processo não pode mais ser excluído como rascunho.";
    return NextResponse.json({ message }, { status });
  }

  if (status === 405) {
    return NextResponse.json(
      { message: "A exclusão de rascunhos ainda não está disponível no backend." },
      { status: 501 },
    );
  }

  return NextResponse.json(
    { message: "Não foi possível excluir o rascunho no momento." },
    { status: 502 },
  );
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}
