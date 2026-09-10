import { NextResponse } from "next/server";
import { login } from "@/services/Autenticacao";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const identifier =
    typeof payload?.identifier === "string" ? payload.identifier.trim() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (!identifier || password.length < 8) {
    return NextResponse.json(
      { message: "Informe seu e-mail ou usuário e uma senha válida." },
      { status: 400 },
    );
  }

  const result = await login(identifier, password);

  if (!result.ok) {
    return NextResponse.json(
      {
        message:
          result.status === 401
            ? "E-mail, usuário ou senha não conferem."
            : result.status
              ? "Não foi possível validar suas credenciais. Tente novamente."
              : "O serviço de autenticação está indisponível no momento.",
      },
      { status: result.status === 401 ? 401 : 502 },
    );
  }

  const accessTokenCookie = result.data.setCookies.find((cookie) =>
    /(?:^|,\s*)access_token=/.test(cookie),
  );

  if (!accessTokenCookie) {
    return NextResponse.json(
      { message: "O serviço não retornou uma sessão válida." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ success: true });
  response.headers.append("Set-Cookie", accessTokenCookie);
  return response;
}
