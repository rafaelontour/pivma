import type { ProcessInstance } from "./Processo";
import type { ReactNode } from "react";
import type { ProcessTask } from "./Tarefa";

export type ProcessParticipantRole =
  | "group_manager"
  | "study_manager"
  | "statistician"
  | "adhoc_evaluator"
  | "peer_reviewer"
  | "lead_laboratory"
  | "participating_laboratory"
  | "proponent"
  | "sponsor"
  | "sample_selection_group"
  | "regulatory_observer"
  | "collaborator";

export const PROCESS_PARTICIPANT_ROLES: readonly ProcessParticipantRole[] = [
  "group_manager", "study_manager", "statistician", "adhoc_evaluator", "peer_reviewer",
  "lead_laboratory", "participating_laboratory", "proponent", "sponsor",
  "sample_selection_group", "regulatory_observer", "collaborator",
];

export type ProcessParticipant = {
  id: string;
  user: { id: string; username: string; full_name: string | null };
  role_key: string;
  laboratory: { id: string; name: string; active: boolean; institution: { id: string; name: string; active: boolean } } | null;
  active: boolean;
  effective: boolean;
  has_conflict: boolean | null;
  assigned_at: string;
  revoked_at: string | null;
  latest_declared_at: string | null;
};

export type ProcessParticipantInvite = {
  id: string;
  role_key: string;
  laboratory: { id: string; name: string; active: boolean; institution: { id: string; name: string; active: boolean } } | null;
  email: string;
  channel: string;
  status: "pending" | "accepted" | "revoked";
  expired: boolean;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
  revoked_at: string | null;
  delivery?: { status: "pending" | "sent" | "failed" | "cancelled"; sent_at: string | null } | null;
};

export type ProcessLaboratory = {
  id: string;
  name: string;
  active: boolean;
  institution: { id: string; name: string; active: boolean };
};

export type ProcessCompositionSnapshot = {
  process: ProcessInstance;
  participants: ProcessParticipant[];
  invites: ProcessParticipantInvite[];
  tasks: ProcessTask[];
  laboratories: ProcessLaboratory[];
  capabilities: {
    canAssignSponsor: boolean;
    canAssignGroupManager: boolean;
    canAssignLaboratories: boolean;
    canManageParticipants?: boolean;
    canDeclareConflict?: boolean;
    canCompleteRoles?: boolean;
    canViewHistory?: boolean;
  };
  history?: ProcessParticipantHistoryItem[];
};

export type ProcessParticipantHistoryItem = Record<string, unknown>;
export type ProcessParticipantAssignmentInput = { user_id: string; role_key: ProcessParticipantRole; laboratory_id?: string | null };
export type ProcessCompositionUserOption = {
  id: string;
  username: string;
  full_name: string | null;
  email: string;
};
export type ProcessParticipantConflictInput = { has_conflict: boolean; justification: string };
export type ProcessParticipantRoleKeyInput = { role_key: ProcessParticipantRole };
export type ProcessParticipantActionInput = ProcessParticipantAssignmentInput | ProcessParticipantConflictInput | ProcessParticipantRoleKeyInput;

export type ProcessCompositionIndexItem = {
  process: ProcessInstance;
  roles: string[];
  actionableTasks: ProcessTask[];
};

export type ProcessCompositionIndexState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: ProcessCompositionIndexItem[] };

export type ProcessCompositionState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; snapshot: ProcessCompositionSnapshot; isRefreshing: boolean; isStale: boolean };

export type ProcessCompositionInviteInput = {
  role_key: ProcessParticipantRole;
  email: string;
  laboratory_id?: string;
};

export type ProcessCompositionWorkspaceProps = { processId?: string };

export type ProcessCompositionInviteFormProps = {
  processId: string;
  role: ProcessParticipantRole;
  participants: ProcessParticipant[];
  laboratories: ProcessLaboratory[];
  invites: ProcessParticipantInvite[];
  busy: boolean;
  onSubmit: (input: ProcessCompositionInviteInput) => Promise<boolean>;
  onAssign: (input: ProcessParticipantAssignmentInput) => Promise<boolean>;
};

export type ProcessCompositionRoleCardProps = {
  processId: string;
  title: string;
  description: string;
  role: ProcessParticipantRole;
  participants: ProcessParticipant[];
  invites: ProcessParticipantInvite[];
  laboratories: ProcessLaboratory[];
  showForm: boolean;
  busy: boolean;
  onSubmit: (input: ProcessCompositionInviteInput) => Promise<boolean>;
  onAssign: (input: ProcessParticipantAssignmentInput) => Promise<boolean>;
  onParticipantAction: (action: ProcessParticipantUiAction, id: string) => Promise<void>;
  onCompleteRole: (role: ProcessParticipantRole) => Promise<void>;
  canManage: boolean;
  onViewParticipant: (participant: ProcessParticipant) => void;
};

export type CompositionProcessCardProps = {
  item: ProcessCompositionIndexItem;
  locale: string | undefined;
};

export type CompositionErrorProps = {
  message: string;
  onRetry: () => void;
};

export type ProcessCompositionPageProps = { processId: string };

export type ProcessCompositionRouteContext = { params: Promise<{ processId: string }> };
export type ProcessParticipantActionRouteContext = { params: Promise<{ processId: string; assignmentId: string }> };
export type ProcessParticipantRoleActionRouteContext = { params: Promise<{ processId: string; roleKey: string }> };
export type ProcessParticipantInviteActionRouteContext = { params: Promise<{ processId: string; inviteId: string }> };

export type ProcessCompositionRoutePageProps = { params: Promise<{ processId: string }> };

export type ProcessCompositionSectionProps = {
  title: string;
  children: ReactNode;
};

export type ProcessCompositionParticipantListProps = {
  participants: ProcessParticipant[];
  invites: ProcessParticipantInvite[];
  role: ProcessParticipantRole;
  canManage: boolean;
  busy: boolean;
  onAction: (action: ProcessParticipantUiAction, id: string) => Promise<void>;
  onViewParticipant: (participant: ProcessParticipant) => void;
};
export type ProcessParticipantUiAction = "resend-invite" | "revoke-invite" | "revoke-assignment" | "conflict";

