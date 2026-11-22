"use client";

import Image from "next/image";
import Link from "next/link";
import { redirect, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Activity,
  BookOpenCheck,
  BrainCircuit,
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FlaskConical,
  HandHelping,
  Handshake,
  House,
  LayoutDashboard,
  FilePenLine,
  LoaderCircle,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PanelsTopLeft,
  Microscope,
  Settings,
  ShieldCheck,
  TestTubes,
  UserCheck,
  UserRoundCog,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { LanguageToggle } from "./language-toggle";
import { normalizeLocale } from "@/i18n/config";
import { getLocalizedApiError } from "@/i18n/errors";
import { useSessionLocale } from "@/i18n/provider";
import type {
  AuthenticatedModule,
  AuthenticatedShellProps,
  ModuleIndicatorProps,
  RoleIconProps,
  SessionState,
  SidebarProps,
} from "@/types/AreaAutenticada";
import type { ApiMessage, ApiRecord } from "@/types/Servico";
import type { CurrentUser } from "@/types/Usuario";
import {
  PROCESS_PARTICIPANT_ROLES,
} from "@/types/ParticipacaoProcesso";
import { hasProcessKanbanAccess } from "@/types/Processo";
import { hasFormManagementAccess } from "@/components/configuracoes";
import { GuidedOnboarding } from "./guided-onboarding";

const ROLE_ICON_BY_MODULE: Record<AuthenticatedModule, LucideIcon> = {
  proponent: FilePenLine,
  bracvam: ShieldCheck,
  administration: Settings,
  sponsor: Handshake,
  group_manager: UsersRound,
  study_manager: BriefcaseBusiness,
  statistician: ChartNoAxesCombined,
  adhoc_evaluator: Microscope,
  peer_reviewer: BookOpenCheck,
  lead_laboratory: FlaskConical,
  participating_laboratory: TestTubes,
  sample_selection_group: ClipboardCheck,
  regulatory_observer: Eye,
  collaborator: HandHelping,
  platform: PanelsTopLeft,
};

export function AuthenticatedShell({
  activePage,
  children,
  isProponentPageAllowed,
  isSponsorPageAllowed,
  isGroupManagerPageAllowed,
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

    function handleSessionRefresh() {
      void loadSession();
    }

    window.addEventListener("pivma:session-refresh", handleSessionRefresh);
    void loadSession();

    return () => {
      window.removeEventListener("pivma:session-refresh", handleSessionRefresh);
      controller.abort();
    };
  }, [router, t]);

  useEffect(() => {
    const desktopViewport = window.matchMedia("(min-width: 768px)");
    const followViewport = () => setIsSidebarExpanded(desktopViewport.matches);
    followViewport();
    desktopViewport.addEventListener("change", followViewport);
    return () => desktopViewport.removeEventListener("change", followViewport);
  }, []);

  const activeModule: AuthenticatedModule = session.kind === "ready"
    ? getActiveModule(session.user)
    : "platform";

  useEffect(() => {
    document.documentElement.dataset.moduleTheme = activeModule;
    return () => {
      delete document.documentElement.dataset.moduleTheme;
    };
  }, [activeModule]);

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

  const isProponentModule = activeModule === "proponent";
  const isSponsorModule = activeModule === "sponsor";
  const isGroupManagerModule = activeModule === "group_manager";
  if (isProponentModule && !isProponentPageAllowed) {
    redirect("/inicio");
  }
  if (isSponsorModule && !isSponsorPageAllowed) {
    redirect("/acompanhamento");
  }
  if (isGroupManagerModule && !isGroupManagerPageAllowed) {
    redirect("/grupo");
  }

  const canViewProcesses = !isProponentModule && !isSponsorModule && !isGroupManagerModule && (
    hasProcessKanbanAccess(
      session.user.permissions,
      session.user.profiles,
    ) || Boolean(session.user.scopes?.some((scope) => scope.roles.length > 0))
  );
  const normalizedProfileNames = session.user.profiles.map((profile) =>
    normalizeModuleName(profile.name),
  );
  const hasAdministrativeProfile = normalizedProfileNames.some(
    (name) => name.includes("administr"),
  );
  const hasBracvamProfile = normalizedProfileNames.some((name) =>
    name.includes("bracvam"),
  );
  const hasProponentRole = session.user.roles.includes("proponent") || Boolean(
    session.user.scopes?.some((scope) => scope.roles.includes("proponent")),
  ) || normalizedProfileNames.some(
    (name) => name.includes("proponente") || name.includes("proponent"),
  );
  const canViewSubmissions = (hasProponentRole || activeModule === "platform") &&
    !hasAdministrativeProfile && !hasBracvamProfile && !isSponsorModule;
  const canViewGroup = isGroupManagerModule;
  const canViewComposition = !isProponentModule && !isSponsorModule && !isGroupManagerModule && (
    session.user.scopes?.some((scope) => scope.roles.includes("proponent")) ||
    session.user.permissions.includes("process.participants.manage")
  );
  const canViewAiEvaluations = !isProponentModule && !isSponsorModule && !isGroupManagerModule && [
    "ai_evaluations.read",
    "ai_evaluations.manage",
  ].some((permission) => session.user.permissions.includes(permission));
  const canManageForms = !isProponentModule && !isSponsorModule && !isGroupManagerModule && hasFormManagementAccess(session.user);
  const canUseSubmissionTutorial = canViewSubmissions && !canManageForms;
  const canManageUsers = session.user.permissions.includes("users.read");
  const canManageInstitutionalCatalog = session.user.permissions.includes(
    "institutional.catalogs.manage",
  );
  const canManageLaboratoryAffiliations = [
    "institutional.affiliations.manage",
    "users.read",
    "institutional.read",
  ].every((permission) => session.user.permissions.includes(permission));
  const canManageCollectionTemplates = session.user.isAdministrator || canManageInstitutionalCatalog;
  const canViewSettings = !isProponentModule && !isSponsorModule && !isGroupManagerModule && (
    canManageForms || canViewAiEvaluations || canManageUsers ||
    canManageInstitutionalCatalog || canManageLaboratoryAffiliations ||
    canManageCollectionTemplates
  );
  const headingKey = activePage === "sponsor-tracking"
    ? "sponsorTracking"
    : activePage === "ai-evaluations"
    ? "aiEvaluations"
    : activePage === "operational-observability"
      ? "operationalObservability"
      : activePage === "ai-observability"
        ? "aiObservability"
        : activePage === "institutional-catalog"
          ? "institutionalCatalog"
          : activePage === "collection-templates"
            ? "collectionTemplates"
            : activePage === "process-samples"
              ? "processSamples"
              : activePage === "sample-receipt"
                ? "sampleReceipt"
                : activePage === "group"
                  ? "group"
            : activePage;
  const heading = {
    eyebrow: t(`shell.headings.${headingKey}.eyebrow`),
    title: t(`shell.headings.${headingKey}.title`),
    description: t(`shell.headings.${headingKey}.description`, {
      username: session.user.full_name || session.user.username,
    }),
  };

  return (
    <main className="authenticated-role-shell grid h-dvh min-w-0 grid-cols-[auto_minmax(0,1fr)] grid-rows-[4.5rem_minmax(0,1fr)] overflow-hidden text-slate-800" data-module-theme={activeModule}>
      <header className="authenticated-role-header col-span-full flex h-18 items-center justify-between gap-4 border-b px-5 shadow-[0_12px_28px_-24px_rgba(15,23,42,0.18)] sm:px-6">
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
          <ModuleIndicator module={activeModule} />
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
        activeModule={activeModule}
        canViewGroup={canViewGroup}
        canViewComposition={canViewComposition}
        canViewProcesses={canViewProcesses}
        canViewSubmissions={canViewSubmissions}
        canViewSponsorTracking={isSponsorModule}
        canViewObservability={!isProponentModule && !isSponsorModule && !isGroupManagerModule && session.user.isAdministrator}
        canViewSettings={canViewSettings}
        canManageForms={canManageForms}
        canViewAiEvaluations={canViewAiEvaluations}
        canManageUsers={!isSponsorModule && !isGroupManagerModule && canManageUsers}
        canManageInstitutionalCatalog={!isSponsorModule && !isGroupManagerModule && canManageInstitutionalCatalog}
        canManageLaboratoryAffiliations={!isSponsorModule && !isGroupManagerModule && canManageLaboratoryAffiliations}
        expanded={isSidebarExpanded}
        user={session.user}
      />

      <GuidedOnboarding
        activePage={activePage}
        canManageForms={canManageForms}
        canManageUsers={!isProponentModule && !isSponsorModule && !isGroupManagerModule && session.user.permissions.includes("users.read")}
        canSubmit={canUseSubmissionTutorial}
        userId={session.user.id}
      />

      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div
          data-tour-scroll-container
          className={`min-h-0 flex-1 ${
            activePage === "processes" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          <div
            className={`mx-auto flex w-full max-w-none flex-col px-5 py-6 sm:px-8 sm:py-9 lg:px-12 ${
              activePage === "processes"
                ? "h-full min-h-0"
                : "min-h-full"
            }`}
          >
            <div className="authenticated-role-heading flex shrink-0 items-start justify-between gap-5 rounded-2xl border px-5 py-5 shadow-sm sm:px-6">
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

function ModuleIndicator({ module }: ModuleIndicatorProps) {
  const { t } = useTranslation();

  return (
    <div
      className="role-module-indicator inline-flex min-h-9 shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold shadow-sm"
    >
      <span className="grid size-6 place-items-center rounded-full bg-teal-600 text-white shadow-sm">
        <RoleIcon className="size-3.5" module={module} />
      </span>
      <span className="whitespace-nowrap">{t(`shell.modules.${module}`)}</span>
    </div>
  );
}

function Sidebar({
  activePage,
  activeModule,
  canViewGroup,
  canViewComposition,
  canViewProcesses,
  canViewSubmissions,
  canViewSponsorTracking,
  canViewObservability,
  canViewSettings,
  canManageForms,
  canViewAiEvaluations,
  canManageUsers,
  canManageInstitutionalCatalog,
  canManageLaboratoryAffiliations,
  expanded,
  user,
}: SidebarProps) {
  const { i18n, t } = useTranslation();
  const isConfigurationPage = activePage === "settings" || activePage === "forms" || activePage === "ai-evaluations" || activePage === "users" || activePage === "institutional-catalog" || activePage === "collection-templates";
  const [configurationExpanded, setConfigurationExpanded] = useState(isConfigurationPage);
  const displayName = user.full_name || user.username;
  const initials = getInitials(displayName);
  const locale = normalizeLocale(i18n.resolvedLanguage) ?? "pt-BR";
  const profiles = user.profiles.length === 0
    ? formatRoles(user.roles, locale, t("common.notAssigned"))
    : user.profiles.map((profile) => profile.name).join(" · ");
  const activeRoleTitle = t(`shell.roleProfiles.${activeModule}.title`);
  const activeRoleDescription = t(`shell.roleProfiles.${activeModule}.description`);
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
      className={`authenticated-role-sidebar relative z-10 flex min-h-0 shrink-0 flex-col overflow-hidden border-r px-3 py-3 shadow-[12px_0_28px_-24px_rgba(15,23,42,0.14)] transition-[width] duration-200 ease-out ${
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

        {canViewSubmissions && (
          <Link
            data-tour="shell-nav-submissions"
            aria-current={activePage === "submissions" ? "page" : undefined}
            aria-label={t("shell.navigation.submissions")}
            className={`mt-2 ${linkClassName(activePage === "submissions")}`}
            href="/submissoes"
            onClick={() => {
              try {
                window.sessionStorage.setItem("pivma:onboarding:enter", "proponent-submission");
              } catch {
                // A navegação continua quando o navegador bloqueia o armazenamento.
              }
              window.dispatchEvent(new CustomEvent("pivma:onboarding-enter", { detail: "proponent-submission" }));
            }}
          >
            <FilePenLine
              aria-hidden="true"
              className="size-5 shrink-0"
              strokeWidth={2.2}
            />
            {expanded && <span>{t("shell.navigation.submissions")}</span>}
          </Link>
        )}

        {canViewSponsorTracking && (
          <Link
            aria-current={activePage === "sponsor-tracking" ? "page" : undefined}
            aria-label={t("shell.navigation.sponsorTracking")}
            className={`mt-2 ${linkClassName(activePage === "sponsor-tracking")}`}
            href="/acompanhamento"
          >
            <ChartNoAxesCombined
              aria-hidden="true"
              className="size-5 shrink-0"
              strokeWidth={2.2}
            />
            {expanded && <span>{t("shell.navigation.sponsorTracking")}</span>}
          </Link>
        )}

        {canViewProcesses && (
          <Link
            aria-current={activePage === "processes" || activePage === "process-samples" || activePage === "sample-receipt" ? "page" : undefined}
            aria-label={t("shell.navigation.processes")}
            className={`mt-2 ${linkClassName(activePage === "processes" || activePage === "process-samples" || activePage === "sample-receipt")}`}
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

        {canViewComposition && (
          <Link
            aria-current={activePage === "process-composition" ? "page" : undefined}
            aria-label={t("shell.navigation.composition")}
            className={`mt-2 ${linkClassName(activePage === "process-composition")}`}
            href="/processos/composicao"
          >
            <UsersRound aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
            {expanded && <span>{t("shell.navigation.composition")}</span>}
          </Link>
        )}

        {canViewGroup && (
          <Link
            aria-current={activePage === "group" ? "page" : undefined}
            aria-label={t("shell.navigation.sponsorTracking")}
            className={`mt-2 ${linkClassName(activePage === "group")}`}
            href="/grupo"
          >
            <UsersRound aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
            {expanded && <span>{t("shell.navigation.sponsorTracking")}</span>}
          </Link>
        )}

        {canViewSettings && (
          <section aria-label={t("shell.navigation.configuration")} className="mt-2">
            <div className={`flex items-center rounded-xl ${expanded ? "gap-1" : "justify-center gap-0.5"}`}>
              <Link
                aria-current={activePage === "settings" ? "page" : undefined}
                aria-label={t("shell.navigation.settings")}
                className={`flex min-w-0 flex-1 items-center rounded-xl py-3 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${expanded ? "gap-3 px-3" : "justify-center px-2"} ${isConfigurationPage ? "bg-teal-600/10 text-teal-800 ring-1 ring-inset ring-teal-700/20 hover:bg-teal-600/15" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                href="/configuracoes"
              >
                <Settings aria-hidden="true" className="size-5 shrink-0" strokeWidth={2.2} />
                {expanded && <span className="truncate">{t("shell.navigation.settings")}</span>}
              </Link>
              {expanded && (
                <button
                  aria-controls="configuration-submenu"
                  aria-expanded={configurationExpanded}
                  aria-label={t(configurationExpanded ? "shell.navigation.collapseConfiguration" : "shell.navigation.expandConfiguration")}
                  className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-500"
                  onClick={() => setConfigurationExpanded((value) => !value)}
                  type="button"
                >
                  <ChevronDown aria-hidden="true" className={`size-4 transition-transform ${configurationExpanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
            <div className={`ml-3 mt-1 grid gap-1 border-l border-slate-200 pl-2 ${configurationExpanded ? "" : "hidden"}`} id="configuration-submenu">
            {canManageForms && (
              <Link
                data-tour="shell-nav-settings"
                aria-current={activePage === "forms" ? "page" : undefined}
                aria-label={t("shell.navigation.forms")}
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${expanded ? "gap-3" : "justify-center"} ${activePage === "forms" ? "bg-teal-600/10 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                href="/formularios"
              >
                <ClipboardList aria-hidden="true" className="size-4 shrink-0" />
                {expanded && <span>{t("shell.navigation.forms")}</span>}
              </Link>
            )}
            {canViewAiEvaluations && (
              <Link
                aria-current={activePage === "ai-evaluations" ? "page" : undefined}
                aria-label={t("shell.navigation.aiRules")}
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${expanded ? "gap-3" : "justify-center"} ${activePage === "ai-evaluations" ? "bg-teal-600/10 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                href="/avaliacoes-ia"
              >
                <BrainCircuit aria-hidden="true" className="size-4 shrink-0" />
                {expanded && <span>{t("shell.navigation.aiRules")}</span>}
              </Link>
            )}
            {canManageUsers && (
              <Link
                aria-current={activePage === "users" ? "page" : undefined}
                aria-label={t("shell.navigation.usersAndProfiles")}
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${expanded ? "gap-3" : "justify-center"} ${activePage === "users" ? "bg-teal-600/10 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                href="/usuarios"
              >
                <UserRoundCog aria-hidden="true" className="size-4 shrink-0" />
                {expanded && <span>{t("shell.navigation.usersAndProfiles")}</span>}
              </Link>
            )}
            {(canManageInstitutionalCatalog || canManageLaboratoryAffiliations) && (
              <Link
                aria-current={activePage === "institutional-catalog" ? "page" : undefined}
                aria-label={t("shell.navigation.institutionsAndLaboratories")}
                className={`flex items-center rounded-lg px-3 py-2 text-sm font-medium outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${expanded ? "gap-3" : "justify-center"} ${activePage === "institutional-catalog" ? "bg-teal-600/10 text-teal-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"}`}
                href="/instituicoes-laboratorios"
              >
                <Building2 aria-hidden="true" className="size-4 shrink-0" />
                {expanded && <span>{t("shell.navigation.institutionsAndLaboratories")}</span>}
              </Link>
            )}
            </div>
          </section>
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
          className={`role-profile-card flex items-center rounded-2xl border shadow-sm ${
            expanded ? "gap-3 p-3.5" : "justify-center p-2"
          }`}
          title={expanded ? undefined : `${displayName} · ${activeRoleTitle}`}
        >
          <div className="relative grid size-11 shrink-0 place-items-center rounded-full bg-teal-600 text-xs font-bold text-white shadow-sm ring-4 ring-white/80">
            {initials}
            <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-2 border-white bg-teal-800 text-white">
              <RoleIcon className="size-2.5" module={activeModule} />
            </span>
          </div>
          {!expanded && <span className="sr-only">{t("shell.profile", { name: displayName })}</span>}
          {expanded && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">
                {displayName}
              </p>
              <p className="mt-0.5 truncate text-xs font-bold text-teal-800">
                {activeRoleTitle}
              </p>
              <p className="mt-1 line-clamp-2 text-[0.7rem] leading-4 text-slate-600">
                {activeRoleDescription}
              </p>
              <p className="mt-2 truncate border-t border-slate-200/80 pt-2 text-[0.68rem] text-slate-500" title={profiles}>
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

function RoleIcon({ module, className }: RoleIconProps) {
  const Icon = ROLE_ICON_BY_MODULE[module] ?? UserCheck;
  return <Icon aria-hidden="true" className={className} strokeWidth={2.3} />;
}

function getInitials(username: string) {
  return username.trim().slice(0, 2).toUpperCase() || "PV";
}

function getActiveModule(user: CurrentUser): AuthenticatedModule {
  const profileNames = user.profiles.map((profile) =>
    normalizeModuleName(profile.name),
  );
  const sessionRoles = [
    ...user.roles,
    ...(user.scopes?.flatMap((scope) => scope.roles) ?? []),
  ];
  const associationRole = PROCESS_PARTICIPANT_ROLES.find(
    (role) => role !== "proponent" && role !== "sponsor" && sessionRoles.includes(role),
  );
  if (associationRole) return associationRole;

  if (profileNames.some((name) => name.includes("administr"))) {
    return "administration";
  }
  if (profileNames.some((name) => name.includes("bracvam"))) {
    return "bracvam";
  }
  if (
    profileNames.some(
      (name) => name.includes("proponente") || name.includes("proponent"),
    )
  ) {
    return "proponent";
  }

  if (sessionRoles.includes("sponsor")) return "sponsor";
  if (sessionRoles.includes("proponent")) return "proponent";

  return "platform";
}

function normalizeModuleName(value: string) {
  return value
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replaceAll(/[-_]/g, " ");
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
    && (user.scopes === undefined || (Array.isArray(user.scopes) && user.scopes.every(isSessionAccessScope)))
  );
}

function isSessionAccessScope(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const scope = value as ApiRecord;
  return typeof scope.process_id === "string" &&
    (scope.institution_id === null || typeof scope.institution_id === "string") &&
    (scope.laboratory_id === null || typeof scope.laboratory_id === "string") &&
    Array.isArray(scope.roles) && scope.roles.every((role) => typeof role === "string");
}
