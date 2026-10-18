import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { validateLaboratoryCreate } from "@/components/institucional";
import { createLaboratory } from "@/services/Institucional";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = validateLaboratoryCreate(await request.json().catch(() => null));
  if (!input.valid) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: input.message },
      { status: 422 },
    );
  }

  const authorization = await authorizeInternalApi(["institutional.catalogs.manage"]);
  if (!authorization.ok) return authorization.response;

  const result = await createLaboratory(authorization.accessToken, input.input);
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore: authorization.cookieStore,
      fallbackMessage: "Não foi possível cadastrar o laboratório no momento.",
      messages: {
        403: "Você não tem permissão para cadastrar laboratórios.",
        404: "A instituição selecionada não foi encontrada.",
        409: "Já existe um laboratório com este nome na instituição selecionada.",
        422: "Informe uma instituição ativa e um nome de laboratório válido.",
      },
    });
  }

  return NextResponse.json(result.data, { status: 201 });
}
