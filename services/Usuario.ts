import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { http } from "./Http";
import type { ServiceResult } from "@/types/Servico";
import type {
  CreateUserInput,
  UserList,
  UserPublic,
} from "@/types/Usuario";

export async function createUser(
  input: CreateUserInput,
): Promise<ServiceResult<UserPublic>> {
  const [error, response] = await tryit(() =>
    http.post<UserPublic>("/users", input),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return { ok: true, data: response.data };
}

export async function listUsers(
  accessToken: string,
  options: { offset: number; limit: number },
): Promise<ServiceResult<UserList>> {
  const [error, response] = await tryit(() =>
    http.get<UserList>("/users", {
      headers: { Cookie: `access_token=${accessToken}` },
      params: options,
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return { ok: true, data: response.data };
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
