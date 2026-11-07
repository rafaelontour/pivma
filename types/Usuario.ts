import type { AssignedPermissionProfile } from "./Rbac";
import type { AppLocale } from "./I18n";
import type { SessionAccessScope } from "./ParticipacaoEscopo";

export type UserPublic = {
  id: string;
  username: string;
  email: string;
  full_name: string | null;
};

export type CurrentUser = UserPublic & {
  permissions: string[];
  roles: string[];
  profiles: AssignedPermissionProfile[];
  isAdministrator: boolean;
  preferred_locale?: AppLocale;
  scopes?: SessionAccessScope[];
};

export type CreateUserInput = {
  username: string;
  email: string;
  full_name: string;
  password: string;
};

export type UpdateUserInput = {
  full_name: string;
};

export type UserListItem = UserPublic & {
  active: boolean;
  profiles: AssignedPermissionProfile[];
};

export type UserProfileDetails = {
  account: UserListItem & { created_at?: string | null };
  global_profiles: AssignedPermissionProfile[];
  local_roles: UserProcessRole[];
};

export type UserProcessRole = {
  process_id: string;
  process_code?: string | null;
  process_title?: string | null;
  role_key: string;
  assigned_at?: string | null;
  active?: boolean | null;
};

export type UserList = {
  offset: number;
  limit: number;
  items: UserListItem[];
};

export type ExternalUserListResponse = {
  data: UserListItem[];
  pagination: {
    page: number;
    per_page: number;
    has_next: boolean;
  };
};

export type UserListOptions = {
  offset: number;
  limit: number;
  search?: string;
  active: boolean;
  profileId?: string;
};

export type UserDirectoryStatus = "loading" | "ready" | "denied" | "error";

export type UserDirectoryFilters = {
  search: string;
  active: "true" | "false";
};

export type UserEditState = {
  user: UserListItem;
  fullName: string;
  isSaving: boolean;
};
