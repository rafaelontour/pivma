import type {
  SettingsModuleItem,
  SettingsSessionCapabilities,
} from "@/types/Configuracoes";
import type { ApiRecord } from "@/types/Servico";
import type { CurrentUser } from "@/types/Usuario";
import type { TFunction } from "i18next";

export function isCurrentUser(value: unknown): value is CurrentUser {
  if (!value || typeof value !== "object") return false;
  const user = value as ApiRecord;
  return (
    typeof user.id === "string" &&
    typeof user.username === "string" &&
    typeof user.email === "string" &&
    (typeof user.full_name === "string" || user.full_name === null) &&
    Array.isArray(user.permissions) &&
    typeof user.isAdministrator === "boolean" &&
    Array.isArray(user.profiles)
  );
}

export function getSettingsCapabilities(
  user: CurrentUser,
): SettingsSessionCapabilities {
  const canManageForms =
    user.isAdministrator ||
    user.permissions.includes("rbac.read") ||
    user.profiles.some((profile) => profile.name === "Grupo Gestor");

  const canViewAiEvaluations = [
    "ai_evaluations.read",
    "ai_evaluations.manage",
  ].some((permission) => user.permissions.includes(permission));

  const canManageUsers = user.permissions.includes("users.read");

  return {
    canManageForms,
    canViewAiEvaluations,
    canManageUsers,
    user,
  };
}

export function hasAnySettingsAccess(
  capabilities: SettingsSessionCapabilities,
): boolean {
  return (
    capabilities.canManageForms ||
    capabilities.canViewAiEvaluations ||
    capabilities.canManageUsers
  );
}

export function getSettingsModules(
  capabilities: SettingsSessionCapabilities,
  t: TFunction,
): SettingsModuleItem[] {
  return [
    {
      id: "forms",
      title: t("settings.modules.forms.title"),
      description: t("settings.modules.forms.description"),
      href: "/formularios",
      badge: t("settings.modules.forms.badge"),
      iconName: "ListChecks",
      isAllowed: capabilities.canManageForms,
      deniedReason: t("settings.modules.forms.denied"),
    },
    {
      id: "ai-evaluations",
      title: t("settings.modules.ai-evaluations.title"),
      description: t("settings.modules.ai-evaluations.description"),
      href: "/avaliacoes-ia",
      badge: t("settings.modules.ai-evaluations.badge"),
      iconName: "Bot",
      isAllowed: capabilities.canViewAiEvaluations,
      deniedReason: t("settings.modules.ai-evaluations.denied"),
    },
    {
      id: "users",
      title: t("settings.modules.users.title"),
      description: t("settings.modules.users.description"),
      href: "/usuarios",
      badge: t("settings.modules.users.badge"),
      iconName: "UsersRound",
      isAllowed: capabilities.canManageUsers,
      deniedReason: t("settings.modules.users.denied"),
    },
  ];
}
