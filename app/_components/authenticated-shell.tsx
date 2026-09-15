"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  // Activity,
  Bot,
  // BrainCircuit,
  ClipboardCheck,
  House,
  LayoutDashboard,
  FilePenLine,
  ListChecks,
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

const SIDEBAR_PREFERENCE_KEY = "pivma:sidebar";
const SIDEBAR_EXPANDED = "expanded";
const SIDEBAR_COLLAPSED = "collapsed";

export function AuthenticatedShell({
  activePage,
  children,
}: AuthenticatedShellProps) {
  const router = useRouter();
  const [session, setSession] = useState<SessionState>({ kind: "loading" });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
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

  useEffect(() => {
    const desktopViewport = window.matchMedia("(min-width: 768px)");
    const followViewport = () => {
      const savedPreference = getSidebarPreference();
      setIsSidebarExpanded(savedPreference ?? desktopViewport.matches);
    };
    const initialSync = window.setTimeout(followViewport, 0);

    desktopViewport.addEventListener("change", followViewport);
    return () => {
      window.clearTimeout(initialSync);
      desktopViewport.removeEventListener("change", followViewport);
    };
  }, []);

  function toggleSidebar() {
    setIsSidebarExpanded((currentValue) => {
      const nextValue = !currentValue;
      saveSidebarPreference(nextValue);
      return nextValue;
    });
  }

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
  const canViewAiEvaluations = [
    "ai_evaluations.read",
    "ai_evaluations.manage",
  ].some((permission) => session.user.permissions.includes(permission));
  const canViewTriage = session.user.permissions.includes("triage.review");
  const heading = getPageHeading(
    activePage,
    session.user.full_name || session.user.username,
  );

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
            onClick={toggleSidebar}
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
        canManageForms={
          session.user.isAdministrator ||
          session.user.permissions.includes("rbac.read") ||
          session.user.profiles.some((profile) => profile.name === "Grupo Gestor")
        }
        canManageUsers={session.user.permissions.includes("users.read")}
        canViewSubmissions={session.user.profiles.some(
          (profile) => profile.name === "Proponente",
        )}
        canViewAiEvaluations={canViewAiEvaluations}
        canViewProcesses={canViewProcesses}
        canViewTriage={canViewTriage}
        canViewObservability={session.user.isAdministrator}
        expanded={isSidebarExpanded}
        user={session.user}
      />

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div
            className={`flex w-full max-w-none flex-col px-5 py-6 sm:px-8 sm:py-9 lg:px-12 ${
              activePage === "processes"
                ? "h-full min-h-0"
                : "min-h-full"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-5 border-b border-slate-300 pb-6">
              <div className="min-w-0 flex-1">
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
              {activePage === "processes" && (
                <div
                  className="flex w-full shrink-0 justify-end sm:mt-5 sm:w-auto"
                  id="authenticated-page-heading-actions"
                />
              )}
            </div>

            <div className="flex min-h-0 w-full flex-1 flex-col">{children}</div>

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
  canManageForms,
  canManageUsers,
  canViewSubmissions,
  canViewAiEvaluations,
  canViewProcesses,
  canViewTriage,
  // canViewObservability,
  expanded,
  user,
}: SidebarProps) {
  const displayName = user.full_name || user.username;
  const initials = getInitials(displayName);
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

        {canViewSubmissions && (
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
        )}

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

        {canViewTriage && (
          <Link
            aria-current={activePage === "triage" ? "page" : undefined}
            aria-label="Triagem"
            className={`mt-2 ${linkClassName(activePage === "triage")}`}
            href="/triagem"
          >
            <ClipboardCheck
              aria-hidden="true"
              className="size-5 shrink-0"
              strokeWidth={2.2}
            />
            {expanded && <span>Triagem</span>}
          </Link>
        )}

        {canManageForms && (
          <Link
            aria-current={activePage === "forms" ? "page" : undefined}
            aria-label="Formulários"
            className={`mt-2 ${linkClassName(activePage === "forms")}`}
            href="/formularios"
          >
            <ListChecks aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
            {expanded && <span>Formulários</span>}
          </Link>
        )}

        {canViewAiEvaluations && (
          <Link
            aria-current={activePage === "ai-evaluations" ? "page" : undefined}
            aria-label="Avaliações por IA"
            className={`mt-2 ${linkClassName(activePage === "ai-evaluations")}`}
            href="/avaliacoes-ia"
          >
            <Bot aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
            {expanded && <span>Avaliações por IA</span>}
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

        {/* Ocultos temporariamente; páginas e autorização permanecem implementadas.
        {canViewObservability && (
          <>
            <Link
              aria-current={activePage === "operational-observability" ? "page" : undefined}
              aria-label="Observabilidade operacional"
              className={`mt-2 ${linkClassName(activePage === "operational-observability")}`}
              href="/observabilidade/operacional"
            >
              <Activity aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
              {expanded && <span>Observabilidade operacional</span>}
            </Link>
            <Link
              aria-current={activePage === "ai-observability" ? "page" : undefined}
              aria-label="Observabilidade de IA"
              className={`mt-2 ${linkClassName(activePage === "ai-observability")}`}
              href="/observabilidade/ia"
            >
              <BrainCircuit aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
              {expanded && <span>Observabilidade de IA</span>}
            </Link>
          </>
        )} */}
      </nav>

      <div className="mt-auto border-t border-slate-200 pt-4">
        <div
          className={`flex items-center rounded-xl bg-slate-100 ${
            expanded ? "gap-3 p-3" : "justify-center p-2"
          }`}
          title={expanded ? undefined : displayName}
        >
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-teal-600/10 text-xs font-bold text-teal-800 ring-1 ring-teal-700/20">
            {initials}
          </div>
          {!expanded && <span className="sr-only">Perfil: {displayName}</span>}
          {expanded && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user.username} · {user.email}
              </p>
              <p className="mt-1 truncate text-xs font-medium text-teal-700">
                Perfis: {formatProfiles(user)}
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
  if (page === "operational-observability") {
    return {
      eyebrow: "Administração",
      title: "Observabilidade operacional",
      description:
        "Acompanhe eventos da plataforma, falhas, duração e correlações em tempo real.",
    };
  }

  if (page === "ai-observability") {
    return {
      eyebrow: "Administração",
      title: "Observabilidade de IA",
      description:
        "Inspecione execuções e etapas dos pipelines de IA sem expor dados fora da sessão administrativa.",
    };
  }

  if (page === "triage") {
    return {
      eyebrow: "Análise BraCVAM",
      title: "Triagem",
      description:
        "Revise a proposta, confronte as evidências da pré-avaliação e registre a decisão técnica.",
    };
  }

  if (page === "ai-evaluations") {
    return {
      eyebrow: "Configuração de IA",
      title: "Avaliações por IA",
      description:
        "Consulte objetivos, versões e critérios usados nas avaliações configuráveis da plataforma.",
    };
  }

  if (page === "forms") {
    return {
      eyebrow: "Configuração BraCVAM",
      title: "Formulários",
      description:
        "Edite os formulários vinculados aos processos, suas seções, campos e regras de preenchimento.",
    };
  }

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

function getSidebarPreference() {
  try {
    const preference = window.localStorage.getItem(SIDEBAR_PREFERENCE_KEY);

    if (preference === SIDEBAR_EXPANDED) {
      return true;
    }

    if (preference === SIDEBAR_COLLAPSED) {
      return false;
    }
  } catch {
    return null;
  }

  return null;
}

function saveSidebarPreference(isExpanded: boolean) {
  try {
    window.localStorage.setItem(
      SIDEBAR_PREFERENCE_KEY,
      isExpanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
    );
  } catch {
    // O padrão responsivo continua disponível quando o armazenamento é bloqueado.
  }
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

function formatProfiles(user: CurrentUser) {
  if (user.profiles.length === 0) {
    return formatRoles(user.roles);
  }

  return user.profiles.map((profile) => profile.name).join(" · ");
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
    (typeof user.full_name === "string" || user.full_name === null) &&
    Array.isArray(user.permissions) &&
    user.permissions.every((permission) => typeof permission === "string") &&
    Array.isArray(user.profiles) &&
    user.profiles.every(
      (profile) =>
        profile &&
        typeof profile === "object" &&
        "id" in profile &&
        typeof profile.id === "string" &&
        "name" in profile &&
        typeof profile.name === "string" &&
        "active" in profile &&
        typeof profile.active === "boolean",
    ) &&
    typeof user.isAdministrator === "boolean" &&
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
