import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { getCurrentUser } from "@/services/Autenticacao";
import { listProponentSubmissionDrafts } from "@/services/Submissao";

export const runtime = "nodejs";

export async function GET() {
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
    return draftsErrorResponse(currentUser.status, cookieStore);
  }

  const result = await listProponentSubmissionDrafts(
    accessToken,
    currentUser.data.access.scopes,
  );

  if (!result.ok) {
    return draftsErrorResponse(result.status, cookieStore);
  }

  return NextResponse.json(result.data);
}

function draftsErrorResponse(
  status: number | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage: "Não foi possível consultar seus rascunhos no momento.",
    messages: { 403: "Você não pode consultar estes rascunhos." },
  });
}
