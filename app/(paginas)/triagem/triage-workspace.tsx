"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, Bot, ClipboardCheck, LoaderCircle, RefreshCw, Save, X } from "lucide-react";
import { toast } from "sonner";
import { useAccessibleDialog } from "@/components/accessible-dialog";
import { DynamicFormFieldValue } from "@/components/dynamic-form-field";
import type { ProcessInstance, ProcessList } from "@/types/Processo";
import type { ApiRecord } from "@/types/Servico";
import type {
  TriageAiReportProps,
  TriageDecisionDialogProps,
  TriageDecisionInput,
  TriageFeedbackVerdict,
  TriageFieldCardProps,
  TriageFieldReviewStatus,
  TriageLoadingProps,
  TriageMessageProps,
  TriageQueueCardProps,
  TriageQueueState,
  TriageReviewPanelProps,
  TriageSnapshot,
  TriageWorkspaceState,
} from "@/types/Triagem";

const REVIEW_STATUSES: TriageFieldReviewStatus[] = ["APPROVED", "NEEDS_REVISION", "REJECTED"];
const FEEDBACK_VERDICTS: TriageFeedbackVerdict[] = ["agree", "disagree", "inconclusive"];

export function TriageWorkspace() {
  const [queue, setQueue] = useState<TriageQueueState>({ kind: "loading" });
  const [workspace, setWorkspace] = useState<TriageWorkspaceState>({ kind: "closed" });
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const detailControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setQueue({ kind: "loading" });
      try {
        const response = await fetch("/api/triage?page=1&size=100", { cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (!response.ok || !isProcessList(payload)) {
          setQueue(response.status === 403 ? { kind: "denied", message: getApiMessage(payload, "Seu perfil não pode acessar a triagem.") } : { kind: "error", message: getApiMessage(payload, "Não foi possível carregar a fila de triagem.") });
          return;
        }
        setQueue({ kind: "ready", processes: payload.items });
      } catch {
        if (!controller.signal.aborted) setQueue({ kind: "error", message: "Não foi possível conectar ao serviço de triagem." });
      }
    }
    void load();
    return () => controller.abort();
  }, [reloadKey]);

  useEffect(() => () => detailControllerRef.current?.abort(), []);

  async function selectProcess(process: ProcessInstance, preserveEdits = false) {
    const previous = preserveEdits && workspace.kind === "ready" && workspace.snapshot.process.id === process.id ? workspace : null;
    detailControllerRef.current?.abort();
    const controller = new AbortController();
    detailControllerRef.current = controller;
    setWorkspace({ kind: "loading", process });
    try {
      const response = await fetch(`/api/triage/${process.id}`, { cache: "no-store", signal: controller.signal });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (!response.ok || !isSnapshot(payload)) {
        setWorkspace({ kind: "error", process, message: getApiMessage(payload, "Não foi possível carregar a proposta para triagem.") });
        return;
      }
      const confirmedReviews = Object.fromEntries(Object.entries(payload.form.reviews).filter(([, review]) => isReviewStatus(review.status)).map(([fieldKey, review]) => [fieldKey, { field_key: fieldKey, status: review.status as TriageFieldReviewStatus, comments: review.comments ?? null }]));
      setWorkspace({
        kind: "ready",
        snapshot: payload,
        reviews: previous ? { ...confirmedReviews, ...previous.reviews } : confirmedReviews,
        feedback: previous?.feedback ?? {},
        isSavingReviews: false,
        isSavingFeedback: false,
        isDeciding: false,
      });
    } catch {
      if (!controller.signal.aborted) setWorkspace({ kind: "error", process, message: "Não foi possível conectar ao serviço de triagem." });
    } finally {
      if (detailControllerRef.current === controller) detailControllerRef.current = null;
    }
  }

  function updateReady(update: (state: Extract<TriageWorkspaceState, { kind: "ready" }>) => Extract<TriageWorkspaceState, { kind: "ready" }>) {
    setWorkspace((current) => current.kind === "ready" ? update(current) : current);
  }

  async function saveReviews() {
    if (workspace.kind !== "ready" || workspace.isSavingReviews) return;
    const reviews = Object.values(workspace.reviews);
    if (reviews.length === 0) { toast.error("Registre ao menos um parecer de campo."); return; }
    const incompleteReview = reviews.find((review) => review.status !== "APPROVED" && !review.comments?.trim());
    if (incompleteReview) { toast.error("Informe um comentário para campos que precisam de revisão ou foram rejeitados."); return; }
    updateReady((current) => ({ ...current, isSavingReviews: true }));
    try {
      const response = await fetch(`/api/triage/${workspace.snapshot.process.id}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviews }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(getApiMessage(payload, "Não foi possível salvar os pareceres."));
        if (response.status === 409) await selectProcess(workspace.snapshot.process, true);
        return;
      }
      toast.success("Pareceres de campo salvos.");
      await selectProcess(workspace.snapshot.process);
    } catch { toast.error("Não foi possível conectar ao serviço de triagem."); }
    finally { updateReady((current) => ({ ...current, isSavingReviews: false })); }
  }

  async function saveFeedback() {
    if (workspace.kind !== "ready" || workspace.isSavingFeedback || !workspace.snapshot.preEvaluation) return;
    const items = Object.values(workspace.feedback);
    if (items.length === 0) { toast.error("Registre ao menos um feedback de critério."); return; }
    const incompleteFeedback = items.find((item) => item.verdict === "disagree" && !item.reason?.trim());
    if (incompleteFeedback) { toast.error("Informe o motivo ao discordar de um critério automático."); return; }
    updateReady((current) => ({ ...current, isSavingFeedback: true }));
    try {
      const response = await fetch(`/api/triage/${workspace.snapshot.process.id}/feedback/${workspace.snapshot.preEvaluation.run_id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(getApiMessage(payload, "Não foi possível salvar o feedback."));
        if (response.status === 409) await selectProcess(workspace.snapshot.process, true);
        return;
      }
      toast.success("Feedback sobre a pré-avaliação salvo.");
      await selectProcess(workspace.snapshot.process);
    } catch { toast.error("Não foi possível conectar ao serviço de triagem."); }
    finally { updateReady((current) => ({ ...current, isSavingFeedback: false })); }
  }

  async function decide(input: TriageDecisionInput) {
    if (workspace.kind !== "ready" || workspace.isDeciding) return false;
    updateReady((current) => ({ ...current, isDeciding: true }));
    try {
      const response = await fetch(`/api/triage/${workspace.snapshot.process.id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || typeof payload.new_process_status !== "string") {
        toast.error(getApiMessage(payload, "Não foi possível registrar a decisão."));
        if (response.status === 409) await selectProcess(workspace.snapshot.process, true);
        return false;
      }
      const confirmation = await fetch(`/api/processes/${workspace.snapshot.process.id}`, { cache: "no-store" });
      const confirmedProcess = await confirmation.json().catch(() => null);
      const confirmedStatus = confirmation.ok && isProcess(confirmedProcess) ? confirmedProcess.status : payload.new_process_status;
      const expectedStatus = getExpectedDecisionStatus(input.outcome);
      if (confirmedStatus !== expectedStatus) {
        toast.warning(`A decisão foi registrada, mas o processo está em ${formatOption(confirmedStatus)}.`);
      } else {
        toast.success(`Decisão registrada. Novo estado: ${formatOption(confirmedStatus)}.`);
      }
      setWorkspace({ kind: "closed" });
      setReloadKey((value) => value + 1);
      return true;
    } catch { toast.error("Não foi possível conectar ao serviço de triagem."); return false; }
    finally { updateReady((current) => ({ ...current, isDeciding: false })); }
  }

  const normalizedSearch = search.trim().toLocaleLowerCase("pt-BR");
  const visibleProcesses = queue.kind === "ready" ? queue.processes.filter((process) => !normalizedSearch || `${process.code} ${process.title} ${process.template_key}`.toLocaleLowerCase("pt-BR").includes(normalizedSearch)) : [];
  const selectedId = workspace.kind === "ready" ? workspace.snapshot.process.id : workspace.kind === "loading" || workspace.kind === "error" ? workspace.process.id : null;

  return (
    <div className="grid flex-1 gap-5 py-7 lg:grid-cols-[21rem_minmax(0,1fr)]">
      <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="flex gap-2" onSubmit={(event: FormEvent) => event.preventDefault()} role="search"><label className="min-w-0 flex-1"><span className="sr-only">Filtrar fila</span><input className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" onChange={(event) => setSearch(event.target.value)} placeholder="Código, título ou tipo" value={search} /></label><button aria-label="Atualizar fila" className="grid size-11 place-items-center rounded-xl bg-teal-700 text-white" onClick={() => setReloadKey((value) => value + 1)} type="button"><RefreshCw aria-hidden="true" className="size-4" /></button></form>
        <div className="mt-4 grid gap-3">{queue.kind === "loading" ? <Loading label="Carregando fila…" /> : queue.kind === "error" || queue.kind === "denied" ? <Message action={queue.kind === "error" ? () => setReloadKey((value) => value + 1) : undefined} message={queue.message} /> : visibleProcesses.length === 0 ? <Message message={normalizedSearch ? "Nenhum processo corresponde ao filtro." : "Não há processos aguardando triagem."} /> : visibleProcesses.map((process) => <TriageQueueCard key={process.id} onSelect={(selected) => void selectProcess(selected)} process={process} selected={selectedId === process.id} />)}</div>
      </aside>
      <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">{workspace.kind === "closed" ? <div className="grid min-h-96 place-items-center p-8 text-center"><div><ClipboardCheck aria-hidden="true" className="mx-auto size-10 text-teal-700" /><h2 className="mt-4 text-xl font-bold text-slate-900">Selecione uma proposta</h2><p className="mt-2 text-sm text-slate-600">Revise os campos, a pré-avaliação e o histórico antes da decisão.</p></div></div> : <TriageReviewPanel onDecision={decide} onFeedbackChange={(itemId, verdict, reason) => updateReady((current) => ({ ...current, feedback: { ...current.feedback, [itemId]: { item_id: itemId, verdict, reason: reason || null } } }))} onRetry={() => { const process = workspace.kind === "ready" ? workspace.snapshot.process : workspace.process; void selectProcess(process); }} onReviewChange={(fieldKey, status, comments) => updateReady((current) => ({ ...current, reviews: { ...current.reviews, [fieldKey]: { field_key: fieldKey, status, comments: comments || null } } }))} onSaveFeedback={() => void saveFeedback()} onSaveReviews={() => void saveReviews()} state={workspace} />}</section>
    </div>
  );
}

function TriageQueueCard({ process, selected, onSelect }: TriageQueueCardProps) {
  return <button aria-pressed={selected} className={`w-full rounded-xl border p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${selected ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-teal-300"}`} onClick={() => onSelect(process)} type="button"><p className="font-mono text-[0.7rem] font-bold text-teal-700">{process.code}</p><p className="mt-1 font-semibold text-slate-900">{process.title}</p><div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>{process.template_key}</span>{process.started_at && <span>{formatDate(process.started_at)}</span>}</div></button>;
}

function TriageReviewPanel({ state, onRetry, onReviewChange, onFeedbackChange, onSaveReviews, onSaveFeedback, onDecision }: TriageReviewPanelProps) {
  const [decisionOpen, setDecisionOpen] = useState(false);
  if (state.kind === "loading") return <Loading label="Carregando proposta…" />;
  if (state.kind === "error") return <div className="p-6"><Message action={onRetry} message={state.message} /></div>;
  const busy = state.isSavingReviews || state.isSavingFeedback || state.isDeciding;
  const fields = state.snapshot.form.fields.slice().sort((first, second) => first.order_index - second.order_index);
  const sections = [...new Set(fields.map((field) => field.section?.trim() || "Geral"))];
  return <div><header className="border-b border-slate-200 p-5 sm:p-6"><p className="font-mono text-xs font-bold text-teal-700">{state.snapshot.process.code}</p><div className="mt-1 flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-2xl font-bold text-slate-900">{state.snapshot.process.title}</h2><p className="mt-1 text-sm text-slate-500">{state.snapshot.process.template_key}</p></div><button className="min-h-11 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white" disabled={busy} onClick={() => setDecisionOpen(true)} type="button">Registrar decisão final</button></div></header><div className="grid gap-6 p-5 sm:p-6">
    {sections.map((section) => <section key={section}><h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">{section}</h3><div className="mt-3 grid gap-3">{fields.filter((field) => (field.section?.trim() || "Geral") === section).map((field) => <TriageFieldCard disabled={busy} field={field} key={field.field_key} onChange={(status, comments) => onReviewChange(field.field_key, status, comments)} review={state.reviews[field.field_key]} value={state.snapshot.form.values[field.field_key]} />)}</div></section>)}
    <button className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-teal-700 px-4 text-sm font-bold text-teal-800" disabled={busy || Object.keys(state.reviews).length === 0} onClick={onSaveReviews} type="button">{state.isSavingReviews ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}Salvar pareceres</button>
    <TriageAiReport disabled={busy} evaluation={state.snapshot.preEvaluation} feedback={state.feedback} onChange={onFeedbackChange} />
    {state.snapshot.preEvaluation && <button className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-violet-700 px-4 text-sm font-bold text-violet-800" disabled={busy || Object.keys(state.feedback).length === 0} onClick={onSaveFeedback} type="button">{state.isSavingFeedback ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}Salvar feedback da IA</button>}
    <section><h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Linha do tempo</h3>{state.snapshot.timeline.events.length === 0 ? <p className="mt-3 text-sm text-slate-600">Ainda não há eventos disponíveis para este processo.</p> : <div className="mt-3 border-l-2 border-slate-200 pl-4">{state.snapshot.timeline.events.map((event) => <details className="mb-3 rounded-lg border border-slate-200 p-3" key={event.id}><summary className="cursor-pointer text-sm font-semibold text-slate-800">{formatOption(event.event_type)} · {formatDate(event.occurred_at)}</summary>{event.context_data && <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-3 text-xs text-slate-100">{JSON.stringify(event.context_data, null, 2)}</pre>}</details>)}</div>}</section>
  </div><TriageDecisionDialog isOpen={decisionOpen} isSaving={state.isDeciding} onClose={() => setDecisionOpen(false)} onSubmit={async (input) => { const saved = await onDecision(input); if (saved) setDecisionOpen(false); return saved; }} /></div>;
}

function TriageFieldCard({ field, value, review, disabled, onChange }: TriageFieldCardProps) {
  const status = review?.status ?? "APPROVED";
  return <article className="rounded-xl border border-slate-200 p-4"><DynamicFormFieldValue field={field} value={value} /><div className="mt-3 grid gap-3 sm:grid-cols-[13rem_1fr]"><label className="grid gap-1.5 text-xs font-bold text-slate-700">Parecer<select className="min-h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal" disabled={disabled} onChange={(event) => onChange(event.target.value as TriageFieldReviewStatus, review?.comments ?? "")} value={status}>{REVIEW_STATUSES.map((item) => <option key={item} value={item}>{formatReview(item)}</option>)}</select></label><label className="grid gap-1.5 text-xs font-bold text-slate-700">Comentário<textarea className="min-h-20 rounded-lg border border-slate-300 p-2 text-sm font-normal" disabled={disabled} onChange={(event) => onChange(status, event.target.value)} value={review?.comments ?? ""} /></label></div></article>;
}

function TriageAiReport({ evaluation, feedback, disabled, onChange }: TriageAiReportProps) {
  return <section className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4"><div className="flex items-center gap-2"><Bot aria-hidden="true" className="size-5 text-violet-700" /><h3 className="text-sm font-bold uppercase tracking-wide text-violet-900">Relatório da pré-avaliação</h3></div>{!evaluation ? <p className="mt-3 text-sm text-slate-600">O processo seguiu para triagem sem uma pré-avaliação automática disponível.</p> : <><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600"><span className="rounded-full bg-white px-2 py-1">Estado: {formatOption(evaluation.status)}</span><span className="rounded-full bg-white px-2 py-1">Resultado: {evaluation.consolidated_result ? formatOption(evaluation.consolidated_result) : "indisponível"}</span><span className="rounded-full bg-white px-2 py-1">Execução {evaluation.run_id}</span>{(evaluation.evaluations ?? []).map((item) => <span className="rounded-full bg-white px-2 py-1" key={`${item.definition_name}-${item.version_number}`}>{item.definition_name} · v{item.version_number}</span>)}</div><p className="mt-3 text-xs text-slate-600">{evaluation.summary.compliant} conformes · {evaluation.summary.non_compliant} não conformes · {evaluation.summary.partial} parciais · {evaluation.summary.indeterminate} indeterminados</p>{evaluation.error_summary ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">Falha técnica: {evaluation.error_summary}</p> : evaluation.consolidated_result === "negative" ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">A avaliação automática encontrou pontos que exigem análise humana.</p> : evaluation.consolidated_result === "positive" ? <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">A avaliação automática concluiu o conteúdo como positivo.</p> : null}<div className="mt-4 grid gap-3">{(evaluation.attention_points ?? []).map((point) => { const current = feedback[point.item_id]; const verdict = current?.verdict ?? "inconclusive"; return <article className="rounded-xl border border-violet-100 bg-white p-4" key={point.item_id}><div className="flex flex-wrap gap-2 text-[0.68rem] font-bold uppercase text-slate-500"><span>{formatOption(point.conclusion)}</span><span>{formatOption(point.severity)}</span>{point.evidence_location && <span>Campo {point.evidence_location}</span>}</div><p className="mt-2 text-sm font-semibold text-slate-900">{point.criterion_statement}</p>{point.evidence_excerpt && <p className="mt-2 text-xs leading-5 text-slate-600">Evidência: {point.evidence_excerpt}</p>}{point.justification && <p className="mt-2 text-xs leading-5 text-slate-600">Justificativa automática: {point.justification}</p>}<div className="mt-3 grid gap-3 sm:grid-cols-[12rem_1fr]"><label className="grid gap-1 text-xs font-bold text-slate-700">Concordância<select className="min-h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal" disabled={disabled} onChange={(event) => onChange(point.item_id, event.target.value as TriageFeedbackVerdict, current?.reason ?? "")} value={verdict}>{FEEDBACK_VERDICTS.map((item) => <option key={item} value={item}>{formatFeedback(item)}</option>)}</select></label><label className="grid gap-1 text-xs font-bold text-slate-700">Motivo<textarea className="min-h-20 rounded-lg border border-slate-300 p-2 text-sm font-normal" disabled={disabled} onChange={(event) => onChange(point.item_id, verdict, event.target.value)} value={current?.reason ?? ""} /></label></div></article>; })}</div>{(evaluation.attention_points ?? []).length === 0 && !evaluation.error_summary && <p className="mt-4 text-sm text-slate-600">Nenhum ponto de atenção foi retornado para esta execução.</p>}</>}</section>;
}

function TriageDecisionDialog({ isOpen, isSaving, onClose, onSubmit }: TriageDecisionDialogProps) {
  const [outcome, setOutcome] = useState<TriageDecisionInput["outcome"]>("APPROVED");
  const [justification, setJustification] = useState("");
  const dialogRef = useAccessibleDialog(isOpen, isSaving, onClose);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4" role="presentation"><div aria-labelledby="triage-decision-title" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" ref={dialogRef} role="dialog" tabIndex={-1}><div className="flex justify-between gap-3"><div><ClipboardCheck aria-hidden="true" className="size-8 text-teal-700" /><h2 className="mt-3 text-xl font-bold text-slate-900" id="triage-decision-title">Confirmar decisão final</h2></div><button aria-label="Fechar" className="grid size-10 place-items-center" disabled={isSaving} onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button></div><label className="mt-4 grid gap-1.5 text-sm font-bold text-slate-800">Resultado<select className="min-h-11 rounded-xl border border-slate-300 px-3 font-normal" disabled={isSaving} onChange={(event) => setOutcome(event.target.value as TriageDecisionInput["outcome"])} value={outcome}><option value="APPROVED">Aprovar e avançar ao planejamento</option><option value="NEEDS_REVISION">Solicitar correção ao proponente</option><option value="REJECTED">Rejeitar e encerrar</option></select></label><label className="mt-4 grid gap-1.5 text-sm font-bold text-slate-800">Justificativa<textarea className="min-h-28 rounded-xl border border-slate-300 p-3 font-normal" disabled={isSaving} maxLength={4000} onChange={(event) => setJustification(event.target.value)} value={justification} /></label><div className="mt-5 flex justify-end gap-3"><button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold" disabled={isSaving} onClick={onClose} type="button">Cancelar</button><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white disabled:opacity-60" disabled={isSaving || justification.trim().length < 3} onClick={() => void onSubmit({ outcome, justification })} type="button">{isSaving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}Confirmar decisão</button></div></div></div>;
}

function Loading({ label }: TriageLoadingProps) { return <div className="flex min-h-32 items-center justify-center gap-2 p-5 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />{label}</div>; }
function Message({ message, action }: TriageMessageProps) { return <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center"><AlertCircle aria-hidden="true" className="mx-auto size-6 text-slate-500" /><p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>{action && <button className="mt-3 min-h-10 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white" onClick={action} type="button">Tentar novamente</button>}</div>; }
function isProcessList(value: unknown): value is ProcessList { return isRecord(value) && Array.isArray(value.items) && value.items.every(isProcess) && typeof value.total === "number"; }
function isProcess(value: unknown): value is ProcessInstance { return isRecord(value) && typeof value.id === "string" && typeof value.code === "string" && typeof value.title === "string" && typeof value.status === "string" && typeof value.template_key === "string" && typeof value.version_number === "number"; }
function isSnapshot(value: unknown): value is TriageSnapshot { return isRecord(value) && isProcess(value.process) && isRecord(value.form) && Array.isArray(value.form.fields) && isRecord(value.form.values) && isRecord(value.timeline) && Array.isArray(value.timeline.events); }
function isReviewStatus(value: string): value is TriageFieldReviewStatus { return REVIEW_STATUSES.includes(value as TriageFieldReviewStatus); }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function getApiMessage(value: unknown, fallback: string) { return isRecord(value) && typeof value.message === "string" ? value.message : fallback; }
function formatOption(value: string) { return value.replaceAll("_", " "); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(date); }
function formatReview(value: TriageFieldReviewStatus) { return value === "APPROVED" ? "Aprovado" : value === "NEEDS_REVISION" ? "Precisa de revisão" : "Rejeitado"; }
function formatFeedback(value: TriageFeedbackVerdict) { return value === "agree" ? "Concordo" : value === "disagree" ? "Discordo" : "Inconclusivo"; }
function getExpectedDecisionStatus(outcome: TriageDecisionInput["outcome"]) { return outcome === "APPROVED" ? "PLANNING" : outcome === "NEEDS_REVISION" ? "SUBMISSION" : "CLOSED"; }
