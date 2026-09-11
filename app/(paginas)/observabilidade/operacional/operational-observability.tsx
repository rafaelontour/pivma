"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Activity, AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
  isOperationalEvent,
  mergeOperationalEvents,
  operationalEventMatches,
  parseSseData,
  safePayload,
} from "@/components/observabilidade";
import type {
  ConnectionBadgeProps,
  ObservabilityConnectionState,
  ObservabilityMessageProps,
  OperationalEventCardProps,
  OperationalFilters,
  OperationalObservabilityState,
} from "@/types/Observabilidade";
import type { ApiRecord } from "@/types/Servico";

export function OperationalObservability() {
  const [filters, setFilters] = useState<OperationalFilters>({ limit: "100", status: "", operationType: "" });
  const [appliedFilters, setAppliedFilters] = useState(filters);
  const [state, setState] = useState<OperationalObservabilityState>({ kind: "loading", events: [] });
  const [connection, setConnection] = useState<ObservabilityConnectionState>("connecting");
  const hasConnectedRef = useRef(false);
  const isDenied = state.kind === "denied";

  const loadHistory = useCallback(async (preserve: boolean) => {
    const query = new URLSearchParams({ limit: appliedFilters.limit });
    if (appliedFilters.status) query.set("status", appliedFilters.status);
    if (appliedFilters.operationType) query.set("operation_type", appliedFilters.operationType);
    try {
      const response = await fetch(`/api/observability/operational?${query}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(payload) || !payload.every(isOperationalEvent)) {
        const message = getApiMessage(payload, "Não foi possível carregar o histórico operacional.");
        setState((current) => response.status === 403 ? { kind: "denied", message, events: current.events } : { kind: "error", message, events: current.events });
        return;
      }
      setState((current) => ({ kind: "ready", events: mergeOperationalEvents(preserve ? current.events : [], payload) }));
    } catch {
      setState((current) => ({ kind: "error", message: "Não foi possível conectar ao histórico operacional.", events: current.events }));
    }
  }, [appliedFilters]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadHistory(false), 0);
    return () => window.clearTimeout(timer);
  }, [loadHistory]);

  useEffect(() => {
    if (isDenied) return;
    const source = new EventSource("/api/observability/operational/stream");
    source.onopen = () => {
      setConnection("live");
      if (hasConnectedRef.current) void loadHistory(true);
      hasConnectedRef.current = true;
    };
    source.onmessage = (message) => {
      const event = parseSseData(message.data);
      if (!isOperationalEvent(event) || !operationalEventMatches(event, appliedFilters)) return;
      setState((current) => ({ kind: "ready", events: mergeOperationalEvents(current.events, [event]) }));
    };
    source.onerror = () => setConnection("disconnected");
    return () => source.close();
  }, [appliedFilters, isDenied, loadHistory]);

  function applyFilters(event: FormEvent) {
    event.preventDefault();
    const limit = Number(filters.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) {
      toast.error("Informe um limite entre 1 e 500 eventos.");
      return;
    }
    setState((current) => ({ kind: "loading", events: current.events }));
    setConnection("connecting");
    setAppliedFilters({ ...filters, limit: String(limit), status: filters.status.trim(), operationType: filters.operationType.trim() });
  }

  return <div className="flex flex-1 flex-col gap-5 py-7"><form className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[7rem_1fr_1fr_auto]" onSubmit={applyFilters}><label className="grid gap-1 text-xs font-bold text-slate-700">Limite<input className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" inputMode="numeric" max={500} min={1} onChange={(event) => setFilters((current) => ({ ...current, limit: event.target.value }))} type="number" value={filters.limit} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Estado<input className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" maxLength={128} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))} placeholder="Ex.: SUCCESS" value={filters.status} /></label><label className="grid gap-1 text-xs font-bold text-slate-700">Tipo de operação<input className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal" maxLength={128} onChange={(event) => setFilters((current) => ({ ...current, operationType: event.target.value }))} placeholder="Tipo exato" value={filters.operationType} /></label><button className="mt-auto inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white" type="submit"><RefreshCw aria-hidden="true" className="size-4" />Aplicar</button></form><div className="flex flex-wrap items-center justify-between gap-3"><ConnectionBadge state={connection} /><span className="text-xs text-slate-500">{state.events.length} eventos em memória</span></div>{state.kind === "loading" && state.events.length === 0 ? <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />Carregando histórico…</div> : state.kind === "denied" ? <ObservabilityMessage message={state.message} /> : state.kind === "error" && state.events.length === 0 ? <ObservabilityMessage message={state.message} onRetry={() => void loadHistory(false)} /> : <>{state.kind === "error" && <ObservabilityMessage message={state.message} onRetry={() => void loadHistory(true)} />}{state.events.length === 0 ? <ObservabilityMessage message="Nenhum evento corresponde aos filtros informados." /> : <div className="grid gap-3">{state.events.map((event, index) => <OperationalEventCard event={event} key={event.event_id ?? `${event.correlation_id}-${event.operation_type}-${event.timestamp ?? index}`} />)}</div>}</>}</div>;
}

function OperationalEventCard({ event }: OperationalEventCardProps) {
  return <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-900">{formatOption(event.operation_type)}</p><p className="mt-1 break-all font-mono text-xs text-slate-500">{event.correlation_id}</p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${event.error_summary ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"}`}>{event.status ?? "Sem estado"}</span></div><dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600"><div><dt className="font-bold">Instante</dt><dd>{formatDate(event.timestamp)}</dd></div><div><dt className="font-bold">Duração</dt><dd>{formatDuration(event.total_duration_ms)}</dd></div>{event.resource_id && <div><dt className="font-bold">Recurso</dt><dd className="break-all">{event.resource_id}</dd></div>}</dl>{event.error_summary && <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{event.error_summary}</p>}<details className="mt-3 rounded-lg border border-slate-200 p-3"><summary className="cursor-pointer text-sm font-semibold text-slate-700">Metadados autorizados</summary><pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{safePayload(event.metadata)}</pre></details></article>;
}

function ConnectionBadge({ state }: ConnectionBadgeProps) {
  return <span aria-live="polite" className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${state === "live" ? "bg-emerald-100 text-emerald-800" : state === "connecting" ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}><Activity aria-hidden="true" className="size-4" />{state === "live" ? "Atualização ao vivo" : state === "connecting" ? "Conectando ao fluxo" : "Fluxo desconectado; reconexão automática"}</span>;
}

function ObservabilityMessage({ message, onRetry }: ObservabilityMessageProps) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center"><AlertTriangle aria-hidden="true" className="mx-auto size-6 text-slate-500" /><p className="mt-2 text-sm text-slate-600">{message}</p>{onRetry && <button className="mt-4 rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white" onClick={onRetry} type="button">Tentar novamente</button>}</div>;
}

function getApiMessage(value: unknown, fallback: string) { return isRecord(value) && typeof value.message === "string" ? value.message : fallback; }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function formatOption(value: string) { return value.replaceAll("_", " "); }
function formatDate(value: string | undefined) { if (!value) return "Não informado"; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(date); }
function formatDuration(value: number) { return value >= 1000 ? `${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 2 })} s` : `${value.toLocaleString("pt-BR")} ms`; }
