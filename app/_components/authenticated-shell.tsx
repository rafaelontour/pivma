"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BrainCircuit,
  House,
  LayoutDashboard,
  FilePenLine,
  LoaderCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "./language-toggle";
import { normalizeLocale } from "@/i18n/config";
import { getLocalizedApiError } from "@/i18n/errors";
import { useSessionLocale } from "@/i18n/provider";
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
  const { t } = useTranslation();
  const [session, setSession] = useState<SessionState>({ kind: "loading" });
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  useSessionLocale(session.kind === "ready" ? session.user.preferred_locale : undefined);

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
            toast.error(
              response.status === 401
                ? t("shell.sessionExpired")
                : getLocalizedApiError(payload, t("shell.sessionFailed"), t),
            );
            router.replace("/login");
          }
          return;
        }

        if (!controller.signal.aborted) {
          setSession({ kind: "ready", user: payload });
        }
      } catch {
        if (!controller.signal.aborted) {
          toast.error(t("shell.sessionFailed"));
          router.replace("/login");
        }
      }
    }

    void loadSession();

    return () => controller.abort();
  }, [router, t]);

  useEffect(() => {
    const desktopViewport = window.matchMedia("(min-width: 768px)");
    const followViewport = () => setIsSidebarExpanded(desktopViewport.matches);
    followViewport();
    desktopViewport.addEventListener("change", followViewport);
    return () => desktopViewport.removeEventListener("change", followViewport);
  }, []);

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });

      if (!response.ok) {
        toast.error(t("shell.logoutFailed"));
        return;
      }

      toast.success(t("shell.logoutSuccess"));
      router.replace("/login");
    } catch {
      toast.error(t("auth.login.connectionFailed"));
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
  const canManageForms =
    session.user.isAdministrator ||
    session.user.permissions.includes("rbac.read") ||
    session.user.profiles.some((profile) => profile.name === "Grupo Gestor");
  const canManageUsers = session.user.permissions.includes("users.read");
  const canViewSettings =
    canManageForms || canViewAiEvaluations || canManageUsers;
  const headingKey = activePage === "ai-evaluations"
    ? "aiEvaluations"
    : activePage === "operational-observability"
      ? "operationalObservability"
      : activePage === "ai-observability"
        ? "aiObservability"
        : activePage;
  const heading = {
    eyebrow: t(`shell.headings.${headingKey}.eyebrow`),
    title: t(`shell.headings.${headingKey}.title`),
    description: t(`shell.headings.${headingKey}.description`, {
      username: session.user.full_name || session.user.username,
    }),
  };

  return (
    <main className="grid h-dvh min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[4.5rem_minmax(0,1fr)] overflow-hidden bg-[#efeef1] text-slate-800">
      <header className="col-span-full flex h-18 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-5 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)] sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <button
            aria-expanded={isSidebarExpanded}
            aria-label={
              isSidebarExpanded
                ? t("shell.collapseSidebar")
                : t("shell.expandSidebar")
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
            aria-label={t("shell.homeLink")}
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
            {t("common.secureEnvironment")}
          </span>
          <LanguageToggle />
          <button
            aria-label={t("shell.logout")}
            className="inline-flex size-10 items-center justify-center rounded-full border border-slate-300 bg-slate-50 text-slate-600 outline-none transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-wait disabled:opacity-60"
            disabled={isLoggingOut}
            onClick={() => void handleLogout()}
            title={t("shell.logout")}
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
        canViewProcesses={canViewProcesses}
        canViewObservability={session.user.isAdministrator}
        canViewSettings={canViewSettings}
        expanded={isSidebarExpanded}
        user={session.user}
      />

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          className={`min-h-0 flex-1 ${
            activePage === "processes" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
            className={`mx-auto flex w-full flex-col px-5 py-6 sm:px-8 sm:py-9 lg:px-12 ${
              activePage === "processes"
                ? "h-full min-h-0 max-w-[100rem]"
                : activePage === "submissions" ||
              activePage === "operational-observability" ||
              activePage === "ai-observability"
                  ? "min-h-full max-w-none"
                  : activePage === "forms"
                    ? "min-h-full max-w-[100rem]"
                    : "min-h-full max-w-6xl"
            }`}
          >
            <div className="flex shrink-0 items-start justify-between gap-5 border-b border-slate-300 pb-6">
              <div className="min-w-0">
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
                  className="shrink-0 pt-1 text-right"
                  id="process-page-header-actions"
                />
              )}
            </div>

            {children}

            <footer className="shrink-0 border-t border-slate-300 pt-5 text-xs text-slate-500">
              {t("shell.footer")}
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}

function Sidebar({
  activePage,
  canViewProcesses,
  canViewObservability,
  canViewSettings,
  expanded,
  user,
}: SidebarProps) {
  const { i18n, t } = useTranslation();
  const displayName = user.full_name || user.username;
  const initials = getInitials(displayName);
  const locale = normalizeLocale(i18n.resolvedLanguage) ?? "pt-BR";
  const profiles = user.profiles.length === 0
    ? formatRoles(user.roles, locale, t("common.notAssigned"))
    : user.profiles.map((profile) => profile.name).join(" · ");
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
      aria-label={t("shell.mainNavigation")}
      className={`relative z-10 flex min-h-0 shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white/95 px-3 py-3 shadow-[12px_0_28px_-24px_rgba(15,23,42,0.14)] transition-[width] duration-200 ease-out ${
        expanded ? "w-72" : "w-20"
      }`}
    >
      <nav aria-label={t("shell.platformSections")}>
        <Link
          aria-current={activePage === "home" ? "page" : undefined}
          aria-label={t("shell.navigation.home")}
          className={linkClassName(activePage === "home")}
          href="/inicio"
        >
          <House aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
          {expanded && <span>{t("shell.navigation.home")}</span>}
        </Link>

        <Link
          aria-current={activePage === "submissions" ? "page" : undefined}
          aria-label={t("shell.navigation.submissions")}
          className={`mt-2 ${linkClassName(activePage === "submissions")}`}
          href="/submissoes"
        >
          <FilePenLine
            aria-hidden="true"
            className="size-5 shrink-0"
            strokeWidth={2.2}
          />
          {expanded && <span>{t("shell.navigation.submissions")}</span>}
        </Link>

        {canViewProcesses && (
          <Link
            aria-current={activePage === "processes" ? "page" : undefined}
            aria-label={t("shell.navigation.processes")}
            className={`mt-2 ${linkClassName(activePage === "processes")}`}
            href="/processos"
          >
            <LayoutDashboard
              aria-hidden="true"
              className="size-5 shrink-0"
              strokeWidth={2.2}
            />
            {expanded && <span>{t("shell.navigation.processes")}</span>}
          </Link>
        )}

        {canViewSettings && (
          <Link
            aria-current={
              activePage === "settings" ||
              activePage === "forms" ||
              activePage === "ai-evaluations" ||
              activePage === "users"
                ? "page"
                : undefined
            }
            aria-label={t("shell.navigation.settings")}
            className={`mt-2 ${linkClassName(
              activePage === "settings" ||
                activePage === "forms" ||
                activePage === "ai-evaluations" ||
                activePage === "users",
            )}`}
            href="/configuracoes"
          >
            <Settings
              aria-hidden="true"
              className="size-5 shrink-0"
              strokeWidth={2.2}
            />
            {expanded && <span>{t("shell.navigation.settings")}</span>}
          </Link>
        )}

        {canViewObservability && (
          <>
            <Link
              aria-current={activePage === "operational-observability" ? "page" : undefined}
              aria-label={t("shell.navigation.operationalObservability")}
              className={`mt-2 ${linkClassName(activePage === "operational-observability")}`}
              href="/observabilidade/operacional"
            >
              <Activity aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
              {expanded && <span>{t("shell.navigation.operationalObservability")}</span>}
            </Link>
            <Link
              aria-current={activePage === "ai-observability" ? "page" : undefined}
              aria-label={t("shell.navigation.aiObservability")}
              className={`mt-2 ${linkClassName(activePage === "ai-observability")}`}
              href="/observabilidade/ia"
            >
              <BrainCircuit aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
              {expanded && <span>{t("shell.navigation.aiObservability")}</span>}
            </Link>
          </>
        )}
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
          {!expanded && <span className="sr-only">{t("shell.profile", { name: displayName })}</span>}
          {expanded && (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user.username} · {user.email}
              </p>
              <p className="mt-1 truncate text-xs font-medium text-teal-700">
                {t("shell.profiles", { profiles })}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function SessionLoading() {
  const { t } = useTranslation();

  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="grid h-dvh place-items-center bg-[#efeef1] px-6 text-slate-700"
    >
      <div className="flex items-center gap-3 text-sm">
        <span className="size-3 animate-pulse rounded-full bg-teal-600" />
        {t("shell.sessionLoading")}
      </div>
    </main>
  );
}

function getInitials(username: string) {
  return username.trim().slice(0, 2).toUpperCase() || "PV";
}

function formatRoles(roles: string[], locale: string, emptyLabel: string) {
  if (roles.length === 0) {
    return emptyLabel;
  }

  return roles
    .map((role) =>
      role
        .replaceAll(/[-_]/g, " ")
        .replaceAll(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase(locale)),
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
    (user.preferred_locale === undefined ||
      user.preferred_locale === "pt-BR" ||
      user.preferred_locale === "en") &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === "string")
  );
}
