import { NextResponse } from "next/server";
import { authorizeInternalApi } from "@/app/(paginas)/api/_shared/authorization";
import { triageErrorResponse } from "@/app/(paginas)/api/_shared/triage";
import { isTriageUuid, validateTriageReviews } from "@/components/triagem";
import { saveTriageFieldReviews } from "@/services/Triagem";

export const runtime = "nodejs";

export async function POST(request: Request, context: RouteContext<"/api/triage/[processId]/reviews">) {
  const { processId } = await context.params;
  const validation = validateTriageReviews(await request.json().catch(() => null));
  if (!isTriageUuid(processId) || !validation.valid) return NextResponse.json({ message: validation.valid ? "Processo inválido." : validation.message }, { status: 400 });
  const authorization = await authorizeInternalApi(["triage.review"]);
  if (!authorization.ok) return authorization.response;
  const result = await saveTriageFieldReviews(authorization.accessToken, processId, validation.input);
  if (!result.ok) return triageErrorResponse(result.status, authorization.cookieStore, "Não foi possível salvar os pareceres.");
  return NextResponse.json(result.data);
}
