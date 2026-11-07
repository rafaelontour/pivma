import { NextResponse } from "next/server";
import type {
  ForwardedApiErrorStatus,
  InternalApiErrorOptions,
  InternalApiErrorStatus,
} from "@/types/Api";

const FORWARDED_ERROR_STATUSES = new Set<number>([
  401,
  403,
  404,
  409,
  422,
  429,
]);

const DEFAULT_MESSAGES: Record<InternalApiErrorStatus, string> = {
  401: "Sua sessão não é mais válida.",
  403: "Você não tem permissão para realizar esta operação.",
  404: "O recurso solicitado não foi encontrado.",
  409: "Os dados foram alterados durante a operação. Atualize e tente novamente.",
  422: "Revise os dados informados.",
  429: "Muitas solicitações foram realizadas. Aguarde e tente novamente.",
  502: "Não foi possível concluir a operação no momento.",
};

export function normalizeExternalApiStatus(
  status: number | undefined,
): InternalApiErrorStatus {
  if (status && FORWARDED_ERROR_STATUSES.has(status)) {
    return status as ForwardedApiErrorStatus;
  }

  return 502;
}

export function internalApiErrorResponse(
  status: number | undefined,
  options: InternalApiErrorOptions,
) {
  if (status === 401) {
    options.cookieStore?.delete("access_token");
  }

  const normalizedStatus = normalizeExternalApiStatus(status);
  const responseStatus = options.backendCode && status && status >= 400 && status <= 599
    ? status
    : normalizedStatus;
  const message =
    options.backendMessage ??
    options.messages?.[normalizedStatus] ??
    (normalizedStatus === 502
      ? options.fallbackMessage
      : DEFAULT_MESSAGES[normalizedStatus]);

  return NextResponse.json(
    {
      ...(options.backendCode || options.code
        ? { code: options.backendCode ?? options.code }
        : {}),
      message,
    },
    { status: responseStatus },
  );
}
