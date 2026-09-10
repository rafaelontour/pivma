"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  House,
  LayoutDashboard,
  FilePenLine,
  LoaderCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  UsersRound,
} from "lucide-react";
import { toast } from "sonner";
import type {
  AuthenticatedShellProps,
  SessionState,
  SidebarProps,
} from "@/types/AreaAutenticada";
import { PROCESS_KANBAN_PERMISSION_CODES } from "@/types/Processo";
import type { ApiMessage, ApiRecord } from "@/types/Servico";
import type { CurrentUser } from "@/types/Usuario";

export function AuthenticatedShell({
  activePage,
  children,
}: AuthenticatedShellProps) {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({ kind: "loading" });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as
          | CurrentUser
          | ApiMessage
          | null;

        if (!response.ok || !isCurrentUser(payload)) {
          if (!controller.signal.aborted) {
            toast.error(getSessionMessage(response.status, payload));
            router.replace("/login");
          }
          return;
        }

        if (!controller.signal.aborted) {
          setSession({ kind: "ready", user: payload });
        }
      } catch {
        if (!controller.signal.aborted) {
          toast.error("Não foi possível validar sua sessão. Entre novamente.");
          router.replace("/login");
        }
      }
    }

    void loadSession();

    return () => controller.abort();
  }, [router]);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        toast.error("Não foi possível encerrar sua sessão. Tente novamente.");
        return;
      }

      toast.success("Sessão encerrada com segurança.");
      router.replace("/login");
    } catch {
      toast.error("Não foi possível conectar ao serviço de autenticação.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (session.kind === "loading") {
    return <SessionLoading />;
  }

  const canViewProcesses = PROCESS_KANBAN_PERMISSION_CODES.some((permission) =>
    session.user.permissions.includes(permission),
  );
  const heading = getPageHeading(activePage, session.user.username);

  return (
    <main className="grid h-dvh min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[4.5rem_minmax(0,1fr)] overflow-hidden bg-[#efeef1] text-slate-800">
      <header className="col-span-full flex h-18 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)] sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            aria-expanded={isSidebarExpanded}
            aria-label={
              isSidebarExpanded
                ? "Recolher menu lateral"
                : "Expandir menu lateral"
            }
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-300 bg-slate-50 text-slate-600 outline-none transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={() => setIsSidebarExpanded((value) => !value)}
            type="button"
          >
            {isSidebarExpanded ? (
              <PanelLeftClose aria-hidden="true" className="size-5" />
            ) : (
              <PanelLeftOpen aria-hidden="true" className="size-5" />
            )}
          </button>

          <Link
            aria-label="pi*VMA — Início"
            className="flex shrink-0 items-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-teal-300"
            href="/inicio"
          >
            <Image
              alt="pi*VMA"
              className="h-auto w-28 sm:w-36"
              height={174}
              src="/marca-colorido.svg"
              unoptimized
              width={842}
            />
          </Link>
          <div className="h-8 w-px shrink-0 bg-slate-300" />
          <div className="flex shrink-0 items-center">
            <Image
              alt="BraCVAM"
              className="h-auto w-20 sm:w-24"
              height={400}
              src="/marca-bracvam-colorido.svg"
              unoptimized
              width={1080}
            />
          </div>
          <div className="h-8 w-px shrink-0 bg-slate-300" />
          <div className="flex shrink-0 items-center">
            <Image
              alt="Fiocruz"
              className="h-auto w-20 sm:w-24"
              height={246}
              src="/marca-fiocruz-preto.svg"
              unoptimized
              width={842}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden rounded-full border border-teal-700/20 bg-teal-600/10 px-3 py-1 text-xs font-semibold text-teal-800 sm:block">
            Ambiente seguro
          </span>
          <button
            aria-label="Encerrar sessão"
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-600 outline-none transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-wait disabled:opacity-60"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            title="Encerrar sessão"
            type="button"
          >
            {isLoggingOut ? (
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin" />
            ) : (
              <LogOut aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </header>

      <Sidebar
        activePage={activePage}
        canManageUsers={session.user.permissions.includes("users.read")}
        canViewProcesses={canViewProcesses}
        expanded={isSidebarExpanded}
        user={session.user}
      />

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={`mx-auto flex min-h-full w-full flex-col px-5 py-6 sm:px-8 sm:py-9 lg:px-12 ${
              activePage === "submissions"
                ? "max-w-none"
                : activePage === "processes"
                  ? "max-w-[100rem]"
                  : "max-w-6xl"
            }`}
          >
            <div className="flex items-start justify-between gap-5 border-b border-slate-300 pb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
                  {heading.eyebrow}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  {heading.title}
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                  {heading.description}
                </p>
              </div>
              <span className="hidden rounded-full border border-teal-700/20 bg-teal-600/10 px-3 py-1 text-xs font-semibold text-teal-800 sm:block">
                pi*VMA
              </span>
            </div>

            {children}

            <footer className="border-t border-slate-300 pt-5 text-xs text-slate-500">
              pi*VMA · Plataforma Integrada de Validação de Métodos Alternativos
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

function Sidebar({
  activePage,
  canManageUsers,
  canViewProcesses,
  expanded,
  user,
}: SidebarProps) {
  const initials = getInitials(user.username);
  const linkClassName = (active: boolean) =>
    `flex items-center rounded-xl py-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${
      expanded ? "gap-3 px-3" : "justify-center px-2"
    } ${
      active
        ? "bg-teal-600/10 text-teal-800 ring-1 ring-inset ring-teal-700/20 hover:bg-teal-600/15"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    }`;

  return (
    <aside
      aria-label="Navegação principal"
      className={`relative z-10 flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white/95 px-3 py-3 shadow-[12px_0_28px_-24px_rgba(15,23,42,0.14)] transition-[width] duration-200 ease-out ${
        expanded ? "w-72" : "w-20"
      }`}
    >
      <nav aria-label="Seções da plataforma">
        <Link
          aria-current={activePage === "home" ? "page" : undefined}
          aria-label="Início"
          className={linkClassName(activePage === "home")}
          href="/inicio"
        >
          <House aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
          {expanded && <span>Início</span>}
        </Link>

        <Link
          aria-current={activePage === "submissions" ? "page" : undefined}
          aria-label="Submissões"
          className={`mt-2 ${linkClassName(activePage === "submissions")}`}
          href="/submissoes"
        >
          <FilePenLine
            aria-hidden="true"
            className="size-5 shrink-0"
            strokeWidth={2.2}
          />
          {expanded && <span>Submissões</span>}
        </Link>

        {canViewProcesses && (
          <Link
            aria-current={activePage === "processes" ? "page" : undefined}
            aria-label="Processos"
            className={`mt-2 ${linkClassName(activePage === "processes")}`}
            href="/processos"
          >
            <LayoutDashboard
              aria-hidden="true"
              className="size-5 shrink-0"
              strokeWidth={2.2}
            />
            {expanded && <span>Processos</span>}
          </Link>
        )}

        {canManageUsers && (
          <Link
            aria-current={activePage === "users" ? "page" : undefined}
            aria-label="Usuários"
            className={`mt-2 ${linkClassName(activePage === "users")}`}
            href="/usuarios"
          >
            <UsersRound
              aria-hidden="true"
              className="size-5 shrink-0"
              strokeWidth={2.2}
            />
            {expanded && <span>Usuários</span>}
          </Link>
        )}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-4">
        <div
          className={`flex items-center rounded-xl bg-slate-100 ${
            expanded ? "gap-3 p-3" : "justify-center p-2"
          }`}
          title={expanded ? undefined : user.username}
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-600/10 text-xs font-bold text-teal-800 ring-1 ring-teal-700/20">
            {initials}
          </div>
          {!expanded && <span className="sr-only">Perfil: {user.username}</span>}
          {expanded && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {user.username}
              </p>
              <p className="truncate text-xs text-slate-500">{user.email}</p>
              <p className="mt-1 truncate text-xs font-medium text-teal-700">
                Cargo: {formatRoles(user.roles)}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function SessionLoading() {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="grid h-dvh place-items-center bg-[#efeef1] px-6 text-slate-700"
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="size-3 animate-pulse rounded-full bg-teal-600" />
        Validando sua sessão…
      </div>
    </main>
  );
}

function getPageHeading(page: SidebarProps["activePage"], username: string) {
  if (page === "submissions") {
    return {
      eyebrow: "Área do proponente",
      title: "Submissões",
      description:
        "Escolha um tipo de submissão para criar um rascunho e começar o preenchimento do formulário.",
    };
  }

  if (page === "processes") {
    return {
      eyebrow: "Acompanhamento",
      title: "Processos",
      description:
        "Acompanhe as submissões organizadas pelo estado atual do fluxo. As movimentações são feitas automaticamente pelo sistema.",
    };
  }

  if (page === "users") {
    return {
      eyebrow: "Administração",
      title: "Usuários",
      description: "Consulte as contas ativas e inativas cadastradas na plataforma.",
    };
  }

  return {
    eyebrow: "Área autenticada",
    title: "Início",
    description: `Boas-vindas, ${username}. Acompanhe os fluxos de validação e as próximas atividades da plataforma a partir daqui.`,
  };
}

function getInitials(username: string) {
  return username.trim().slice(0, 2).toUpperCase() || "PV";
}

function formatRoles(roles: string[]) {
  if (roles.length === 0) {
    return "Não atribuído";
  }

  return roles
    .map((role) =>
      role
        .replaceAll(/[-_]/g, " ")
        .replaceAll(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("pt-BR")),
    )
    .join(" · ");
}

function isCurrentUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== "object") {
    return false;
  }

  const user = value as ApiRecord;
  return (
    typeof user.id === "string" &&
    typeof user.username === "string" &&
    typeof user.email === "string" &&
    Array.isArray(user.permissions) &&
    user.permissions.every((permission) => typeof permission === "string") &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === "string")
  );
}

function getSessionMessage(
  status: number,
  payload: CurrentUser | ApiMessage | null,
) {
  if (status === 401) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }

  if (payload && "message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  return "Não foi possível validar sua sessão. Entre novamente.";
}
