"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, CheckCircle2, Clock3, LoaderCircle, RefreshCw, Send, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAccessibleDialog } from "@/components/accessible-dialog";
import type { ProcessInstance } from "@/types/Processo";
import type {
  DirectReviewDialogProps,
  DirectReviewResult,
  SubmissionPreEvaluation,
  SubmissionPreEvaluationPanelProps,
  SubmissionTrackingCardProps,
} from "@/types/Submissao";
import type { ApiRecord } from "@/types/Servico";

const POLL_INTERVAL_MS = 5000;

export function SubmissionTrackingCard({ submission, templateName, onProcessChanged }: SubmissionTrackingCardProps) {
  const [process, setProcess] = useState(submission);
  const [evaluation, setEvaluation] = useState<SubmissionPreEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const inFlight = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (inFlight.current || document.visibilityState === "hidden") return;
    inFlight.current = true;
    setIsRefreshing(true);
    setError(null);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const evaluationResponse = await fetch(`/api/submissions/${process.id}/pre-evaluation`, { cache: "no-store", signal: controller.signal });
      const evaluationPayload = await evaluationResponse.json().catch(() => null);
      if (evaluationResponse.ok && isPreEvaluation(evaluationPayload)) {
        setEvaluation(evaluationPayload);
      } else if (evaluationResponse.status !== 404 && evaluationResponse.status !== 409) {
        setError(getApiMessage(evaluationPayload, "Não foi possível atualizar a pré-avaliação."));
      }

      const processResponse = await fetch(`/api/submissions/${process.id}`, { cache: "no-store", signal: controller.signal });
      const processPayload = await processResponse.json().catch(() => null);
      if (processResponse.ok && isProcess(processPayload)) {
        if (processPayload.status !== process.status) onProcessChanged();
        setProcess(processPayload);
      }
    } catch {
      if (!controller.signal.aborted) setError("A atualização automática foi interrompida. Tente novamente.");
    } finally {
      if (!controller.signal.aborted) setIsRefreshing(false);
      inFlight.current = false;
    }
  }, [onProcessChanged, process.id, process.status]);

  useEffect(() => {
    const shouldPoll = process.status === "AI_PRE_EVALUATION";
    if (!shouldPoll) return;
    const initial = window.setTimeout(() => void refresh(), 0);
    const interval = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    function handleVisibility() { if (document.visibilityState === "visible") void refresh(); }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(initial);
      document.removeEventListener("visibilitychange", handleVisibility);
      abortRef.current?.abort();
    };
  }, [process.status, refresh]);

  return (
    <article className="flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-300/30">
      <div className="flex items-start justify-between gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800"><Bot aria-hidden="true" className="size-5" /></div><span className="max-w-48 rounded-full bg-teal-100 px-2.5 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-teal-800">{formatProcessStatus(process.status)}</span></div>
      <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-teal-700">{process.code}</p>
      <h3 className="mt-1 text-base font-bold text-slate-900">{process.title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{templateName}</p>
      {process.status === "AI_PRE_EVALUATION" && <div className="mt-4 flex items-center gap-2 rounded-xl bg-violet-50 p-3 text-xs font-semibold text-violet-900"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Pré-avaliação em andamento</div>}
      {evaluation && <SubmissionPreEvaluationPanel compact evaluation={evaluation} />}
      {!evaluation && process.status !== "AI_PRE_EVALUATION" && <p className="mt-4 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">O processo seguiu no fluxo sem relatório de IA disponível para esta sessão.</p>}
      {error && <p className="mt-3 text-xs leading-5 text-rose-700" role="alert">{error}</p>}
      <button className="mt-4 inline-flex min-h-9 w-fit items-center gap-2 rounded-lg border border-teal-700 px-3 text-xs font-bold text-teal-800 outline-none hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60" disabled={isRefreshing} onClick={() => void refresh()} type="button">{isRefreshing ? <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" /> : <RefreshCw aria-hidden="true" className="size-3.5" />}Atualizar</button>
    </article>
  );
}

export function SubmissionPreEvaluationPanel({ evaluation, compact = false }: SubmissionPreEvaluationPanelProps) {
  const positive = evaluation.consolidated_result === "positive";
  const negative = evaluation.consolidated_result === "negative";
  const failed = Boolean(evaluation.error_summary) || evaluation.status.toLowerCase() === "failed";
  return (
    <section className={`mt-4 rounded-xl border p-4 ${failed ? "border-rose-200 bg-rose-50" : negative ? "border-amber-200 bg-amber-50" : positive ? "border-emerald-200 bg-emerald-50" : "border-violet-200 bg-violet-50"}`}>
      <div className="flex items-start gap-2">{failed ? <XCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-700" /> : positive ? <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-emerald-700" /> : negative ? <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-700" /> : <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-violet-700" />}<div><p className="text-sm font-bold text-slate-900">{failed ? "Falha técnica na pré-avaliação" : positive ? "Pré-avaliação positiva" : negative ? "Correções recomendadas" : "Pré-avaliação em processamento"}</p><p className="mt-1 text-xs text-slate-600">{evaluation.summary.compliant} conforme(s) · {evaluation.summary.non_compliant} não conforme(s) · {evaluation.summary.indeterminate} inconclusivo(s)</p></div></div>
      {evaluation.error_summary && <p className="mt-3 text-xs leading-5 text-rose-800">{evaluation.error_summary}</p>}
      {(evaluation.attention_points ?? []).length > 0 && <div className="mt-3 grid gap-2">{(evaluation.attention_points ?? []).slice(0, compact ? 3 : undefined).map((point) => <article className="rounded-lg border border-black/10 bg-white/75 p-3" key={point.item_id}><div className="flex flex-wrap gap-2 text-[0.65rem] font-bold uppercase text-slate-500"><span>{formatOption(point.conclusion)}</span><span>{formatOption(point.severity)}</span></div><p className="mt-1 text-xs font-semibold leading-5 text-slate-800">{point.criterion_statement}</p>{point.recommendation && <p className="mt-1 text-xs leading-5 text-slate-600">{point.recommendation}</p>}{point.evidence_location && <p className="mt-1 font-mono text-[0.65rem] text-slate-500">Campo: {point.evidence_location}</p>}</article>)}</div>}
    </section>
  );
}

export function DirectReviewDialog({ process, isOpen, onClose, onConfirmed }: DirectReviewDialogProps) {
  const [justification, setJustification] = useState("");
  const [isSending, setIsSending] = useState(false);
  const dialogRef = useAccessibleDialog(isOpen, isSending, onClose);
  if (!isOpen) return null;
  async function confirm() {
    if (isSending) return;
    setIsSending(true);
    try {
      const response = await fetch(`/api/submissions/${process.id}/direct-review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ justification: justification.trim() || null }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isDirectReviewResult(payload)) { toast.error(getApiMessage(payload, "Não foi possível solicitar revisão humana.")); return; }
      const reachedTriage = payload.process_status === "TRIAGE" || await waitForTriage(process.id);
      toast.success(reachedTriage ? "Submissão encaminhada para triagem humana." : "Solicitação registrada. O estado continuará sendo atualizado pela lista.");
      onConfirmed();
      onClose();
    } catch {
      toast.error("Não foi possível conectar ao serviço de submissões.");
    } finally {
      setIsSending(false);
    }
  }
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4" role="presentation"><div aria-labelledby="direct-review-title" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" ref={dialogRef} role="dialog" tabIndex={-1}><Send aria-hidden="true" className="size-8 text-teal-700" /><h2 className="mt-3 text-xl font-bold text-slate-900" id="direct-review-title">Solicitar revisão humana?</h2><p className="mt-2 text-sm leading-6 text-slate-600">O relatório automático será preservado e a submissão seguirá diretamente para a triagem BraCVAM.</p><label className="mt-4 grid gap-1.5 text-sm font-semibold text-slate-800">Justificativa opcional<textarea className="min-h-24 rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" disabled={isSending} maxLength={2000} onChange={(event) => setJustification(event.target.value)} value={justification} /></label><div className="mt-5 flex justify-end gap-3"><button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700" disabled={isSending} onClick={onClose} type="button">Cancelar</button><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white disabled:opacity-60" disabled={isSending} onClick={() => void confirm()} type="button">{isSending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}Confirmar encaminhamento</button></div></div></div>;
}

export async function requestPreEvaluation(processId: string) {
  const response = await fetch(`/api/submissions/${processId}/pre-evaluation`, { cache: "no-store" });
  const payload = await response.json().catch(() => null);
  return response.ok && isPreEvaluation(payload) ? payload : null;
}

async function waitForTriage(processId: string) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await new Promise((resolve) => window.setTimeout(resolve, 1250));
    const response = await fetch(`/api/submissions/${processId}`, { cache: "no-store" });
    const payload = await response.json().catch(() => null);
    if (response.ok && isProcess(payload) && payload.status === "TRIAGE") return true;
  }
  return false;
}

function isPreEvaluation(value: unknown): value is SubmissionPreEvaluation { return isRecord(value) && typeof value.run_id === "string" && typeof value.correlation_id === "string" && typeof value.status === "string" && typeof value.started_at === "string" && isRecord(value.summary); }
function isDirectReviewResult(value: unknown): value is DirectReviewResult { return isRecord(value) && typeof value.process_status === "string" && typeof value.direct_review_request_id === "string"; }
function isProcess(value: unknown): value is ProcessInstance { return isRecord(value) && typeof value.id === "string" && typeof value.code === "string" && typeof value.title === "string" && typeof value.status === "string" && typeof value.template_key === "string" && typeof value.version_number === "number"; }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function getApiMessage(value: unknown, fallback: string) { return isRecord(value) && typeof value.message === "string" ? value.message : fallback; }
function formatOption(value: string) { return value.replaceAll("_", " "); }
function formatProcessStatus(status: string) { const labels: Record<string, string> = { AI_PRE_EVALUATION: "Pré-avaliação por IA", TRIAGE: "Em triagem", PLANNING: "Em planejamento", CLOSED: "Encerrado", SUBMISSION: "Correção solicitada" }; return labels[status] ?? status.replaceAll("_", " "); }
