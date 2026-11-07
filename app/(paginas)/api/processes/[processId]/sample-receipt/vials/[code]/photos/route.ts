import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { requestProcessFormOperation } from "@/services/ProcessOperation";
import type { ProcessOperationCodeRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function POST(request: Request, context: ProcessOperationCodeRouteContext) {
  const { processId, code } = await context.params;
  if (!isProcessCompositionUuid(processId) || !code.trim() || code.length > 255 || /[\\/]/.test(code)) return validationError();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return validationError();
  const authorization = await authorizeProcessComposition(processId, "laboratory");
  if (!authorization.ok) return authorization.response;
  const outbound = new FormData(); outbound.set("file", file, file.name);
  const result = await requestProcessFormOperation<unknown>(authorization.accessToken, `/processes/${processId}/sample-receipt/vials/${encodeURIComponent(code)}/photos`, outbound, "post");
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível enviar a foto do recebimento." });
  return NextResponse.json(result.data, { status: 201 });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Selecione um arquivo válido e informe o código do frasco." }, { status: 422 }); }
