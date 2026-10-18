import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isInstitutionalUuid, validateInstitutionName } from "@/components/institucional";
import { deactivateInstitution, renameInstitution } from "@/services/Institucional";
import type { SessionCookieWriter } from "@/types/Api";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/institucional/instituicoes/[institutionId]">,
) {
  const { institutionId } = await context.params;
  const input = validateInstitutionName(await request.json().catch(() => null));
  if (!isInstitutionalUuid(institutionId) || !input.valid) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: input.valid ? "Informe uma instituição válida." : input.message },
      { status: 422 },
    );
  }

  const authorization = await authorizeInternalApi(["institutional.catalogs.manage"]);
  if (!authorization.ok) return authorization.response;

  const result = await renameInstitution(authorization.accessToken, institutionId, input.input);
  if (!result.ok) {
    return institutionError(result.status, authorization.cookieStore, "renomear");
  }

  return NextResponse.json(result.data);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/institucional/instituicoes/[institutionId]">,
) {
  const { institutionId } = await context.params;
  if (!isInstitutionalUuid(institutionId)) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Informe uma instituição válida." },
      { status: 422 },
    );
  }

  const authorization = await authorizeInternalApi(["institutional.catalogs.manage"]);
  if (!authorization.ok) return authorization.response;

  const result = await deactivateInstitution(authorization.accessToken, institutionId);
  if (!result.ok) {
    return institutionError(result.status, authorization.cookieStore, "desativar");
  }

  return new Response(null, { status: 204 });
}

function institutionError(
  status: number | undefined,
  cookieStore: SessionCookieWriter,
  action: string,
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage: `Não foi possível ${action} a instituição no momento.`,
    messages: {
      403: `Você não tem permissão para ${action} instituições.`,
      404: "A instituição informada não foi encontrada.",
      409: action === "desativar"
        ? "A instituição possui dependências ativas ou foi alterada. Atualize e tente novamente."
        : "Já existe uma instituição com este nome ou os dados foram alterados.",
      422: "Informe dados válidos para a instituição.",
    },
  });
}
