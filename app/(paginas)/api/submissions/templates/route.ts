import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { listSubmissionTemplates } from "@/services/Submissao";

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

  const result = await listSubmissionTemplates(accessToken);

  if (!result.ok) {
    if (result.status === 401) {
      cookieStore.delete("access_token");
    }

    const status = result.status === 401 || result.status === 403
      ? result.status
      : 502;
    const message = status === 401
      ? "Sua sessão não é mais válida."
      : status === 403
        ? "Você não tem acesso aos tipos de submissão."
        : "Não foi possível consultar os tipos de submissão no momento.";

    return NextResponse.json({ message }, { status });
  }

  return NextResponse.json(result.data);
}
