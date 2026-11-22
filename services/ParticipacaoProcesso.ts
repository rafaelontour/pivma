import "server-only";

import { isAxiosError } from "axios";
import { tryit } from "radash";
import { http } from "./Http";
import { normalizeProcessInstance } from "./Processo";
import type { CurrentSessionUser } from "@/types/Autenticacao";
import type {
  ProcessCompositionIndexItem,
  ProcessCompositionSnapshot,
  ProcessLaboratory,
  ProcessParticipant,
  ProcessParticipantInvite,
  ProcessCompositionInviteInput,
  ProcessParticipantAssignmentInput,
  ProcessParticipantConflictInput,
  ProcessParticipantHistoryItem,
  ProcessCompositionInviteCreated,
  InvitePreview,
} from "@/types/ParticipacaoProcesso";
import type { ProcessInstance } from "@/types/Processo";
import type { ProcessTask } from "@/types/Tarefa";
import type { ApiRecord, ServiceResult } from "@/types/Servico";
import type {
  SponsorTrackingDetail,
  SponsorTrackingItem,
} from "@/types/Acompanhamento";

const PAGE_SIZE = 100;
const MAX_PAGES = 1000;

export async function getProcessComposition(
  accessToken: string,
  processId: string,
  scopes: CurrentSessionUser["access"]["scopes"],
  canReview = false,
  canManageParticipants = false,
): Promise<ServiceResult<ProcessCompositionSnapshot>> {
  const processResult = await getProcess(accessToken, processId);
  if (!processResult.ok) return processResult;

  const roles = rolesForProcess(scopes, processId);
  const isGroupManager = roles.includes("group_manager");
  const [participants, invites, tasks, laboratories] = await Promise.all([
    listParticipants(accessToken, processId),
    listParticipantInvites(accessToken, processId),
    listProcessTasks(accessToken, processId),
    isGroupManager || canReview ? listActiveLaboratories(accessToken) : Promise.resolve({ ok: true as const, data: [] as ProcessLaboratory[] }),
  ]);
  const failure = [participants, invites, tasks, laboratories].find((result) => !result.ok);
  if (failure && !failure.ok) return failure;

  const taskItems = tasks.ok ? tasks.data : [];
  return {
    ok: true,
    data: {
      process: processResult.data,
      participants: participants.ok ? participants.data : [],
      invites: invites.ok ? invites.data : [],
      tasks: taskItems,
      laboratories: laboratories.ok ? laboratories.data.filter((laboratory) => laboratory.active) : [],
      capabilities: {
        canAssignSponsor: canActOnAssignment(taskItems, "assign_sponsor", roles, canReview) ||
          (canReview && taskItems.some((task) => task.activity_key === "assign_sponsor" && task.status === "COMPLETED")),
        canAssignGroupManager: canActOnAssignment(taskItems, "assign_group_manager", roles, canReview) ||
          (canReview && taskItems.some((task) => task.activity_key === "assign_group_manager" && task.status !== "COMPLETED" && task.status !== "CANCELLED")) ||
          (canManageParticipants && taskItems.some((task) => task.activity_key === "assign_group_manager" && task.status === "COMPLETED")),
        canAssignLaboratories: isGroupManager,
        canManageParticipants: isGroupManager || roles.includes("proponent") || canReview,
        canCompleteRoles: canReview,
      },
    },
  };
}

export async function listCompositionIndex(
  accessToken: string,
  scopes: CurrentSessionUser["access"]["scopes"],
  permissions: string[] = [],
): Promise<ServiceResult<ProcessCompositionIndexItem[]>> {
  const relevantScopes = scopes.filter((scope) => scope.roles.length > 0);
  const tasks = await listAllTasks(accessToken);
  if (!tasks.ok) return tasks;
  const canManageParticipants = permissions.includes("process.participants.manage");
  const compositionTasks = tasks.data.filter((task) =>
    task.activity_key === "assign_group_manager" || task.activity_key === "assign_sponsor",
  );
  const processIds = new Set(canManageParticipants ? [] : relevantScopes.map((scope) => scope.process_id));
  if (canManageParticipants) {
    for (const task of compositionTasks) {
      if (task.assigned_role === "bracvam") processIds.add(task.process.id);
    }
  }
  if (processIds.size === 0) return { ok: true, data: [] };
  const processIdList = Array.from(processIds);
  const [processResults, participantResults] = await Promise.all([
    Promise.all(processIdList.map((processId) => getProcess(accessToken, processId))),
    Promise.all(processIdList.map((processId) => listParticipants(accessToken, processId))),
  ]);
  const failedProcess = processResults.find((result) => !result.ok);
  if (failedProcess && !failedProcess.ok) return failedProcess;
  const failedParticipants = participantResults.find((result) => !result.ok);
  if (failedParticipants && !failedParticipants.ok) return failedParticipants;
  const processes = processResults.flatMap((result) => result.ok ? [result.data] : []);
  const participantsByProcess = new Map(processIdList.map((processId, index) => [
    processId,
    participantResults[index]?.ok ? participantResults[index].data : [],
  ]));

  const byProcessTasks = new Map<string, ProcessTask[]>();
  for (const task of tasks.data) {
    const current = byProcessTasks.get(task.process.id) ?? [];
    current.push(task);
    byProcessTasks.set(task.process.id, current);
  }

  return {
    ok: true,
    data: processes
      .map((process) => ({
        process,
        proponent: participantsByProcess.get(process.id)?.find((participant) => participant.active && participant.role_key === "proponent")?.user ?? null,
        groupMembers: (participantsByProcess.get(process.id) ?? []).filter(
          (participant) => participant.active && participant.role_key === "group_manager",
        ),
        roles: canManageParticipants ? ["bracvam", ...rolesForProcess(relevantScopes, process.id)] : rolesForProcess(relevantScopes, process.id),
        actionableTasks: (byProcessTasks.get(process.id) ?? []).filter(
          (task) => task.status === "READY" && task.can_act,
        ),
      }))
      .filter((item) => item.roles.length > 0),
  };
}

export async function listSponsorTracking(
  accessToken: string,
  scopes: CurrentSessionUser["access"]["scopes"],
  userId: string,
): Promise<ServiceResult<SponsorTrackingItem[]>> {
  const processIds = Array.from(new Set(
    scopes
      .filter((scope) => scope.roles.includes("sponsor"))
      .map((scope) => scope.process_id),
  ));
  const results = await Promise.all(
    processIds.map((processId) =>
      getSponsorTrackingItem(accessToken, processId, userId),
    ),
  );
  const failed = results.find((result) => !result.ok);
  if (failed && !failed.ok) return failed;

  return {
    ok: true,
    data: results
      .flatMap((result) => result.ok && result.data ? [result.data] : [])
      .sort((first, second) =>
        second.sponsorAssignedAt.localeCompare(first.sponsorAssignedAt),
      ),
  };
}

export async function getSponsorTrackingDetail(
  accessToken: string,
  processId: string,
  scopes: CurrentSessionUser["access"]["scopes"],
  userId: string,
): Promise<ServiceResult<SponsorTrackingDetail>> {
  const hasSponsorScope = scopes.some(
    (scope) =>
      scope.process_id === processId && scope.roles.includes("sponsor"),
  );
  if (!hasSponsorScope) return { ok: false, status: 403 };

  const [item, tasks] = await Promise.all([
    getSponsorTrackingItem(accessToken, processId, userId),
    listProcessTasks(accessToken, processId),
  ]);
  if (!item.ok) return item;
  if (!item.data) return { ok: false, status: 403 };
  if (!tasks.ok) return tasks;

  const currentTask = [...tasks.data]
    .filter((task) => task.status === "READY")
    .sort((first, second) =>
      first.phase.order - second.phase.order ||
      first.activity_run_number - second.activity_run_number,
    )[0] ?? null;

  return { ok: true, data: { ...item.data, currentTask } };
}

async function getSponsorTrackingItem(
  accessToken: string,
  processId: string,
  userId: string,
): Promise<ServiceResult<SponsorTrackingItem | null>> {
  const [process, participants] = await Promise.all([
    getProcess(accessToken, processId),
    listParticipants(accessToken, processId),
  ]);
  if (!process.ok) return process;
  if (!participants.ok) return participants;

  const sponsor = participants.data
    .filter((participant) =>
      participant.active &&
      participant.role_key === "sponsor" &&
      participant.user.id === userId,
    )
    .sort((first, second) =>
      second.assigned_at.localeCompare(first.assigned_at),
    )[0];
  if (!sponsor) return { ok: true, data: null };

  return {
    ok: true,
    data: {
      process: process.data,
      proponent: participants.data.find(
        (participant) =>
          participant.active && participant.role_key === "proponent",
      )?.user ?? null,
      sponsorAssignedAt: sponsor.assigned_at,
    },
  };
}

export async function createProcessParticipantInvite(
  accessToken: string,
  processId: string,
  input: ProcessCompositionInviteInput,
  origin: string,
): Promise<ServiceResult<ProcessCompositionInviteCreated>> {
  const [error, response] = await tryit(() => http.post<unknown>(
    `/processes/${processId}/participants/invites`,
    {
      email: input.email,
      role_key: input.role_key,
      channel: input.channel ?? "email",
      ...(input.laboratory_id ? { laboratory_id: input.laboratory_id } : {}),
    },
    { headers: { ...authHeaders(accessToken), Origin: origin } },
  ))();
  if (error) return getServiceError(error);

  // The API response contains a bearer invite token. Normalize only the public
  // fields required by the UI so the token never crosses the internal route.
  const invite = normalizeCreatedInvite(response.data);
  return invite ? { ok: true, data: invite } : { ok: false };
}

export async function previewParticipantInvite(token: string): Promise<ServiceResult<InvitePreview>> {
  const [error, response] = await tryit(() => http.get<unknown>(`/invites/${encodeURIComponent(token)}`))();
  if (error) return getServiceError(error);
  const value = response.data;
  if (!isRecord(value) || typeof value.role_key !== "string" || typeof value.process_code !== "string" || typeof value.process_title !== "string" || typeof value.masked_email !== "string" || typeof value.expires_at !== "string" || typeof value.expired !== "boolean") return { ok: false };
  return { ok: true, data: { role_key: value.role_key as InvitePreview["role_key"], process_code: value.process_code, process_title: value.process_title, masked_email: value.masked_email, expires_at: value.expires_at, expired: value.expired } };
}

export async function acceptParticipantInvite(accessToken: string, token: string) {
  return mutate<unknown>(accessToken, "post", `/invites/${encodeURIComponent(token)}/accept`);
}

export async function createProcessParticipant(
  accessToken: string,
  processId: string,
  input: ProcessParticipantAssignmentInput,
  origin: string,
): Promise<ServiceResult<ProcessParticipant>> {
  const [error, response] = await tryit(() => http.post<unknown>(
    `/processes/${processId}/participants`,
    input,
    { headers: { ...authHeaders(accessToken), Origin: origin } },
  ))();
  if (error) return getServiceError(error);
  const participant = normalizeParticipant(response.data);
  return participant ? { ok: true, data: participant } : { ok: false };
}

export async function resendProcessParticipantInvite(accessToken: string, processId: string, inviteId: string) {
  return mutate<unknown>(accessToken, "post", `/processes/${processId}/participants/invites/${inviteId}/resend`);
}

export async function revokeProcessParticipantInvite(accessToken: string, processId: string, inviteId: string) {
  return mutate<null>(accessToken, "post", `/processes/${processId}/participants/invites/${inviteId}/revoke`);
}

export async function revokeProcessParticipant(accessToken: string, processId: string, assignmentId: string, origin: string) {
  return mutate<null>(accessToken, "delete", `/processes/${processId}/participants/${assignmentId}`, undefined, origin);
}

export async function declareProcessParticipantConflict(
  accessToken: string,
  processId: string,
  assignmentId: string,
  input: ProcessParticipantConflictInput,
) {
  return mutate<unknown>(accessToken, "post", `/processes/${processId}/participants/${assignmentId}/conflicts`, input);
}

export async function completeProcessParticipantRole(accessToken: string, processId: string, roleKey: string) {
  return mutate<unknown>(accessToken, "post", `/processes/${processId}/participants/roles/${encodeURIComponent(roleKey)}/complete`);
}

export async function listProcessParticipantHistory(accessToken: string, processId: string) {
  return listPages(accessToken, `/processes/${processId}/participants/history`, normalizeParticipantHistory);
}

async function mutate<T>(accessToken: string, method: "post" | "delete", path: string, data?: unknown, origin?: string): Promise<ServiceResult<T>> {
  const [error, response] = await tryit(() => method === "post"
    ? http.post<T>(path, data, { headers: { ...authHeaders(accessToken), ...(origin ? { Origin: origin } : {}) } })
    : http.delete<T>(path, { headers: { ...authHeaders(accessToken), ...(origin ? { Origin: origin } : {}) } }))();
  if (error) return getServiceError(error);
  return { ok: true, data: response.data === undefined ? null as T : response.data };
}

function normalizeParticipantHistory(value: unknown): ProcessParticipantHistoryItem | null {
  if (!isRecord(value) || !isRecord(value.assignment) || !Array.isArray(value.declarations)) return null;
  const assignment = normalizeParticipant(value.assignment);
  if (!assignment) return null;
  return { ...value, assignment, declarations: value.declarations.filter(isRecord) };
}

export async function hasDuplicateProcessParticipantInvite(
  accessToken: string,
  processId: string,
  input: ProcessCompositionInviteInput,
): Promise<ServiceResult<boolean>> {
  const invites = await listParticipantInvites(accessToken, processId);
  if (!invites.ok) return invites;
  const normalizedEmail = input.email.toLocaleLowerCase("en-US");
  return {
    ok: true,
    data: invites.data.some((invite) =>
      invite.role_key === input.role_key &&
      invite.email.toLocaleLowerCase("en-US") === normalizedEmail &&
      (invite.status === "accepted" || (invite.status === "pending" && !invite.expired)) &&
      (!isLaboratoryRole(input.role_key) || invite.laboratory?.id === input.laboratory_id),
    ),
  };
}

function isLaboratoryRole(role: string) {
  return role === "participating_laboratory" || role === "lead_laboratory";
}

export function rolesForProcess(
  scopes: CurrentSessionUser["access"]["scopes"],
  processId: string,
) {
  return Array.from(new Set(scopes.filter((scope) => scope.process_id === processId).flatMap((scope) => scope.roles)));
}

export function canActOnAssignment(
  tasks: ProcessTask[],
  activityKey: string,
  roles: string[],
  canReview = false,
) {
  return tasks.some((task) =>
    task.activity_key === activityKey && task.status === "READY" && task.can_act &&
    (roles.includes(task.assigned_role ?? "") || (canReview && task.assigned_role === "bracvam")),
  );
}

async function listParticipants(accessToken: string, processId: string): Promise<ServiceResult<ProcessParticipant[]>> {
  return listPages(accessToken, `/processes/${processId}/participants`, normalizeParticipant);
}

async function listParticipantInvites(accessToken: string, processId: string): Promise<ServiceResult<ProcessParticipantInvite[]>> {
  return listPages(accessToken, `/processes/${processId}/participants/invites`, normalizeInvite);
}

export async function listActiveLaboratories(accessToken: string): Promise<ServiceResult<ProcessLaboratory[]>> {
  return listPages(accessToken, "/institutional/laboratories", normalizeLaboratory);
}

export async function listProcessTasks(accessToken: string, processId: string): Promise<ServiceResult<ProcessTask[]>> {
  return listPages<ProcessTask>(accessToken, "/tasks", normalizeTaskItem, { process_id: processId, current_run: true }, normalizeTaskPage);
}

async function listAllTasks(accessToken: string): Promise<ServiceResult<ProcessTask[]>> {
  return listPages<ProcessTask>(accessToken, "/tasks", normalizeTaskItem, { current_run: true }, normalizeTaskPage);
}

async function listPages<T>(
  accessToken: string,
  path: string,
  normalizeItem: (value: unknown) => T | null,
  params: Record<string, string | number | boolean> = {},
  normalizePage?: (value: unknown) => { items: T[]; hasNext: boolean } | null,
): Promise<ServiceResult<T[]>> {
  const items: T[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const [error, response] = await tryit(() => http.get<unknown>(path, {
      headers: authHeaders(accessToken),
      params: { ...params, page, per_page: PAGE_SIZE },
    }))();
    if (error) return getServiceError(error);
    const normalized = normalizePage
      ? normalizePage(response.data)
      : normalizeListPage(response.data, normalizeItem);
    if (!normalized) return { ok: false };
    items.push(...normalized.items);
    if (!normalized.hasNext) return { ok: true, data: items };
  }
  return { ok: false, status: 502 };
}

function normalizeListPage<T>(value: unknown, normalizeItem: (value: unknown) => T | null) {
  if (!isRecord(value) || !Array.isArray(value.data) || !isRecord(value.pagination)) return null;
  const items = value.data.map(normalizeItem);
  if (items.some((item) => item === null) || typeof value.pagination.has_next !== "boolean") return null;
  return { items: items as T[], hasNext: value.pagination.has_next };
}

function normalizeTaskPage(value: unknown) {
  if (!isRecord(value) || !Array.isArray(value.data) || !isRecord(value.pagination) || typeof value.pagination.has_next !== "boolean") return null;
  const items = value.data.map(normalizeCompositionTask);
  return items.some((item) => item === null) ? null : { items: items as ProcessTask[], hasNext: value.pagination.has_next };
}

function normalizeTaskItem(value: unknown) {
  return normalizeCompositionTask(value);
}

function normalizeCompositionTask(value: unknown): ProcessTask | null {
  if (!isRecord(value) || !isRecord(value.process) || !isRecord(value.phase)) return null;
  const process = value.process;
  const phase = value.phase;
  const activityRunStatus = value.activity_run_status;
  if (
    typeof value.id !== "string" || typeof process.id !== "string" || typeof process.code !== "string" ||
    typeof process.title !== "string" || typeof value.activity_key !== "string" ||
    typeof value.activity_run_number !== "number" || typeof phase.key !== "string" ||
    typeof phase.order !== "number" || typeof value.title !== "string" ||
    (value.assigned_role !== undefined && value.assigned_role !== null && typeof value.assigned_role !== "string") ||
    (value.due_date !== undefined && value.due_date !== null && typeof value.due_date !== "string") ||
    (value.status !== "READY" && value.status !== "COMPLETED" && value.status !== "CANCELLED") ||
    typeof value.can_act !== "boolean" ||
    (activityRunStatus !== "IN_PROGRESS" && activityRunStatus !== "COMPLETED" && activityRunStatus !== "CANCELLED" && activityRunStatus !== "WAIVED" && activityRunStatus !== "SUPERSEDED")
  ) return null;

  return {
    id: value.id,
    process: { id: process.id, code: process.code, title: process.title },
    activity_key: value.activity_key,
    activity_run_number: value.activity_run_number,
    phase: { key: phase.key, order: phase.order },
    title: value.title,
    assigned_role: value.assigned_role ?? null,
    status: value.status,
    due_date: value.due_date ?? null,
    can_act: value.can_act,
  };
}

async function getProcess(accessToken: string, processId: string): Promise<ServiceResult<ProcessInstance>> {
  const [error, response] = await tryit(() => http.get<unknown>(`/processes/${processId}`, { headers: authHeaders(accessToken) }))();
  if (error) return getServiceError(error);
  const process = normalizeProcessInstance(response.data);
  return process ? { ok: true, data: process } : { ok: false };
}

function normalizeParticipant(value: unknown): ProcessParticipant | null {
  if (!isRecord(value) || !isRecord(value.user) || !isRecord(value.process)) return null;
  const user = value.user;
  const process = value.process;
  const laboratory = value.laboratory === null ? null : normalizeLaboratoryRef(value.laboratory);
  if (!laboratory && value.laboratory !== null) return null;
  if (
    typeof value.id !== "string" || typeof process.id !== "string" || typeof process.code !== "string" || typeof process.title !== "string" ||
    typeof user.id !== "string" || typeof user.username !== "string" || (typeof user.full_name !== "string" && user.full_name !== null) ||
    typeof value.role_key !== "string" || typeof value.assigned_by !== "string" || typeof value.assigned_at !== "string" ||
    (value.revoked_at !== null && typeof value.revoked_at !== "string") || typeof value.active !== "boolean" ||
    typeof value.effective !== "boolean" || (value.has_conflict !== null && typeof value.has_conflict !== "boolean") ||
    (value.latest_declared_at !== null && typeof value.latest_declared_at !== "string")
  ) return null;
  return {
    id: value.id,
    user: { id: user.id, username: user.username, full_name: user.full_name },
    role_key: value.role_key,
    laboratory,
    active: value.active,
    effective: value.effective,
    has_conflict: value.has_conflict,
    assigned_at: value.assigned_at,
    revoked_at: value.revoked_at,
    latest_declared_at: value.latest_declared_at,
  };
}

function normalizeInvite(value: unknown): ProcessParticipantInvite | null {
  if (!isRecord(value) || !isRecord(value.process)) return null;
  const process = value.process;
  const laboratory = value.laboratory === null ? null : normalizeLaboratoryRef(value.laboratory);
  if (!laboratory && value.laboratory !== null) return null;
  if (
    typeof value.id !== "string" || typeof process.id !== "string" || typeof process.code !== "string" || typeof process.title !== "string" || typeof value.role_key !== "string" ||
    typeof value.email !== "string" || typeof value.channel !== "string" ||
    (value.status !== "pending" && value.status !== "accepted" && value.status !== "revoked") ||
    typeof value.expired !== "boolean" || typeof value.expires_at !== "string" ||
    typeof value.created_by !== "string" || typeof value.created_at !== "string" ||
    (value.accepted_at !== null && typeof value.accepted_at !== "string") ||
    (value.accepted_by !== null && typeof value.accepted_by !== "string") ||
    (value.revoked_at !== null && typeof value.revoked_at !== "string") ||
    (value.revoked_by !== null && typeof value.revoked_by !== "string") ||
    (value.delivery !== undefined && value.delivery !== null && !isRecord(value.delivery))
  ) return null;
  return {
    id: value.id,
    role_key: value.role_key,
    laboratory,
    email: value.email,
    channel: value.channel === "link" ? "link" : "email",
    status: value.status,
    expired: value.expired,
    expires_at: value.expires_at,
    created_at: value.created_at,
    accepted_at: value.accepted_at,
    accepted_by: value.accepted_by,
    revoked_at: value.revoked_at,
    delivery: isRecord(value.delivery) &&
      (value.delivery.status === "pending" || value.delivery.status === "sent" || value.delivery.status === "failed" || value.delivery.status === "cancelled")
      ? { status: value.delivery.status, sent_at: typeof value.delivery.sent_at === "string" ? value.delivery.sent_at : null }
      : null,
  };
}

function normalizeCreatedInvite(value: unknown): ProcessCompositionInviteCreated | null {
  if (!isRecord(value) || typeof value.token !== "string") return null;
  const invite = normalizeInvite(value);
  return invite ? { ...invite, token: value.token } : null;
}

function normalizeLaboratory(value: unknown): ProcessLaboratory | null {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" || typeof value.active !== "boolean") return null;
  const institution = normalizeInstitutionRef(value.institution);
  return institution ? { id: value.id, name: value.name, active: value.active, institution } : null;
}

function normalizeLaboratoryRef(value: unknown): ProcessLaboratory | null {
  return normalizeLaboratory(value);
}

function normalizeInstitutionRef(value: unknown) {
  if (!isRecord(value) || typeof value.id !== "string" || typeof value.name !== "string" || typeof value.active !== "boolean") return null;
  return { id: value.id, name: value.name, active: value.active };
}

function authHeaders(accessToken: string) {
  return { Cookie: `access_token=${accessToken}` };
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getServiceError(error: Error): ServiceResult<never> {
  if (!isAxiosError(error)) return { ok: false };
  const data = error.response?.data;
  const detail = isRecord(data) && isRecord(data.detail) ? data.detail : isRecord(data) ? data : null;
  return {
    ok: false,
    status: error.response?.status,
    ...(detail && typeof detail.code === "string" ? { code: detail.code } : {}),
    ...(detail && typeof detail.message === "string" ? { message: detail.message } : {}),
  };
}
