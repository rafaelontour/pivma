import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { apiOrigin, http } from "./Http";
import type { ServiceResult } from "@/types/Servico";
import type {
  CreateUserInput,
  UserList,
  UserListOptions,
  UserPublic,
  UpdateUserInput,
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
  options: UserListOptions,
): Promise<ServiceResult<UserList>> {
  const { profileId, ...params } = options;
  const [error, response] = await tryit(() =>
    http.get<UserList>("/users", {
      headers: { Cookie: `access_token=${accessToken}` },
      params: {
        ...params,
        profile_id: profileId,
      },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return { ok: true, data: response.data };
}

export async function updateUser(
  accessToken: string,
  userId: string,
  input: UpdateUserInput,
): Promise<ServiceResult<UserPublic>> {
  const [error, response] = await tryit(() =>
    http.patch<UserPublic>(`/users/${userId}`, input, {
      headers: {
        Cookie: `access_token=${accessToken}`,
        Origin: apiOrigin,
      },
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
