import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { http } from "./Http";
import type { CurrentSessionUser, LoginResult } from "@/types/Autenticacao";
import type { ServiceResult } from "@/types/Servico";

export async function login(
  identifier: string,
  password: string,
): Promise<ServiceResult<LoginResult>> {
  const [error, response] = await tryit(() =>
    http.post("/auth/login", { identifier, password }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error), code: getBackendCode(error) };
  }

  return {
    ok: true,
    data: { setCookies: getSetCookies(response.headers["set-cookie"]) },
  };
}

export async function getCurrentUser(
  accessToken: string,
): Promise<ServiceResult<CurrentSessionUser>> {
  const [error, response] = await tryit(() =>
    http.get<CurrentSessionUser>("/auth/me", {
      headers: { 
        Cookie: `access_token=${accessToken}`
      },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return { ok: true, data: response.data };
}

export async function logout(accessToken: string) {
  await tryit(() =>
    http.post("/auth/logout", undefined, {
      headers: {
        Cookie: `access_token=${accessToken}`
      },
    }),
  )();
}

function getSetCookies(header: unknown) {
  if (Array.isArray(header)) {
    return header;
  }

  return typeof header === "string" ? [header] : [];
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}

function getBackendCode(error: Error) {
  if (!isAxiosError(error)) return undefined;
  const responseData = error.response?.data;
  if (!responseData || typeof responseData !== "object") return undefined;
  const detail = (responseData as Record<string, unknown>).detail;
  if (!detail || typeof detail !== "object") return undefined;
  const code = (detail as Record<string, unknown>).code;
  return typeof code === "string" ? code : undefined;
}
