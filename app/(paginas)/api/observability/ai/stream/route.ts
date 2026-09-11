import { authorizeAdministratorApi } from "@/app/(paginas)/api/_shared/authorization";
import {
  observabilityErrorResponse,
  observabilityStreamResponse,
} from "@/app/(paginas)/api/_shared/observability";
import { openAiStream } from "@/services/Observabilidade";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authorization = await authorizeAdministratorApi();
  if (!authorization.ok) return authorization.response;
  const result = await openAiStream(authorization.accessToken, request.signal);
  if (!result.ok) {
    return observabilityErrorResponse(
      result.status,
      authorization.cookieStore,
      "Não foi possível abrir o fluxo de IA.",
    );
  }
  return observabilityStreamResponse(result.data);
}
