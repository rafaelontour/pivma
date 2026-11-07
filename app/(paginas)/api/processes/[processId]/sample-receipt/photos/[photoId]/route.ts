import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { downloadProcessOperation } from "@/services/ProcessOperation";
import type { ReceiptPhotoRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function GET(_request: Request, context: ReceiptPhotoRouteContext) {
  const { processId, photoId } = await context.params;
  if (!isProcessCompositionUuid(processId) || !isProcessCompositionUuid(photoId)) return validationError();
  const authorization = await authorizeProcessComposition(processId, "read");
  if (!authorization.ok) return authorization.response;
  const result = await downloadProcessOperation(authorization.accessToken, `/processes/${processId}/sample-receipt/photos/${photoId}`);
  if (!result.ok) return internalApiErrorResponse(result.status, { backendCode: result.code, backendMessage: result.message, cookieStore: authorization.cookieStore, fallbackMessage: "Não foi possível baixar a foto do recebimento." });
  return new NextResponse(result.data.bytes, { headers: { "Content-Type": result.data.contentType ?? "application/octet-stream", "Content-Disposition": "attachment; filename=receipt-photo", "Cache-Control": "private, no-store" } });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores da foto." }, { status: 422 }); }
