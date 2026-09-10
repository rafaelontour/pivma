"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

// O backend ainda não publica o catálogo de estados. Estes aliases são
// provisórios e qualquer valor novo permanece visível na coluna de contingência.
const STATUS_PRESENTATIONS: readonly ProcessStatusPresentation[] = [
  {
    key: "new-submissions",
    label: "Novas submissões",
    description: "Processos enviados e aguardando o início da análise.",
    statusValues: ["SUBMITTED", "NEW_SUBMISSION", "PENDING_TRIAGE"],
    tone: "teal",
  },
  {
    key: "triage",
    label: "Em triagem",
    description: "Processos em conferência inicial pela equipe técnica.",
    statusValues: ["TRIAGE", "UNDER_TRIAGE"],
    tone: "amber",
  },
  {
    key: "evaluation",
    label: "Em avaliação",
    description: "Processos que avançaram para avaliação técnica.",
    statusValues: ["EVALUATION", "UNDER_EVALUATION", "IN_REVIEW"],
    tone: "blue",
  },
  {
    key: "completed",
    label: "Concluídos",
    description: "Processos encerrados pelo fluxo da plataforma.",
    statusValues: ["COMPLETED", "CLOSED"],
    tone: "violet",
  },
];

export function ProcessKanban() {
  const [state, setState] = useState<ProcessKanbanState>({ kind: "loading" });
  const [details, setDetails] = useState<ProcessDetailsState>({ kind: "closed" });
  const isRefreshingRef = useRef(false);
  const boardControllerRef = useRef<AbortController | null>(null);
  const detailsControllerRef = useRef<AbortController | null>(null);

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
      const processes = await loadAllProcesses(controller.signal);

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
              : "Não foi possível carregar os processos.",
        };
      });
    } finally {
      if (boardControllerRef.current === controller) {
        boardControllerRef.current = null;
        isRefreshingRef.current = false;
      }
    }
  }, []);

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
            "Não foi possível consultar os detalhes do processo.",
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
          message: "Não foi possível consultar os detalhes do processo.",
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
        description="Estamos reunindo todas as páginas antes de exibir o quadro completo."
        title="Carregando processos…"
      />
    );
  }

  if (state.kind === "denied") {
    return (
      <KanbanMessage
        description="Sua conta não possui a permissão necessária para consultar os processos da BraCVAM."
        title="Acesso não permitido"
      />
    );
  }

  if (state.kind === "error") {
    return (
      <KanbanMessage
        actionLabel="Tentar novamente"
        description={state.message}
        onAction={() => void refreshSnapshot(false)}
        title="Não foi possível montar o quadro"
      />
    );
  }

  const columns = buildColumns(state.processes);

  return (
    <div className="flex flex-1 flex-col py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div aria-live="polite" className="text-xs text-slate-500">
          {state.isStale ? (
            <span className="inline-flex items-center gap-2 font-semibold text-amber-800">
              <AlertTriangle aria-hidden="true" className="size-4" />
              Os dados podem estar desatualizados.
            </span>
          ) : (
            <span>
              Última atualização: {formatDateTime(state.updatedAt)}
            </span>
          )}
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 outline-none transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-wait disabled:opacity-60"
          disabled={state.isRefreshing}
          onClick={() => void refreshSnapshot(true)}
          type="button"
        >
          <RefreshCw
            aria-hidden="true"
            className={`size-4 ${state.isRefreshing ? "animate-spin" : ""}`}
          />
          {state.isRefreshing ? "Atualizando…" : "Atualizar quadro"}
        </button>
      </div>

      {state.processes.length === 0 && (
        <div
          className="mb-4 rounded-xl border border-dashed border-slate-300 bg-white/70 px-5 py-4 text-sm text-slate-600"
          role="status"
        >
          Ainda não existem processos acessíveis para exibir neste quadro.
        </div>
      )}

      <section
        aria-label="Quadro de processos por estado"
        className="min-w-0 overflow-x-hidden pb-4"
      >
        <div
          className="grid w-full min-w-0 items-start gap-3"
          style={{
            gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
          }}
        >
          {columns.map((column) => (
            <section
              aria-labelledby={`column-${column.key}`}
              className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/80 shadow-sm"
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
                    aria-label={`${column.processes.length} processos`}
                    className={`grid min-w-7 place-items-center rounded-full px-2 py-1 text-xs font-bold ${getBadgeTone(column.tone)}`}
                  >
                    {column.processes.length}
                  </span>
                </div>
              </header>

              <div className="max-h-[calc(100dvh-23rem)] min-h-32 space-y-3 overflow-y-auto p-3">
                {column.processes.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-white/50 px-4 py-6 text-center text-xs text-slate-500">
                    Nenhum processo neste estado.
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
        aria-label={`Ver detalhes do processo ${process.code}: ${process.title}`}
        className="mt-4 inline-flex items-center gap-2 rounded-lg text-xs font-semibold text-teal-700 outline-none transition hover:text-teal-900 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
        onClick={() => onViewDetails(process)}
        type="button"
      >
        <Eye aria-hidden="true" className="size-4" />
        Ver detalhes
      </button>
    </article>
  );
}

function ProcessDetailsDialog({
  state,
  onClose,
  onRetry,
}: ProcessDetailsDialogProps) {
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
            aria-label="Fechar detalhes do processo"
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
              Consultando os detalhes…
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
                Tentar novamente
              </button>
            </div>
          )}

          {state.kind === "ready" && (
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Estado" value={state.process.status} />
              <DetailItem label="Template" value={state.process.template_key} />
              <DetailItem
                label="Versão do fluxo"
                value={String(state.process.version_number)}
              />
              <DetailItem
                label="Início"
                value={formatOptionalDateTime(state.process.started_at)}
              />
              <DetailItem
                label="Encerramento"
                value={formatOptionalDateTime(state.process.closed_at)}
              />
              <div className="sm:col-span-2">
                <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Motivo do encerramento
                </dt>
                <dd className="mt-1 text-sm leading-6 text-slate-800">
                  {state.process.closure_reason || "Não informado"}
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

function buildColumns(processes: ProcessInstance[]): ProcessKanbanColumn[] {
  const configuredColumns = STATUS_PRESENTATIONS.map((presentation) => ({
    key: presentation.key,
    label: presentation.label,
    description: presentation.description,
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
    column.processes.sort(compareProcesses);
  }

  if (unknownProcesses.length > 0) {
    configuredColumns.push({
      key: "unknown",
      label: "Estado não mapeado",
      description: "Valores preservados exatamente como recebidos da API.",
      processes: unknownProcesses.sort(compareProcesses),
      tone: "slate",
      unknown: true,
    });
  }

  return configuredColumns;
}

async function loadAllProcesses(signal: AbortSignal) {
  const firstPage = await loadProcessPage(1, signal);
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
      batch.map((page) => loadProcessPage(page, signal)),
    );

    for (const page of pages) {
      items.push(...page.items);
    }
  }

  return Array.from(new Map(items.map((process) => [process.id, process])).values());
}

async function loadProcessPage(page: number, signal: AbortSignal) {
  const response = await fetch(
    `/api/processes?page=${page}&size=${PROCESS_PAGE_SIZE}`,
    { cache: "no-store", signal },
  );
  const payload = (await response.json().catch(() => null)) as unknown;

  if (response.status === 403) {
    const error = new Error("Acesso não permitido.");
    error.name = "ProcessAccessDenied";
    throw error;
  }

  if (!response.ok || !isProcessList(payload)) {
    throw new Error(
      getApiMessage(payload, "Não foi possível consultar todos os processos."),
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

function compareProcesses(first: ProcessInstance, second: ProcessInstance) {
  return first.code.localeCompare(second.code, "pt-BR", {
    numeric: true,
    sensitivity: "base",
  });
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatOptionalDateTime(value?: string | null) {
  return value ? formatDateTime(value) : "Não informado";
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
