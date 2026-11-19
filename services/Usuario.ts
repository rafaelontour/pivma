import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { getApiOrigin, http } from "./Http";
import type { ServiceResult } from "@/types/Servico";
import type {
  CreateUserInput,
  ExternalUserListResponse,
  UserList,
  UserListItem,
  UserListOptions,
  UserPublic,
  UserProfileDetails,
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

export async function getUserProfileDetails(
  accessToken: string,
  userId: string,
): Promise<ServiceResult<UserProfileDetails>> {
  const accountResult = await findUserById(accessToken, userId);
  if (!accountResult.ok) return accountResult;

  const [accessError, accessResponse] = await tryit(() =>
    http.get<unknown>(`/rbac/users/${userId}/access`, {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
  )();
  if (accessError) return { ok: false, status: getStatus(accessError) };

  const access = normalizeUserAccess(accessResponse.data);
  if (!access) return { ok: false };

  return {
    ok: true,
    data: { account: { ...accountResult.data, profiles: access.profiles }, global_profiles: access.profiles, local_roles: [] },
  };
}

export async function findActiveUserById(
  accessToken: string,
  userId: string,
): Promise<ServiceResult<UserListItem>> {
  for (let offset = 0; offset <= 10_000; offset += 100) {
    const page = await listUsers(accessToken, { offset, limit: 100, active: true });
    if (!page.ok) return page;
    const user = page.data.items.find((item) => item.id === userId);
    if (user) return { ok: true, data: user };
    if (page.data.items.length < page.data.limit) break;
  }
  return { ok: false, status: 404 };
}

async function findUserById(
  accessToken: string,
  userId: string,
): Promise<ServiceResult<UserProfileDetails["account"]>> {
  for (const active of [true, false]) {
    for (let offset = 0; offset <= 10_000; offset += 100) {
      const page = await listUsers(accessToken, { offset, limit: 100, active });
      if (!page.ok) return page;
      const user = page.data.items.find((item) => item.id === userId);
      if (user) return { ok: true, data: { ...user, created_at: null } };
      if (page.data.items.length < page.data.limit) break;
    }
  }
  return { ok: false, status: 404 };
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

function normalizeUserAccess(value: unknown): { profiles: UserProfileDetails["global_profiles"] } | null {
  if (!value || typeof value !== "object" || !Array.isArray((value as Record<string, unknown>).profiles)) return null;
  const profiles = (value as Record<string, unknown>).profiles as unknown[];
  if (!profiles.every((profile) => profile && typeof profile === "object" && typeof (profile as Record<string, unknown>).id === "string" && typeof (profile as Record<string, unknown>).name === "string" && typeof (profile as Record<string, unknown>).active === "boolean")) return null;
  return { profiles: profiles as UserProfileDetails["global_profiles"] };
}
