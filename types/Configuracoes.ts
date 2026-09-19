import type { CurrentUser } from "./Usuario";

export type SettingsModuleId = "forms" | "ai-evaluations" | "users";

export type SettingsModuleItem = {
  id: SettingsModuleId;
  title: string;
  description: string;
  href: string;
  badge: string;
  iconName: "ListChecks" | "Bot" | "UsersRound";
  isAllowed: boolean;
  deniedReason?: string;
};

export type SettingsSessionCapabilities = {
  canManageForms: boolean;
  canViewAiEvaluations: boolean;
  canManageUsers: boolean;
  user?: CurrentUser;
};

export type SettingsHubProps = {
  initialCapabilities?: SettingsSessionCapabilities;
};

export type SettingsModuleCardProps = {
  module: SettingsModuleItem;
};

export type SettingsBackLinkProps = {
  currentModuleName: string;
};

export type ModuleIconProps = {
  name: SettingsModuleItem["iconName"];
  className?: string;
};
