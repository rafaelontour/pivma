"use client";

import { useState } from "react";
import { LoginForm } from "./login-form";
import { RegistrationForm } from "./registration-form";
import type { AuthMode } from "@/types/Autenticacao";

export function AuthCard() {
  const [mode, setMode] = useState<AuthMode>("login");

  return mode === "login" ? (
    <LoginForm onRegister={() => setMode("register")} />
  ) : (
    <RegistrationForm onLogin={() => setMode("login")} />
  );
}
