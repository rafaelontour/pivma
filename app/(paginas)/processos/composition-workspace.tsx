"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, LoaderCircle, Mail, MailPlus, RefreshCw, ShieldAlert, UserRoundX } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getLocalizedApiError } from "@/i18n/errors";
import type {
  ProcessCompositionIndexItem,
  ProcessCompositionIndexState,
  ProcessCompositionInviteFormProps,
  ProcessCompositionParticipantListProps,
  ProcessCompositionInviteInput,
  ProcessCompositionRoleCardProps,
  CompositionProcessCardProps,
  CompositionErrorProps,
  ProcessCompositionSnapshot,
  ProcessCompositionState,
  ProcessCompositionWorkspaceProps,
  ProcessParticipant,
  ProcessParticipantUiAction,
  ProcessParticipantRole,
  ProcessParticipantAssignmentInput,
  ProcessCompositionUserOption,
} from "@/types/ParticipacaoProcesso";
import type { ApiRecord } from "@/types/Servico";
import type { UserList } from "@/types/Usuario";

const ASSIGNMENT_ROLE_BY_TASK = {
  assign_group_manager: "group_manager",
  assign_sponsor: "sponsor",
  assign_sample_selection_group: "sample_selection_group",
  assign_lead_laboratory: "lead_laboratory",
  assign_participating_laboratory: "participating_laboratory",
  assign_statistician: "statistician",
  assign_collaborator: "collaborator",
  assign_adhoc_evaluator: "adhoc_evaluator",
} as const satisfies Partial<Record<string, ProcessParticipantRole>>;

export function CompositionWorkspace({ processId, view = "composition" }: ProcessCompositionWorkspaceProps) {
  const { i18n, t } = useTranslation();
  const [indexState, setIndexState] = useState<ProcessCompositionIndexState>({ kind: "loading" });
  const [compositionState, setCompositionState] = useState<ProcessCompositionState>({ kind: "loading" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState<ProcessParticipant | null>(null);
  const [activeCompositionTab, setActiveCompositionTab] = useState("");
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [confirmedAssignmentRoles, setConfirmedAssignmentRoles] = useState<ProcessParticipantRole[]>([]);
  const isSubmittingRef = useRef(false);
  const participantTriggerRef = useRef<HTMLElement | null>(null);

  function openParticipant(participant: ProcessParticipant) {
    participantTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedParticipant(participant);
  }

  function closeParticipant() {
    setSelectedParticipant(null);
    window.setTimeout(() => participantTriggerRef.current?.focus(), 0);
  }

  const refresh = useCallback(async (preserve = false) => {
    if (!processId) {
      setIndexState({ kind: "loading" });
      try {
        const response = await fetch("/api/composition", { cache: "no-store" });
        const payload = await response.json().catch(() => null) as unknown;
        if (!response.ok || !isIndex(payload)) {
          setIndexState({ kind: "error", message: getLocalizedApiError(payload, t("participantComposition.errors.load"), t) });
          return false;
        }
        setIndexState({ kind: "ready", items: payload });
        return true;
      } catch {
        setIndexState({ kind: "error", message: t("participantComposition.errors.connection") });
        return false;
      }
    }

    setCompositionState((current) => preserve && current.kind === "ready"
      ? { ...current, isRefreshing: true }
      : { kind: "loading" });
    try {
      const response = await fetch(`/api/processes/${processId}/composition`, { cache: "no-store" });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok || !isSnapshot(payload)) {
        const message = getLocalizedApiError(payload, t("participantComposition.errors.load"), t);
        setCompositionState((current) => preserve && current.kind === "ready"
          ? { ...current, isRefreshing: false, isStale: true }
          : { kind: "error", message });
        return false;
      }
      setCompositionState({ kind: "ready", snapshot: payload, isRefreshing: false, isStale: false });
      return true;
    } catch {
      setCompositionState((current) => preserve && current.kind === "ready"
        ? { ...current, isRefreshing: false, isStale: true }
        : { kind: "error", message: t("participantComposition.errors.connection") });
      return false;
    }
  }, [processId, t]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timeout);
  }, [refresh]);

  useEffect(() => {
    if (!selectedParticipant) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeParticipant();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedParticipant]);

  useEffect(() => {
    if (!isStageModalOpen && !selectedParticipant) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isStageModalOpen, selectedParticipant]);

  async function invite(input: ProcessCompositionInviteInput) {
    if (!processId || isSubmittingRef.current) return false;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/processes/${processId}/composition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) {
        if (response.status === 409) await refresh(true);
        toast.error(getLocalizedApiError(payload, t("participantComposition.errors.invite"), t));
        return false;
      }

      if (input.channel === "link" && isRecord(payload) && typeof payload.token === "string") {
        const inviteUrl = `${window.location.origin}/convites/${encodeURIComponent(payload.token)}`;
        try {
          await navigator.clipboard.writeText(inviteUrl);
          toast.success(t("participantComposition.success.linkCopied"));
        } catch {
          window.prompt(t("participantComposition.actions.copyLink"), inviteUrl);
        }
      }

      const reconciled = await refresh(true);
      if (input.channel !== "link") toast.success(reconciled
        ? t("participantComposition.success.invite")
        : t("participantComposition.errors.reconciliation"));
      return true;
    } catch {
      toast.error(t("participantComposition.errors.connection"));
      return false;
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function assignExisting(input: ProcessParticipantAssignmentInput) {
    if (!processId || isSubmittingRef.current) return false;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      const response = await fetch(`/api/processes/${processId}/participants`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("participantComposition.errors.assign"), t)); return false; }
      const reconciled = await refresh(true);
      toast.success(t("participantComposition.success.assigned"));
      if (!reconciled) toast.error(t("participantComposition.errors.reconciliation"));
      return true;
    } catch { toast.error(t("participantComposition.errors.connection")); return false; }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  }

  async function participantAction(action: ProcessParticipantUiAction, id: string) {
    if (!processId || isSubmittingRef.current) return;
    const confirmation = action === "revoke-assignment" ? t("participantComposition.confirm.revokeAssignment")
      : action === "revoke-invite" ? t("participantComposition.confirm.revokeInvite")
        : action === "resend-invite" ? t("participantComposition.confirm.resendInvite") : "";
    if (confirmation && !window.confirm(confirmation)) return;
    const justification = action === "conflict" ? window.prompt(t("participantComposition.fields.conflictJustification"))?.trim() : undefined;
    if (action === "conflict" && !justification) return;
    const url = action === "resend-invite" ? `/api/processes/${processId}/participants/invites/${id}/resend`
      : action === "revoke-invite" ? `/api/processes/${processId}/participants/invites/${id}/revoke`
        : action === "revoke-assignment" ? `/api/processes/${processId}/participants/${id}`
          : `/api/processes/${processId}/participants/${id}/conflicts`;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      const response = await fetch(url, { method: action === "revoke-assignment" ? "DELETE" : "POST", ...(action === "conflict" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ has_conflict: true, justification }) } : {}) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("participantComposition.errors.action"), t)); return; }
      const reconciled = await refresh(true);
      toast.success(t(`participantComposition.success.${action}`));
      if (!reconciled) toast.error(t("participantComposition.errors.reconciliation"));
    } catch { toast.error(t("participantComposition.errors.connection")); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  }

  async function completeRole(role: ProcessParticipantRole) {
    if (!processId || isSubmittingRef.current || !window.confirm(t("participantComposition.confirm.completeRole", { role: t(`participantComposition.roleLabels.${role}`, { defaultValue: role }) }))) return;
    isSubmittingRef.current = true; setIsSubmitting(true);
    try {
      const response = await fetch(`/api/processes/${processId}/participants/roles/${role}/complete`, { method: "POST" });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("participantComposition.errors.action"), t)); return; }
      await refresh(true);
      setConfirmedAssignmentRoles((current) => current.includes(role) ? current : [...current, role]);
      toast.success(t("participantComposition.success.roleCompleted"));
    } catch { toast.error(t("participantComposition.errors.connection")); }
    finally { isSubmittingRef.current = false; setIsSubmitting(false); }
  }

  if (!processId) {
    if (indexState.kind === "loading") return <CompositionLoading />;
    if (indexState.kind === "error") return <CompositionError message={indexState.message} onRetry={() => void refresh()} />;
    if (indexState.items.length === 0) return <EmptyCompositionIndex view={view} />;
    return (
      <section aria-label={t("participantComposition.index.title")} className="flex min-h-0 flex-1 flex-col gap-4 py-6">
        <div className="grid min-h-0 flex-1 content-start gap-4 overflow-y-auto overscroll-contain pr-2">
          {indexState.items.map((item) => (
            <CompositionProcessCard item={item} key={item.process.id} locale={i18n.resolvedLanguage} view={view} />
          ))}
        </div>
      </section>
    );
  }

  if (compositionState.kind === "loading") return <CompositionLoading />;
  if (compositionState.kind === "error") return <CompositionError message={compositionState.message} onRetry={() => void refresh()} />;

  const snapshot = compositionState.snapshot;
  const canAssignSponsor = snapshot.capabilities.canAssignSponsor;
  const canAssignGroupManager = snapshot.capabilities.canAssignGroupManager;
  const stageTasks = snapshot.tasks.filter((task) =>
    (task.activity_key in ASSIGNMENT_ROLE_BY_TASK && task.activity_key !== "assign_lead_laboratory") ||
    (task.phase.order >= 2 && !task.activity_key.startsWith("assign_")),
  );
  const selectedStageId = stageTasks.some((task) => task.id === activeCompositionTab)
    ? activeCompositionTab
    : stageTasks.find((task) => task.activity_key === "assign_group_manager")?.id ?? stageTasks[0]?.id ?? "";

  return (
    <div className="grid gap-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-wide text-teal-700">{snapshot.process.code}</p>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{snapshot.process.title}</h2>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500" href="/processos/composicao">{t("participantComposition.actions.backToList")}</Link>
          <button aria-label={t("participantComposition.actions.refresh")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60" disabled={compositionState.isRefreshing} onClick={() => void refresh(true)} type="button">
            {compositionState.isRefreshing ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <RefreshCw aria-hidden="true" className="size-4" />}
            {t("participantComposition.actions.refresh")}
          </button>
        </div>
      </div>

      {compositionState.isStale && <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="status">{t("participantComposition.errors.stale")}</p>}

      <section aria-label={t("participantComposition.timeline.title")} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {stageTasks.map((task) => {
            const role = ASSIGNMENT_ROLE_BY_TASK[task.activity_key as keyof typeof ASSIGNMENT_ROLE_BY_TASK];
            const hasPendingInvites = role ? snapshot.invites.some((invite) => isInviteAwaitingAssignment(invite, snapshot.participants, role)) : false;
            const hasActiveParticipants = role ? snapshot.participants.some((participant) => participant.role_key === role && participant.active) : false;
            const done = role
              ? role === "group_manager"
                ? confirmedAssignmentRoles.includes(role)
                : task.status === "COMPLETED" && hasActiveParticipants && !hasPendingInvites
              : task.status === "COMPLETED";
            const current = task.can_act && task.status === "READY";
            const hasAssignment = hasActiveParticipants || hasPendingInvites;
            const label = role
              ? t(`participantComposition.roles.${role}.title`)
              : task.activity_key === "sample_definition"
                ? t("participantComposition.operationalTasks.sampleDefinition")
                : task.activity_key === "statistical_plan"
                  ? t("participantComposition.operationalTasks.statisticalPlan")
                  : task.title;
            const description = role
              ? t(`participantComposition.roles.${role}.description`)
              : task.activity_key === "sample_definition"
                ? t("participantComposition.operationalTasks.sampleDefinitionDescription")
                : task.activity_key === "statistical_plan"
                  ? t("participantComposition.operationalTasks.statisticalPlanDescription")
                  : "";
            const status = done ? "participantComposition.timeline.done"
              : !hasAssignment ? "participantComposition.timeline.toDefine"
                : hasPendingInvites ? "participantComposition.timeline.pendingInvites"
                  : current ? "participantComposition.timeline.current" : "participantComposition.timeline.waiting";
            return <button
              aria-label={t("participantComposition.timeline.openStage", { stage: label, status: t(status) })}
              className={`rounded-2xl border p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${done ? "border-emerald-300 bg-emerald-50/60" : current || hasPendingInvites ? "border-teal-300 bg-white" : "border-slate-200 bg-white"}`}
              id={`composition-card-${task.id}`}
              key={`${task.id}-${task.activity_run_number}`}
              onClick={() => { setActiveCompositionTab(task.id); setIsStageModalOpen(true); }}
              type="button"
            >
              <span className="block text-lg font-bold text-slate-900">{label}</span>
              {description && <span className="mt-2 block text-sm leading-5 text-slate-600">{description}</span>}
              <span className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${done ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300" : !hasAssignment ? "bg-slate-100 text-slate-700" : hasPendingInvites ? "bg-amber-100 text-amber-950 ring-1 ring-amber-300" : current ? "bg-teal-100 text-teal-900" : "bg-slate-100 text-slate-700"}`}>{t(status)}</span>
            </button>;
          })}
      </section>
      {isStageModalOpen && stageTasks.filter((task) => task.id === selectedStageId).map((task) => {
            const role = ASSIGNMENT_ROLE_BY_TASK[task.activity_key as keyof typeof ASSIGNMENT_ROLE_BY_TASK];
            const hasPendingInvites = role ? snapshot.invites.some((invite) => isInviteAwaitingAssignment(invite, snapshot.participants, role)) : false;
            const done = role
              ? role === "group_manager"
                ? confirmedAssignmentRoles.includes(role)
                : task.status === "COMPLETED" && snapshot.participants.some((participant) => participant.role_key === role && participant.active) && !hasPendingInvites
              : task.status === "COMPLETED";
            const roleCanAssign = role === "sponsor" ? canAssignSponsor
              : role === "group_manager" ? canAssignGroupManager
                : Boolean(snapshot.capabilities.canManageParticipants || snapshot.capabilities.canAssignLaboratories);
            const canMaintainCompletedRole = task.status === "COMPLETED" && snapshot.capabilities.canCompleteRoles === true;
            const canEditRole = Boolean(task.status === "READY" && task.can_act && roleCanAssign) || canMaintainCompletedRole;
            return <div className="fixed inset-0 z-40 grid place-items-center overflow-hidden bg-slate-950/50 p-4" key={`modal-${task.id}`} onMouseDown={(event) => { if (event.target === event.currentTarget) setIsStageModalOpen(false); }}>
            <section
              aria-labelledby={`composition-modal-title-${task.id}`}
              aria-modal="true"
              className="grid h-auto max-h-[calc(100dvh-1rem)] w-[95vw] max-w-none grid-rows-[auto_minmax(0,1fr)] gap-5 overflow-visible rounded-2xl bg-slate-50 p-5 text-base shadow-xl sm:w-[85vw] sm:gap-6 sm:p-7 lg:w-[85vw] lg:p-8"
              role="dialog"
              onKeyDown={(event) => { if (event.key === "Escape") setIsStageModalOpen(false); }}
            >
              <header className="flex items-center justify-between gap-4"><h2 className="text-2xl font-bold text-slate-900 sm:text-3xl" id={`composition-modal-title-${task.id}`}>{role ? t(`participantComposition.roles.${role}.title`) : task.title}</h2><button autoFocus aria-label={t("common.close")} className="min-h-11 shrink-0 rounded-lg border border-slate-300 bg-white px-5 text-base font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600" onClick={() => setIsStageModalOpen(false)} type="button">{t("common.close")}</button></header>
              <div className="grid min-h-0 content-start gap-3 overflow-visible lg:grid-rows-[auto_minmax(0,1fr)]">
              {role ? (
                <>
                  <p className={`w-fit rounded-full px-3 py-1.5 text-sm font-extrabold uppercase tracking-wide ring-1 ${done ? "bg-emerald-100 text-emerald-950 ring-emerald-300" : hasPendingInvites ? "bg-amber-100 text-amber-950 ring-amber-300" : task.status === "CANCELLED" ? "bg-slate-100 text-slate-700 ring-slate-300" : task.can_act ? "bg-teal-100 text-teal-950 ring-teal-300" : "bg-slate-100 text-slate-700 ring-slate-300"}`}>
                    {t(`participantComposition.timeline.${done ? "done" : hasPendingInvites ? "pendingInvites" : task.status === "CANCELLED" ? "cancelled" : task.can_act ? "current" : "waiting"}`)}
                  </p>
                  <CompositionRoleCard
                    description={t(`participantComposition.roles.${role}.description`)}
                    invites={snapshot.invites}
                    laboratories={snapshot.laboratories}
                    onSubmit={invite}
                    participants={snapshot.participants}
                    role={role}
                    showForm={canEditRole}
                    canCompleteRole={Boolean(role === "group_manager" ? task.status !== "CANCELLED" && roleCanAssign && !confirmedAssignmentRoles.includes(role) : task.status === "READY" && task.can_act)}
                    title={t(`participantComposition.roles.${role}.title`)}
                    busy={isSubmitting}
                    onAssign={assignExisting}
                    onParticipantAction={participantAction}
                    onCompleteRole={completeRole}
                    canManage={Boolean(roleCanAssign || snapshot.capabilities.canManageParticipants || snapshot.capabilities.canAssignLaboratories)}
                    onViewParticipant={openParticipant}
                  />
                </>
              ) : (
                <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <h3 className="font-bold text-slate-900">{task.activity_key === "sample_definition" ? t("participantComposition.operationalTasks.sampleDefinition") : task.activity_key === "statistical_plan" ? t("participantComposition.operationalTasks.statisticalPlan") : task.title}</h3>
                  <p className="text-sm text-slate-600">{t(`participantComposition.timeline.${task.status === "COMPLETED" ? "done" : task.status === "CANCELLED" ? "cancelled" : task.can_act ? "current" : "waiting"}`)} · {t(`participantComposition.roleLabels.${task.assigned_role ?? ""}`, { defaultValue: task.assigned_role ?? "" })}</p>
                  {task.activity_key === "sample_definition" && <Link className="w-fit text-sm font-semibold text-teal-800 underline" href={`/processos/${processId}/amostras`}>{t("participantComposition.operationalTasks.openSamples")}</Link>}
                </div>
              )}
              </div>
            </section></div>;
          })}

      {selectedParticipant && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeParticipant(); }}><section aria-labelledby="participant-profile-title" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" role="dialog"><h3 className="text-lg font-bold text-slate-900" id="participant-profile-title">{selectedParticipant.user.full_name || selectedParticipant.user.username}</h3><dl className="mt-4 grid gap-3 text-sm"><div><dt className="font-semibold text-slate-500">{t("participantComposition.profile.role")}</dt><dd className="mt-1 text-slate-900">{t(`participantComposition.roleLabels.${selectedParticipant.role_key}`, { defaultValue: selectedParticipant.role_key })}</dd></div><div><dt className="font-semibold text-slate-500">{t("participantComposition.profile.assignedAt")}</dt><dd className="mt-1 text-slate-900">{new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeStyle: "short" }).format(new Date(selectedParticipant.assigned_at))}</dd></div></dl><button autoFocus className="mt-6 min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white" onClick={closeParticipant} type="button">{t("common.close")}</button></section></div>}

      {!canAssignSponsor && !canAssignGroupManager && !snapshot.capabilities.canAssignLaboratories && (
        <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600" role="status">{t("participantComposition.readOnly")}</p>
      )}

    </div>
  );
}

function CompositionRoleCard({ title, description, role, participants, invites, laboratories, showForm, canCompleteRole, busy, onSubmit, onAssign, canManage, onParticipantAction, onCompleteRole, onViewParticipant }: ProcessCompositionRoleCardProps) {
  const { t } = useTranslation();
  const hasPendingInvite = invites.some((invite) => isInviteAwaitingAssignment(invite, participants, role));
  const hasActiveParticipant = participants.some((participant) => participant.role_key === role && participant.active);
  const canAddAnother = role !== "sponsor" || (!hasActiveParticipant && !hasPendingInvite);
  return (
      <section aria-labelledby={`composition-${role}-title`} className="grid min-h-0 content-start gap-4 overflow-visible rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-6">
        <header className="grid content-start gap-1 lg:col-span-2 lg:max-w-[48%]">
          <h3 className="text-lg font-bold text-slate-900" id={`composition-${role}-title`}>{title}</h3>
          <p className="text-base leading-7 text-slate-600">{description}</p>
        </header>
        {role === "sponsor" && hasPendingInvite && <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 lg:col-span-2" role="status"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800"><Mail aria-hidden="true" className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-wide text-amber-900">{t("participantComposition.status.pending")}</p>{invites.filter((invite) => isInviteAwaitingAssignment(invite, participants, role)).map((invite) => <p className="mt-1 break-all text-sm font-semibold text-slate-900" key={invite.id}>{invite.email}</p>)}<p className="mt-1 text-xs leading-5 text-amber-900">{t("participantComposition.roles.waitingAcceptance")}</p></div></div>}
        <div className="flex min-h-0 flex-col gap-3">
          {role === "group_manager" && <h4 className="text-base font-bold text-slate-900">{t("participantComposition.groupMembers")}</h4>}
          {role === "group_manager" && showForm && <p className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-base leading-6 text-sky-950" role="status">{t("participantComposition.roles.addMembersBeforeComplete")}</p>}
          <div className="min-h-0 lg:flex-1 lg:overflow-y-auto"><ProcessCompositionParticipantList invites={invites} participants={participants} role={role} canManage={canManage} busy={busy} onAction={onParticipantAction} onViewParticipant={onViewParticipant} /></div>
          {canManage && canCompleteRole && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200 bg-teal-50 p-3"><p className="text-sm font-medium text-teal-950">{role === "group_manager" ? t("participantComposition.roles.completeWhenReady") : t("participantComposition.actions.completeRole")}</p><button type="button" disabled={busy || !hasActiveParticipant || hasPendingInvite} onClick={() => void onCompleteRole(role)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"><Check aria-hidden="true" className="size-4" />{role === "group_manager" ? t("participantComposition.actions.completeGroupDefinition") : t("participantComposition.actions.completeRole")}</button></div>}
        </div>
        <div className="relative z-50 grid content-start gap-3 overflow-visible lg:-mt-24 lg:min-h-0">
          {showForm && canAddAnother ? <ProcessCompositionInviteForm busy={busy} invites={invites} laboratories={laboratories} onSubmit={onSubmit} onAssign={onAssign} role={role} /> : hasPendingInvite ? <p className="text-sm font-medium text-amber-900" role="status">{t("participantComposition.roles.waitingAcceptance")}</p> : role === "sponsor" && hasActiveParticipant ? <p className="text-sm text-slate-600" role="status">{t("participantComposition.roles.singleSponsor")}</p> : null}
        </div>
    </section>
  );
}

function ProcessCompositionParticipantList({ participants, invites, role, canManage, busy, onAction, onViewParticipant }: ProcessCompositionParticipantListProps) {
  const { t } = useTranslation();
  const assigned = participants.filter((participant) => participant.role_key === role && participant.active);
  const roleInvites = invites.filter((invite) => invite.role_key === role && !hasActiveInviteAssignment(invite, assigned));
  if (assigned.length === 0 && roleInvites.length === 0) return <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{t("participantComposition.roles.unassigned")}</p>;
  return (
    <ul className={`mt-3 grid gap-2 ${role === "group_manager" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
      {assigned.map((participant) => <li className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border p-2 ${role === "sponsor" ? "border-teal-200 bg-gradient-to-r from-teal-50 to-white" : "border-emerald-200 bg-emerald-50"}`} key={participant.id}><div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1"><button type="button" onClick={() => onViewParticipant(participant)} className="block max-w-full truncate text-left text-sm font-semibold text-slate-950 decoration-teal-700 underline-offset-4 hover:underline" title={participant.user.full_name || participant.user.username}>{participant.user.full_name || participant.user.username}</button><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ${participant.effective ? "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-300" : "bg-slate-100 text-slate-700 ring-1 ring-slate-300"}`}>{participant.effective ? t("participantComposition.status.effective") : t("participantComposition.status.notEffective")}</span>{participant.has_conflict === true && <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-bold text-rose-900 ring-1 ring-rose-300"><ShieldAlert aria-hidden="true" className="size-3" />{t("participantComposition.status.conflict")}</span>}</div>{canManage && <div className="flex justify-end gap-1.5"><button type="button" title={t("participantComposition.actions.declareConflict")} aria-label={t("participantComposition.actions.declareConflict")} disabled={busy || participant.has_conflict === true} onClick={() => void onAction("conflict", participant.id)} className="inline-flex size-8 items-center justify-center rounded-lg border border-amber-300 bg-white text-amber-900 shadow-sm transition hover:border-amber-500 hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:cursor-not-allowed disabled:opacity-50"><ShieldAlert aria-hidden="true" className="size-4" /></button><button type="button" title={t("participantComposition.actions.revoke")} aria-label={t("participantComposition.actions.revoke")} disabled={busy} onClick={() => void onAction("revoke-assignment", participant.id)} className="inline-flex size-8 items-center justify-center rounded-lg border border-rose-300 bg-white text-rose-800 shadow-sm transition hover:border-rose-500 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-wait disabled:opacity-50"><UserRoundX aria-hidden="true" className="size-4" /></button></div>}</li>)}
      {roleInvites.map((invite) => <li className={`grid gap-3 rounded-xl border p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center ${role === "sponsor" ? "border-amber-300 bg-amber-50/80" : "border-amber-200 bg-amber-50"}`} key={invite.id}><div className="flex min-w-0 items-start gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-amber-100 text-amber-800"><Mail aria-hidden="true" className="size-4" /></span><div className="min-w-0"><p className="break-all text-sm font-bold text-slate-900">{invite.email}{invite.laboratory ? ` · ${invite.laboratory.name}` : ""}</p><div className="mt-1 flex flex-wrap items-center gap-2"><span className="rounded-full bg-amber-200 px-2.5 py-1 text-xs font-extrabold text-amber-950">{t(invite.status === "revoked" ? "participantComposition.status.revokedInvite" : invite.expired ? "participantComposition.status.expiredInvite" : "participantComposition.status.pending")}</span>{invite.status === "accepted" && <span className="text-xs font-medium text-slate-600">{t("participantComposition.status.acceptedAwaitingAssignment")}</span>}{invite.delivery && <span className="text-xs font-medium text-slate-600">{t(`participantComposition.delivery.${invite.delivery.status}`)}</span>}</div></div></div>{canManage && invite.status === "pending" && !invite.expired && <div className="flex gap-2 sm:justify-end"><button type="button" disabled={busy} onClick={() => void onAction("resend-invite", invite.id)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50">{t("participantComposition.actions.resend")}</button><button type="button" disabled={busy} onClick={() => void onAction("revoke-invite", invite.id)} className="inline-flex min-h-9 items-center rounded-lg border border-rose-300 bg-white px-3 text-xs font-bold text-rose-800 shadow-sm transition hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50">{t("participantComposition.actions.revoke")}</button></div>}</li>)}
    </ul>
  );
}

function ProcessCompositionInviteForm({ role, laboratories, invites, busy, onSubmit, onAssign }: ProcessCompositionInviteFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState<ProcessCompositionUserOption[]>([]);
  const [isUserResultsOpen, setIsUserResultsOpen] = useState(true);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchFailed, setUserSearchFailed] = useState(false);
  const [assignmentMode, setAssignmentMode] = useState<"invite" | "link" | "assign">("assign");
  const [laboratoryId, setLaboratoryId] = useState("");
  const normalizedEmail = email.trim();
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) && normalizedEmail.length <= 254;
  const needsLaboratory = role === "participating_laboratory" || role === "lead_laboratory";
  const laboratoryValid = !needsLaboratory || laboratories.some((laboratory) => laboratory.id === laboratoryId && laboratory.active);
  const duplicateInvite = invites.some((invite) => (invite.status === "accepted" || (invite.status === "pending" && !invite.expired)) && invite.role_key === role && invite.email.toLocaleLowerCase("en-US") === normalizedEmail.toLocaleLowerCase("en-US") && (!needsLaboratory || invite.laboratory?.id === laboratoryId));
  const valid = emailValid && laboratoryValid && !duplicateInvite;
  const userIdValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId.trim());

  useEffect(() => {
    const search = userSearch.trim();
    if (assignmentMode !== "assign" || search.length < 2) return;
    const controller = new AbortController();
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      setIsSearchingUsers(true);
      setUserSearchFailed(false);
      const requestTimeout = window.setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 15_000);
      const query = new URLSearchParams({ search, active: "true", offset: "0", limit: "100" });
      void fetch(`/api/users?${query}`, { cache: "no-store", signal: controller.signal })
        .then(async (response) => {
          if (!response.ok) throw new Error("USER_SEARCH_FAILED");
          return await response.json() as UserList;
        })
        .then((payload) => {
          if (controller.signal.aborted) return;
          setUsers(Array.isArray(payload?.items) ? payload.items.map(({ id, username, full_name, email }) => ({ id, username, full_name, email })) : []);
        })
        .catch(() => {
          if (!controller.signal.aborted || timedOut) {
            setUsers([]);
            setUserSearchFailed(true);
          }
        })
        .finally(() => {
          window.clearTimeout(requestTimeout);
          if (!controller.signal.aborted || timedOut) setIsSearchingUsers(false);
        });
    }, 250);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
      setIsSearchingUsers(false);
    };
  }, [assignmentMode, userSearch]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (assignmentMode === "assign") {
      if (!userIdValid || !laboratoryValid) return;
      const input: ProcessParticipantAssignmentInput = { role_key: role, user_id: userId.trim(), ...(needsLaboratory ? { laboratory_id: laboratoryId } : {}) };
      if (await onAssign(input)) {
        setUserId("");
        setUserSearch("");
        setUsers([]);
        setIsSearchingUsers(false);
        setUserSearchFailed(false);
        setIsUserResultsOpen(true);
        setLaboratoryId("");
      }
      return;
    }
    if (!valid) return;
    const input: ProcessCompositionInviteInput = {
      role_key: role,
      email: normalizedEmail,
      channel: assignmentMode === "link" ? "link" : "email",
      ...(needsLaboratory ? { laboratory_id: laboratoryId } : {}),
    };
    if (await onSubmit(input)) {
      setEmail("");
      setLaboratoryId("");
    }
  }

  return (
    <form className="grid w-full min-w-0 gap-4 rounded-xl bg-slate-50 p-4 sm:p-5" onSubmit={(event) => void submit(event)}>
      <div className={`grid min-w-0 gap-4 ${needsLaboratory ? "md:grid-cols-2" : ""}`}>
          <label className="grid gap-2 text-base font-semibold text-slate-800" htmlFor={`composition-${role}-mode`}>{t("participantComposition.fields.assignmentMode")}
          <select id={`composition-${role}-mode`} value={assignmentMode} onChange={(event) => { setAssignmentMode(event.target.value as "invite" | "link" | "assign"); setUserSearch(""); setUsers([]); setIsSearchingUsers(false); setUserSearchFailed(false); setUserId(""); setIsUserResultsOpen(true); }} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 font-normal focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20"><option value="invite">{t("participantComposition.actions.inviteByEmail")}</option><option value="link">{t("participantComposition.actions.inviteByLink")}</option><option value="assign">{t("participantComposition.actions.assignExisting")}</option></select>
        </label>
        {needsLaboratory && <label className="grid gap-1.5 text-sm font-semibold text-slate-800" htmlFor={`composition-${role}-laboratory`}>{t("participantComposition.fields.laboratory")}
          <select className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-100" disabled={busy || laboratories.length === 0} id={`composition-${role}-laboratory`} onChange={(event) => setLaboratoryId(event.target.value)} required value={laboratoryId}>
            <option value="">{t("participantComposition.fields.selectLaboratory")}</option>
            {laboratories.map((laboratory) => <option key={laboratory.id} value={laboratory.id}>{laboratory.institution.name} · {laboratory.name}</option>)}
          </select>
        </label>}
      </div>
      <div className="grid min-w-0 gap-3 overflow-visible">
        {assignmentMode === "assign" ? <>
          <div className="relative">
        <label className="grid gap-2 text-base font-semibold text-slate-800" htmlFor={`composition-${role}-user-search`}>{t("participantComposition.fields.searchUser")}
            <input id={`composition-${role}-user-search`} value={userSearch} onChange={(event) => { setUserSearch(event.target.value); setUserId(""); setUsers([]); setIsSearchingUsers(false); setUserSearchFailed(false); setIsUserResultsOpen(event.target.value.trim().length >= 2); }} disabled={busy} className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" autoComplete="off" aria-controls={`composition-${role}-user-results`} />
          </label>
          {userSearch.trim().length >= 2 && isUserResultsOpen && <div className="absolute inset-x-0 top-full z-[100] mt-1 max-h-80 overscroll-contain overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-2xl" id={`composition-${role}-user-results`}>
          {isSearchingUsers && <p className="px-3 py-4 text-center text-sm text-slate-500" role="status">{t("participantComposition.fields.searchingUsers")}</p>}
          {userSearchFailed && <p className="px-3 py-4 text-center text-sm text-rose-700" role="status">{t("participantComposition.fields.userSearchFailed")}</p>}
          {!isSearchingUsers && !userSearchFailed && users.length === 0 && <p className="px-3 py-4 text-center text-sm text-slate-600" role="status">{t("participantComposition.fields.noUsersFound")}</p>}
          {users.length > 0 && <ul className="grid gap-2" aria-label={t("participantComposition.fields.selectUser")}>
            {users.map((user) => {
              const displayName = user.full_name || user.username;
              const initials = displayName.trim().slice(0, 1).toLocaleUpperCase();
              const selected = userId === user.id;
              return <li key={user.id}><button type="button" aria-pressed={selected} onClick={() => setUserId(user.id)} onDoubleClick={() => { setUserId(user.id); setUserSearch(displayName); setIsUserResultsOpen(false); }} disabled={busy} className={`flex min-h-[4.5rem] w-full items-center gap-3 rounded-xl border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${selected ? "border-teal-600 bg-teal-50 shadow-sm" : "border-slate-200 bg-white hover:border-teal-300 hover:bg-teal-50/50"}`}>
                <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${selected ? "bg-teal-700 text-white" : "bg-teal-100 text-teal-800"}`}>{initials}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-900">{displayName}</span><span className="mt-0.5 block truncate text-xs font-medium text-teal-800">@{user.username}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{user.email}</span></span>
                {selected && <Check aria-hidden="true" className="size-5 shrink-0 text-teal-700" />}
              </button></li>;
            })}
          </ul>}
          </div>}
          </div>
        </> : <label className="grid gap-1.5 text-sm font-semibold text-slate-800" htmlFor={`composition-${role}-email`}>{t("participantComposition.fields.email")}
          <input autoComplete="email" className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 disabled:bg-slate-100" disabled={busy} id={`composition-${role}-email`} maxLength={254} onChange={(event) => setEmail(event.target.value)} placeholder={t("participantComposition.fields.emailPlaceholder")} required type="email" value={email} />
        </label>}
        {duplicateInvite && <p className="text-xs font-medium text-amber-900" role="status">{t("participantComposition.errors.duplicate")}</p>}
        <button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white outline-none transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" disabled={busy || (assignmentMode === "assign" ? !userIdValid || !laboratoryValid : !valid)} type="submit">
          {busy ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <MailPlus aria-hidden="true" className="size-4" />}
          {busy ? t("participantComposition.actions.sending") : assignmentMode === "assign" ? t("participantComposition.actions.assign") : t("participantComposition.actions.invite")}
        </button>
      </div>
    </form>
  );
}

function CompositionProcessCard({ item, locale, view }: CompositionProcessCardProps) {
  const { t } = useTranslation();
  const firstTask = item.actionableTasks[0];
  const nextStep = firstTask ? t("participantComposition.index.nextTask", { task: firstTask.title }) : t("participantComposition.index.noPendingTask");
  const formattedDate = item.process.started_at ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(item.process.started_at)) : t("dynamicForm.notProvided");
  return (
    <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="min-w-0 flex-1"><p className="font-mono text-xs font-bold uppercase tracking-wide text-teal-700">{item.process.code}</p><h2 className="mt-1 break-words text-lg font-bold text-slate-900">{item.process.title}</h2><p className="mt-2 text-sm text-slate-700"><span className="font-semibold">{t("participantComposition.index.proponent")}:</span> {item.proponent?.full_name || item.proponent?.username || t("participantComposition.index.proponentNotIdentified")}</p><p className="mt-1 text-xs text-slate-500">{t("participantComposition.index.startedAt", { date: formattedDate })}</p>{view === "group" ? <div className="mt-4"><p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{t("participantComposition.index.groupMembers", { count: item.groupMembers.length })}</p>{item.groupMembers.length > 0 ? <ul className="mt-2 flex flex-wrap gap-2">{item.groupMembers.map((member) => <li className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900" key={member.id}><span className="grid size-6 place-items-center rounded-full bg-teal-700 text-[0.65rem] font-bold text-white">{(member.user.full_name || member.user.username).trim().charAt(0).toLocaleUpperCase()}</span>{member.user.full_name || member.user.username}</li>)}</ul> : <p className="mt-2 text-sm text-slate-600">{t("participantComposition.index.noGroupMembers")}</p>}</div> : <p className="mt-2 text-sm text-slate-600">{nextStep}</p>}</div>
      <Link className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white outline-none hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2" href={view === "group" ? `/grupo/${item.process.id}` : `/processos/${item.process.id}/composicao`}>{t(view === "group" ? "participantComposition.actions.viewProcess" : "participantComposition.actions.open")}<ArrowRight aria-hidden="true" className="size-4" /></Link>
    </article>
  );
}

function CompositionLoading() {
  const { t } = useTranslation();
  return <div aria-live="polite" className="flex min-h-40 items-center justify-center gap-3 py-12 text-sm font-medium text-slate-600"><LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />{t("participantComposition.loading")}</div>;
}

function CompositionError({ message, onRetry }: CompositionErrorProps) {
  const { t } = useTranslation();
  return <div className="my-6 rounded-xl border border-rose-200 bg-rose-50 p-5" role="alert"><p className="text-sm text-rose-900">{message}</p><button className="mt-3 rounded-lg bg-rose-800 px-3 py-2 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2" onClick={onRetry} type="button">{t("common.retry")}</button></div>;
}

function EmptyCompositionIndex({ view }: Pick<ProcessCompositionWorkspaceProps, "view">) {
  const { t } = useTranslation();
  const prefix = view === "group" ? "participantComposition.index.emptyGroup" : "participantComposition.index.empty";
  return <div className="my-6 rounded-xl border border-slate-200 bg-white p-8 text-center"><h2 className="text-lg font-bold text-slate-900">{t(`${prefix}Title`)}</h2><p className="mt-2 text-sm text-slate-600">{t(`${prefix}Description`)}</p></div>;
}

function isIndex(value: unknown): value is ProcessCompositionIndexItem[] {
  return Array.isArray(value) && value.every((item) => isRecord(item) && isProcess(item.process) && (item.proponent === null || isCompositionUser(item.proponent)) && Array.isArray(item.groupMembers) && item.groupMembers.every(isIndexParticipant) && Array.isArray(item.roles) && item.roles.every((role) => typeof role === "string") && Array.isArray(item.actionableTasks));
}

function isIndexParticipant(value: unknown): value is ProcessParticipant {
  return isRecord(value) && typeof value.id === "string" && isCompositionUser(value.user) && typeof value.role_key === "string" && typeof value.active === "boolean";
}

function isSnapshot(value: unknown): value is ProcessCompositionSnapshot {
  return isRecord(value) && isProcess(value.process) && Array.isArray(value.participants) && Array.isArray(value.invites) && Array.isArray(value.tasks) && Array.isArray(value.laboratories) && isRecord(value.capabilities) && typeof value.capabilities.canAssignSponsor === "boolean" && typeof value.capabilities.canAssignGroupManager === "boolean" && typeof value.capabilities.canAssignLaboratories === "boolean";
}

function isProcess(value: unknown) {
  return isRecord(value) && typeof value.id === "string" && typeof value.code === "string" && typeof value.title === "string" && typeof value.status === "string" && typeof value.template_key === "string" && typeof value.version_number === "number";
}

function isCompositionUser(value: unknown) {
  return isRecord(value) && typeof value.id === "string" && typeof value.username === "string" && (typeof value.full_name === "string" || value.full_name === null);
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function hasActiveInviteAssignment(
  invite: ProcessCompositionSnapshot["invites"][number],
  participants: ProcessParticipant[],
) {
  return invite.status === "accepted" && Boolean(invite.accepted_by) && participants.some(
    (participant) => participant.active && participant.role_key === invite.role_key && participant.user.id === invite.accepted_by,
  );
}

function isInviteAwaitingAssignment(
  invite: ProcessCompositionSnapshot["invites"][number],
  participants: ProcessParticipant[],
  role: ProcessParticipantRole,
) {
  if (invite.role_key !== role || invite.status === "revoked" || invite.expired) return false;
  return invite.status === "pending" || !hasActiveInviteAssignment(invite, participants);
}
