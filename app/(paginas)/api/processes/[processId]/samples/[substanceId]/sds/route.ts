import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { downloadProcessOperation, requestProcessFormOperation } from "@/services/ProcessOperation";
import type { SampleSubstanceRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function GET(_request: Request, context: SampleSubstanceRouteContext) {
  const { processId, substanceId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(substanceId)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "read");
  if (!authorization.ok) return authorization.response;
  const result = await downloadProcessOperation(authorization.accessToken, `/processes/${processId}/samples/${substanceId}/sds`);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível baixar a ficha de segurança." });
  return new NextResponse(result.data.bytes, { headers: { "Content-Type": result.data.contentType ?? "application/octet-stream", "Content-Disposition": "attachment; filename=sample-sds", "Cache-Control": "private, no-store" } });
}

export async function PUT(request: Request, context: SampleSubstanceRouteContext) {
  const { processId, substanceId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(substanceId)) return validationError();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0) return validationError();
  const authorization = await authorizeProcessComposition(processId, "group_manager");
  if (!authorization.ok) return authorization.response;
  const outbound = new FormData(); outbound.set("file", file, file.name);
  const result = await requestProcessFormOperation<unknown>(authorization.accessToken, `/processes/${processId}/samples/${substanceId}/sds`, outbound);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível enviar a ficha de segurança." });
  return NextResponse.json(result.data);
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Selecione um arquivo válido." }, { status: 422 }); }
