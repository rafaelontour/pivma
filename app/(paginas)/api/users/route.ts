import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserAccess, listPermissionProfiles } from "@/services/Perfil";
import { listUsers } from "@/services/Usuario";
import type { PermissionProfile } from "@/types/Rbac";
import type { UserListItem, UserPosition } from "@/types/Usuario";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 100;

export async function GET(request: Request) {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offset = readInteger(searchParams.get("offset"), 0, 0);
  const limit = readInteger(searchParams.get("limit"), DEFAULT_LIMIT, 1, 100);
  const result = await listUsers(accessToken, { offset, limit });

  if (!result.ok) {
    if (result.status === 401) {
      (await cookies()).delete("access_token");
    }

    const status = result.status === 401 || result.status === 403 ? result.status : 502;
    const message =
      status === 401
        ? "Sua sessão não é mais válida."
        : status === 403
          ? "Você não tem permissão para consultar usuários."
          : "Não foi possível consultar os usuários no momento.";

    return NextResponse.json({ message }, { status });
  }

  const profilesResult = await listPermissionProfiles(accessToken);
  const positionsByUser = profilesResult.ok
    ? await getUserPositions(accessToken, result.data.items, profilesResult.data)
    : new Map<string, UserPosition[]>();

  return NextResponse.json({
    ...result.data,
    items: result.data.items.map((user) => ({
      ...user,
      positions: positionsByUser.get(user.id) ?? [],
    })),
  });
}

async function getUserPositions(
  accessToken: string,
  users: UserListItem[],
  profiles: PermissionProfile[],
) {
  const descriptionsByProfileId = new Map(
    profiles.map((profile) => [profile.id, profile.description]),
  );
  const positionsByUser = new Map<string, UserPosition[]>();
  const batchSize = 10;

  for (let index = 0; index < users.length; index += batchSize) {
    const batch = users.slice(index, index + batchSize);
    const accesses = await Promise.all(
      batch.map(async (user) => ({
        userId: user.id,
        result: await getUserAccess(accessToken, user.id),
      })),
    );

    for (const access of accesses) {
      if (!access.result.ok) {
        continue;
      }

      positionsByUser.set(
        access.userId,
        access.result.data.profiles.map((profile) => ({
          profileId: profile.id,
          name: profile.name,
          description:
            descriptionsByProfileId.get(profile.id) ??
            "Descrição do cargo não disponível.",
        })),
      );
    }
  }

  return positionsByUser;
}

function readInteger(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum = Number.MAX_SAFE_INTEGER,
) {
  if (!value || !/^\d+$/.test(value)) {
    return fallback;
  }

  const parsed = Number(value);
  return parsed >= minimum && parsed <= maximum ? parsed : fallback;
}
