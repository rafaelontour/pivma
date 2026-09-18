import type {
  SettingsModuleItem,
  SettingsSessionCapabilities,
} from "@/types/Configuracoes";
import type { ApiRecord } from "@/types/Servico";
import type { CurrentUser } from "@/types/Usuario";

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
): SettingsModuleItem[] {
  return [
    {
      id: "forms",
      title: "Formulários",
      description:
        "Edite e estruture os formulários dos processos, definindo seções, campos dinâmicos, obrigatoriedade e habilitação para IA.",
      href: "/formularios",
      badge: "Configuração BraCVAM",
      iconName: "ListChecks",
      isAllowed: capabilities.canManageForms,
      deniedReason:
        "Seu perfil não possui permissão para gerenciar os formulários de processo.",
    },
    {
      id: "ai-evaluations",
      title: "Avaliações por IA",
      description:
        "Consulte e configure objetivos, versões publicadas, sugestões de critérios e associações com campos avaliados.",
      href: "/avaliacoes-ia",
      badge: "Inteligência Artificial",
      iconName: "Bot",
      isAllowed: capabilities.canViewAiEvaluations,
      deniedReason:
        "Seu perfil não possui permissão para consultar ou configurar avaliações por IA.",
    },
    {
      id: "users",
      title: "Usuários",
      description:
        "Consulte as contas cadastradas, gerencie a situação de acesso, edite nomes completos e configure perfis de permissão.",
      href: "/usuarios",
      badge: "Administração",
      iconName: "UsersRound",
      isAllowed: capabilities.canManageUsers,
      deniedReason:
        "Seu perfil não possui permissão para consultar o diretório de usuários.",
    },
  ];
}
