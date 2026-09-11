import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { triageErrorResponse } from "@/app/(paginas)/api/_shared/triage";
import { isTriageUuid } from "@/components/triagem";
import { getProcess } from "@/services/Processo";
import { getSubmissionForm, getSubmissionPreEvaluation } from "@/services/Submissao";
import { getTriageTimeline } from "@/services/Triagem";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/triage/[processId]">) {
  const { processId } = await context.params;
  if (!isTriageUuid(processId)) return NextResponse.json({ message: "Processo inválido." }, { status: 400 });
  const authorization = await authorizeInternalApi(["triage.review"]);
  if (!authorization.ok) return authorization.response;
  const [process, form, preEvaluation, timeline] = await Promise.all([
    getProcess(authorization.accessToken, processId),
    getSubmissionForm(authorization.accessToken, processId),
    getSubmissionPreEvaluation(authorization.accessToken, processId),
    getTriageTimeline(authorization.accessToken, processId),
  ]);
  const failed = !process.ok ? process : !form.ok ? form : !timeline.ok ? timeline : !preEvaluation.ok && preEvaluation.status !== 404 ? preEvaluation : null;
  if (failed && !failed.ok) return triageErrorResponse(failed.status, authorization.cookieStore, "Não foi possível carregar o processo para triagem.");
  if (!process.ok || !form.ok || !timeline.ok) return triageErrorResponse(undefined, authorization.cookieStore, "A resposta de triagem está incompleta.");
  return NextResponse.json({ process: process.data, form: form.data, preEvaluation: preEvaluation.ok ? preEvaluation.data : null, timeline: timeline.data });
}
