import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { ProcessOperationCodeRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function GET(_request: Request, context: ProcessOperationCodeRouteContext) {
  const { processId, code } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isSafeCode(code)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "read");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "get", `/processes/${processId}/samples/vials/${encodeURIComponent(code)}`);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível consultar o frasco." });
  return NextResponse.json(result.data);
}

function isSafeCode(value: string) { return Boolean(value.trim()) && value.length <= 255 && !/[\\/]/.test(value) && value !== "." && value !== ".."; }
function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise o código do frasco." }, { status: 422 }); }
