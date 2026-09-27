"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrainCircuit, LoaderCircle, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
        const message = getApiMessage(payload, t("observability.executionsFailed"));
        setState((current) => response.status === 403 ? { kind: "denied", message, executions: current.executions } : { kind: "error", message, executions: current.executions });
        return;
      }
      setState((current) => ({ kind: "ready", executions: mergeAiExecutions(preserve ? current.executions : [], payload) }));
    } catch {
      setState((current) => ({ kind: "error", message: t("observability.executionsConnectionFailed"), executions: current.executions }));
    }
  }, [appliedFilters, t]);

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
      toast.error(t("observability.invalidExecutionLimit"));
      return;
    }
    setState((current) => ({ kind: "loading", executions: current.executions }));
    setConnection("connecting");
    setAppliedFilters({ limit: String(limit), correlationId: filters.correlationId.trim() });
  }

  return <div className="flex flex-1 flex-col gap-5 py-7"><form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[7rem_1fr_auto]" onSubmit={applyFilters}><label className="grid gap-1 text-xs font-bold text-slate-700">{t("observability.limit")}<input className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" inputMode="numeric" max={200} min={1} onChange={(event) => setFilters((current) => ({ ...current, limit: event.target.value }))} type="number" value={filters.limit} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">{t("observability.correlation")}<input className="min-h-10 rounded-lg border border-slate-300 px-3 font-mono text-sm font-normal" maxLength={128} onChange={(event) => setFilters((current) => ({ ...current, correlationId: event.target.value }))} placeholder={t("observability.correlationPlaceholder")} value={filters.correlationId} /></label><button className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white" type="submit"><RefreshCw aria-hidden="true" className="size-4" />{t("observability.apply")}</button></form><div className="flex flex-wrap items-center justify-between gap-3"><ConnectionBadge state={connection} /><span className="text-xs text-slate-500">{t("observability.correlationsInMemory", { count: state.executions.length })}</span></div>{state.kind === "loading" && state.executions.length === 0 ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />{t("observability.loadingExecutions")}</div> : state.kind === "denied" ? <ObservabilityMessage message={state.message} /> : state.kind === "error" && state.executions.length === 0 ? <ObservabilityMessage message={state.message} onRetry={() => void loadHistory(false)} /> : <>{state.kind === "error" && <ObservabilityMessage message={state.message} onRetry={() => void loadHistory(true)} />}{state.executions.length === 0 ? <ObservabilityMessage message={t("observability.noExecutions")} /> : <div className="grid gap-4">{state.executions.map((execution) => <AiExecutionCard execution={execution} key={execution.correlation_id} />)}</div>}</>}</div>;
}

function AiExecutionCard({ execution }: AiExecutionCardProps) {
  const { i18n, t } = useTranslation();
  const locale = i18n.resolvedLanguage;
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-bold text-slate-900">{formatOption(execution.pipeline_name ?? t("observability.aiPipeline"))}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">{execution.correlation_id}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${isFailure(execution.status) ? "bg-rose-100 text-rose-800" : "bg-violet-100 text-violet-800"}`}>{execution.status ?? t("observability.noStatus")}</span></div><dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">{execution.field_key && <div><dt className="font-bold">{t("observability.field")}</dt><dd>{execution.field_key}</dd></div>}<div><dt className="font-bold">{t("observability.duration")}</dt><dd>{formatDuration(execution.total_duration_ms, locale, t("observability.notProvidedFeminine"))}</dd></div>{typeof execution.total_cost === "number" && <div><dt className="font-bold">{t("observability.cost")}</dt><dd>{execution.total_cost.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</dd></div>}<div><dt className="font-bold">{t("observability.start")}</dt><dd>{formatDate(execution.started_at, locale, t("observability.notProvided"))}</dd></div></dl><div className="mt-4 grid gap-3">{(execution.steps ?? []).map((step) => <details className="rounded-xl border border-slate-200 p-3" key={step.event_id ?? `${step.field_key}-${step.step_order}-${step.step_name}`}><summary className="cursor-pointer text-sm font-semibold text-slate-800"><span className="mr-2 text-xs text-slate-500">#{step.step_order}</span>{formatOption(step.step_name)} <span className={isFailure(step.status) ? "text-rose-700" : "text-emerald-700"}>· {step.status ?? t("observability.noStatus")}</span></summary><dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600"><div><dt className="font-bold">{t("observability.field")}</dt><dd>{step.field_key}</dd></div><div><dt className="font-bold">{t("observability.duration")}</dt><dd>{formatDuration(step.step_duration_ms, locale, t("observability.notProvidedFeminine"))}</dd></div>{step.model_name && <div><dt className="font-bold">{t("observability.model")}</dt><dd>{step.model_name}</dd></div>}{typeof step.real_cost === "number" && <div><dt className="font-bold">{t("observability.actualCost")}</dt><dd>{step.real_cost.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</dd></div>}</dl><div className="mt-3 grid gap-2"><PayloadDetails label={t("observability.input")} value={step.input_payload} /><PayloadDetails label={t("observability.output")} value={step.output_payload} /><PayloadDetails label={t("observability.error")} value={step.error_details} /></div></details>)}{(execution.steps ?? []).length === 0 && <p className="text-sm text-slate-600">{t("observability.noSteps")}</p>}</div></article>;
}

function PayloadDetails({ label, value }: ObservabilityPayloadDetailsProps) {
  return <details className="rounded-lg bg-slate-50 p-3"><summary className="cursor-pointer text-xs font-bold uppercase tracking-wide text-slate-600">{label}</summary><pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{safePayload(value)}</pre></details>;
}

function ConnectionBadge({ state }: ConnectionBadgeProps) {
  const { t } = useTranslation();
  return <span aria-live="polite" className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${state === "live" ? "bg-emerald-100 text-emerald-800" : state === "connecting" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}><BrainCircuit aria-hidden="true" className="size-4" />{state === "live" ? t("observability.liveSteps") : state === "connecting" ? t("observability.connecting") : t("observability.disconnected")}</span>;
}

function ObservabilityMessage({ message, onRetry }: ObservabilityMessageProps) {
  const { t } = useTranslation();
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center"><TriangleAlert aria-hidden="true" className="mx-auto size-6 text-slate-500" /><p className="mt-2 text-sm text-slate-600">{message}</p>{onRetry && <button className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white" onClick={onRetry} type="button">{t("common.retry")}</button>}</div>;
}

function getApiMessage(value: unknown, fallback: string) { return isRecord(value) && typeof value.message === "string" ? value.message : fallback; }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function formatOption(value: string) { return value.replaceAll("_", " "); }
function formatDate(value: string | null | undefined, locale: string | undefined, emptyLabel: string) { if (!value) return emptyLabel; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "medium" }).format(date); }
function formatDuration(value: number | undefined, locale: string | undefined, emptyLabel: string) { if (typeof value !== "number") return emptyLabel; return value >= 1000 ? `${(value / 1000).toLocaleString(locale, { maximumFractionDigits: 2 })} s` : `${value.toLocaleString(locale)} ms`; }
function isFailure(value: string | undefined) { return Boolean(value && /fail|error/i.test(value)); }
