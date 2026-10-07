"use client";

import type { FormEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowLeft, Bot, CalendarDays, CheckCircle2, ClipboardCheck, History, Info, LoaderCircle, RefreshCw, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { getLocalizedApiError } from "@/i18n/errors";
import { DynamicFormFieldValue } from "@/components/dynamic-form-field";
import type { ProcessInstance, ProcessList } from "@/types/Processo";
import type { ApiRecord } from "@/types/Servico";
import type {
  TriageAiReportProps,
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
  TriageTimelineViewProps,
  TriageWorkspaceState,
  TriageWorkspaceProps,
} from "@/types/Triagem";

const REVIEW_STATUSES: TriageFieldReviewStatus[] = ["APPROVED", "NEEDS_REVISION", "REJECTED"];
const FEEDBACK_VERDICTS: TriageFeedbackVerdict[] = ["agree", "disagree", "inconclusive"];
const TRIAGE_LOAD_TIMEOUT_MS = 20_000;
// Temporarily disabled to exercise the integrated triage flow with partial field reviews.
// Restore this to true after the test period; the backend remains authoritative.
const ENFORCE_TRIAGE_FIELD_REVIEW_VALIDATION = false;

export function TriageWorkspace({
  embedded = false,
  initialProcess,
  onCompleted,
}: TriageWorkspaceProps = {}) {
  const { i18n, t } = useTranslation();
  const [queue, setQueue] = useState<TriageQueueState>(
    initialProcess
      ? { kind: "ready", processes: [initialProcess] }
      : { kind: "loading" },
  );
  const [workspace, setWorkspace] = useState<TriageWorkspaceState>({ kind: "closed" });
  const workspaceRef = useRef(workspace);
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const detailControllerRef = useRef<AbortController | null>(null);
  const initializedProcessRef = useRef<string | null>(null);

  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);

  useEffect(() => {
    if (embedded) return;
    const controller = new AbortController();
    async function load() {
      setQueue({ kind: "loading" });
      try {
        const response = await fetch("/api/triage?page=1&size=100", { cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (!response.ok || !isProcessList(payload)) {
          setQueue(response.status === 403 ? { kind: "denied", message: getApiMessage(payload, t("triage.denied"), t) } : { kind: "error", message: getApiMessage(payload, t("triage.queueFailed"), t) });
          return;
        }
        setQueue({ kind: "ready", processes: payload.items });
      } catch {
        if (!controller.signal.aborted) setQueue({ kind: "error", message: t("triage.connectionFailed") });
      }
    }
    void load();
    return () => controller.abort();
  }, [embedded, reloadKey, t]);

  useEffect(() => () => detailControllerRef.current?.abort(), []);

  const selectProcess = useCallback(async (process: ProcessInstance, preserveEdits = false) => {
    const currentWorkspace = workspaceRef.current;
    const previous = preserveEdits && currentWorkspace.kind === "ready" && currentWorkspace.snapshot.process.id === process.id ? currentWorkspace : null;
    detailControllerRef.current?.abort();
    const controller = new AbortController();
    let didTimeOut = false;
    const timeoutId = window.setTimeout(() => {
      didTimeOut = true;
      controller.abort();
    }, TRIAGE_LOAD_TIMEOUT_MS);
    detailControllerRef.current = controller;
    setWorkspace({ kind: "loading", process });
    try {
      const response = await fetch(`/api/triage/${process.id}`, { cache: "no-store", signal: controller.signal });
      const payload = await response.json().catch(() => null);
      if (controller.signal.aborted) return;
      if (!response.ok || !isSnapshot(payload)) {
        setWorkspace({ kind: "error", process, message: getApiMessage(payload, t("triage.proposalFailed"), t) });
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
      if (didTimeOut) {
        setWorkspace({ kind: "error", process, message: t("triage.proposalTimeout") });
      } else if (!controller.signal.aborted) {
        setWorkspace({ kind: "error", process, message: t("triage.connectionFailed") });
      }
    } finally {
      window.clearTimeout(timeoutId);
      if (detailControllerRef.current === controller) detailControllerRef.current = null;
    }
  }, [t]);

  useEffect(() => {
    if (
      !embedded ||
      !initialProcess ||
      initializedProcessRef.current === initialProcess.id
    ) {
      return;
    }

    initializedProcessRef.current = initialProcess.id;
    void selectProcess(initialProcess);
    return () => {
      if (initializedProcessRef.current === initialProcess.id) {
        initializedProcessRef.current = null;
      }
      detailControllerRef.current?.abort();
    };
  }, [embedded, initialProcess, selectProcess]);

  function updateReady(update: (state: Extract<TriageWorkspaceState, { kind: "ready" }>) => Extract<TriageWorkspaceState, { kind: "ready" }>) {
    setWorkspace((current) => current.kind === "ready" ? update(current) : current);
  }

  async function saveFeedback() {
    if (workspace.kind !== "ready" || workspace.isSavingFeedback || !workspace.snapshot.preEvaluation) return;
    const items = Object.values(workspace.feedback);
    if (items.length === 0) { toast.error(t("triage.feedbackRequired")); return; }
    const incompleteFeedback = items.find((item) => item.verdict === "disagree" && !item.reason?.trim());
    if (incompleteFeedback) { toast.error(t("triage.feedbackReasonRequired")); return; }
    updateReady((current) => ({ ...current, isSavingFeedback: true }));
    try {
      const response = await fetch(`/api/triage/${workspace.snapshot.process.id}/feedback/${workspace.snapshot.preEvaluation.run_id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        toast.error(getApiMessage(payload, t("triage.feedbackSaveFailed"), t));
        if (response.status === 409) await selectProcess(workspace.snapshot.process, true);
        return;
      }
      toast.success(t("triage.feedbackSaved"));
      await selectProcess(workspace.snapshot.process);
    } catch { toast.error(t("triage.connectionFailed")); }
    finally { updateReady((current) => ({ ...current, isSavingFeedback: false })); }
  }

  async function decide(input: TriageDecisionInput) {
    if (workspace.kind !== "ready" || workspace.isDeciding) return false;
    const reviews = workspace.snapshot.form.fields.map((field) => workspace.reviews[field.field_key]);
    if (ENFORCE_TRIAGE_FIELD_REVIEW_VALIDATION && reviews.some((review) => !review)) {
      toast.error(t("triage.allFieldsReviewRequired"));
      return false;
    }
    const completedReviews = reviews.filter((review): review is NonNullable<typeof review> => Boolean(review));
    if (ENFORCE_TRIAGE_FIELD_REVIEW_VALIDATION && completedReviews.some((review) => review.status !== "APPROVED" && !review.comments?.trim())) {
      toast.error(t("triage.reviewCommentRequired"));
      return false;
    }
    if (ENFORCE_TRIAGE_FIELD_REVIEW_VALIDATION && input.outcome === "NEEDS_REVISION" && !completedReviews.some((review) => review.status === "NEEDS_REVISION" || review.status === "REJECTED")) {
      toast.error(t("triage.correctionFieldRequired"));
      return false;
    }
    updateReady((current) => ({ ...current, isSavingReviews: true, isDeciding: true }));
    try {
      if (completedReviews.length > 0) {
        const reviewsResponse = await fetch(`/api/triage/${workspace.snapshot.process.id}/reviews`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reviews: completedReviews }) });
        const reviewsPayload = await reviewsResponse.json().catch(() => null);
        if (!reviewsResponse.ok) {
          toast.error(getApiMessage(reviewsPayload, t("triage.reviewsSaveFailed"), t));
          if (reviewsResponse.status === 409) await selectProcess(workspace.snapshot.process, true);
          return false;
        }
      }

      const response = await fetch(`/api/triage/${workspace.snapshot.process.id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || typeof payload.process_status !== "string") {
        toast.error(getApiMessage(payload, t("triage.decisionFailed"), t));
        if (response.status === 409) await selectProcess(workspace.snapshot.process, true);
        return false;
      }
      toast.success(t("triage.decisionSuccess", { status: t(`submissionTracking.statuses.${payload.process_status}`, { defaultValue: payload.process_status }) }));
      setWorkspace({ kind: "closed" });
      setReloadKey((value) => value + 1);
      onCompleted?.();
      return true;
    } catch { toast.error(t("triage.connectionFailed")); return false; }
    finally { updateReady((current) => ({ ...current, isSavingReviews: false, isDeciding: false })); }
  }

  const normalizedSearch = search.trim().toLocaleLowerCase(i18n.resolvedLanguage);
  const visibleProcesses = queue.kind === "ready" ? queue.processes.filter((process) => !normalizedSearch || `${process.code} ${process.title} ${process.template_key}`.toLocaleLowerCase(i18n.resolvedLanguage).includes(normalizedSearch)) : [];
  const selectedId = workspace.kind === "ready" ? workspace.snapshot.process.id : workspace.kind === "loading" || workspace.kind === "error" ? workspace.process.id : null;

  return (
    <div className={embedded ? "h-full min-h-0 overflow-y-auto" : "grid flex-1 gap-5 py-7 lg:grid-cols-[21rem_minmax(0,1fr)]"}>
      {!embedded && <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="flex gap-2" onSubmit={(event: FormEvent) => event.preventDefault()} role="search"><label className="min-w-0 flex-1"><span className="sr-only">{t("triage.filter")}</span><input className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" onChange={(event) => setSearch(event.target.value)} placeholder={t("triage.filterPlaceholder")} value={search} /></label><button aria-label={t("triage.refreshQueue")} className="grid size-11 place-items-center rounded-xl bg-teal-700 text-white" onClick={() => setReloadKey((value) => value + 1)} type="button"><RefreshCw aria-hidden="true" className="size-4" /></button></form>
        <div className="mt-4 grid gap-3">{queue.kind === "loading" ? <Loading label={t("triage.loadingQueue")} /> : queue.kind === "error" || queue.kind === "denied" ? <Message action={queue.kind === "error" ? () => setReloadKey((value) => value + 1) : undefined} message={queue.message} /> : visibleProcesses.length === 0 ? <Message message={normalizedSearch ? t("triage.noFilterResults") : t("triage.emptyQueue")} /> : visibleProcesses.map((process) => <TriageQueueCard key={process.id} onSelect={(selected) => void selectProcess(selected)} process={process} selected={selectedId === process.id} />)}</div>
      </aside>}
      <section className={`min-w-0 bg-white ${embedded ? "min-h-full" : "rounded-2xl border border-slate-200 shadow-sm"}`}>{workspace.kind === "closed" ? <div className="grid min-h-96 place-items-center p-8 text-center"><div><ClipboardCheck aria-hidden="true" className="mx-auto size-10 text-teal-700" /><h2 className="mt-4 text-xl font-bold text-slate-900">{t("triage.selectProposal")}</h2><p className="mt-2 text-sm text-slate-600">{t("triage.selectDescription")}</p></div></div> : <TriageReviewPanel key={selectedId} onDecision={decide} onFeedbackChange={(itemId, verdict, reason) => updateReady((current) => ({ ...current, feedback: { ...current.feedback, [itemId]: { item_id: itemId, verdict, reason: reason || null } } }))} onRetry={() => { const process = workspace.kind === "ready" ? workspace.snapshot.process : workspace.process; void selectProcess(process); }} onReviewChange={(fieldKey, status, comments) => updateReady((current) => ({ ...current, reviews: { ...current.reviews, [fieldKey]: { field_key: fieldKey, status, comments: comments || null } } }))} onSaveFeedback={() => void saveFeedback()} state={workspace} />}</section>
    </div>
  );
}

function TriageQueueCard({ process, selected, onSelect }: TriageQueueCardProps) {
  const { i18n } = useTranslation();
  return <button aria-pressed={selected} className={`w-full rounded-xl border p-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${selected ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:border-teal-300"}`} onClick={() => onSelect(process)} type="button"><p className="font-mono text-[0.7rem] font-bold text-teal-700">{process.code}</p><p className="mt-1 font-semibold text-slate-900">{process.title}</p><div className="mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>{process.template_key}</span>{process.started_at && <span>{formatDate(process.started_at, i18n.resolvedLanguage)}</span>}</div></button>;
}

function TriageReviewPanel({ state, onRetry, onReviewChange, onFeedbackChange, onSaveFeedback, onDecision }: TriageReviewPanelProps) {
  const { t } = useTranslation();
  const [outcome, setOutcome] = useState<TriageDecisionInput["outcome"] | "">("");
  const [justification, setJustification] = useState("");
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  if (state.kind === "loading") return <Loading label={t("triage.loadingProposal")} />;
  if (state.kind === "error") return <div className="p-6"><Message action={onRetry} message={state.message} /></div>;
  const readyState = state;
  const busy = state.isSavingReviews || state.isSavingFeedback || state.isDeciding;
  const fields = state.snapshot.form.fields.slice().sort((first, second) => first.order_index - second.order_index);
  const generalSection = t("triage.generalSection");
  const sections = [...new Set(fields.map((field) => field.section?.trim() || generalSection))];
  const hasSectionTabs = sections.length > 1;
  const visibleSectionIndex = Math.min(
    activeSectionIndex,
    Math.max(sections.length - 1, 0),
  );
  const correctedFields = fields.filter((field) =>
    state.snapshot.correctedFieldKeys.includes(field.field_key),
  );

  function focusCorrectedField(fieldKey: string) {
    const field = fields.find((candidate) => candidate.field_key === fieldKey);
    if (!field) return;
    const section = field.section?.trim() || generalSection;
    const sectionIndex = sections.indexOf(section);
    if (sectionIndex >= 0) setActiveSectionIndex(sectionIndex);
    setIsHistoryOpen(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const fieldElement = document.getElementById(`triage-field-${fieldKey}`);
        fieldElement?.scrollIntoView({ behavior: "smooth", block: "center" });
        document.getElementById(`triage-review-${fieldKey}`)?.focus({
          preventScroll: true,
        });
      });
    });
  }

  function handleSectionTabKeyDown(
    event: React.KeyboardEvent<HTMLButtonElement>,
    sectionIndex: number,
  ) {
    let nextSectionIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextSectionIndex = (sectionIndex + 1) % sections.length;
    } else if (event.key === "ArrowLeft") {
      nextSectionIndex = (sectionIndex - 1 + sections.length) % sections.length;
    } else if (event.key === "Home") {
      nextSectionIndex = 0;
    } else if (event.key === "End") {
      nextSectionIndex = sections.length - 1;
    }

    if (nextSectionIndex === null) return;

    event.preventDefault();
    setActiveSectionIndex(nextSectionIndex);
    requestAnimationFrame(() => {
      document
        .getElementById(`triage-section-tab-${nextSectionIndex}`)
        ?.focus();
    });
  }

  function confirmDecision() {
    const missingField = fields.find((field) => !readyState.reviews[field.field_key]);
    if (ENFORCE_TRIAGE_FIELD_REVIEW_VALIDATION && missingField) {
      const missingSection = missingField.section?.trim() || generalSection;
      const missingSectionIndex = sections.indexOf(missingSection);
      if (missingSectionIndex >= 0) setActiveSectionIndex(missingSectionIndex);
      toast.error(t("triage.allFieldsReviewRequired"));
      requestAnimationFrame(() => document.getElementById(`triage-review-${missingField.field_key}`)?.focus());
      return;
    }
    const incompleteReview = fields
      .map((field) => readyState.reviews[field.field_key])
      .find((review) => review && review.status !== "APPROVED" && !review.comments?.trim());
    if (ENFORCE_TRIAGE_FIELD_REVIEW_VALIDATION && incompleteReview) {
      const incompleteField = fields.find((field) => field.field_key === incompleteReview.field_key);
      const incompleteSection = incompleteField?.section?.trim() || generalSection;
      const incompleteSectionIndex = sections.indexOf(incompleteSection);
      if (incompleteSectionIndex >= 0) setActiveSectionIndex(incompleteSectionIndex);
      toast.error(t("triage.reviewCommentRequired"));
      requestAnimationFrame(() => document.getElementById(`triage-comment-${incompleteReview.field_key}`)?.focus());
      return;
    }
    if (!outcome) {
      toast.error(t("triage.finalDecisionRequired"));
      document.getElementById("triage-final-outcome")?.focus();
      return;
    }
    if (justification.trim().length < 3) {
      toast.error(t("triage.finalJustificationRequired"));
      document.getElementById("triage-final-justification")?.focus();
      return;
    }
    if (ENFORCE_TRIAGE_FIELD_REVIEW_VALIDATION && outcome === "NEEDS_REVISION" && !fields.some((field) => {
      const status = readyState.reviews[field.field_key]?.status;
      return status === "NEEDS_REVISION" || status === "REJECTED";
    })) {
      toast.error(t("triage.correctionFieldRequired"));
      return;
    }
    void onDecision({ outcome, justification });
  }

  return <div><header className={`grid items-start gap-4 border-b border-slate-200 p-5 sm:p-6 ${correctedFields.length > 0 ? "lg:grid-cols-[minmax(0,1fr)_minmax(22rem,30rem)_auto]" : "lg:grid-cols-[minmax(0,1fr)_auto]"}`}><div className="min-w-0"><p className="font-mono text-xs font-bold text-teal-700">{state.snapshot.process.code}</p><h2 className="mt-1 truncate text-2xl font-bold text-slate-900">{state.snapshot.process.title}</h2><p className="mt-1 text-sm text-slate-500">{state.snapshot.process.template_key}</p></div>{correctedFields.length > 0 && <section aria-labelledby="triage-corrected-fields-title" className="min-w-0 rounded-xl border border-emerald-300 bg-emerald-50 p-3"><div className="flex items-start gap-2"><CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-700" /><div className="min-w-0"><h3 className="text-sm font-bold text-emerald-950" id="triage-corrected-fields-title">{t("triage.correctedFieldsTitle")}</h3><p className="mt-0.5 text-xs leading-5 text-emerald-900">{t("triage.correctedFieldsDescription")}</p></div></div><ul className="mt-2 max-h-32 space-y-2 overflow-y-auto pr-1">{correctedFields.map((field) => { const review = state.snapshot.form.reviews[field.field_key]; return <li key={field.field_key}><button aria-label={t("triage.goToCorrectedField", { field: field.label })} className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-left outline-none transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-600" onClick={() => focusCorrectedField(field.field_key)} type="button"><span className="flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-bold text-emerald-950">{field.label}</span>{review && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-bold text-amber-900">{t(`triage.reviewStatuses.${review.status}`, { defaultValue: review.status })}</span>}</span>{review?.comments && <span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600">{review.comments}</span>}</button></li>; })}</ul></section>}<button aria-expanded={isHistoryOpen} aria-label={t(isHistoryOpen ? "triage.showAnalysis" : "triage.showHistory")} className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${isHistoryOpen ? "border-teal-700 bg-teal-700 text-white" : "border-teal-700 bg-white text-teal-800 hover:bg-teal-50"}`} onClick={() => setIsHistoryOpen((current) => !current)} type="button"><History aria-hidden="true" className="size-4" />{t("triage.historyButton")}</button></header><div className="mx-5 mt-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2.5 text-sm leading-5 text-sky-900 sm:mx-6" role="note"><Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" /><p>{t("triage.historyToggleHint")}</p></div>{isHistoryOpen ? <TriageTimelineView onClose={() => setIsHistoryOpen(false)} timeline={state.snapshot.timeline} /> : <div className="grid items-start gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,1fr)_22rem] 2xl:grid-cols-[minmax(0,1fr)_24rem]">
    <div className="grid min-w-0 gap-6">
      <div className="min-w-0">
        {hasSectionTabs && (
          <div
            aria-label={t("triage.formSectionsLabel")}
            className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-2 pt-2"
            role="tablist"
          >
            {sections.map((section, sectionIndex) => {
              const isActive = sectionIndex === visibleSectionIndex;
              return (
                <button
                  aria-controls={`triage-section-panel-${sectionIndex}`}
                  aria-selected={isActive}
                  className={`min-h-11 shrink-0 whitespace-nowrap rounded-t-xl border border-b-0 px-4 py-2 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 ${
                    isActive
                      ? "border-slate-200 bg-white text-teal-800"
                      : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  id={`triage-section-tab-${sectionIndex}`}
                  key={section}
                  onClick={() => setActiveSectionIndex(sectionIndex)}
                  onKeyDown={(event) =>
                    handleSectionTabKeyDown(event, sectionIndex)
                  }
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                >
                  {section}
                </button>
              );
            })}
          </div>
        )}
        {sections.map((section, sectionIndex) => (
          <section
            aria-labelledby={hasSectionTabs ? `triage-section-tab-${sectionIndex}` : undefined}
            className={hasSectionTabs ? "pt-4" : undefined}
            hidden={hasSectionTabs && sectionIndex !== visibleSectionIndex}
            id={hasSectionTabs ? `triage-section-panel-${sectionIndex}` : undefined}
            key={section}
            role={hasSectionTabs ? "tabpanel" : undefined}
          >
            <h3 className={hasSectionTabs ? "sr-only" : "text-sm font-bold uppercase tracking-wide text-slate-600"}>
              {section}
            </h3>
            <div className={hasSectionTabs ? "grid gap-3 2xl:grid-cols-2" : "mt-3 grid gap-3 2xl:grid-cols-2"}>
              {fields
                .filter(
                  (field) =>
                    (field.section?.trim() || generalSection) === section,
                )
                .map((field) => (
                  <TriageFieldCard
                    corrected={state.snapshot.correctedFieldKeys.includes(field.field_key)}
                    disabled={busy}
                    field={field}
                    key={field.field_key}
                    onChange={(status, comments) =>
                      onReviewChange(field.field_key, status, comments)
                    }
                    review={state.reviews[field.field_key]}
                    value={state.snapshot.form.values[field.field_key]}
                  />
                ))}
            </div>
          </section>
        ))}
      </div>
      <TriageAiReport disabled={busy} evaluation={state.snapshot.preEvaluation} feedback={state.feedback} onChange={onFeedbackChange} />
      {state.snapshot.preEvaluation && <button className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-violet-700 px-4 text-sm font-bold text-violet-800" disabled={busy || Object.keys(state.feedback).length === 0} onClick={onSaveFeedback} type="button">{state.isSavingFeedback ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}{t("triage.saveAiFeedback")}</button>}
    </div>
    <aside className="sticky top-0 rounded-2xl border border-teal-200 bg-teal-50/60 p-5 shadow-sm"><div className="flex items-center gap-2"><ClipboardCheck aria-hidden="true" className="size-6 text-teal-700" /><h3 className="text-base font-bold text-slate-900">{t("triage.confirmDecision")}</h3></div><label className="mt-5 grid gap-1.5 text-sm font-bold text-slate-800">{t("triage.resultLabel")}<select className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal" disabled={busy} id="triage-final-outcome" onChange={(event) => setOutcome(event.target.value as TriageDecisionInput["outcome"] | "")} value={outcome}><option disabled value="">{t("triage.selectFinalDecision")}</option><option value="APPROVED">{t("triage.approve")}</option><option value="NEEDS_REVISION">{t("triage.requestCorrection")}</option><option value="REJECTED">{t("triage.reject")}</option></select></label><label className="mt-4 grid gap-1.5 text-sm font-bold text-slate-800">{t("triage.justification")}<textarea className="min-h-36 resize-y rounded-xl border border-slate-300 bg-white p-3 font-normal" disabled={busy} id="triage-final-justification" maxLength={4000} onChange={(event) => setJustification(event.target.value)} value={justification} /></label><button className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={busy || !outcome || justification.trim().length < 3} onClick={confirmDecision} type="button">{state.isDeciding && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{t("triage.confirm")}</button></aside>
  </div>}</div>;
}

function TriageTimelineView({ timeline, onClose }: TriageTimelineViewProps) {
  const { i18n, t } = useTranslation();
  const events = timeline.events.slice().sort(
    (first, second) => new Date(second.occurred_at).getTime() - new Date(first.occurred_at).getTime(),
  );

  return <section aria-labelledby="triage-history-title" className="min-h-0 p-5 sm:p-6"><div className="mx-auto max-w-4xl"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">{t("triage.historyEyebrow")}</p><h3 className="mt-1 text-xl font-bold text-slate-900" id="triage-history-title">{t("triage.historyTitle")}</h3><p className="mt-1 text-sm leading-6 text-slate-600">{t("triage.historyDescription")}</p></div><button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500" onClick={onClose} type="button"><ArrowLeft aria-hidden="true" className="size-4" />{t("triage.backToAnalysis")}</button></div>{events.length === 0 ? <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">{t("triage.noTimeline")}</div> : <ol className="mt-8" aria-label={t("triage.timeline")}>
    {events.map((event, index) => {
      const isLatest = index === 0;
      const details = getTimelineContextDetails(event.context_data, t);
      const justification = typeof event.context_data?.justification === "string" ? event.context_data.justification : null;
      return <li className="relative grid grid-cols-[1.5rem_minmax(0,1fr)] gap-4 pb-8 last:pb-0" key={event.id}>{index < events.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[0.71875rem] top-6 w-0.5 bg-teal-200" />}<span aria-hidden="true" className="relative z-10 mt-1 block size-6"><span className={`absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${isLatest ? "bg-teal-700" : "bg-teal-500"}`} />{isLatest && <span className="absolute inset-0 animate-ping rounded-full bg-teal-400 opacity-45 motion-reduce:animate-none" />}</span><article className={`rounded-2xl border p-4 shadow-sm ${isLatest ? "border-teal-300 bg-teal-50/70" : "border-slate-200 bg-white"}`}><div className="flex flex-wrap items-start justify-between gap-3"><div><h4 className="font-bold text-slate-900">{t(`triage.timelineEvents.${event.event_type}`, { defaultValue: formatTimelineEventFallback(event.event_type) })}</h4>{isLatest && <span className="mt-1 inline-block rounded-full bg-teal-700 px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-white">{t("triage.latestEvent")}</span>}</div><time className={`inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-bold shadow-sm ${isLatest ? "border-teal-300 bg-white text-teal-900" : "border-slate-200 bg-slate-50 text-slate-700"}`} dateTime={event.occurred_at}><CalendarDays aria-hidden="true" className={`size-4 ${isLatest ? "text-teal-700" : "text-slate-500"}`} />{formatDate(event.occurred_at, i18n.resolvedLanguage)}</time></div>{justification && <p className="mt-3 whitespace-pre-wrap rounded-lg bg-white/80 p-3 text-sm leading-6 text-slate-700">{justification}</p>}{details.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{details.map((detail) => <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600" key={detail}>{detail}</span>)}</div>}</article></li>;
    })}
  </ol>}</div></section>;
}

function getTimelineContextDetails(context: Record<string, unknown> | null | undefined, t: TFunction) {
  if (!context) return [];
  const details: string[] = [];
  if (typeof context.run_number === "number") details.push(t("triage.timelineRound", { number: context.run_number }));
  if (typeof context.source === "string") details.push(t(`triage.timelineSources.${context.source}`, { defaultValue: formatTimelineEventFallback(context.source) }));
  if (typeof context.choice === "string") details.push(t(`submissions.returnChoices.${context.choice}`, { defaultValue: formatTimelineEventFallback(context.choice) }));
  if (typeof context.outcome === "string") details.push(t(`triage.reviewStatuses.${context.outcome}`, { defaultValue: formatTimelineEventFallback(context.outcome) }));
  if (typeof context.activity_key === "string") details.push(t(`triage.timelineActivities.${context.activity_key}`, { defaultValue: formatTimelineEventFallback(context.activity_key) }));
  return details;
}

function formatTimelineEventFallback(value: string) {
  const normalized = value.toLocaleLowerCase().replaceAll("_", " ").trim();
  return normalized ? normalized[0].toLocaleUpperCase() + normalized.slice(1) : value;
}

function TriageFieldCard({ field, value, review, corrected, disabled, onChange }: TriageFieldCardProps) {
  const { t } = useTranslation();
  const status = review?.status ?? "";
  return <article className={`scroll-mt-6 rounded-xl border p-4 ${corrected ? "border-emerald-300 bg-emerald-50/40" : "border-slate-200"}`} id={`triage-field-${field.field_key}`}>{corrected && <p className="mb-3 w-fit rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">{t("triage.correctedByProponent")}</p>}<DynamicFormFieldValue field={field} value={value} /><div className="mt-3 grid gap-3 sm:grid-cols-[13rem_1fr]"><label className="grid gap-1.5 text-xs font-bold text-slate-700">{t("triage.review")}<select className="min-h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal" disabled={disabled} id={`triage-review-${field.field_key}`} onChange={(event) => onChange(event.target.value as TriageFieldReviewStatus, review?.comments ?? "")} value={status}><option disabled value="">{t("triage.registerDecision")}</option>{REVIEW_STATUSES.map((item) => <option key={item} value={item}>{t(`triage.reviewStatuses.${item}`)}</option>)}</select></label><label className="grid gap-1.5 text-xs font-bold text-slate-700">{t("triage.comment")}<textarea className="min-h-20 rounded-lg border border-slate-300 p-2 text-sm font-normal" disabled={disabled || !review} id={`triage-comment-${field.field_key}`} onChange={(event) => { if (review) onChange(review.status, event.target.value); }} value={review?.comments ?? ""} /></label></div></article>;
}

function TriageAiReport({ evaluation, feedback, disabled, onChange }: TriageAiReportProps) {
  const { t } = useTranslation();
  return <section className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4"><div className="flex items-center gap-2"><Bot aria-hidden="true" className="size-5 text-violet-700" /><h3 className="text-sm font-bold uppercase tracking-wide text-violet-900">{t("triage.report")}</h3></div>{!evaluation ? <p className="mt-3 text-sm text-slate-600">{t("triage.noPreEvaluation")}</p> : <><div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600"><span className="rounded-full bg-white px-2 py-1">{t("triage.status", { status: t(`submissionTracking.statuses.${evaluation.status}`, { defaultValue: evaluation.status }) })}</span><span className="rounded-full bg-white px-2 py-1">{t("triage.result", { result: evaluation.consolidated_result ? t(`aiEvaluations.options.${evaluation.consolidated_result}`, { defaultValue: evaluation.consolidated_result }) : t("triage.unavailable") })}</span><span className="rounded-full bg-white px-2 py-1">{t("triage.execution", { id: evaluation.run_id })}</span>{(evaluation.evaluations ?? []).map((item) => <span className="rounded-full bg-white px-2 py-1" key={`${item.definition_name}-${item.version_number}`}>{item.definition_name} · v{item.version_number}</span>)}</div><p className="mt-3 text-xs text-slate-600">{t("triage.summary", { compliant: evaluation.summary.compliant, nonCompliant: evaluation.summary.non_compliant, partial: evaluation.summary.partial, indeterminate: evaluation.summary.indeterminate })}</p>{evaluation.error_summary ? <p className="mt-3 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{t("triage.technicalFailure", { error: evaluation.error_summary })}</p> : evaluation.consolidated_result === "negative" ? <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{t("triage.negativeResult")}</p> : evaluation.consolidated_result === "positive" ? <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">{t("triage.positiveResult")}</p> : null}<div className="mt-4 grid gap-3">{(evaluation.attention_points ?? []).map((point) => { const current = feedback[point.item_id]; const verdict = current?.verdict ?? "inconclusive"; return <article className="rounded-xl border border-violet-100 bg-white p-4" key={point.item_id}><div className="flex flex-wrap gap-2 text-[0.68rem] font-bold uppercase text-slate-500"><span>{t(`aiEvaluations.options.${point.conclusion}`, { defaultValue: point.conclusion })}</span><span>{t(`aiEvaluations.options.${point.severity}`, { defaultValue: point.severity })}</span>{point.evidence_location && <span>{t("triage.field", { field: point.evidence_location })}</span>}</div><p className="mt-2 text-sm font-semibold text-slate-900">{point.criterion_statement}</p>{point.evidence_excerpt && <p className="mt-2 text-xs leading-5 text-slate-600">{t("triage.evidence", { evidence: point.evidence_excerpt })}</p>}{point.justification && <p className="mt-2 text-xs leading-5 text-slate-600">{t("triage.automaticJustification", { justification: point.justification })}</p>}<div className="mt-3 grid gap-3 sm:grid-cols-[12rem_1fr]"><label className="grid gap-1 text-xs font-bold text-slate-700">{t("triage.agreement")}<select className="min-h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal" disabled={disabled} onChange={(event) => onChange(point.item_id, event.target.value as TriageFeedbackVerdict, current?.reason ?? "")} value={verdict}>{FEEDBACK_VERDICTS.map((item) => <option key={item} value={item}>{t(`triage.feedbackVerdicts.${item}`)}</option>)}</select></label><label className="grid gap-1 text-xs font-bold text-slate-700">{t("triage.reason")}<textarea className="min-h-20 rounded-lg border border-slate-300 p-2 text-sm font-normal" disabled={disabled} onChange={(event) => onChange(point.item_id, verdict, event.target.value)} value={current?.reason ?? ""} /></label></div></article>; })}</div>{(evaluation.attention_points ?? []).length === 0 && !evaluation.error_summary && <p className="mt-4 text-sm text-slate-600">{t("triage.noAttentionPoints")}</p>}</>}</section>;
}

function Loading({ label }: TriageLoadingProps) { return <div className="flex min-h-32 items-center justify-center gap-2 p-5 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />{label}</div>; }
function Message({ message, action }: TriageMessageProps) { const { t } = useTranslation(); return <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center"><AlertCircle aria-hidden="true" className="mx-auto size-6 text-slate-500" /><p className="mt-2 text-sm leading-6 text-slate-600">{message}</p>{action && <button className="mt-3 min-h-10 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white" onClick={action} type="button">{t("common.retry")}</button>}</div>; }
function isProcessList(value: unknown): value is ProcessList { return isRecord(value) && Array.isArray(value.items) && value.items.every(isProcess) && typeof value.total === "number"; }
function isProcess(value: unknown): value is ProcessInstance { return isRecord(value) && typeof value.id === "string" && typeof value.code === "string" && typeof value.title === "string" && typeof value.status === "string" && typeof value.template_key === "string" && typeof value.version_number === "number"; }
function isSnapshot(value: unknown): value is TriageSnapshot { return isRecord(value) && isProcess(value.process) && isRecord(value.form) && Array.isArray(value.form.fields) && isRecord(value.form.values) && isRecord(value.timeline) && Array.isArray(value.timeline.events) && Array.isArray(value.correctedFieldKeys) && value.correctedFieldKeys.every((fieldKey) => typeof fieldKey === "string"); }
function isReviewStatus(value: string): value is TriageFieldReviewStatus { return REVIEW_STATUSES.includes(value as TriageFieldReviewStatus); }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function getApiMessage(value: unknown, fallback: string, t: TFunction) { return getLocalizedApiError(isRecord(value) ? value : null, fallback, t); }
function formatDate(value: string, locale: string | undefined) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(date); }
