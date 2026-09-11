import { internalApiErrorResponse } from "./responses";
import type { SessionCookieWriter } from "@/types/Api";

export function triageErrorResponse(status: number | undefined, cookieStore: SessionCookieWriter, fallbackMessage: string) {
  return internalApiErrorResponse(status, { cookieStore, fallbackMessage, messages: { 403: "Você não possui permissão para realizar esta operação de triagem.", 404: "O processo ou registro de triagem não foi encontrado.", 409: "O processo mudou de estado. Atualize a fila antes de continuar.", 422: "Os dados de triagem foram rejeitados. Revise os campos informados." } });
}
