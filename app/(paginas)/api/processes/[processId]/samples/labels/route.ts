import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { ProcessOperationRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function GET(request: Request, context: ProcessOperationRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "sample_group");
  if (!authorization.ok) return authorization.response;
  const search = new URL(request.url).searchParams;
  const page = parsePage(search.get("page")); const perPage = parsePerPage(search.get("per_page"));
  if (page === null || perPage === null) return validationError();
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "get", `/processes/${processId}/samples/labels`, undefined, { page, per_page: perPage });
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível consultar as etiquetas das amostras." });
  return NextResponse.json(result.data);
}

function parsePage(value: string | null) { if (value === null) return 1; return /^\d+$/.test(value) && Number(value) >= 1 ? Number(value) : null; }
function parsePerPage(value: string | null) { if (value === null) return 20; return /^\d+$/.test(value) && Number(value) >= 1 && Number(value) <= 100 ? Number(value) : null; }
function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise a paginação ou o identificador do processo." }, { status: 422 }); }
