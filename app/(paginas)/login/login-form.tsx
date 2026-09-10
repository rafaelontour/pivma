"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type {
  LoginCurrentUser,
  LoginFormProps,
  LoginFormState,
  PasswordVisibilityIconProps,
} from "@/types/Autenticacao";
import type { ApiMessage } from "@/types/Servico";

export function LoginForm({ onRegister }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [formState, setFormState] = useState<LoginFormState>({ kind: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormState({ kind: "loading" });

    const form = event.currentTarget;
    const formData = new FormData(form);
    const identifier = String(formData.get("identifier") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const loginResponse = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });
      const loginPayload = (await loginResponse.json().catch(() => null)) as ApiMessage | null;

      if (!loginResponse.ok) {
        setFormState({ kind: "idle" });
        toast.error(
          loginPayload?.message ??
            "Não foi possível iniciar sua sessão. Tente novamente.",
        );
        return;
      }

      const userResponse = await fetch("/api/auth/me", { cache: "no-store" });
      const userPayload = (await userResponse.json().catch(() => null)) as
        | LoginCurrentUser
        | null;

      if (!userResponse.ok || !userPayload?.username || !userPayload.email) {
        setFormState({ kind: "idle" });
        toast.error("Sua sessão foi iniciada, mas não foi possível carregar seu perfil.");
        return;
      }

      toast.success("Sessão iniciada", {
        description: `Boas-vindas, ${userPayload.username}.`,
      });
      form.reset();
      router.replace("/inicio");
    } catch {
      setFormState({ kind: "idle" });
      toast.error("Não foi possível conectar ao serviço de autenticação.");
    }
  }

  const isLoading = formState.kind === "loading";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-400/20 backdrop-blur sm:p-7">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
          Acesso à plataforma
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Entre na sua conta
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use as credenciais institucionais atribuídas ao seu perfil.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            className="mb-2 block text-sm font-medium text-slate-700"
            htmlFor="identifier"
          >
            E-mail ou nome de usuário
          </label>
          <input
            autoComplete="username"
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-3 focus:ring-teal-600/15"
            id="identifier"
            name="identifier"
            placeholder="nome@instituicao.br"
            required
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label
              className="text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              Senha
            </label>
            <span className="text-xs text-slate-500">Mínimo de 8 caracteres</span>
          </div>
          <div className="relative">
            <input
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pr-12 pl-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-3 focus:ring-teal-600/15"
              id="password"
              minLength={8}
              name="password"
              placeholder="Digite sua senha"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 transition hover:text-teal-700 focus:outline-none"
              onClick={() => setShowPassword((value) => !value)}
              type="button"
            >
              <EyeIcon open={showPassword} />
            </button>
          </div>
        </div>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-[#efeef1] disabled:cursor-wait disabled:opacity-70"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? "Validando acesso…" : "Entrar na plataforma"}
          {!isLoading && <ArrowIcon />}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-200 pt-5 text-center text-xs leading-5 text-slate-500">
        <p>Não possui uma conta?</p>
        <button
          className="mt-1 font-semibold text-teal-700 transition hover:text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
          onClick={onRegister}
          type="button"
        >
          Criar conta
        </button>
        <p className="mt-3">Perfis institucionais são vinculados pela equipe gestora da BraCVAM.</p>
      </div>
    </section>
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" className="size-4" fill="none" viewBox="0 0 24 24">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function EyeIcon({ open }: PasswordVisibilityIconProps) {
  return open ? (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path
        d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 5.1A10.7 10.7 0 0 1 12 5c5.2 0 8.7 5.1 9 7-.1.7-.7 2-1.8 3.3M6.2 6.2C4.5 7.6 3.3 9.6 3 12c.5 2.8 4.1 7 9 7 1.2 0 2.4-.3 3.4-.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ) : (
    <svg aria-hidden="true" className="size-5" fill="none" viewBox="0 0 24 24">
      <path
        d="M3 12s3.4-7 9-7 9 7 9 7-3.4 7-9 7-9-7-9-7Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}
