import type { AssignedPermissionProfile } from "./Rbac";

export const PROCESS_KANBAN_PERMISSION_CODES = ["triage.review"] as const;

export function hasProcessKanbanAccess(
  permissions: string[],
  profiles: Pick<AssignedPermissionProfile, "name">[],
) {
  return (
    PROCESS_KANBAN_PERMISSION_CODES.some((permission) =>
      permissions.includes(permission),
    ) ||
    profiles.some((profile) =>
      profile.name.toLocaleLowerCase("pt-BR").includes("bracvam"),
    )
  );
}

export type ProcessInstance = {
  id: string;
  code: string;
  title: string;
  status: string;
  template_key: string;
  version_number: number;
  started_at?: string | null;
  closed_at?: string | null;
  closure_reason?: string | null;
  available_actions?: ProcessAvailableAction[];
  has_been_submitted?: boolean;
  awaiting_correction?: boolean;
  returned_by_bracvam?: boolean;
};

export type ProcessAvailableAction = "DELETE" | "ARCHIVE";

export type ProcessList = {
  items: ProcessInstance[];
  total: number;
  page: number;
  size: number;
};

export type ProcessListOptions = {
  page: number;
  size: number;
  status?: string;
};
