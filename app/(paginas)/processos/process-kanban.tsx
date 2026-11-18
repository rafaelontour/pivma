"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import Link from "next/link";
import type { TFunction } from "i18next";
import { toast } from "sonner";
import { useAccessibleDialog } from "@/components/accessible-dialog";
import { getLocalizedApiError } from "@/i18n/errors";
import { TriageWorkspace } from "@/app/(paginas)/triagem/triage-workspace";
import {
  AlertTriangle,
  Eye,
  FileStack,
  LoaderCircle,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import type {
  KanbanMessageProps,
  ProcessAnalysisDialogProps,
  ProcessCardProps,
  ProcessDetailsDialogProps,
  ProcessDetailsState,
  ProcessDetailItemProps,
  ProcessDeletionDialogProps,
  ProcessDeletionState,
  ProcessKanbanColumn,
  ProcessKanbanItem,
  ProcessKanbanState,
  ProcessStagePresentation,
} from "@/types/Kanban";
import type { ProcessInstance, ProcessList } from "@/types/Processo";
import type { ProcessTask, ProcessTaskList } from "@/types/Tarefa";
import type { ApiRecord } from "@/types/Servico";
import type { ProcessCompositionSnapshot } from "@/types/ParticipacaoProcesso";

const PROCESS_PAGE_SIZE = 100;
const PAGE_BATCH_SIZE = 4;
const REVALIDATION_INTERVAL_MS = 30_000;

const STAGE_PRESENTATIONS: readonly ProcessStagePresentation[] = [
  { key: "new", tone: "teal" },
  { key: "review", tone: "amber" },
  { key: "ongoing", tone: "violet" },
  { key: "closed", tone: "slate" },
];

const TERMINAL_PROCESS_STATUSES = new Set(["CLOSED", "CANCELLED", "ARCHIVED"]);

export function ProcessKanban() {
  const { i18n, t } = useTranslation();
  const [state, setState] = useState<ProcessKanbanState>({ kind: "loading" });
  const [details, setDetails] = useState<ProcessDetailsState>({ kind: "closed" });
  const [analysisProcess, setAnalysisProcess] = useState<ProcessInstance | null>(null);
  const [deletion, setDeletion] = useState<ProcessDeletionState>({ kind: "closed" });
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [headerActionsTarget, setHeaderActionsTarget] =
    useState<HTMLElement | null>(null);
  const isRefreshingRef = useRef(false);
  const boardControllerRef = useRef<AbortController | null>(null);
  const detailsControllerRef = useRef<AbortController | null>(null);
  const isDeletingRef = useRef(false);

  useEffect(() => {
    setHeaderActionsTarget(
      document.getElementById("process-page-header-actions"),
    );
  }, []);

  const refreshSnapshot = useCallback(async (preserveSnapshot: boolean) => {
    if (isRefreshingRef.current) {
      if (boardControllerRef.current?.signal.aborted) {
        isRefreshingRef.current = false;
      } else {
        return;
      }
    }

    isRefreshingRef.current = true;
    boardControllerRef.current?.abort();
    const controller = new AbortController();
    boardControllerRef.current = controller;

    setState((current) =>
      preserveSnapshot && current.kind === "ready"
        ? { ...current, isRefreshing: true }
        : { kind: "loading" },
    );

    try {
      const [processes, tasks] = await Promise.all([
        loadAllProcesses(
          controller.signal,
          t("processes.deniedTitle"),
          t("processes.allFailed"),
          t,
        ),
        loadAllTasks(
          controller.signal,
          t("processes.deniedTitle"),
          t("processes.tasksFailed"),
          t,
        ),
      ]);

      if (!controller.signal.aborted) {
        setState({
          kind: "ready",
          processes,
          tasks,
          updatedAt: new Date().toISOString(),
          isRefreshing: false,
          isStale: false,
        });
      }
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setState((current) => {
        if (preserveSnapshot && current.kind === "ready") {
          return { ...current, isRefreshing: false, isStale: true };
        }

        if (error instanceof Error && error.name === "ProcessAccessDenied") {
          return { kind: "denied" };
        }

        return {
          kind: "error",
          message:
            error instanceof Error
              ? error.message
              : t("processes.loadFailed"),
        };
      });
    } finally {
      if (boardControllerRef.current === controller) {
        boardControllerRef.current = null;
        isRefreshingRef.current = false;
      }
    }
  }, [t]);

  useEffect(() => {
    void refreshSnapshot(false);

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshSnapshot(true);
      }
    }, REVALIDATION_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void refreshSnapshot(true);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      boardControllerRef.current?.abort();
      detailsControllerRef.current?.abort();
    };
  }, [refreshSnapshot]);

  useEffect(() => {
    if (details.kind === "closed") {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        detailsControllerRef.current?.abort();
        setDetails({ kind: "closed" });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [details.kind]);

  async function openDetails(process: ProcessInstance) {
    detailsControllerRef.current?.abort();
    const controller = new AbortController();
    detailsControllerRef.current = controller;
    setDetails({ kind: "loading", process });

    try {
      const response = await fetch(`/api/processes/${process.id}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (controller.signal.aborted) {
        return;
      }

      if (!response.ok || !isProcessInstance(payload)) {
        setDetails({
          kind: "error",
          process,
          message: getApiMessage(
            payload,
            t("processes.detailsFailed"),
            t,
          ),
        });
        return;
      }

      let composition: ProcessCompositionSnapshot | null = null;
      try {
        const compositionResponse = await fetch(`/api/processes/${process.id}/composition`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const compositionPayload = await compositionResponse.json().catch(() => null) as unknown;
        if (compositionResponse.ok && isCompositionSnapshot(compositionPayload)) composition = compositionPayload;
      } catch {
        composition = null;
      }
      let structure: ApiRecord | null = null;
      try {
        const structureResponse = await fetch(`/api/processes/${process.id}/structure-approval`, { cache: "no-store", signal: controller.signal });
        const structurePayload = await structureResponse.json().catch(() => null) as unknown;
        if (structureResponse.ok && isRecord(structurePayload)) structure = structurePayload;
      } catch {
        structure = null;
      }
      let operationsPermissions: ApiRecord | null = null;
      try {
        const operationsResponse = await fetch(`/api/processes/${process.id}/operations/access`, { cache: "no-store", signal: controller.signal });
        const operationsPayload = await operationsResponse.json().catch(() => null) as unknown;
        if (operationsResponse.ok && isRecord(operationsPayload) && isRecord(operationsPayload.permissions)) operationsPermissions = operationsPayload.permissions;
      } catch {
        operationsPermissions = null;
      }
      if (!controller.signal.aborted) setDetails({ kind: "ready", process: payload, composition, structure, operationsPermissions });
    } catch {
      if (!controller.signal.aborted) {
        setDetails({
          kind: "error",
          process,
          message: t("processes.detailsFailed"),
        });
      }
    }
  }

  function closeDetails() {
    detailsControllerRef.current?.abort();
    detailsControllerRef.current = null;
    setDetails({ kind: "closed" });
  }

  async function deleteSelectedProcess() {
    if (deletion.kind === "closed" || isDeletingRef.current) return;
    const process = deletion.process;
    isDeletingRef.current = true;
    setDeletion({ kind: "deleting", process });

    try {
      const response = await fetch(`/api/processes/${process.id}`, { method: "DELETE" });
      const payload = response.status === 204
        ? null
        : await response.json().catch(() => null) as unknown;
      if (!response.ok) {
        setDeletion({
          kind: "error",
          process,
          message: getApiMessage(payload, t("processes.deleteFailed"), t),
        });
        return;
      }

      setState((current) => current.kind === "ready"
        ? {
            ...current,
            processes: current.processes.filter((item) => item.id !== process.id),
            tasks: current.tasks.filter((task) => task.process.id !== process.id),
          }
        : current);
      if (details.kind !== "closed" && details.process.id === process.id) closeDetails();
      if (analysisProcess?.id === process.id) setAnalysisProcess(null);
      setDeletion({ kind: "closed" });
      toast.success(t("processes.deleted", { code: process.code }));
    } catch {
      setDeletion({ kind: "error", process, message: t("processes.deleteFailed") });
    } finally {
      isDeletingRef.current = false;
    }
  }

  if (state.kind === "loading") {
    return (
      <KanbanMessage
        description={t("processes.loadingDescription")}
        title={t("processes.loadingTitle")}
      />
    );
  }

  if (state.kind === "denied") {
    return (
      <KanbanMessage
        description={t("processes.deniedDescription")}
        title={t("processes.deniedTitle")}
      />
    );
  }

  if (state.kind === "error") {
    return (
      <KanbanMessage
        actionLabel={t("common.retry")}
        description={state.message}
        onAction={() => void refreshSnapshot(false)}
        title={t("processes.boardFailed")}
      />
    );
  }

  const locale = i18n.resolvedLanguage;
  const items = buildKanbanItems(state.processes, state.tasks);
  const phaseOptions = buildPhaseOptions(items);
  const columns = buildColumns(items, phaseFilter, t, locale);

  return (
    <div className="flex min-h-0 flex-1 flex-col py-6">
      {headerActionsTarget &&
        createPortal(
          <div className="flex flex-col items-end gap-2">
            <div aria-live="polite" className="text-xs text-slate-500">
              {state.isStale ? (
                <span className="inline-flex items-center gap-2 font-semibold text-amber-800">
                  <AlertTriangle aria-hidden="true" className="size-4" />
                  {t("processes.stale")}
                </span>
              ) : (
                <span>
                  {t("processes.lastUpdate", { date: formatDateTime(state.updatedAt, locale) })}
                </span>
              )}
            </div>
            <button
              aria-label={t("processes.refreshBoard")}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-teal-700/20 bg-teal-600/10 px-3 py-1.5 text-[11px] font-bold text-teal-800 shadow-sm outline-none transition hover:border-teal-700 hover:bg-teal-700 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:border-slate-300 disabled:bg-slate-100 disabled:text-slate-500 disabled:shadow-none"
              disabled={state.isRefreshing}
              onClick={() => void refreshSnapshot(true)}
              type="button"
            >
              <RefreshCw
                aria-hidden="true"
                className={`size-3.5 ${state.isRefreshing ? "animate-spin" : ""}`}
              />
              {state.isRefreshing ? t("processes.refreshing") : t("processes.refresh")}
            </button>
          </div>,
          headerActionsTarget,
        )}

      {state.processes.length === 0 && (
        <div
          className="mb-4 rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-4 text-sm text-slate-600"
          role="status"
        >
          {t("processes.emptyBoard")}
        </div>
      )}

      <section
        aria-label={t("processes.boardLabel")}
        className="min-h-0 min-w-0 flex-1 pb-4"
      >
        <div className="grid h-full min-w-0 grid-cols-4 items-stretch gap-3">
          {columns.map((column) => (
            <section
              aria-labelledby={`column-${column.key}`}
              className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/80 shadow-sm"
              key={column.key}
            >
              <header className={`border-t-4 bg-white px-4 py-4 ${getBorderTone(column.tone)}`}>
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2
                      className="break-words text-sm font-bold text-slate-900"
                      id={`column-${column.key}`}
                    >
                      {column.label}
                    </h2>
                    <p className="mt-1 break-words text-xs leading-5 text-slate-500">
                      {column.description}
                    </p>
                  </div>
                  <span
                    aria-label={t("processes.count", { count: column.total })}
                    className={`grid min-w-7 place-items-center rounded-full px-2 py-1 text-xs font-bold ${getBadgeTone(column.tone)}`}
                  >
                    {column.key === "ongoing" && column.items.length !== column.total
                      ? `${column.items.length}/${column.total}`
                      : column.total}
                  </span>
                </div>
                {column.key === "ongoing" && phaseOptions.length > 0 && (
                  <label className="mt-3 block text-xs font-semibold text-slate-700">
                    <span className="sr-only">{t("processes.phaseFilter")}</span>
                    <select
                      aria-label={t("processes.phaseFilter")}
                      className="min-h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-700 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                      onChange={(event) => setPhaseFilter(event.target.value)}
                      value={phaseFilter}
                    >
                      <option value="all">{t("processes.allPhases")}</option>
                      {phaseOptions.map((phase) => (
                        <option key={phase.key} value={phase.key}>
                          {t("processes.phaseNumber", { number: phase.order })}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </header>

              <div className="min-h-32 flex-1 space-y-3 overflow-y-auto p-3">
                {column.items.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-6 text-center text-xs text-slate-500">
                    {column.key === "ongoing" && phaseFilter !== "all"
                      ? t("processes.emptyPhase")
                      : t("processes.emptyColumn")}
                  </p>
                ) : (
                  column.items.map((item) => (
                    <ProcessCard
                      isDeleting={deletion.kind === "deleting" && deletion.process.id === item.process.id}
                      item={item}
                      key={item.process.id}
                      onAnalyze={setAnalysisProcess}
                      onDelete={(process) => setDeletion({ kind: "confirming", process })}
                      onViewDetails={(selectedProcess) =>
                        void openDetails(selectedProcess)
                      }
                    />
                  ))
                )}
              </div>
            </section>
          ))}
        </div>
      </section>

      {details.kind !== "closed" && (
        <ProcessDetailsDialog
          onClose={closeDetails}
          onRetry={() => void openDetails(details.process)}
          state={details}
        />
      )}

      {analysisProcess && (
        <ProcessAnalysisDialog
          onClose={() => setAnalysisProcess(null)}
          onCompleted={() => {
            setAnalysisProcess(null);
            void refreshSnapshot(true);
          }}
          process={analysisProcess}
        />
      )}

      {deletion.kind !== "closed" && (
        <ProcessDeletionDialog
          onClose={() => {
            if (deletion.kind !== "deleting") setDeletion({ kind: "closed" });
          }}
          onConfirm={() => void deleteSelectedProcess()}
          state={deletion}
        />
      )}
    </div>
  );
}

function ProcessCard({ item, isDeleting, onAnalyze, onDelete, onViewDetails }: ProcessCardProps) {
  const { t } = useTranslation();
  const { process } = item;

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-300/30 xl:p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 break-all font-mono text-[11px] font-bold uppercase tracking-wide text-teal-700">
          {process.code}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`max-w-full rounded-md px-2 py-1 text-[10px] font-semibold ${getReviewStateTone(item.reviewState)}`}>
            {t(`processes.reviewStates.${item.reviewState}`)}
          </span>
          <button
            aria-label={t("processes.deleteLabel", { code: process.code, title: process.title })}
            className="grid size-7 shrink-0 place-items-center rounded-md text-rose-600 outline-none transition hover:bg-rose-50 hover:text-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-wait disabled:text-slate-400"
            disabled={isDeleting}
            onClick={() => onDelete(process)}
            title={t("processes.delete")}
            type="button"
          >
            {isDeleting
              ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
              : <Trash2 aria-hidden="true" className="size-3.5" />}
          </button>
        </div>
      </div>
      <h3 className="mt-3 min-w-0 break-words text-sm font-bold leading-5 text-slate-900">
        {process.title}
      </h3>
      <dl className="mt-3 space-y-1 text-xs text-slate-600">
        {item.currentPhase && (
          <div className="flex gap-1.5">
            <dt className="font-semibold">{t("processes.phase")}:</dt>
            <dd>{t("processes.phaseNumber", { number: item.currentPhase.order })}</dd>
          </div>
        )}
        {item.currentTask && (
          <div>
            <dt className="font-semibold">{t("processes.currentActivity")}:</dt>
            <dd className="mt-0.5 break-words">{item.currentTask.title}</dd>
          </div>
        )}
      </dl>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          aria-label={t("processes.viewDetailsLabel", { code: process.code, title: process.title })}
          className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-teal-700/25 bg-teal-50 px-2.5 py-2 text-xs font-bold text-teal-800 shadow-sm outline-none transition hover:border-teal-600 hover:bg-teal-100 hover:text-teal-950 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
          onClick={() => onViewDetails(process)}
          type="button"
        >
          <Eye aria-hidden="true" className="size-4" />
          {t("processes.viewDetails")}
        </button>
        {(item.stage === "new" || item.stage === "review") && (
          item.canAnalyze ? (
            <button
              aria-label={t("processes.analyzeLabel", { code: process.code, title: process.title })}
              className="min-h-9 w-full rounded-lg bg-amber-600 px-2.5 py-2 text-xs font-bold text-white shadow-sm outline-none transition hover:bg-amber-700 focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
              onClick={() => onAnalyze(process)}
              type="button"
            >
              {t("processes.analyze")}
            </button>
          ) : (
            <button
              className="min-h-9 w-full cursor-not-allowed rounded-lg bg-slate-200 px-2.5 py-2 text-xs font-bold text-slate-500"
              disabled
              title={t("processes.analysisUnavailable")}
              type="button"
            >
              {t("processes.analyze")}
            </button>
          )
        )}
      </div>
    </article>
  );
}

function ProcessDeletionDialog({ state, onClose, onConfirm }: ProcessDeletionDialogProps) {
  const { t } = useTranslation();
  const isDeleting = state.kind === "deleting";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onClose]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation">
      <div aria-describedby="process-delete-description" aria-labelledby="process-delete-title" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" role="dialog">
        <div className="grid size-10 place-items-center rounded-xl bg-rose-100 text-rose-700">
          <Trash2 aria-hidden="true" className="size-5" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900" id="process-delete-title">
          {t("processes.deleteTitle")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600" id="process-delete-description">
          {t("processes.deleteDescription", { code: state.process.code, title: state.process.title })}
        </p>
        {state.kind === "error" && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800" role="alert">
            {state.message}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button className="min-h-10 rounded-lg border border-slate-300 px-4 text-sm font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60" disabled={isDeleting} onClick={onClose} type="button">
            {t("common.cancel")}
          </button>
          <button className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-700 px-4 text-sm font-bold text-white outline-none transition hover:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:cursor-wait disabled:bg-slate-400" disabled={isDeleting} onClick={onConfirm} type="button">
            {isDeleting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Trash2 aria-hidden="true" className="size-4" />}
            {isDeleting ? t("processes.deleting") : t("processes.confirmDelete")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProcessDetailsDialog({
  state,
  onClose,
  onRetry,
}: ProcessDetailsDialogProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage;
  const isTerminal = isTerminalProcessStatus(state.process.status);

  return (
    <div
      aria-labelledby="process-details-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
    >
      <div className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-teal-700">
              {state.process.code}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900" id="process-details-title">
              {state.process.title}
            </h2>
          </div>
          <button
            aria-label={t("processes.closeDetails")}
            autoFocus
            className="grid size-9 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        <div className="p-5">
          {state.kind === "loading" && (
            <div aria-live="polite" className="flex items-center gap-3 py-8 text-sm text-slate-600">
              <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />
              {t("processes.loadingDetails")}
            </div>
          )}

          {state.kind === "error" && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-800">{state.message}</p>
              <button
                className="mt-3 text-sm font-semibold text-rose-900 underline underline-offset-4"
                onClick={onRetry}
                type="button"
              >
                {t("common.retry")}
              </button>
            </div>
          )}

          {state.kind === "ready" && (
            <>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t("processes.template")} value={state.process.template_key} />
              <DetailItem
                label={t("processes.flowVersion")}
                value={String(state.process.version_number)}
              />
              <DetailItem
                label={t("processes.start")}
                value={formatOptionalDateTime(state.process.started_at, locale, t("dynamicForm.notProvided"))}
              />
              {isTerminal && (
                <DetailItem
                  label={t("processes.end")}
                  value={formatOptionalDateTime(state.process.closed_at, locale, t("dynamicForm.notProvided"))}
                />
              )}
              {isTerminal && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    {t("processes.closureReason")}
                  </dt>
                  <dd className="mt-1 text-sm leading-6 text-slate-800">
                    {state.process.closure_reason || t("dynamicForm.notProvided")}
                  </dd>
                </div>
              )}
            </dl>
            {state.structure && <section className="mt-6 grid gap-2 border-t border-slate-200 pt-5" aria-labelledby="process-structure-status"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-base font-bold text-slate-900" id="process-structure-status">{t("processOperations.sections.structure")}</h3><div className="flex gap-3"><Link className="text-xs font-bold text-teal-800 underline underline-offset-4" href={`/processos/${state.process.id}/amostras`}>{t("processOperations.actions.openWorkspace")}</Link>{state.operationsPermissions?.canRegisterReceipt === true && <Link className="text-xs font-bold text-teal-800 underline underline-offset-4" href={`/processos/${state.process.id}/recebimento-amostras`}>{t("processOperations.sections.receipt")}</Link>}</div></div><p className="text-sm text-slate-700">{t("processOperations.structureStatus", { status: String(state.structure.status ?? "") })}{state.structure.run_number != null ? ` · ${t("processOperations.runNumber", { run: state.structure.run_number })}` : ""}{state.structure.blocked_reason ? ` · ${String(state.structure.blocked_reason)}` : ""}</p>{Array.isArray(state.structure.decisions) && state.structure.decisions[0] && isRecord(state.structure.decisions[0]) && <p className="text-xs text-slate-600">{t("processOperations.latestDecision", { outcome: t(`processOperations.outcomes.${String(state.structure.decisions[0].outcome ?? "").toLowerCase()}`), date: typeof state.structure.decisions[0].decided_at === "string" ? formatOptionalDateTime(state.structure.decisions[0].decided_at, locale, t("dynamicForm.notProvided")) : t("dynamicForm.notProvided") })}</p>}</section>}
            {state.composition && (
              <section aria-labelledby="process-composition-summary" className="mt-6 border-t border-slate-200 pt-5">
                <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-base font-bold text-slate-900" id="process-composition-summary">{t("participantComposition.details.title")}</h3><div className="flex gap-3">{(state.composition.capabilities.canAssignSponsor || state.composition.capabilities.canAssignGroupManager || state.composition.capabilities.canAssignLaboratories) && <Link className="text-xs font-bold text-teal-800 underline underline-offset-4" href={`/processos/${state.process.id}/composicao`}>{t("participantComposition.actions.open")}</Link>}<Link className="text-xs font-bold text-teal-800 underline underline-offset-4" href={`/processos/${state.process.id}/amostras`}>{t("processOperations.actions.openWorkspace")}</Link></div></div>
                {state.composition.participants.filter((participant) => participant.active).length === 0 && state.composition.invites.filter((invite) => invite.status === "pending" && !invite.expired).length === 0 ? <p className="mt-3 text-sm text-slate-600">{t("participantComposition.details.empty")}</p> : (
                  <ul className="mt-3 grid gap-2">{state.composition.participants.filter((participant) => participant.active).map((participant) => <li className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm" key={participant.id}><span className="font-semibold text-slate-900">{participant.user.full_name || participant.user.username}</span><span className="ml-2 text-slate-600">{t(`participantComposition.roleLabels.${participant.role_key}`, { defaultValue: participant.role_key })}</span>{participant.laboratory && <span className="mt-1 block text-xs text-slate-600">{participant.laboratory.institution.name} · {participant.laboratory.name}</span>}</li>)}{state.composition.invites.filter((invite) => invite.status === "pending" && !invite.expired).map((invite) => <li className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm" key={invite.id}><span className="font-semibold text-slate-900">{invite.email}</span><span className="ml-2 text-amber-900">{t("participantComposition.status.pending")} · {t(`participantComposition.roleLabels.${invite.role_key}`, { defaultValue: invite.role_key })}</span>{invite.laboratory && <span className="mt-1 block text-xs text-slate-700">{invite.laboratory.institution.name} · {invite.laboratory.name}</span>}</li>)}</ul>
                )}
                {state.composition.tasks.some((task) => task.status === "READY") && <p className="mt-3 text-xs text-slate-600">{t("participantComposition.details.pendingTasks", { count: new Intl.NumberFormat(locale).format(state.composition.tasks.filter((task) => task.status === "READY").length) })}</p>}
              </section>
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function ProcessAnalysisDialog({
  process,
  onClose,
  onCompleted,
}: ProcessAnalysisDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useAccessibleDialog(true, false, onClose);

  return createPortal(
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 backdrop-blur-[2px]"
      role="presentation"
    >
      <div
        aria-describedby="process-analysis-description"
        aria-labelledby="process-analysis-title"
        aria-modal="true"
        className="flex min-h-0 max-w-none flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-2xl"
        ref={dialogRef}
        role="dialog"
        style={{ height: "92dvh", width: "95vw" }}
        tabIndex={-1}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-teal-700">
              {process.code}
            </p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-900" id="process-analysis-title">
              {t("processes.analysisTitle", { title: process.title })}
            </h2>
            <p className="mt-1 text-sm text-slate-500" id="process-analysis-description">
              {t("processes.analysisDescription")}
            </p>
          </div>
          <button
            aria-label={t("processes.closeAnalysis")}
            className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <TriageWorkspace
            embedded
            initialProcess={process}
            onCompleted={onCompleted}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function DetailItem({ label, value }: ProcessDetailItemProps) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {value}
      </dd>
    </div>
  );
}

function KanbanMessage({
  title,
  description,
  actionLabel,
  onAction,
}: KanbanMessageProps) {
  return (
    <section className="grid flex-1 place-items-center py-12" aria-live="polite">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <FileStack aria-hidden="true" className="mx-auto size-9 text-teal-700" />
        <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        {actionLabel && onAction && (
          <button
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            onClick={onAction}
            type="button"
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            {actionLabel}
          </button>
        )}
      </div>
    </section>
  );
}

export function buildKanbanItems(
  processes: ProcessInstance[],
  tasks: ProcessTask[],
): ProcessKanbanItem[] {
  const tasksByProcess = new Map<string, ProcessTask[]>();
  for (const task of tasks) {
    const processTasks = tasksByProcess.get(task.process.id) ?? [];
    processTasks.push(task);
    tasksByProcess.set(task.process.id, processTasks);
  }

  return processes.flatMap((process) => {
    const processTasks = tasksByProcess.get(process.id) ?? [];
    return hasSubmissionEvidence(process, processTasks)
      ? [projectKanbanItem(process, processTasks)]
      : [];
  });
}

function hasSubmissionEvidence(
  process: ProcessInstance,
  tasks: ProcessTask[],
) {
  if (TERMINAL_PROCESS_STATUSES.has(process.status.trim().toUpperCase())) {
    return true;
  }

  return tasks.some(
    (task) =>
      task.status !== "CANCELLED" &&
      (task.activity_key !== "proposal_submission" ||
        task.status === "COMPLETED" ||
        task.activity_run_number > 1),
  );
}

export function projectKanbanItem(
  process: ProcessInstance,
  tasks: ProcessTask[],
): ProcessKanbanItem {
  const relevantTasks = tasks
    .filter((task) => task.status !== "CANCELLED")
    .slice()
    .sort(compareTasksByWorkflowPosition);
  const currentTask = relevantTasks.at(-1) ?? null;
  const currentPhase = currentTask?.phase ?? null;
  const normalizedStatus = process.status.trim().toUpperCase();
  const isClosed = TERMINAL_PROCESS_STATUSES.has(normalizedStatus);
  const awaitingProponent = relevantTasks.some(
    (task) =>
      task.status === "READY" &&
      task.assigned_role === "proponent" &&
      (task.activity_key === "submission_return_review" ||
        (task.activity_key === "proposal_submission" &&
          task.activity_run_number > 1)),
  );
  const correctionReceived = relevantTasks.some(
    (task) =>
      task.activity_run_number > 1 &&
      ((task.activity_key === "proposal_submission" &&
        task.status === "COMPLETED") ||
        (task.activity_key === "triage_evaluation" &&
          task.status === "READY")),
  );
  const triageTask = relevantTasks
    .filter((task) => task.activity_key === "triage_evaluation")
    .at(-1);
  const hasReviewHistory = relevantTasks.some(
    (task) =>
      task.activity_key === "submission_return_review" ||
      (task.phase.order === 1 && task.activity_run_number > 1),
  );

  let stage: ProcessKanbanItem["stage"] = "new";
  let reviewState: ProcessKanbanItem["reviewState"] = "awaiting-triage";

  if (isClosed) {
    stage = "closed";
    reviewState = "closed";
  } else if ((currentPhase?.order ?? 1) > 1) {
    stage = "ongoing";
    reviewState = "in-progress";
  } else if (awaitingProponent) {
    stage = "review";
    reviewState = "awaiting-proponent";
  } else if (correctionReceived) {
    stage = "review";
    reviewState = "correction-received";
  } else if (hasReviewHistory || triageTask?.status === "COMPLETED") {
    stage = "review";
    reviewState = "bracvam-review";
  } else if (triageTask?.status === "READY") {
    reviewState = "ready-for-analysis";
  }

  return {
    process,
    tasks: relevantTasks,
    stage,
    reviewState,
    currentTask,
    currentPhase,
    canAnalyze:
      !isClosed &&
      !awaitingProponent &&
      (stage === "new" ||
        (triageTask?.status === "READY" && triageTask.can_act)),
  };
}

function buildColumns(
  items: ProcessKanbanItem[],
  phaseFilter: string,
  t: TFunction,
  locale: string | undefined,
): ProcessKanbanColumn[] {
  return STAGE_PRESENTATIONS.map((presentation) => {
    const allItems = items
      .filter((item) => item.stage === presentation.key)
      .sort((first, second) =>
        compareProcesses(first.process, second.process, locale),
      );
    const visibleItems =
      presentation.key === "ongoing" && phaseFilter !== "all"
        ? allItems.filter((item) => item.currentPhase?.key === phaseFilter)
        : allItems;

    return {
    key: presentation.key,
    label: t(`processes.columns.${presentation.key}.label`),
    description: t(`processes.columns.${presentation.key}.description`),
    items: visibleItems,
    total: allItems.length,
    tone: presentation.tone,
    };
  });
}

function buildPhaseOptions(items: ProcessKanbanItem[]) {
  const phases = new Map<string, NonNullable<ProcessKanbanItem["currentPhase"]>>();
  for (const item of items) {
    if (item.stage === "ongoing" && item.currentPhase) {
      phases.set(item.currentPhase.key, item.currentPhase);
    }
  }
  return Array.from(phases.values()).sort((first, second) => first.order - second.order);
}

function compareTasksByWorkflowPosition(first: ProcessTask, second: ProcessTask) {
  return (
    first.phase.order - second.phase.order ||
    first.activity_run_number - second.activity_run_number ||
    Number(first.status === "READY") - Number(second.status === "READY")
  );
}

async function loadAllProcesses(
  signal: AbortSignal,
  deniedMessage: string,
  fallbackMessage: string,
  t: TFunction,
) {
  const firstPage = await loadProcessPage(1, signal, deniedMessage, fallbackMessage, t);
  const pageCount = Math.ceil(firstPage.total / firstPage.size);

  if (pageCount <= 1) {
    return firstPage.items;
  }

  const remainingPages = Array.from(
    { length: pageCount - 1 },
    (_, index) => index + 2,
  );
  const items = [...firstPage.items];

  for (let index = 0; index < remainingPages.length; index += PAGE_BATCH_SIZE) {
    const batch = remainingPages.slice(index, index + PAGE_BATCH_SIZE);
    const pages = await Promise.all(
      batch.map((page) => loadProcessPage(page, signal, deniedMessage, fallbackMessage, t)),
    );

    for (const page of pages) {
      items.push(...page.items);
    }
  }

  return Array.from(new Map(items.map((process) => [process.id, process])).values());
}

async function loadProcessPage(
  page: number,
  signal: AbortSignal,
  deniedMessage: string,
  fallbackMessage: string,
  t: TFunction,
) {
  const response = await fetch(
    `/api/processes?page=${page}&size=${PROCESS_PAGE_SIZE}`,
    { cache: "no-store", signal },
  );
  const payload = (await response.json().catch(() => null)) as unknown;

  if (response.status === 403) {
    const error = new Error(deniedMessage);
    error.name = "ProcessAccessDenied";
    throw error;
  }

  if (!response.ok || !isProcessList(payload)) {
    throw new Error(
      getApiMessage(payload, fallbackMessage, t),
    );
  }

  return payload;
}

async function loadAllTasks(
  signal: AbortSignal,
  deniedMessage: string,
  fallbackMessage: string,
  t: TFunction,
) {
  const firstPage = await loadTaskPage(1, signal, deniedMessage, fallbackMessage, t);
  const pageCount = Math.ceil(firstPage.total / firstPage.size);
  if (pageCount <= 1) return firstPage.items;

  const remainingPages = Array.from(
    { length: pageCount - 1 },
    (_, index) => index + 2,
  );
  const items = [...firstPage.items];
  for (let index = 0; index < remainingPages.length; index += PAGE_BATCH_SIZE) {
    const batch = remainingPages.slice(index, index + PAGE_BATCH_SIZE);
    const pages = await Promise.all(
      batch.map((page) =>
        loadTaskPage(page, signal, deniedMessage, fallbackMessage, t),
      ),
    );
    for (const page of pages) items.push(...page.items);
  }

  return Array.from(new Map(items.map((task) => [task.id, task])).values());
}

async function loadTaskPage(
  page: number,
  signal: AbortSignal,
  deniedMessage: string,
  fallbackMessage: string,
  t: TFunction,
) {
  const response = await fetch(
    `/api/tasks?page=${page}&size=${PROCESS_PAGE_SIZE}`,
    { cache: "no-store", signal },
  );
  const payload = (await response.json().catch(() => null)) as unknown;

  if (response.status === 403) {
    const error = new Error(deniedMessage);
    error.name = "ProcessAccessDenied";
    throw error;
  }
  if (!response.ok || !isTaskList(payload)) {
    throw new Error(getApiMessage(payload, fallbackMessage, t));
  }
  return payload;
}

function isProcessList(value: unknown): value is ProcessList {
  if (!value || typeof value !== "object") {
    return false;
  }

  const list = value as ApiRecord;
  return (
    Array.isArray(list.items) &&
    list.items.every(isProcessInstance) &&
    typeof list.total === "number" &&
    typeof list.page === "number" &&
    typeof list.size === "number"
  );
}

function isProcessInstance(value: unknown): value is ProcessInstance {
  if (!value || typeof value !== "object") {
    return false;
  }

  const process = value as ApiRecord;
  return (
    typeof process.id === "string" &&
    typeof process.code === "string" &&
    typeof process.title === "string" &&
    typeof process.status === "string" &&
    typeof process.template_key === "string" &&
    typeof process.version_number === "number"
  );
}

function isTaskList(value: unknown): value is ProcessTaskList {
  if (!value || typeof value !== "object") return false;
  const list = value as ApiRecord;
  return (
    Array.isArray(list.items) &&
    list.items.every(isProcessTask) &&
    typeof list.total === "number" &&
    typeof list.page === "number" &&
    typeof list.size === "number"
  );
}

function isProcessTask(value: unknown): value is ProcessTask {
  if (!value || typeof value !== "object") return false;
  const task = value as ApiRecord;
  const process = task.process as ApiRecord | undefined;
  const phase = task.phase as ApiRecord | undefined;
  return (
    typeof task.id === "string" &&
    Boolean(process) &&
    typeof process?.id === "string" &&
    typeof task.activity_key === "string" &&
    typeof task.activity_run_number === "number" &&
    Boolean(phase) &&
    typeof phase?.key === "string" &&
    typeof phase?.order === "number" &&
    typeof task.title === "string" &&
    (task.assigned_role === null || typeof task.assigned_role === "string") &&
    (task.status === "READY" || task.status === "COMPLETED" || task.status === "CANCELLED") &&
    typeof task.can_act === "boolean"
  );
}

function isCompositionSnapshot(value: unknown): value is ProcessCompositionSnapshot {
  if (!value || typeof value !== "object") return false;
  const snapshot = value as ApiRecord;
  return Array.isArray(snapshot.participants) && Array.isArray(snapshot.invites) &&
    Array.isArray(snapshot.tasks) && Array.isArray(snapshot.laboratories) &&
    Boolean(snapshot.capabilities) && typeof snapshot.capabilities === "object";
}

function getApiMessage(value: unknown, fallback: string, t: TFunction) {
  return getLocalizedApiError(
    value && typeof value === "object" ? value : null,
    fallback,
    t,
  );
}

function compareProcesses(first: ProcessInstance, second: ProcessInstance, locale: string | undefined) {
  return first.code.localeCompare(second.code, locale, {
    numeric: true,
    sensitivity: "base",
  });
}

function formatDateTime(value: string, locale: string | undefined) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOptionalDateTime(
  value: string | null | undefined,
  locale: string | undefined,
  emptyLabel: string,
) {
  return value ? formatDateTime(value, locale) : emptyLabel;
}

function getBorderTone(tone: ProcessKanbanColumn["tone"]) {
  if (tone === "teal") return "border-t-teal-600";
  if (tone === "amber") return "border-t-amber-500";
  if (tone === "blue") return "border-t-blue-600";
  if (tone === "violet") return "border-t-violet-600";
  return "border-t-slate-500";
}

function getBadgeTone(tone: ProcessKanbanColumn["tone"]) {
  if (tone === "teal") return "bg-teal-100 text-teal-800";
  if (tone === "amber") return "bg-amber-100 text-amber-800";
  if (tone === "blue") return "bg-blue-100 text-blue-800";
  if (tone === "violet") return "bg-violet-100 text-violet-800";
  return "bg-slate-200 text-slate-700";
}

function getReviewStateTone(state: ProcessKanbanItem["reviewState"]) {
  if (state === "awaiting-proponent") return "bg-amber-100 text-amber-900";
  if (state === "correction-received") return "bg-emerald-100 text-emerald-800";
  if (state === "ready-for-analysis") return "bg-teal-100 text-teal-800";
  if (state === "bracvam-review") return "bg-blue-100 text-blue-800";
  if (state === "in-progress") return "bg-violet-100 text-violet-800";
  return "bg-slate-100 text-slate-700";
}

function isTerminalProcessStatus(status: string) {
  return TERMINAL_PROCESS_STATUSES.has(status.trim().toUpperCase());
}
