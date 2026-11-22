import type { ReactNode, RefObject } from "react";
import type { UserListItem } from "./Usuario";

export type InstitutionRef = {
  id: string;
  name: string;
  active: boolean;
};

export type Institution = InstitutionRef & {
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  deleted_by: string | null;
  deleted_at: string | null;
};

export type Laboratory = {
  id: string;
  name: string;
  active: boolean;
  institution: InstitutionRef;
  created_by: string | null;
  created_at: string;
  updated_by: string | null;
  updated_at: string | null;
  deleted_by: string | null;
  deleted_at: string | null;
};

export type InstitutionalPagination = {
  page: number;
  per_page: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

export type InstitutionalListResponse<T> = {
  items: T[];
  pagination: InstitutionalPagination;
};

export type InstitutionalAffiliationCreateInput = {
  institution_id: string;
  laboratory_id: string;
};

export type LaboratoryMemberDialogState =
  | { kind: "closed" }
  | {
      kind: "open";
      laboratory: Laboratory;
      search: string;
      users: UserListItem[];
      selectedUserId: string;
      error: string | null;
      hasSearched: boolean;
      isSearching: boolean;
      isSubmitting: boolean;
    };

export type InstitutionalCatalogSnapshot = {
  institutions: Institution[];
  laboratories: Laboratory[];
};

export type InstitutionNameInput = { name: string };

export type LaboratoryCreateInput = InstitutionNameInput & {
  institution_id: string;
};

export type InstitutionalResourceKind = "institution" | "laboratory";

export type InstitutionalTarget = {
  id: string;
  kind: InstitutionalResourceKind;
  name: string;
  institutionId?: string;
};

export type InstitutionalCatalogState =
  | { kind: "loading" }
  | { kind: "denied"; message: string }
  | { kind: "error"; message: string }
  | { kind: "ready"; snapshot: InstitutionalCatalogSnapshot };

export type InstitutionalDialogState =
  | { kind: "closed" }
  | {
      kind: "form";
      mode: "create" | "rename";
      resourceKind: InstitutionalResourceKind;
      target: InstitutionalTarget | null;
      name: string;
      institutionId: string;
      error: string | null;
      isSubmitting: boolean;
    }
  | {
      kind: "deactivate";
      target: InstitutionalTarget;
      error: string | null;
      isSubmitting: boolean;
    };

export type InstitutionalCatalogProps = {
  initialSnapshot?: InstitutionalCatalogSnapshot;
};

export type LaboratoryMemberDialogProps = {
  state: Extract<LaboratoryMemberDialogState, { kind: "open" }>;
  onClose: () => void;
  onSearchChange: (search: string) => void;
  onSelectUser: (userId: string) => void;
  onSearch: () => void;
  onSubmit: () => void;
};

export type InstitutionalDialogProps = {
  state: Exclude<InstitutionalDialogState, { kind: "closed" }>;
  institutions: Institution[];
  onClose: () => void;
  onNameChange: (name: string) => void;
  onInstitutionChange: (institutionId: string) => void;
  onSubmit: () => void;
};

export type InstitutionalDialogShellProps = {
  label: string;
  titleId: string;
  busy: boolean;
  wide?: boolean;
  onClose: () => void;
  children: ReactNode;
};

export type InstitutionalDialogHandle = RefObject<HTMLDivElement | null>;

export type InstitutionalApiMutation = {
  method: "POST" | "PATCH" | "DELETE";
  path: string;
  body?: InstitutionNameInput | LaboratoryCreateInput;
};

export type InstitutionCardProps = {
  institution: Institution;
  laboratories: Laboratory[];
  locale: "pt-BR" | "en";
  canManageCatalog: boolean;
  canManageAffiliations: boolean;
  onAddPerson: (laboratory: Laboratory) => void;
  onDeactivate: (target: InstitutionalTarget) => void;
  onRename: (target: InstitutionalTarget) => void;
};

export type InstitutionalActionButtonProps = {
  danger?: boolean;
  label: string;
  onClick: () => void;
};

export type InstitutionalStatusBadgeProps = { active: boolean };

export type InstitutionalCatalogMessageProps = {
  busy: boolean;
  message: string;
};
