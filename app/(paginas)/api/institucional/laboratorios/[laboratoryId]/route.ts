import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isInstitutionalUuid, validateInstitutionName } from "@/components/institucional";
import { deactivateLaboratory, renameLaboratory } from "@/services/Institucional";
import type { SessionCookieWriter } from "@/types/Api";

export const runtime = "nodejs";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/institucional/laboratorios/[laboratoryId]">,
) {
  const { laboratoryId } = await context.params;
  const input = validateInstitutionName(await request.json().catch(() => null));
  if (!isInstitutionalUuid(laboratoryId) || !input.valid) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: input.valid ? "Informe um laboratório válido." : input.message },
      { status: 422 },
    );
  }

  const authorization = await authorizeInternalApi(["institutional.catalogs.manage"]);
  if (!authorization.ok) return authorization.response;

  const result = await renameLaboratory(authorization.accessToken, laboratoryId, input.input);
  if (!result.ok) {
    return laboratoryError(result.status, authorization.cookieStore, "renomear");
  }

  return NextResponse.json(result.data);
}

export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/institucional/laboratorios/[laboratoryId]">,
) {
  const { laboratoryId } = await context.params;
  if (!isInstitutionalUuid(laboratoryId)) {
    return NextResponse.json(
      { code: "VALIDATION_ERROR", message: "Informe um laboratório válido." },
      { status: 422 },
    );
  }

  const authorization = await authorizeInternalApi(["institutional.catalogs.manage"]);
  if (!authorization.ok) return authorization.response;

  const result = await deactivateLaboratory(authorization.accessToken, laboratoryId);
  if (!result.ok) {
    return laboratoryError(result.status, authorization.cookieStore, "desativar");
  }

  return new Response(null, { status: 204 });
}

function laboratoryError(
  status: number | undefined,
  cookieStore: SessionCookieWriter,
  action: string,
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage: `Não foi possível ${action} o laboratório no momento.`,
    messages: {
      403: `Você não tem permissão para ${action} laboratórios.`,
      404: "O laboratório informado não foi encontrado.",
      409: action === "desativar"
        ? "O laboratório possui dependências ativas ou foi alterado. Atualize e tente novamente."
        : "Já existe um laboratório com este nome ou os dados foram alterados.",
      422: "Informe dados válidos para o laboratório.",
    },
  });
}
