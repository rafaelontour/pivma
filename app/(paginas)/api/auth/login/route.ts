import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
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
    return internalApiErrorResponse(result.status, {
      fallbackMessage: "O serviço de autenticação está indisponível no momento.",
      messages: {
        401: "E-mail, usuário ou senha não conferem.",
        403: "Este usuário não pode acessar a plataforma.",
        422: "Não foi possível validar suas credenciais. Revise os dados.",
      },
    });
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
