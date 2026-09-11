import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { listUsers } from "@/services/Usuario";

export const runtime = "nodejs";

const DEFAULT_LIMIT = 100;

export async function GET(request: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offset = readInteger(searchParams.get("offset"), 0, 0);
  const limit = readInteger(searchParams.get("limit"), DEFAULT_LIMIT, 1, 100);
  const search = searchParams.get("search")?.trim() || undefined;
  const activeValue = searchParams.get("active") ?? "true";

  if (activeValue !== "true" && activeValue !== "false") {
    return NextResponse.json(
      { message: "O filtro de situação deve ser ativo ou inativo." },
      { status: 400 },
    );
  }

  const result = await listUsers(accessToken, {
    offset,
    limit,
    search,
    active: activeValue === "true",
  });

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      cookieStore,
      fallbackMessage: "Não foi possível consultar os usuários no momento.",
      messages: { 403: "Você não tem permissão para consultar usuários." },
    });
  }

  return NextResponse.json(result.data);
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
