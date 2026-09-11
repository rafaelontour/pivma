import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { listEvaluableFormFields } from "@/services/Formulario";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/forms/evaluable-fields/[formKey]">,
) {
  const { formKey } = await context.params;
  if (!/^[A-Za-z0-9._-]{1,128}$/.test(formKey)) {
    return NextResponse.json({ message: "Formulário inválido." }, { status: 400 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await listEvaluableFormFields(accessToken, formKey);
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage: "Não foi possível consultar as associações de IA.",
      messages: {
        403: "Você não tem permissão para consultar associações de IA.",
        404: "O formulário informado não foi encontrado.",
      },
    });
  }

  return NextResponse.json(result.data);
}
