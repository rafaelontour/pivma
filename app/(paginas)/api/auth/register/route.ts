import { NextResponse } from "next/server";
import { createUser } from "@/services/Usuario";
import type { RegistrationInput } from "@/types/Autenticacao";

export const runtime = "nodejs";

const USERNAME_PATTERN = /^[A-Za-z0-9._-]{3,64}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const username =
    typeof payload?.username === "string" ? payload.username.trim() : "";
  const email = typeof payload?.email === "string" ? payload.email.trim() : "";
  const password = typeof payload?.password === "string" ? payload.password : "";

  if (!isValidRegistration({ username, email, password })) {
    return NextResponse.json(
      { message: "Revise os dados informados para criar sua conta." },
      { status: 400 },
    );
  }

  const result = await createUser({ username, email, password });

  if (!result.ok) {
    if (!result.status || result.status >= 500) {
      return serviceUnavailable();
    }

    return NextResponse.json(
      { message: "Não foi possível criar sua conta. Revise os dados e tente novamente." },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}

function isValidRegistration({
  username,
  email,
  password,
}: RegistrationInput) {
  return (
    USERNAME_PATTERN.test(username) &&
    EMAIL_PATTERN.test(email) &&
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password)
  );
}

function serviceUnavailable() {
  return NextResponse.json(
    { message: "O serviço de cadastro está indisponível no momento." },
    { status: 502 },
  );
}
