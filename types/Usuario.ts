import type { AssignedPermissionProfile } from "./Rbac";
import type { AppLocale } from "./I18n";

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

export type UserList = {
  offset: number;
  limit: number;
  items: UserListItem[];
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
