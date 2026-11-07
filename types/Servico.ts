export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status?: number; code?: string; message?: string };

export type ApiMessage = {
  code?: string;
  message?: string;
};

export type ApiRecord = Record<string, unknown>;
