import "server-only";

import { internalApiErrorResponse } from "./responses";
import type { SessionCookieWriter } from "@/types/Api";

export function aiEvaluationErrorResponse(
  status: number | undefined,
  cookieStore: SessionCookieWriter,
  fallbackMessage: string,
) {
  return internalApiErrorResponse(status, {
    cookieStore,
    fallbackMessage,
    messages: {
      403: "Seu perfil não possui a capacidade exigida para esta operação de IA.",
      404: "A avaliação, versão ou formulário informado não foi encontrado.",
      409: "O recurso foi alterado por outra operação. Recarregue os dados e tente novamente.",
      422: "A operação foi recusada. Revise os dados da avaliação.",
    },
  });
}
