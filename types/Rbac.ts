export type PermissionProfile = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  official: boolean;
  permission_codes: string[];
};

export type PermissionDefinition = {
  code: string;
  description: string;
};

export type UpdatePermissionProfileInput = {
  permissionCodes: string[];
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
