import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/services/Autenticacao";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  }

  const result = await getCurrentUser(accessToken);

  if (!result.ok) {
    if (result.status === 401) {
      cookieStore.delete("access_token");
    }

    return NextResponse.json(
      {
        message: result.status
          ? "Não foi possível validar sua sessão."
          : "O serviço de autenticação está indisponível no momento.",
      },
      { status: result.status === 401 ? 401 : 502 },
    );
  }

  return NextResponse.json({
    id: result.data.id,
    username: result.data.username,
    email: result.data.email,
    permissions: result.data.access.global_permissions,
    roles: [
      ...new Set(
        result.data.access.scopes.flatMap((scope) => scope.roles),
      ),
    ],
  });
}
