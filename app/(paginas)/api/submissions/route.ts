import { cookies } from "next/headers";
import { NextResponse } from "next/server";
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

  if (!TEMPLATE_KEY_PATTERN.test(templateKey)) {
    return NextResponse.json(
      { message: "Selecione um tipo de submissão válido." },
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
    title: `${templateKey}-001`,
  });

  if (!result.ok) {
    if (result.status === 401) {
      cookieStore.delete("access_token");
    }

    const status = getResponseStatus(result.status);
    return NextResponse.json(
      { message: getErrorMessage(status) },
      { status },
    );
  }

  return NextResponse.json(result.data, { status: 201 });
}

function getResponseStatus(status: number | undefined) {
  if (status === 401 || status === 403 || status === 404 || status === 409) {
    return status;
  }

  return status === 422 ? 400 : 502;
}

function getErrorMessage(status: number) {
  if (status === 401) return "Sua sessão não é mais válida.";
  if (status === 403) return "Você não pode iniciar esta submissão.";
  if (status === 404) return "Este tipo de submissão não está mais disponível.";
  if (status === 409) return "Não foi possível criar outro rascunho neste momento.";
  if (status === 400) return "O tipo de submissão foi rejeitado pela API.";
  return "Não foi possível criar o rascunho no momento.";
}
