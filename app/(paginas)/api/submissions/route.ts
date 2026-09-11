import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { createSubmissionDraft } from "@/services/Submissao";
import type { CreateSubmissionDraftInput } from "@/types/Submissao";

export const runtime = "nodejs";

const TEMPLATE_KEY_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as
    | CreateSubmissionDraftInput
    | null;
  const templateKey = typeof payload?.templateKey === "string"
    ? payload.templateKey.trim()
    : "";
  const title = typeof payload?.title === "string" ? payload.title.trim() : "";

  if (!TEMPLATE_KEY_PATTERN.test(templateKey) || title.length < 3 || title.length > 255) {
    return NextResponse.json(
      { message: "Selecione um tipo e informe um título entre 3 e 255 caracteres." },
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

  const result = await createSubmissionDraft(accessToken, {
    templateKey,
    title,
  });

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage: "Não foi possível criar o rascunho no momento.",
      messages: {
        403: "Você não pode iniciar esta submissão.",
        404: "Este tipo de submissão não está mais disponível.",
        409: "Não foi possível criar outro rascunho neste momento.",
        422: "Os dados da submissão foram rejeitados pela API.",
      },
    });
  }

  return NextResponse.json(result.data, { status: 201 });
}
