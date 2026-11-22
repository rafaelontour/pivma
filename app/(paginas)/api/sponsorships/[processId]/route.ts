import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { isProcessCompositionUuid } from "@/components/participacao-processo";
import { getCurrentUser } from "@/services/Autenticacao";
import { getSponsorTrackingDetail } from "@/services/ParticipacaoProcesso";
import type { SponsorTrackingRouteContext } from "@/types/Acompanhamento";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: SponsorTrackingRouteContext,
) {
  const { processId } = await context.params;
  if (!isProcessCompositionUuid(processId)) {
    return NextResponse.json({ code: "VALIDATION_ERROR" }, { status: 422 });
  }

  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ code: "AUTH_REQUIRED" }, { status: 401 });
  }

  const session = await getCurrentUser(accessToken);
  if (!session.ok) {
    return internalApiErrorResponse(session.status, {
      cookieStore,
      fallbackMessage: "Não foi possível validar a sessão do patrocinador.",
    });
  }

  const user = session.data.user ?? session.data;
  const userId = user.id ?? session.data.id;
  if (!userId) {
    return NextResponse.json({ code: "FORBIDDEN" }, { status: 403 });
  }

  const result = await getSponsorTrackingDetail(
    accessToken,
    processId,
    session.data.access.scopes,
    userId,
  );
  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      backendCode: result.code,
      backendMessage: result.message,
      code: result.status === 403 ? "FORBIDDEN" : "UPSTREAM_UNAVAILABLE",
      fallbackMessage: "Não foi possível carregar o acompanhamento do projeto.",
      messages: {
        403: "Você não possui um vínculo ativo de patrocínio neste processo.",
        404: "O processo patrocinado não foi encontrado.",
      },
    });
  }

  return NextResponse.json(result.data);
}
