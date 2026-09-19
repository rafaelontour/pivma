"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrainCircuit, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import {
  isAiPipelineExecution,
  isAiStepExecution,
  mergeAiExecutions,
  parseSseData,
  safePayload,
} from "@/components/observabilidade";
import type {
  AiExecutionCardProps,
  AiFilters,
  AiObservabilityState,
  ConnectionBadgeProps,
  ObservabilityPayloadDetailsProps,
  ObservabilityConnectionState,
  ObservabilityMessageProps,
} from "@/types/Observabilidade";
import type { ApiRecord } from "@/types/Servico";

export function AiObservability() {
  const [filters, setFilters] = useState<AiFilters>({ limit: "50", correlationId: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [state, setState] = useState<AiObservabilityState>({ kind: "loading", executions: [] });
  const [connection, setConnection] = useState<ObservabilityConnectionState>("connecting");
  const hasConnectedRef = useRef(false);
  const isDenied = state.kind === "denied";

  const loadHistory = useCallback(async (preserve: boolean) => {
    const query = new URLSearchParams({ limit: appliedFilters.limit });
    if (appliedFilters.correlationId) query.set("correlation_id", appliedFilters.correlationId);
    try {
      const response = await fetch(`/api/observability/ai?${query}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(payload) || !payload.every(isAiPipelineExecution)) {
        const message = getApiMessage(payload, "Não foi possível carregar as execuções de IA.");
        setState((current) => response.status === 403 ? { kind: "denied", message, executions: current.executions } : { kind: "error", message, executions: current.executions });
        return;
      }
      setState((current) => ({ kind: "ready", executions: mergeAiExecutions(preserve ? current.executions : [], payload) }));
    } catch {
      setState((current) => ({ kind: "error", message: "Não foi possível conectar ao histórico de IA.", executions: current.executions }));
    }
  }, [appliedFilters]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadHistory(false), 0);
    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  useEffect(() => {
    if (isDenied) return;
    const source = new EventSource("/api/observability/ai/stream");
    source.onopen = () => {
      setConnection("live");
      if (hasConnectedRef.current) void loadHistory(true);
      hasConnectedRef.current = true;
    };
    source.onmessage = (message) => {
      const item = parseSseData(message.data);
      if (!isAiStepExecution(item) && !isAiPipelineExecution(item)) return;
      if (appliedFilters.correlationId && item.correlation_id !== appliedFilters.correlationId) return;
      setState((current) => ({ kind: "ready", executions: mergeAiExecutions(current.executions, [item]) }));
    };
    source.onerror = () => setConnection("disconnected");
    return () => source.close();
  }, [appliedFilters.correlationId, isDenied, loadHistory]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    const limit = Number(filters.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
      toast.error("Informe um limite entre 1 e 200 execuções.");
      return;
    }
    setState((current) => ({ kind: "loading", executions: current.executions }));
    setConnection("connecting");
    setAppliedFilters({ limit: String(limit), correlationId: filters.correlationId.trim() });
  }

  return <div className="flex flex-1 flex-col gap-5 py-7"><form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[7rem_1fr_auto]" onSubmit={applyFilters}><label className="grid gap-1 text-xs font-bold text-slate-700">Limite<input className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" inputMode="numeric" max={200} min={1} onChange={(event) => setFilters((current) => ({ ...current, limit: event.target.value }))} type="number" value={filters.limit} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Correlação<input className="min-h-10 rounded-lg border border-slate-300 px-3 font-mono text-sm font-normal" maxLength={128} onChange={(event) => setFilters((current) => ({ ...current, correlationId: event.target.value }))} placeholder="Identificador da correlação" value={filters.correlationId} /></label><button className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white" type="submit"><RefreshCw aria-hidden="true" className="size-4" />Aplicar</button></form><div className="flex flex-wrap items-center justify-between gap-3"><ConnectionBadge state={connection} /><span className="text-xs text-slate-500">{state.executions.length} correlações em memória</span></div>{state.kind === "loading" && state.executions.length === 0 ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />Carregando execuções…</div> : state.kind === "denied" ? <ObservabilityMessage message={state.message} /> : state.kind === "error" && state.executions.length === 0 ? <ObservabilityMessage message={state.message} onRetry={() => void loadHistory(false)} /> : <>{state.kind === "error" && <ObservabilityMessage message={state.message} onRetry={() => void loadHistory(true)} />}{state.executions.length === 0 ? <ObservabilityMessage message="Nenhuma execução corresponde aos filtros informados." /> : <div className="grid gap-4">{state.executions.map((execution) => <AiExecutionCard execution={execution} key={execution.correlation_id} />)}</div>}</>}</div>;
}

function AiExecutionCard({ execution }: AiExecutionCardProps) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{formatOption(execution.pipeline_name ?? "Pipeline de IA")}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">{execution.correlation_id}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isFailure(execution.status) ? "bg-rose-100 text-rose-800" : "bg-violet-100 text-violet-800"}`}>{execution.status ?? "Sem estado"}</span></div><dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">{execution.field_key && <div><dt className="font-bold">Campo</dt><dd>{execution.field_key}</dd></div>}<div><dt className="font-bold">Duração</dt><dd>{formatDuration(execution.total_duration_ms)}</dd></div>{typeof execution.total_cost === "number" && <div><dt className="font-bold">Custo</dt><dd>{execution.total_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</dd></div>}<div><dt className="font-bold">Início</dt><dd>{formatDate(execution.started_at)}</dd></div></dl><div className="mt-4 grid gap-3">{(execution.steps ?? []).map((step) => <details className="rounded-xl border border-slate-200 p-3" key={step.event_id ?? `${step.field_key}-${step.step_order}-${step.step_name}`}><summary className="cursor-pointer text-sm font-semibold text-slate-800"><span className="mr-2 text-xs text-slate-500">#{step.step_order}</span>{formatOption(step.step_name)} <span className={isFailure(step.status) ? "text-rose-700" : "text-emerald-700"}>· {step.status ?? "Sem estado"}</span></summary><dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600"><div><dt className="font-bold">Campo</dt><dd>{step.field_key}</dd></div><div><dt className="font-bold">Duração</dt><dd>{formatDuration(step.step_duration_ms)}</dd></div>{step.model_name && <div><dt className="font-bold">Modelo</dt><dd>{step.model_name}</dd></div>}{typeof step.real_cost === "number" && <div><dt className="font-bold">Custo real</dt><dd>{step.real_cost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</dd></div>}</dl><div className="mt-3 grid gap-2"><PayloadDetails label="Entrada" value={step.input_payload} /><PayloadDetails label="Saída" value={step.output_payload} /><PayloadDetails label="Erro" value={step.error_details} /></div></details>)}{(execution.steps ?? []).length === 0 && <p className="text-sm text-slate-600">Nenhuma etapa foi disponibilizada para esta correlação.</p>}</div></article>;
}

function PayloadDetails({ label, value }: ObservabilityPayloadDetailsProps) {
  return <details className="rounded-lg bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-600">{label}</summary><pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{safePayload(value)}</pre></details>;
}

function ConnectionBadge({ state }: ConnectionBadgeProps) {
  return <span aria-live="polite" className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${state === "live" ? "bg-emerald-100 text-emerald-800" : state === "connecting" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}><BrainCircuit aria-hidden="true" className="size-4" />{state === "live" ? "Etapas ao vivo" : state === "connecting" ? "Conectando ao fluxo" : "Fluxo desconectado; reconexão automática"}</span>;
}

function ObservabilityMessage({ message, onRetry }: ObservabilityMessageProps) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center"><TriangleAlert aria-hidden="true" className="mx-auto size-6 text-slate-500" /><p className="mt-2 text-sm text-slate-600">{message}</p>{onRetry && <button className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white" onClick={onRetry} type="button">Tentar novamente</button>}</div>;
}

function getApiMessage(value: unknown, fallback: string) { return isRecord(value) && typeof value.message === "string" ? value.message : fallback; }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function formatOption(value: string) { return value.replaceAll("_", " "); }
function formatDate(value: string | null | undefined) { if (!value) return "Não informado"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(date); }
function formatDuration(value: number | undefined) { if (typeof value !== "number") return "Não informada"; return value >= 1000 ? `${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} s` : `${value.toLocaleString("pt-BR")} ms`; }
function isFailure(value: string | undefined) { return Boolean(value && /fail|error/i.test(value)); }
