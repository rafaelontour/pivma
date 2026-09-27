"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  AlertTriangle,
  Eye,
  FileStack,
  LoaderCircle,
  RefreshCw,
  X,
} from "lucide-react";
import type {
  KanbanMessageProps,
  ProcessCardProps,
  ProcessDetailsDialogProps,
  ProcessDetailsState,
  ProcessDetailItemProps,
  ProcessKanbanColumn,
  ProcessKanbanState,
  ProcessStatusPresentation,
} from "@/types/Kanban";
import type { ProcessInstance, ProcessList } from "@/types/Processo";
import type { ApiRecord } from "@/types/Servico";

const PROCESS_PAGE_SIZE = 100;
const PAGE_BATCH_SIZE = 4;
const REVALIDATION_INTERVAL_MS = 30_000;

const STATUS_PRESENTATIONS: readonly ProcessStatusPresentation[] = [
  {
    key: "submission",
    label: "",
    description: "",
    statusValues: ["SUBMISSION"],
    tone: "teal",
  },
  {
    key: "ai-pre-evaluation",
    label: "",
    description: "",
    statusValues: ["AI_PRE_EVALUATION"],
    tone: "blue",
  },
  {
    key: "triage",
    label: "",
    description: "",
    statusValues: ["TRIAGE"],
    tone: "amber",
  },
  {
    key: "planning",
    label: "",
    description: "",
    statusValues: ["PLANNING"],
    tone: "violet",
  },
  {
    key: "closed",
    label: "",
    description: "",
    statusValues: ["CLOSED"],
    tone: "slate",
  },
];

export function ProcessKanban() {
  const { i18n, t } = useTranslation();
  const [state, setState] = useState<ProcessKanbanState>({ kind: "loading" });
  const [details, setDetails] = useState<ProcessDetailsState>({ kind: "closed" });
  const [headerActionsTarget, setHeaderActionsTarget] =
    useState<HTMLElement | null>(null);
  const isRefreshingRef = useRef(false);
  const boardControllerRef = useRef<AbortController | null>(null);
  const detailsControllerRef = useRef<AbortController | null>(null);

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
      const processes = await loadAllProcesses(
        controller.signal,
        t("processes.deniedTitle"),
        t("processes.allFailed"),
      );

      if (!controller.signal.aborted) {
        setState({
          kind: "ready",
          processes,
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
          ),
        });
        return;
      }

      setDetails({ kind: "ready", process: payload });
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
  const columns = buildColumns(state.processes, t, locale);

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
        className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-4"
      >
        <div
          className="grid h-full w-max min-w-full grid-flow-col auto-cols-[minmax(15rem,1fr)] items-stretch gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(15rem, 1fr))`,
          }}
        >
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
                    aria-label={t("processes.count", { count: column.processes.length })}
                    className={`grid min-w-7 place-items-center rounded-full px-2 py-1 text-xs font-bold ${getBadgeTone(column.tone)}`}
                  >
                    {column.processes.length}
                  </span>
                </div>
              </header>

              <div className="min-h-32 flex-1 space-y-3 overflow-y-auto p-3">
                {column.processes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-6 text-center text-xs text-slate-500">
                    {t("processes.emptyColumn")}
                  </p>
                ) : (
                  column.processes.map((process) => (
                    <ProcessCard
                      key={process.id}
                      onViewDetails={(selectedProcess) =>
                        void openDetails(selectedProcess)
                      }
                      process={process}
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
    </div>
  );
}

function ProcessCard({ process, onViewDetails }: ProcessCardProps) {
  const { t } = useTranslation();

  return (
    <article className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm shadow-slate-300/30 xl:p-4">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <span className="min-w-0 break-all font-mono text-[11px] font-bold uppercase tracking-wide text-teal-700">
          {process.code}
        </span>
        <span className="max-w-full break-all rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">
          {process.status}
        </span>
      </div>
      <h3 className="mt-3 min-w-0 break-words text-sm font-bold leading-5 text-slate-900">
        {process.title}
      </h3>
      <button
        aria-label={t("processes.viewDetailsLabel", { code: process.code, title: process.title })}
        className="mt-4 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-teal-700 outline-none transition hover:text-teal-900 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        onClick={() => onViewDetails(process)}
        type="button"
      >
        <Eye aria-hidden="true" className="size-4" />
        {t("processes.viewDetails")}
      </button>
    </article>
  );
}

function ProcessDetailsDialog({
  state,
  onClose,
  onRetry,
}: ProcessDetailsDialogProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage;

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
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label={t("processes.status")} value={state.process.status} />
              <DetailItem label={t("processes.template")} value={state.process.template_key} />
              <DetailItem
                label={t("processes.flowVersion")}
                value={String(state.process.version_number)}
              />
              <DetailItem
                label={t("processes.start")}
                value={formatOptionalDateTime(state.process.started_at, locale, t("dynamicForm.notProvided"))}
              />
              <DetailItem
                label={t("processes.end")}
                value={formatOptionalDateTime(state.process.closed_at, locale, t("dynamicForm.notProvided"))}
              />
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t("processes.closureReason")}
                </dt>
                <dd className="mt-1 text-sm leading-6 text-slate-800">
                  {state.process.closure_reason || t("dynamicForm.notProvided")}
                </dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    </div>
  );
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

function buildColumns(
  processes: ProcessInstance[],
  t: TFunction,
  locale: string | undefined,
): ProcessKanbanColumn[] {
  const configuredColumns = STATUS_PRESENTATIONS.map((presentation) => ({
    key: presentation.key,
    label: t(`processes.columns.${presentation.key}.label`),
    description: t(`processes.columns.${presentation.key}.description`),
    processes: [] as ProcessInstance[],
    tone: presentation.tone,
    unknown: false,
  }));
  const unknownProcesses: ProcessInstance[] = [];

  for (const process of processes) {
    const normalizedStatus = process.status.trim().toUpperCase();
    const columnIndex = STATUS_PRESENTATIONS.findIndex((presentation) =>
      presentation.statusValues.includes(normalizedStatus),
    );

    if (columnIndex === -1) {
      unknownProcesses.push(process);
    } else {
      configuredColumns[columnIndex].processes.push(process);
    }
  }

  for (const column of configuredColumns) {
    column.processes.sort((first, second) => compareProcesses(first, second, locale));
  }

  if (unknownProcesses.length > 0) {
    configuredColumns.push({
      key: "unknown",
      label: t("processes.columns.unknown.label"),
      description: t("processes.columns.unknown.description"),
      processes: unknownProcesses.sort((first, second) => compareProcesses(first, second, locale)),
      tone: "slate",
      unknown: true,
    });
  }

  return configuredColumns;
}

async function loadAllProcesses(
  signal: AbortSignal,
  deniedMessage: string,
  fallbackMessage: string,
) {
  const firstPage = await loadProcessPage(1, signal, deniedMessage, fallbackMessage);
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
      batch.map((page) => loadProcessPage(page, signal, deniedMessage, fallbackMessage)),
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
      getApiMessage(payload, fallbackMessage),
    );
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

function getApiMessage(value: unknown, fallback: string) {
  return value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
    ? value.message
    : fallback;
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
