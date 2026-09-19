import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { triageErrorResponse } from "@/app/(paginas)/api/_shared/triage";
import { isTriageUuid, validateTriageFeedback } from "@/components/triagem";
import { saveTriageFeedback } from "@/services/Triagem";

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext<"/api/triage/[processId]/feedback/[runId]">) {
  const { processId, runId } = await context.params;
  const validation = validateTriageFeedback(await request.json().catch(() => null));
  if (!isTriageUuid(processId) || !isTriageUuid(runId) || !validation.valid) return NextResponse.json({ message: validation.valid ? "Processo ou execução inválida." : validation.message }, { status: 400 });
  const authorization = await authorizeInternalApi(["triage.review"]);
  if (!authorization.ok) return authorization.response;
  const result = await saveTriageFeedback(authorization.accessToken, processId, runId, validation.input);
  if (!result.ok) return triageErrorResponse(result.status, authorization.cookieStore, "Não foi possível salvar o feedback da IA.");
  return NextResponse.json(result.data);
}
