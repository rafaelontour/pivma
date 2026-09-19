export type PermissionProfile = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  official: boolean;
  permission_codes: string[];
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  deleted_by: string | null;
  deleted_at: string | null;
};

export type PermissionDefinition = {
  code: string;
  description: string;
};

export type UpdatePermissionProfileInput = {
  permissionCodes: string[];
};

export type CreatePermissionProfileInput = {
  name: string;
  description: string;
  permission_codes: string[];
};

export type AssignedPermissionProfile = {
  id: string;
  name: string;
  active: boolean;
};

export type UserAccess = {
  user_id: string;
  profiles: AssignedPermissionProfile[];
  effective_permissions: string[];
};

export type CreateProfileState = {
  name: string;
  description: string;
  permissionCodes: string[];
  isSaving: boolean;
};
