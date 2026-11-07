import { NextResponse } from "next/server";
import { authorizeCollectionTemplates, collectionTemplateError } from "@/app/(paginas)/api/_shared/collection-template-authorization";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { validateCollectionTemplateColumn } from "@/components/template-coleta";
import { addCollectionTemplateColumn } from "@/services/TemplateColeta";
import type { CollectionTemplateRouteContext } from "@/types/TemplateColeta";

export const runtime = "nodejs";

export async function POST(request: Request, context: CollectionTemplateRouteContext) {
  const { templateId } = await context.params;
  if (!isProcessCompositionUuid(templateId)) return validationError();
  const authorization = await authorizeCollectionTemplates();
  if (!authorization.ok) return authorization.response;
  const parsed = validateCollectionTemplateColumn(await request.json().catch(() => null));
  if (!parsed.valid) return NextResponse.json({ code: "VALIDATION_ERROR", message: parsed.message }, { status: 422 });
  const result = await addCollectionTemplateColumn(authorization.accessToken, templateId, parsed.input);
  if (!result.ok) return collectionTemplateError(result.status, result.code, result.message, authorization.cookieStore);
  return NextResponse.json(result.data, { status: 201 });
}

function validationError() { return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise o identificador do template." }, { status: 422 }); }
