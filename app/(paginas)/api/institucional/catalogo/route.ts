import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { listInstitutionalCatalog } from "@/services/Institucional";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await authorizeInternalApi(["institutional.catalogs.manage"]);
  if (!authorization.ok) return authorization.response;

  const result = await listInstitutionalCatalog(authorization.accessToken);
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore: authorization.cookieStore,
      fallbackMessage: "Não foi possível consultar o catálogo institucional no momento.",
      messages: {
        403: "Você não tem permissão para consultar o catálogo institucional.",
      },
    });
  }

  return NextResponse.json(result.data);
}
