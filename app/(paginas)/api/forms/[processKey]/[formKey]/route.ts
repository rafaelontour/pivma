import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { validateFormDefinition } from "@/components/formulario";
import { getFormTemplate, updateFormTemplate } from "@/services/Formulario";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/forms/[processKey]/[formKey]">,
) {
  const { processKey, formKey } = await context.params;
  if (!isTechnicalKey(processKey) || !isTechnicalKey(formKey)) {
    return NextResponse.json({ message: "Template ou formulário inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await getFormTemplate(accessToken, processKey, formKey);
  if (!result.ok) {
    return formError(result.status, cookieStore);
  }

  return NextResponse.json(result.data);
}

export async function PUT(
  request: Request,
  context: RouteContext<"/api/forms/[processKey]/[formKey]">,
) {
  const { processKey, formKey } = await context.params;
  if (!isTechnicalKey(processKey) || !isTechnicalKey(formKey)) {
    return NextResponse.json({ message: "Template ou formulário inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const validation = validateFormDefinition(await request.json().catch(() => null));
  if (!validation.valid) {
    return NextResponse.json({ message: validation.message }, { status: 400 });
  }

  const result = await updateFormTemplate(
    accessToken,
    processKey,
    formKey,
    validation.input,
  );
  if (!result.ok) {
    return formError(result.status, cookieStore);
  }

  return NextResponse.json(result.data);
}

function formError(
  status: number | undefined,
  cookieStore: Awaited<ReturnType<typeof cookies>>,
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage: "Não foi possível concluir a operação com o formulário.",
    messages: {
      403: "A edição é restrita à equipe de gestão BraCVAM.",
      404: "O template ou formulário não foi encontrado.",
      409: "O formulário foi alterado durante a edição. Recarregue e revise suas mudanças.",
      422: "A definição foi recusada. Revise campos, chaves, opções e regras.",
    },
  });
}

function isTechnicalKey(value: string) {
  return /^[A-Za-z0-9._-]{1,128}$/.test(value);
}
