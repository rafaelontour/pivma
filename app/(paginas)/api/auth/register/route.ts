import { NextResponse } from "next/server";
import { internalApiErrorResponse } from "@/app/(paginas)/api/_shared/responses";
import { createUser } from "@/services/Usuario";
import type { RegistrationInput } from "@/types/Autenticacao";

export const runtime = "nodejs";

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const fullName =
    typeof payload?.fullName === "string" ? payload.fullName.trim() : "";
  const username =
    typeof payload?.username === "string" ? payload.username.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (!isValidRegistration({ fullName, username, email, password })) {
    return NextResponse.json(
      { message: "Revise os dados informados para criar sua conta." },
      { status: 400 },
    );
  }

  const result = await createUser({
    full_name: fullName,
    username,
    email,
    password,
  });

  if (!result.ok) {
    return internalApiErrorResponse(result.status, {
      fallbackMessage: "O serviço de cadastro está indisponível no momento.",
      messages: {
        409: "Já existe uma conta com o usuário ou e-mail informado.",
        422: "Não foi possível criar sua conta. Revise os dados e tente novamente.",
      },
    });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

function isValidRegistration({
  fullName,
  username,
  email,
  password,
}: RegistrationInput) {
  return (
    fullName.length >= 1 &&
    fullName.length <= 255 &&
    USERNAME_PATTERN.test(username) &&
    EMAIL_PATTERN.test(email) &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    password.length <= 128
  );
}
