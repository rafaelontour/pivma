export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status?: number };

export type ApiMessage = {
  code?: string;
  message?: string;
};

export type ApiRecord = Record<string, unknown>;
