import type { TFunction } from "i18next";
import type { ApiMessage } from "@/types/Servico";

const ERROR_TRANSLATION_KEYS: Record<string, string> = {
  AUTH_REQUIRED: "errors.AUTH_REQUIRED",
  FORBIDDEN: "errors.FORBIDDEN",
  NOT_FOUND: "errors.NOT_FOUND",
  CONFLICT: "errors.CONFLICT",
  VALIDATION_ERROR: "errors.VALIDATION_ERROR",
  RATE_LIMITED: "errors.RATE_LIMITED",
  UPSTREAM_UNAVAILABLE: "errors.UPSTREAM_UNAVAILABLE",
};

export function getLocalizedApiError(
  payload: ApiMessage | null,
  fallback: string,
  t: TFunction,
) {
  const translationKey = payload?.code
    ? ERROR_TRANSLATION_KEYS[payload.code]
    : undefined;

  if (translationKey) {
    return t(translationKey);
  }

  return payload?.message ?? fallback;
}

