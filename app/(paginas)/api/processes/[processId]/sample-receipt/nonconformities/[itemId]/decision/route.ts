import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { validateNonconformityDecision } from "@/components/process-operations";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessOperation } from "@/services/ProcessOperation";
import type { ProcessOperationItemRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function POST(request: Request, context: ProcessOperationItemRouteContext) {
  const { processId, itemId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(itemId)) return validationError("Revise os identificadores informados.");
  const parsed = validateNonconformityDecision(await request.json().catch(() => null));
  if (!parsed.valid) return validationError(parsed.message);
  const authorization = await authorizeProcessComposition(processId, "sample_group");
  if (!authorization.ok) return authorization.response;
  const result = await requestProcessOperation<unknown>(authorization.accessToken, "post", `/processes/${processId}/sample-receipt/nonconformities/${itemId}/decision`, parsed.input);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível registrar a decisão da inconformidade." });
  return NextResponse.json(result.data);
}

function validationError(message: string) { return NextResponse.json({ code: "VALIDATION_ERROR", message }, { status: 422 }); }
