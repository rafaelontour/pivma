import { internalApiErrorResponse } from "./responses";
import type { SessionCookieWriter } from "@/types/Api";
import type { ObservabilityStream } from "@/types/Observabilidade";

export function observabilityErrorResponse(
  status: number | undefined,
  cookieStore: SessionCookieWriter,
  fallbackMessage: string,
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage,
    messages: {
      403: "Você não possui permissão para acessar a observabilidade.",
      422: "Os filtros de observabilidade foram rejeitados.",
      429: "O limite de consultas foi atingido. Aguarde antes de tentar novamente.",
    },
  });
}

export function observabilityStreamResponse(stream: ObservabilityStream) {
  return new Response(stream.body, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
