import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/Autenticacao";
import { listProponentSubmittedProcesses } from "@/services/Submissao";

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
    return submissionsErrorResponse(currentUser.status, cookieStore);
  }

  const result = await listProponentSubmittedProcesses(
    accessToken,
    currentUser.data.access.scopes,
  );

  if (!result.ok) {
    return submissionsErrorResponse(result.status, cookieStore);
  }

  return NextResponse.json(result.data);
}

function submissionsErrorResponse(
  status: number | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  if (status === 401) {
    cookieStore.delete("access_token");
  }

  const responseStatus = status === 401 || status === 403 ? status : 502;
  const message =
    responseStatus === 401
      ? "Sua sessão não é mais válida."
      : responseStatus === 403
        ? "Você não pode consultar estas submissões."
        : "Não foi possível consultar suas submissões no momento.";

  return NextResponse.json({ message }, { status: responseStatus });
}
