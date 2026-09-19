import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
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
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage:
        "Não foi possível consultar os tipos de submissão no momento.",
      messages: { 403: "Você não tem acesso aos tipos de submissão." },
    });
  }

  return NextResponse.json(result.data);
}
