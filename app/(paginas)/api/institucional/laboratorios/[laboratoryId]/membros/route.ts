import { NextResponse } from "next/server";
import { authorizeInternalApiAll } from "@/app/(paginas)/api/_shared/authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isInstitutionalUuid } from "@/components/institucional";
import {
  createUserAffiliation,
  getUserActiveState,
  listInstitutionalCatalog,
} from "@/services/Institucional";
import { searchActiveUsersByFullName } from "@/services/Usuario";
import type { ApiRecord } from "@/types/Servico";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  context: RouteContext<"/api/institucional/laboratorios/[laboratoryId]/membros">,
) {
  const { laboratoryId } = await context.params;
  const name = new URL(request.url).searchParams.get("name")?.trim() ?? "";
  if (!isInstitutionalUuid(laboratoryId) || name.length < 2 || name.length > 255) {
    return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 422 });
  }

  const authorization = await authorizeInternalApiAll([
    "institutional.affiliations.manage",
    "users.read",
    "institutional.read",
  ]);
  if (!authorization.ok) return authorization.response;

  const catalog = await listInstitutionalCatalog(authorization.accessToken);
  if (!catalog.ok) {
    return internalApiErrorResponse(catalog.status, {
      cookieStore: authorization.cookieStore,
      fallbackMessage: "Não foi possível validar o laboratório selecionado.",
    });
  }
  const laboratoryIsActive = catalog.data.laboratories.some((item) =>
    item.id === laboratoryId && item.active && item.institution.active,
  );
  if (!laboratoryIsActive) {
    return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 422 });
  }

  const result = await searchActiveUsersByFullName(authorization.accessToken, name);
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore: authorization.cookieStore,
      fallbackMessage: "Não foi possível buscar contas ativas pelo nome.",
    });
  }

  return NextResponse.json(result.data);
}

export async function POST(
  request: Request,
  context: RouteContext<"/api/institucional/laboratorios/[laboratoryId]/membros">,
) {
  const { laboratoryId } = await context.params;
  const payload = await request.json().catch(() => null) as unknown;
  const userId = isRecord(payload) && typeof payload.user_id === "string" ? payload.user_id : "";
  if (!isInstitutionalUuid(laboratoryId) || !isInstitutionalUuid(userId)) {
    return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 422 });
  }

  const authorization = await authorizeInternalApiAll([
    "institutional.affiliations.manage",
    "users.read",
    "institutional.read",
  ]);
  if (!authorization.ok) return authorization.response;

  const [account, catalog] = await Promise.all([
    getUserActiveState(authorization.accessToken, userId),
    listInstitutionalCatalog(authorization.accessToken),
  ]);
  if (!account.ok) {
    return internalApiErrorResponse(account.status, {
      cookieStore: authorization.cookieStore,
      code: account.status === 401 ? "AUTH_REQUIRED" : account.status === 403 ? "FORBIDDEN" : account.status === 404 ? "NOT_FOUND" : "UPSTREAM_UNAVAILABLE",
      fallbackMessage: "Não foi possível validar a conta selecionada.",
      messages: { 404: "A conta selecionada não foi encontrada." },
    });
  }
  if (!account.data) return NextResponse.json({ code: "CONFLICT" }, { status: 409 });
  if (!catalog.ok) {
    return internalApiErrorResponse(catalog.status, {
      cookieStore: authorization.cookieStore,
      code: catalog.status === 401 ? "AUTH_REQUIRED" : catalog.status === 403 ? "FORBIDDEN" : catalog.status === 404 ? "NOT_FOUND" : "UPSTREAM_UNAVAILABLE",
      fallbackMessage: "Não foi possível validar o laboratório selecionado.",
    });
  }

  const laboratory = catalog.data.laboratories.find((item) =>
    item.id === laboratoryId && item.active && item.institution.active,
  );
  if (!laboratory) return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 422 });

  const result = await createUserAffiliation(authorization.accessToken, userId, {
    institution_id: laboratory.institution.id,
    laboratory_id: laboratory.id,
  });
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore: authorization.cookieStore,
      code: result.status === 401 ? "AUTH_REQUIRED" : result.status === 403 ? "FORBIDDEN" : result.status === 404 ? "NOT_FOUND" : result.status === 409 ? "CONFLICT" : result.status === 422 ? "VALIDATION_ERROR" : result.status === 429 ? "RATE_LIMITED" : "UPSTREAM_UNAVAILABLE",
      fallbackMessage: "Não foi possível vincular a conta ao laboratório no momento.",
      messages: {
        403: "Você não tem permissão para criar este vínculo.",
        404: "A conta ou o laboratório não foi encontrado.",
        409: "A conta já possui um vínculo ativo com este laboratório.",
        422: "A conta, a instituição ou o laboratório não está ativo ou não corresponde.",
        429: "Muitas solicitações foram realizadas. Aguarde e tente novamente.",
      },
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
