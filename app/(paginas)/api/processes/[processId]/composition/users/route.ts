import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { listUsers } from "@/services/Usuario";
import type { ProcessCompositionRouteContext, ProcessCompositionUserOption } from "@/types/ParticipacaoProcesso";

export const runtime = "nodejs";

export async function GET(request: Request, context: ProcessCompositionRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();

  const search = new URL(request.url).searchParams.get("search")?.trim() ?? "";
  if (search.length < 2 || search.length > 255) return validationError();

  const authorization = await authorizeProcessComposition(processId, "manage");
  if (!authorization.ok) return authorization.response;

  const result = await listUsers(authorization.accessToken, {
    offset: 0,
    limit: 20,
    search,
    active: true,
  });
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore: authorization.cookieStore,
      fallbackMessage: "Não foi possível consultar os usuários no momento.",
      messages: { 403: "Você não tem permissão para consultar usuários." },
    });
  }

  const matchingUsers = new Map(
    result.data.items
      .filter((user) => user.active)
      .map((user) => [user.id, user]),
  );
  const searchTokens = normalizeSearch(search).split(" ").filter(Boolean);

  // The external search covers username and email. Full names must always be
  // checked across the active directory, even if the external search matched
  // another account first.
  for (let offset = 0; offset <= 10_000; offset += 100) {
    const page = await listUsers(authorization.accessToken, { offset, limit: 100, active: true });
    if (!page.ok) {
      return internalApiErrorResponse(page.status, {
        cookieStore: authorization.cookieStore,
        fallbackMessage: "Não foi possível consultar os usuários no momento.",
        messages: { 403: "Você não tem permissão para consultar usuários." },
      });
    }

    for (const user of page.data.items) {
      if (user.active && matchesName(user.full_name, searchTokens)) matchingUsers.set(user.id, user);
    }
    if (page.data.items.length < page.data.limit) break;
  }

  const users: ProcessCompositionUserOption[] = Array.from(matchingUsers.values())
    .slice(0, 20)
    .map(({ id, username, full_name, email }) => ({ id, username, full_name, email }));
  return NextResponse.json(users);
}

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("en-US").trim().replace(/\s+/g, " ");
}

function matchesName(fullName: string | null, tokens: string[]) {
  if (!fullName) return false;
  const normalizedName = normalizeSearch(fullName);
  return tokens.every((token) => normalizedName.includes(token));
}

function validationError() {
  return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise a busca informada." }, { status: 422 });
}
