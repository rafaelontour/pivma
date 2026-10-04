import type { TFunction } from "i18next";

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
  payload: unknown,
  fallback: string,
  t: TFunction,
) {
  const code = getStringProperty(payload, "code");
  const translationKey = code
    ? ERROR_TRANSLATION_KEYS[code]
    : undefined;

  if (translationKey) {
    return t(translationKey);
  }

  return getStringProperty(payload, "message") ?? fallback;
}

function getStringProperty(value: unknown, property: string) {
  if (!value || typeof value !== "object" || !(property in value)) return undefined;
  const candidate = (value as Record<string, unknown>)[property];
  return typeof candidate === "string" ? candidate : undefined;
}
