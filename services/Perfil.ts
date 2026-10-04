import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { getApiOrigin, http } from "./Http";
import type {
  CreatePermissionProfileInput,
  PermissionDefinition,
  PermissionProfile,
  UpdatePermissionProfileInput,
  UserAccess,
} from "@/types/Rbac";
import type { ServiceResult } from "@/types/Servico";

export async function listPermissionProfiles(
  accessToken: string,
): Promise<ServiceResult<PermissionProfile[]>> {
  const [error, response] = await tryit(() =>
    http.get<PermissionProfile[]>("/rbac/profiles", {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  const data = unwrapCollection<PermissionProfile>(response.data);
  return data ? { ok: true, data } : { ok: false };
}

export async function createPermissionProfile(
  accessToken: string,
  input: CreatePermissionProfileInput,
): Promise<ServiceResult<PermissionProfile>> {
  const [error, response] = await tryit(() =>
    http.post<PermissionProfile>("/rbac/profiles", input, {
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

export async function getUserAccess(
  accessToken: string,
  userId: string,
): Promise<ServiceResult<UserAccess>> {
  const [error, response] = await tryit(() =>
    http.get<UserAccess>(`/rbac/users/${userId}/access`, {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return { ok: true, data: response.data };
}

export async function listPermissionDefinitions(
  accessToken: string,
): Promise<ServiceResult<PermissionDefinition[]>> {
  const [error, response] = await tryit(() =>
    http.get<PermissionDefinition[]>("/rbac/permissions", {
      headers: { Cookie: `access_token=${accessToken}` },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  const data = unwrapCollection<PermissionDefinition>(response.data);
  return data ? { ok: true, data } : { ok: false };
}

export async function grantUserProfile(
  accessToken: string,
  userId: string,
  profileId: string,
): Promise<ServiceResult<undefined>> {
  const [error] = await tryit(() =>
    http.post(`/rbac/users/${userId}/profiles/${profileId}`, undefined, {
      headers: {
        Cookie: `access_token=${accessToken}`,
        Origin: getApiOrigin(),
      },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return { ok: true, data: undefined };
}

export async function revokeUserProfile(
  accessToken: string,
  userId: string,
  profileId: string,
): Promise<ServiceResult<undefined>> {
  const [error] = await tryit(() =>
    http.delete(`/rbac/users/${userId}/profiles/${profileId}`, {
      headers: {
        Cookie: `access_token=${accessToken}`,
        Origin: getApiOrigin(),
      },
    }),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return { ok: true, data: undefined };
}

export async function updatePermissionProfile(
  accessToken: string,
  profileId: string,
  input: UpdatePermissionProfileInput,
): Promise<ServiceResult<PermissionProfile>> {
  const [error, response] = await tryit(() =>
    http.patch<PermissionProfile>(
      `/rbac/profiles/${profileId}`,
      { permission_codes: input.permissionCodes },
      {
        headers: {
          Cookie: `access_token=${accessToken}`,
          Origin: getApiOrigin(),
        },
      },
    ),
  )();

  if (error) {
    return { ok: false, status: getStatus(error) };
  }

  return { ok: true, data: response.data };
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}

function unwrapCollection<T>(value: unknown): T[] | null {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return null;
}
