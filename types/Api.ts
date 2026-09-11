export type ForwardedApiErrorStatus = 401 | 403 | 404 | 409 | 422 | 429;

export type InternalApiErrorStatus = ForwardedApiErrorStatus | 502;

export type InternalApiErrorMessages = Partial<
  Record<InternalApiErrorStatus, string>
>;

export type SessionCookieWriter = {
  delete(name: string): void;
};

export type InternalApiErrorOptions = {
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
