import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { getApiOrigin, http } from "./Http";
import type { ServiceResult } from "@/types/Servico";
import type {
  CreateUserInput,
  ExternalUserListResponse,
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
    http.get<ExternalUserListResponse>("/users", {
      headers: { Cookie: `access_token=${accessToken}` },
      params: {
        search: params.search,
        active: params.active,
        page: Math.floor(params.offset / params.limit) + 1,
        per_page: params.limit,
        profile_id: profileId,
      },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  const data = normalizeUserList(response.data);
  return data ? { ok: true, data } : { ok: false };
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
        Origin: getApiOrigin(),
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

function normalizeUserList(value: ExternalUserListResponse): UserList | null {
  if (
    !value ||
    !Array.isArray(value.data) ||
    !value.pagination ||
    typeof value.pagination.page !== "number" ||
    typeof value.pagination.per_page !== "number" ||
    typeof value.pagination.has_next !== "boolean"
  ) {
    return null;
  }

  return {
    offset: (value.pagination.page - 1) * value.pagination.per_page,
    limit: value.pagination.per_page,
    items: value.data,
  };
}
