import { NextResponse } from "next/server";
import { authorizeCollectionTemplates, collectionTemplateError } from "@/app/(paginas)/api/_shared/collection-template-authorization";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { validateCollectionTemplateColumnPatch } from "@/components/template-coleta";
import { deleteCollectionTemplateColumn, updateCollectionTemplateColumn } from "@/services/TemplateColeta";
import type { CollectionTemplateColumnRouteContext } from "@/types/TemplateColeta";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: CollectionTemplateColumnRouteContext) {
  const { templateId, columnId } = await context.params;
  if (!isProcessCompositionUuid(templateId) || !isProcessCompositionUuid(columnId)) return validationError();
  const authorization = await authorizeCollectionTemplates();
  if (!authorization.ok) return authorization.response;
  const parsed = validateCollectionTemplateColumnPatch(await request.json().catch(() => null));
  if (!parsed.valid) return NextResponse.json({ code: "VALIDATION_ERROR", message: parsed.message }, { status: 422 });
  const result = await updateCollectionTemplateColumn(authorization.accessToken, templateId, columnId, parsed.input);
  if (!result.ok) return collectionTemplateError(result.status, result.code, result.message, authorization.cookieStore);
  return NextResponse.json(result.data);
}

export async function DELETE(_request: Request, context: CollectionTemplateColumnRouteContext) {
  const { templateId, columnId } = await context.params;
  if (!isProcessCompositionUuid(templateId) || !isProcessCompositionUuid(columnId)) return validationError();
  const authorization = await authorizeCollectionTemplates();
  if (!authorization.ok) return authorization.response;
  const result = await deleteCollectionTemplateColumn(authorization.accessToken, templateId, columnId);
  if (!result.ok) return collectionTemplateError(result.status, result.code, result.message, authorization.cookieStore);
  return new NextResponse(null, { status: 204 });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise os identificadores informados." }, { status: 422 }); }
