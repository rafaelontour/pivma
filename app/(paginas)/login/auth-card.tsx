"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LoginForm } from "./login-form";
import { RegistrationForm } from "./registration-form";
import type { AuthMode } from "@/types/Autenticacao";

export function AuthCard() {
  const query = useSearchParams();
  const candidate = query.get("returnTo") ?? "";
  const returnTo = candidate.startsWith("/convites/") && !candidate.startsWith("//") ? candidate : undefined;
  const [mode, setMode] = useState<AuthMode>(query.get("mode") === "register" ? "register" : "login");

  return mode === "login" ? (
    <LoginForm onRegister={() => setMode("register")} returnTo={returnTo} />
  ) : (
    <RegistrationForm onLogin={() => setMode("login")} returnTo={returnTo} />
  );
}
