import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { validateInstitutionName } from "@/components/institucional";
import { createInstitution } from "@/services/Institucional";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = validateInstitutionName(await request.json().catch(() => null));
  if (!input.valid) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: input.message },
      { status: 422 },
    );
  }

  const authorization = await authorizeInternalApi(["institutional.catalogs.manage"]);
  if (!authorization.ok) return authorization.response;

  const result = await createInstitution(authorization.accessToken, input.input);
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore: authorization.cookieStore,
      fallbackMessage: "Não foi possível cadastrar a instituição no momento.",
      messages: {
        403: "Você não tem permissão para cadastrar instituições.",
        409: "Já existe uma instituição com este nome.",
        422: "Informe um nome de instituição válido.",
      },
    });
  }

  return NextResponse.json(result.data, { status: 201 });
}
