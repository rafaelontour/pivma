import type { ReactNode, RefObject } from "react";
import type { CurrentUser, UserEditState, UserListItem } from "./Usuario";
import type { CreateProfileState } from "./Rbac";
import type {
  PermissionDefinition,
  PermissionProfile,
  UserAccess,
} from "./Rbac";

export type SessionState =
  | { kind: "loading" }
  | { kind: "ready"; user: CurrentUser };

export type AuthenticatedHomeProps = {
  page?: "home";
};

export type AuthenticatedPage =
  | "home"
  | "users"
  | "processes"
  | "submissions"
  | "forms"
  | "ai-evaluations"
  | "triage"
  | "operational-observability"
  | "ai-observability";

export type AuthenticatedShellProps = {
  activePage: AuthenticatedPage;
  children: ReactNode;
};

export type SidebarProps = {
  activePage: AuthenticatedPage;
  canManageUsers: boolean;
  canManageForms: boolean;
  canViewSubmissions: boolean;
  canViewAiEvaluations: boolean;
  canViewProcesses: boolean;
  canViewTriage: boolean;
  canViewObservability: boolean;
  expanded: boolean;
  user: CurrentUser;
};

export type AccessPanelState =
  | { kind: "closed" }
  | { kind: "loading"; user: UserListItem }
  | { kind: "error"; user: UserListItem; message: string }
  | {
      kind: "ready";
      user: UserListItem;
      profiles: PermissionProfile[];
      permissionCatalog: PermissionDefinition[];
      access: UserAccess;
      selectedProfileId: string;
      isSaving: boolean;
      isRemovingProfileId: string | null;
    };

export type AccessPanelProps = {
  panel: Exclude<AccessPanelState, { kind: "closed" }>;
  canManageAssignments: boolean;
  onClose: () => void;
  onRetry: () => void;
  onProfileChange: (profileId: string) => void;
  onGrant: () => void;
  onRemoveProfile: (profileId: string) => void;
};

export type UserEditDialogProps = {
  state: UserEditState;
  onChange: (fullName: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export type CreateProfileDialogProps = {
  state: CreateProfileState;
  permissions: PermissionDefinition[];
  isCatalogLoading: boolean;
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onPermissionToggle: (permissionCode: string) => void;
  onClose: () => void;
  onSave: () => void;
};

export type ModalShellProps = {
  label: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
};

export type AccessibleDialogHandle = RefObject<HTMLDivElement | null>;

export type DirectoryMessageProps = {
  message: string;
};

export type WelcomeCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};
