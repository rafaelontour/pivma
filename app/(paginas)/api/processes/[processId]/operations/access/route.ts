import { NextResponse } from "next/server";
import { authorizeProcessComposition } from "@/app/(paginas)/api/_shared/process-composition-authorization";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import type { ProcessOperationRouteContext } from "@/types/ProcessOperations";

export const runtime = "nodejs";

export async function GET(_request: Request, context: ProcessOperationRouteContext) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) return NextResponse.json({ code: "VALIDATION_ERROR", message: "Revise o identificador do processo." }, { status: 422 });
  const authorization = await authorizeProcessComposition(processId, "read");
  if (!authorization.ok) return authorization.response;
  const roles = authorization.roles;
  const canReview = authorization.session.access.global_permissions.includes("triage.review");
  return NextResponse.json({ permissions: { canEditSamples: roles.includes("group_manager"), canDecideStructure: canReview, canRegisterReceipt: roles.includes("lead_laboratory") || roles.includes("participating_laboratory"), canDecideNonconformity: roles.includes("sample_selection_group"), canManageExecution: canReview } });
}
