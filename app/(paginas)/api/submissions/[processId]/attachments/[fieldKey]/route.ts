import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { downloadSubmissionAttachment, removeSubmissionAttachment, uploadSubmissionAttachment } from "@/services/Submissao";

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext<"/api/submissions/[processId]/attachments/[fieldKey]">) {
  const parameters = await getParameters(context);
  if (!parameters) return invalidResponse();
  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size < 1) return NextResponse.json({ message: "Selecione um arquivo válido." }, { status: 400 });
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  const result = await uploadSubmissionAttachment(session.accessToken, parameters.processId, parameters.fieldKey, file);
  if (!result.ok) return attachmentError(result.status, session.cookieStore, "enviar");
  return NextResponse.json(result.data);
}

export async function DELETE(_request: Request, context: RouteContext<"/api/submissions/[processId]/attachments/[fieldKey]">) {
  const parameters = await getParameters(context);
  if (!parameters) return invalidResponse();
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  const result = await removeSubmissionAttachment(session.accessToken, parameters.processId, parameters.fieldKey);
  if (!result.ok) return attachmentError(result.status, session.cookieStore, "remover");
  return NextResponse.json(result.data);
}

export async function GET(_request: Request, context: RouteContext<"/api/submissions/[processId]/attachments/[fieldKey]">) {
  const parameters = await getParameters(context);
  if (!parameters) return invalidResponse();
  const session = await getSession();
  if (!session.accessToken) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  const result = await downloadSubmissionAttachment(session.accessToken, parameters.processId, parameters.fieldKey);
  if (!result.ok) return attachmentError(result.status, session.cookieStore, "baixar");
  return new Response(result.data.data, { headers: { "Content-Type": result.data.contentType, ...(result.data.contentDisposition ? { "Content-Disposition": result.data.contentDisposition } : {}), "Cache-Control": "private, no-store" } });
}

async function getSession() { const cookieStore = await cookies(); return { cookieStore, accessToken: cookieStore.get("access_token")?.value }; }
async function getParameters(context: RouteContext<"/api/submissions/[processId]/attachments/[fieldKey]">) { const { processId, fieldKey } = await context.params; return isUuid(processId) && /^[A-Za-z0-9._-]{1,128}$/.test(fieldKey) ? { processId, fieldKey } : null; }
function invalidResponse() { return NextResponse.json({ message: "Submissão ou campo inválido." }, { status: 400 }); }
function attachmentError(status: number | undefined, cookieStore: Awaited<ReturnType<typeof cookies>>, operation: string) { return internalApiErrorResponse(status, { cookieStore, fallbackMessage: `Não foi possível ${operation} o anexo.`, messages: { 403: "Você não pode alterar este anexo.", 404: "Anexo ou formulário não encontrado.", 409: "Este formulário não aceita mais alterações.", 422: "O arquivo foi rejeitado pelas regras do campo." } }); }
function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
