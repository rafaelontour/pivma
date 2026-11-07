import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { downloadProcessOperation } from "@/services/ProcessOperation";
import type { ProcessOperationCodeRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function GET(_request: Request, context: ProcessOperationCodeRouteContext) {
  const { processId, code } = await context.params;
  if (!isProcessCompositionUuid(processId) || !code.trim() || code.length > 255 || /[\\/]/.test(code)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "sample_group");
  if (!authorization.ok) return authorization.response;
  const result = await downloadProcessOperation(authorization.accessToken, `/processes/${processId}/samples/vials/${encodeURIComponent(code)}/qr.svg`);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível baixar o QR code do frasco." });
  return new NextResponse(result.data.bytes, { headers: { "Content-Type": "image/svg+xml", "Content-Disposition": "attachment; filename=sample-qr.svg", "Cache-Control": "private, no-store" } });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise o código do frasco." }, { status: 422 }); }
