import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { validateSampleReceipt } from "@/components/process-operations";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { ProcessOperationCodeRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function POST(request: Request, context: ProcessOperationCodeRouteContext) {
  const { processId, code } = await context.params;
  if (!isProcessCompositionUuid(processId) || !code.trim() || code.length > 255 || /[\\/]/.test(code)) return validationError("Revise os identificadores informados.");
  const parsed = validateSampleReceipt(await request.json().catch(() => null));
  if (!parsed.valid) return validationError(parsed.message);
  const authorization = await authorizeProcessComposition(processId, "laboratory");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "post", `/processes/${processId}/sample-receipt/vials/${encodeURIComponent(code)}/check`, parsed.input);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível pré-verificar o recebimento." });
  return NextResponse.json(result.data);
}

function validationError(message: string) { return NextResponse.json({ code: "VALIDATION_ERROR", message }, { status: 422 }); }
