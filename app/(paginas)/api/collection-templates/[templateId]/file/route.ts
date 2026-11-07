import { NextResponse } from "next/server";
import { authorizeCollectionTemplates, collectionTemplateError } from "@/app/(paginas)/api/_shared/collection-template-authorization";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { downloadCollectionTemplate } from "@/services/TemplateColeta";
import type { CollectionTemplateRouteContext } from "@/types/TemplateColeta";

export const runtime = "nodejs";

export async function GET(request: Request, context: CollectionTemplateRouteContext) {
  const { templateId } = await context.params;
  if (!isProcessCompositionUuid(templateId)) return validationError();
  const format = new URL(request.url).searchParams.get("format");
  if (format !== "csv" && format !== "xlsx") return validationError();
  const authorization = await authorizeCollectionTemplates();
  if (!authorization.ok) return authorization.response;
  const result = await downloadCollectionTemplate(authorization.accessToken, templateId, format);
  if (!result.ok) return collectionTemplateError(result.status, result.code, result.message, authorization.cookieStore);
  const expectedType = format === "csv" ? "text/csv; charset=utf-8" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const fileName = format === "csv" ? "template-coleta.csv" : "template-coleta.xlsx";
  return new NextResponse(result.data.bytes, { status: 200, headers: { "Content-Type": expectedType, "Content-Disposition": `attachment; filename="${fileName}"`, "Cache-Control": "private, no-store" } });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Selecione um formato CSV ou XLSX válido." }, { status: 422 }); }
