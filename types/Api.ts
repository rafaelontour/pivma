export type ForwardedApiErrorStatus = 401 | 403 | 404 | 409 | 422 | 429;

export type InternalApiErrorStatus = ForwardedApiErrorStatus | 502;

export type InternalApiErrorCode =
  | "AUTH_REQUIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "UPSTREAM_UNAVAILABLE";

export type InternalApiErrorMessages = Partial<
  Record<InternalApiErrorStatus, string>
>;

export type SessionCookieWriter = {
  delete(name: string): void;
};

export type InternalApiErrorOptions = {
  code?: InternalApiErrorCode;
  fallbackMessage: string;
  messages?: InternalApiErrorMessages;
  cookieStore?: SessionCookieWriter;
};

export type InternalApiAuthorization =
  | {
      ok: true;
      accessToken: string;
      cookieStore: SessionCookieWriter;
    }
  | { ok: false; response: Response };

export type ApiInputValidation<T> =
  | { valid: true; input: T }
  | { valid: false; message: string };
