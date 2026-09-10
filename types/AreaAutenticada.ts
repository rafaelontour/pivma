import type { ReactNode } from "react";
import type { CurrentUser, UserListItem } from "./Usuario";
import type {
  PermissionDefinition,
  PermissionProfile,
  UserAccess,
} from "./Rbac";

export type SessionState =
  | { kind: "loading" }
  | { kind: "ready"; user: CurrentUser };

export type AuthenticatedHomeProps = {
  page?: "home" | "users";
};

export type AuthenticatedPage = "home" | "users" | "processes" | "submissions";

export type AuthenticatedShellProps = {
  activePage: AuthenticatedPage;
  children: ReactNode;
};

export type SidebarProps = {
  activePage: AuthenticatedPage;
  canManageUsers: boolean;
  canViewProcesses: boolean;
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
      editingProfileId: string | null;
      editedPermissionCodes: string[];
      isUpdatingPermissions: boolean;
      isRemovingProfileId: string | null;
    };

export type AccessPanelProps = {
  panel: Exclude<AccessPanelState, { kind: "closed" }>;
  onClose: () => void;
  onRetry: () => void;
  onProfileChange: (profileId: string) => void;
  onGrant: () => void;
  onBeginPermissionEdit: (profileId: string) => void;
  onCancelPermissionEdit: () => void;
  onPermissionToggle: (permissionCode: string) => void;
  onSavePermissions: () => void;
  onRemoveProfile: (profileId: string) => void;
};

export type DirectoryMessageProps = {
  message: string;
};

export type WelcomeCardProps = {
  eyebrow: string;
  title: string;
  description: string;
};
