import { NextResponse } from "next/server";
import { authorizeCollectionTemplates, collectionTemplateError } from "@/app/(paginas)/api/_shared/collection-template-authorization";
import { validateCollectionTemplate } from "@/components/template-coleta";
import { createCollectionTemplate, listCollectionTemplates } from "@/services/TemplateColeta";

export const runtime = "nodejs";

export async function GET() {
  const authorization = await authorizeCollectionTemplates();
  if (!authorization.ok) return authorization.response;
  const result = await listCollectionTemplates(authorization.accessToken);
  if (!result.ok) return collectionTemplateError(result.status, result.code, result.message, authorization.cookieStore);
  return NextResponse.json(result.data);
}

export async function POST(request: Request) {
  const authorization = await authorizeCollectionTemplates();
  if (!authorization.ok) return authorization.response;
  const parsed = validateCollectionTemplate(await request.json().catch(() => null));
  if (!parsed.valid) return NextResponse.json({ code: "VALIDATION_ERROR", message: parsed.message }, { status: 422 });
  const result = await createCollectionTemplate(authorization.accessToken, parsed.input);
  if (!result.ok) return collectionTemplateError(result.status, result.code, result.message, authorization.cookieStore);
  return NextResponse.json(result.data, { status: 201 });
}
