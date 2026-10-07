"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  AlertCircle,
  Check,
  FileCheck2,
  FileClock,
  FilePenLine,
  FilePlus2,
  LockKeyhole,
  LoaderCircle,
  RefreshCw,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { getLocalizedApiError } from "@/i18n/errors";
import { DynamicFormFieldControl } from "@/components/dynamic-form-field";
import {
  buildDynamicFormInputs,
  buildDynamicFormValues,
  getPendingSubmissionCorrectionField,
  isSubmissionCorrectionFieldChanged,
  validateDynamicFormValues,
} from "@/components/formulario";
import type { ProcessInstance } from "@/types/Processo";
import type { ApiMessage, ApiRecord } from "@/types/Servico";
import type {
  DynamicFormField,
  DynamicFormReview,
  SaveSubmissionDraftResult,
  SubmissionCatalogMessageProps,
  SubmissionCatalogState,
  SubmissionDialogContentProps,
  SubmissionDialogIntent,
  SubmissionDialogState,
  SubmissionDraftCardProps,
  SubmissionDraftDeletionDialogProps,
  SubmissionDraftDeletionState,
  SubmissionDraftsState,
  SubmissionFieldInputs,
  SubmissionForm,
  SubmissionFormDialogProps,
  SubmissionFormOperation,
  SubmissionIdentificationDialogProps,
  SubmissionTab,
  SubmissionTemplate,
  SubmissionTemplateCardProps,
  SubmissionReturnReview,
  SubmissionReturnReviewChoice,
  SubmissionReturnReviewResult,
  SubmittedSubmissionsState,
  SubmitSubmissionResult,
} from "@/types/Submissao";
import {
  DirectReviewDialog,
  requestPreEvaluation,
  SubmissionPreEvaluationPanel,
  SubmissionTrackingCard,
} from "./submission-pre-evaluation";

export function SubmissionCatalog() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<SubmissionTab>("templates");
  const [state, setState] = useState<SubmissionCatalogState>({
    kind: "loading",
  });
  const [creatingTemplateKey, setCreatingTemplateKey] = useState<string | null>(
    null,
  );
  const [dialog, setDialog] = useState<SubmissionDialogState>({ kind: "closed" });
  const [draftsState, setDraftsState] = useState<SubmissionDraftsState>({
    kind: "loading",
  });
  const [submittedState, setSubmittedState] =
    useState<SubmittedSubmissionsState>({ kind: "loading" });
  const [openingDraftId, setOpeningDraftId] = useState<string | null>(null);
  const [draftDeletion, setDraftDeletion] =
    useState<SubmissionDraftDeletionState>({ kind: "closed" });
  const [identificationTemplate, setIdentificationTemplate] =
    useState<SubmissionTemplate | null>(null);
  const [submissionTitle, setSubmissionTitle] = useState("");
  const isCreatingRef = useRef(false);
  const isOpeningRef = useRef(false);
  const isDeletingRef = useRef(false);

  useEffect(() => {
    let active = true;

    void requestTemplates(t).then((nextState) => {
      if (active) {
        setState(nextState);
      }
    });

    void requestDrafts(t).then((nextState) => {
      if (active) {
        setDraftsState(nextState);
      }
    });

    void requestSubmittedSubmissions(t).then((nextState) => {
      if (active) {
        setSubmittedState(nextState);
      }
    });

    return () => {
      active = false;
    };
  }, [t]);

  useEffect(() => {
    if (dialog.kind === "closed") {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDialog({ kind: "closed" });
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dialog.kind]);

  async function selectTemplate(template: SubmissionTemplate) {
    if (isCreatingRef.current || isOpeningRef.current) return;
    setSubmissionTitle("");
    setIdentificationTemplate(template);
  }

  async function createIdentifiedSubmission() {
    const template = identificationTemplate;
    if (isCreatingRef.current || isOpeningRef.current) {
      return;
    }
    if (!template || submissionTitle.trim().length < 3 || submissionTitle.trim().length > 255) {
      toast.error(t("submissions.titleValidation"));
      return;
    }

    isCreatingRef.current = true;
    setCreatingTemplateKey(template.key);

    try {
      const createResponse = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: template.key, title: submissionTitle.trim() }),
      });
      const createPayload = (await createResponse.json().catch(() => null)) as unknown;

      if (!createResponse.ok || !isProcessInstance(createPayload)) {
        toast.error(
          getApiMessage(createPayload, t("submissions.createFailed"), t),
        );
        return;
      }

      toast.success(t("submissions.created", { code: createPayload.code }));
      setIdentificationTemplate(null);
      await loadForm(template, createPayload);
    } catch {
      toast.error(t("submissions.connectionFailed"));
    } finally {
      isCreatingRef.current = false;
      setCreatingTemplateKey(null);
    }
  }

  async function openDraft(draft: ProcessInstance) {
    if (isCreatingRef.current || isOpeningRef.current) {
      return;
    }

    isOpeningRef.current = true;
    setOpeningDraftId(draft.id);

    const availableTemplates = state.kind === "ready" ? state.templates : [];
    const template = availableTemplates.find(
      (candidate) => candidate.key === draft.template_key,
    ) ?? buildFallbackTemplate(draft);

    try {
      await loadForm(
        template,
        draft,
        draft.has_been_submitted ? "return-review" : "edit",
      );
    } finally {
      isOpeningRef.current = false;
      setOpeningDraftId(null);
    }
  }

  function refreshDrafts() {
    setDraftsState({ kind: "loading" });
    void requestDrafts(t).then(setDraftsState);
  }

  async function deleteDraft() {
    if (draftDeletion.kind === "closed" || isDeletingRef.current) {
      return;
    }

    const draft = draftDeletion.draft;
    isDeletingRef.current = true;
    setDraftDeletion({ kind: "deleting", draft });

    try {
      const response = await fetch(`/api/submissions/${draft.id}`, {
        method: "DELETE",
      });
      const payload = response.status === 204
        ? null
        : await response.json().catch(() => null) as unknown;

      if (!response.ok) {
        setDraftDeletion({
          kind: "error",
          draft,
          message: getApiMessage(payload, t("submissions.deleteFailed"), t),
        });
        return;
      }

      setDraftsState((current) =>
        current.kind === "ready"
          ? {
              kind: "ready",
              drafts: current.drafts.filter(
                (candidate) => candidate.id !== draft.id,
              ),
            }
          : current,
      );
      setDraftDeletion({ kind: "closed" });
      toast.success(t("submissions.deleted", { code: draft.code }));
    } catch {
      setDraftDeletion({
        kind: "error",
        draft,
        message: t("submissions.deleteFailed"),
      });
    } finally {
      isDeletingRef.current = false;
    }
  }

  function refreshTemplates() {
    setState({ kind: "loading" });
    void requestTemplates(t).then(setState);
  }

  function refreshSubmittedSubmissions() {
    setSubmittedState({ kind: "loading" });
    void requestSubmittedSubmissions(t).then(setSubmittedState);
  }

  async function loadForm(
    template: SubmissionTemplate,
    process: ProcessInstance,
    intent: SubmissionDialogIntent = "edit",
  ) {
    try {
      const [response, returnReviewResponse] = await Promise.all([
        fetch(`/api/submissions/${process.id}/form`, { cache: "no-store" }),
        intent === "return-review"
          ? fetch(`/api/submissions/${process.id}/return-review`, { cache: "no-store" })
          : Promise.resolve(null),
      ]);
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !isSubmissionForm(payload)) {
        setDialog({
          kind: "error",
          template,
          process,
          intent,
          message: getApiMessage(
            payload,
            t("submissions.formLoadFailed"),
            t,
          ),
        });
        return;
      }

      let returnReview: SubmissionReturnReview | null = null;
      if (returnReviewResponse) {
        const returnPayload = await returnReviewResponse.json().catch(() => null) as unknown;
        const completedReturnReview =
          !payload.is_submitted &&
          (returnReviewResponse.status === 404 || returnReviewResponse.status === 409);
        if (!completedReturnReview && (!returnReviewResponse.ok || !isReturnReview(returnPayload))) {
          setDialog({
            kind: "error",
            template,
            process,
            intent,
            message: getApiMessage(returnPayload, t("submissions.returnReviewLoadFailed"), t),
          });
          return;
        }
        if (!completedReturnReview && isReturnReview(returnPayload)) {
          returnReview = returnPayload;
        }
      }

      setDialog({ kind: "ready", template, process, intent, form: payload, returnReview });
    } catch {
      setDialog({
        kind: "error",
        template,
        process,
        intent,
        message: t("submissions.formLoadFailed"),
      });
    }
  }

  async function openReturnReview(process: ProcessInstance) {
    const template = state.kind === "ready"
      ? state.templates.find((candidate) => candidate.key === process.template_key) ?? buildFallbackTemplate(process)
      : buildFallbackTemplate(process);
    await loadForm(template, process, "return-review");
  }

  return (
    <div className="flex flex-1 flex-col py-7">
      <div
        aria-label={t("submissions.tabsLabel")}
        className="mb-6 grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-slate-100 p-1"
        role="tablist"
      >
        <button
          aria-controls="submission-panel-templates"
          aria-selected={activeTab === "templates"}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${
            activeTab === "templates"
              ? "bg-white text-teal-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          id="submission-tab-templates"
          onClick={() => setActiveTab("templates")}
          role="tab"
          type="button"
        >
          {t("submissions.tabs.new")}
        </button>
        <button
          aria-controls="submission-panel-submitted"
          aria-selected={activeTab === "submitted"}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${
            activeTab === "submitted"
              ? "bg-white text-teal-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          id="submission-tab-submitted"
          onClick={() => setActiveTab("submitted")}
          role="tab"
          type="button"
        >
          {t("submissions.tabs.submitted")}
        </button>
          <button
          aria-controls="submission-panel-drafts"
          aria-selected={activeTab === "drafts"}
          className={`min-h-11 rounded-lg px-4 text-sm font-semibold outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${
            activeTab === "drafts"
              ? "bg-white text-teal-800 shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          id="submission-tab-drafts"
          onClick={() => setActiveTab("drafts")}
          role="tab"
          type="button"
        >
          {t("submissions.tabs.drafts")}
        </button>
      </div>

      {activeTab === "drafts" && (
      <section
        aria-labelledby="submission-tab-drafts"
        id="submission-panel-drafts"
        role="tabpanel"
        tabIndex={0}
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">
              {t("submissions.draftsEyebrow")}
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900" id="drafts-title">
              {t("submissions.draftsTitle")}
            </h2>
          </div>
          {draftsState.kind === "ready" && draftsState.drafts.length > 0 && (
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-teal-800 outline-none transition hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500"
              onClick={refreshDrafts}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              {t("submissions.refresh")}
            </button>
          )}
        </div>

        {draftsState.kind === "loading" ? (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-600">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />
            {t("submissions.loadingDrafts")}
          </div>
        ) : draftsState.kind === "error" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-700" />
              <div>
                <p className="font-semibold text-rose-900">{t("submissions.draftsLoadTitle")}</p>
                <p className="mt-1 text-sm leading-6 text-rose-800">{draftsState.message}</p>
              </div>
            </div>
            <button
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-800 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              onClick={refreshDrafts}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              {t("common.retry")}
            </button>
          </div>
        ) : draftsState.drafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
            <FileClock aria-hidden="true" className="mx-auto size-8 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-800">{t("submissions.emptyDraftsTitle")}</p>
            <p className="mt-1 text-sm text-slate-500">
              {t("submissions.emptyDraftsDescription")}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {draftsState.drafts.map((draft) => {
              const templateName = state.kind === "ready"
                ? state.templates.find((template) => template.key === draft.template_key)?.name
                : undefined;

              return (
                <SubmissionDraftCard
                  draft={draft}
                  isOpening={openingDraftId === draft.id}
                  isOpeningLocked={
                    openingDraftId !== null ||
                    creatingTemplateKey !== null ||
                    draftDeletion.kind !== "closed"
                  }
                  key={draft.id}
                  onDelete={(selectedDraft) =>
                    setDraftDeletion({
                      kind: "confirming",
                      draft: selectedDraft,
                    })
                  }
                  onOpen={(selectedDraft) => void openDraft(selectedDraft)}
                  templateName={templateName ?? draft.template_key}
                />
              );
            })}
          </div>
        )}
      </section>
      )}

      {activeTab === "submitted" && (
      <section
        aria-labelledby="submission-tab-submitted"
        id="submission-panel-submitted"
        role="tabpanel"
        tabIndex={0}
      >
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">
              {t("submissions.submittedEyebrow")}
            </p>
            <h2
              className="mt-1 text-xl font-bold text-slate-900"
              id="submitted-submissions-title"
            >
              {t("submissions.submittedTitle")}
            </h2>
          </div>
          {submittedState.kind === "ready" &&
            submittedState.submissions.length > 0 && (
              <button
                className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-teal-800 outline-none transition hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500"
                onClick={refreshSubmittedSubmissions}
                type="button"
              >
                <RefreshCw aria-hidden="true" className="size-4" />
                {t("submissions.refresh")}
              </button>
            )}
        </div>

        {submittedState.kind === "loading" ? (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-600">
            <LoaderCircle
              aria-hidden="true"
              className="size-5 animate-spin text-teal-700"
            />
            {t("submissions.loadingSubmitted")}
          </div>
        ) : submittedState.kind === "error" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle
                aria-hidden="true"
                className="mt-0.5 size-5 shrink-0 text-rose-700"
              />
              <div>
                <p className="font-semibold text-rose-900">
                  {t("submissions.submittedLoadTitle")}
                </p>
                <p className="mt-1 text-sm leading-6 text-rose-800">
                  {submittedState.message}
                </p>
              </div>
            </div>
            <button
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-800 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              onClick={refreshSubmittedSubmissions}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              {t("common.retry")}
            </button>
          </div>
        ) : submittedState.submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
            <FileCheck2
              aria-hidden="true"
              className="mx-auto size-8 text-slate-400"
            />
            <p className="mt-3 font-semibold text-slate-800">
              {t("submissions.emptySubmittedTitle")}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {t("submissions.emptySubmittedDescription")}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {submittedState.submissions.map((submission) => {
              const templateName =
                state.kind === "ready"
                  ? state.templates.find(
                      (template) => template.key === submission.template_key,
                    )?.name
                  : undefined;

              return (
                <SubmissionTrackingCard
                  key={submission.id}
                  onOpenReturnReview={(selected) => void openReturnReview(selected)}
                  onProcessChanged={() => {
                    refreshDrafts();
                    refreshSubmittedSubmissions();
                  }}
                  submission={submission}
                  templateName={templateName ?? submission.template_key}
                />
              );
            })}
          </div>
        )}
      </section>
      )}

      {activeTab === "templates" && (
      <section
        aria-labelledby="submission-tab-templates"
        id="submission-panel-templates"
        role="tabpanel"
        tabIndex={0}
      >
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">
          {t("submissions.newEyebrow")}
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900" id="new-submission-title">
          {t("submissions.newTitle")}
        </h2>

      <div className="mb-6 mt-3 w-full">
        <p className="text-sm leading-6 text-slate-600">
          {t("submissions.newDescription")}
        </p>
      </div>

      {state.kind === "loading" ? (
        <SubmissionCatalogMessage
          description={t("submissions.loadingTemplatesDescription")}
          title={t("submissions.loadingTemplatesTitle")}
        />
      ) : state.kind === "error" ? (
        <SubmissionCatalogMessage
          actionLabel={t("common.retry")}
          description={state.message}
          onAction={refreshTemplates}
          title={t("submissions.templatesLoadTitle")}
        />
      ) : state.templates.length === 0 ? (
        <SubmissionCatalogMessage
          description={t("submissions.emptyTemplatesDescription")}
          title={t("submissions.emptyTemplatesTitle")}
        />
      ) : (
        <section
          aria-label={t("submissions.templatesLabel")}
          className="grid content-start gap-4 pb-8 md:grid-cols-2 xl:grid-cols-3"
        >
          {state.templates.map((template) => (
            <SubmissionTemplateCard
              isCreating={creatingTemplateKey === template.key}
              isCreationLocked={creatingTemplateKey !== null || openingDraftId !== null}
              key={template.id}
              onSelect={(selectedTemplate) => void selectTemplate(selectedTemplate)}
              template={template}
            />
          ))}
        </section>
      )}
      </section>
      )}

      {dialog.kind !== "closed" && (
        <SubmissionFormDialog
          key={`${dialog.process.id}-${dialog.kind}`}
          onClose={() => setDialog({ kind: "closed" })}
          onRetry={() => void loadForm(dialog.template, dialog.process, dialog.intent)}
          onReturnResolved={(choice) => {
            setDialog({ kind: "closed" });
            if (choice === "REVISE") {
              setActiveTab("submitted");
            }
            refreshDrafts();
            refreshSubmittedSubmissions();
          }}
          onSaved={refreshDrafts}
          onSubmitted={(submittedProcess) => {
            setDraftsState((current) =>
              current.kind === "ready"
                ? {
                    kind: "ready",
                    drafts: current.drafts.filter(
                      (draft) => draft.id !== submittedProcess.id,
                    ),
                  }
                : current,
            );
            setSubmittedState((current) =>
              current.kind === "ready" &&
              !current.submissions.some(
                (submission) => submission.id === submittedProcess.id,
              )
                ? {
                    kind: "ready",
                    submissions: [submittedProcess, ...current.submissions],
                  }
                : current,
            );
            setDialog({ kind: "closed" });
            setActiveTab("submitted");
            refreshDrafts();
            refreshSubmittedSubmissions();
          }}
          state={dialog}
        />
      )}

      {identificationTemplate && (
        <SubmissionIdentificationDialog
          isCreating={creatingTemplateKey !== null}
          onClose={() => setIdentificationTemplate(null)}
          onConfirm={() => void createIdentifiedSubmission()}
          onTitleChange={setSubmissionTitle}
          template={identificationTemplate}
          title={submissionTitle}
        />
      )}

      {draftDeletion.kind !== "closed" && (
        <SubmissionDraftDeletionDialog
          onClose={() => {
            if (draftDeletion.kind !== "deleting") {
              setDraftDeletion({ kind: "closed" });
            }
          }}
          onConfirm={() => void deleteDraft()}
          state={draftDeletion}
        />
      )}
    </div>
  );
}

function SubmissionTemplateCard({
  template,
  isCreating,
  isCreationLocked,
  onSelect,
}: SubmissionTemplateCardProps) {
  const { t } = useTranslation();

  return (
    <article className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-300/30 transition hover:border-teal-300 hover:shadow-md">
      <div className="grid size-11 place-items-center rounded-xl bg-teal-600/10 text-teal-800 ring-1 ring-inset ring-teal-700/15">
        <FilePenLine aria-hidden="true" className="size-5" />
      </div>
      <p className="mt-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-teal-700">
        {template.key}
      </p>
      <h2 className="mt-2 text-lg font-bold text-slate-900">{template.name}</h2>
      <p className="mt-3 flex-1 text-sm leading-6 text-slate-600">
        {template.description || t("submissions.noTemplateDescription")}
      </p>
      <button
        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white outline-none transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-slate-400"
        disabled={isCreationLocked}
        onClick={() => onSelect(template)}
        type="button"
      >
        {isCreating ? (
          <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <FilePlus2 aria-hidden="true" className="size-4" />
        )}
        {isCreating ? t("submissions.creatingDraft") : t("submissions.startSubmission")}
      </button>
    </article>
  );
}

function SubmissionIdentificationDialog({
  template,
  title,
  isCreating,
  onTitleChange,
  onClose,
  onConfirm,
}: SubmissionIdentificationDialogProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4" role="presentation">
      <div aria-labelledby="submission-identification-title" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" role="dialog">
        <FilePlus2 aria-hidden="true" className="size-8 text-teal-700" />
        <h2 className="mt-3 text-xl font-bold text-slate-900" id="submission-identification-title">{t("submissions.identifyTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t("submissions.identifyDescription", { template: template.name })}</p>
        <label className="mt-4 grid gap-1.5 text-sm font-semibold text-slate-800">{t("submissions.titleLabel")}<input autoFocus className="min-h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" disabled={isCreating} maxLength={255} minLength={3} onChange={(event) => onTitleChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") onConfirm(); }} placeholder={t("submissions.titlePlaceholder")} value={title} /></label>
        <div className="mt-5 flex justify-end gap-3"><button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-teal-500" disabled={isCreating} onClick={onClose} type="button">{t("common.cancel")}</button><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60" disabled={isCreating || title.trim().length < 3} onClick={onConfirm} type="button">{isCreating && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{t("submissions.createAndOpen")}</button></div>
      </div>
    </div>
  );
}

function SubmissionDraftCard({
  draft,
  templateName,
  isOpening,
  isOpeningLocked,
  onOpen,
  onDelete,
}: SubmissionDraftCardProps) {
  const { t } = useTranslation();
  const [evaluation, setEvaluation] = useState<import("@/types/Submissao").SubmissionPreEvaluation | null>(null);
  const [directReviewOpen, setDirectReviewOpen] = useState(false);
  const isCorrection = draft.has_been_submitted === true;
  const canDelete = !isCorrection && (draft.available_actions?.includes("DELETE") ?? false);

  useEffect(() => {
    let active = true;
    void requestPreEvaluation(draft.id).then((result) => {
      if (active) setEvaluation(result);
    });
    return () => { active = false; };
  }, [draft.id]);

  return (
    <article className="flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-300/30">
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <FileClock aria-hidden="true" className="size-5" />
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">
          {t(isCorrection ? "submissions.correctionStatus" : "submissions.draftStatus")}
        </span>
      </div>
      <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-teal-700">
        {draft.code}
      </p>
      <h3 className="mt-1 text-base font-bold text-slate-900">{draft.title}</h3>
      <p className="mt-1 flex-1 text-sm leading-6 text-slate-600">{templateName}</p>
      {evaluation?.consolidated_result === "negative" && (
        <SubmissionPreEvaluationPanel compact evaluation={evaluation} />
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-teal-700 px-3 py-1.5 text-xs font-semibold text-teal-800 outline-none transition hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:border-slate-300 disabled:text-slate-400"
          disabled={isOpeningLocked}
          onClick={() => onOpen(draft)}
          type="button"
        >
          {isOpening ? (
            <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <FilePenLine aria-hidden="true" className="size-3.5" />
          )}
          {isOpening ? t("submissions.opening") : t("submissions.resumeEditing")}
        </button>
        {!isCorrection && evaluation?.consolidated_result === "negative" && !evaluation.direct_review_request && (
          <button className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-violet-300 px-3 py-1.5 text-xs font-semibold text-violet-800 outline-none hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500" disabled={isOpeningLocked} onClick={() => setDirectReviewOpen(true)} type="button">{t("submissions.requestHumanReview")}</button>
        )}
        {canDelete && <button
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-800 outline-none transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:border-slate-300 disabled:text-slate-400"
          disabled={isOpeningLocked}
          onClick={() => onDelete(draft)}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          {t("submissions.deleteDraft")}
        </button>}
      </div>
      <DirectReviewDialog isOpen={directReviewOpen} onClose={() => setDirectReviewOpen(false)} onConfirmed={() => window.location.reload()} process={draft} />
    </article>
  );
}

function SubmissionDraftDeletionDialog({
  state,
  onClose,
  onConfirm,
}: SubmissionDraftDeletionDialogProps) {
  const { t } = useTranslation();
  const isDeleting = state.kind === "deleting";

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4"
      role="presentation"
    >
      <div
        aria-describedby="delete-draft-description"
        aria-labelledby="delete-draft-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <div className="grid size-11 place-items-center rounded-xl bg-rose-100 text-rose-800">
          <Trash2 aria-hidden="true" className="size-5" />
        </div>
        <h2
          className="mt-4 text-xl font-bold text-slate-900"
          id="delete-draft-title"
        >
          {t("submissions.deleteDraftTitle")}
        </h2>
        <p
          className="mt-2 text-sm leading-6 text-slate-600"
          id="delete-draft-description"
        >
          {t("submissions.deleteDraftDescription", {
            code: state.draft.code,
            title: state.draft.title,
          })}
        </p>

        {state.kind === "error" && (
          <div
            className="mt-4 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800"
            role="alert"
          >
            <AlertCircle
              aria-hidden="true"
              className="mt-0.5 size-4 shrink-0"
            />
            <span>{state.message}</span>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-bold text-white outline-none transition hover:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-slate-400"
            disabled={isDeleting}
            onClick={onConfirm}
            type="button"
          >
            {isDeleting ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="size-4" />
            )}
            {isDeleting
              ? t("submissions.deletingDraft")
              : t("submissions.confirmDeleteDraft")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubmissionFormDialog({
  state,
  onClose,
  onRetry,
  onSaved,
  onSubmitted,
  onReturnResolved,
}: SubmissionFormDialogProps) {
  const { t } = useTranslation();
  const [form] = useState<SubmissionForm | null>(() =>
    state.kind === "ready" ? state.form : null,
  );
  const [returnReview] = useState<SubmissionReturnReview | null>(() =>
    state.kind === "ready" ? state.returnReview ?? null : null,
  );
  const [inputs, setInputs] = useState<SubmissionFieldInputs>(() =>
    state.kind === "ready" ? buildDynamicFormInputs(state.form) : {},
  );
  const [operation, setOperation] = useState<SubmissionFormOperation>("idle");
  const [returnChoice, setReturnChoice] = useState<SubmissionReturnReviewChoice>(() =>
    state.kind === "ready" && state.returnReview?.available_choices.includes("REVISE")
      ? "REVISE"
      : state.kind === "ready" && state.returnReview?.available_choices[0]
        ? state.returnReview.available_choices[0]
        : "REVISE",
  );
  const [returnJustification, setReturnJustification] = useState("");
  const [savedCorrectionFieldKeys, setSavedCorrectionFieldKeys] = useState(
    () => new Set<string>(),
  );
  const [activeSectionIndex, setActiveSectionIndex] = useState(() =>
    state.kind === "ready"
      ? getFirstReviewedSectionIndex(
          state.form,
          t("submissions.generalSection"),
        )
      : 0,
  );
  const operationRef = useRef<SubmissionFormOperation>("idle");
  const returnResponseResolvedRef = useRef(false);
  const defaultSection = t("submissions.generalSection");
  const sections = form
    ? getSubmissionFormSections(form.fields, defaultSection)
    : [];
  const visibleSectionIndex = Math.min(
    activeSectionIndex,
    Math.max(sections.length - 1, 0),
  );

  function updateField(fieldKey: string, value: string | boolean) {
    setInputs((current) => ({ ...current, [fieldKey]: value }));
  }

  function saveCorrectionField(fieldKey: string) {
    if (!form || !isSubmissionCorrectionFieldChanged(form, inputs, fieldKey)) {
      return;
    }
    setSavedCorrectionFieldKeys((current) => {
      const next = new Set(current);
      next.add(fieldKey);
      return next;
    });
  }

  function editCorrectionField(fieldKey: string) {
    setSavedCorrectionFieldKeys((current) => {
      const next = new Set(current);
      next.delete(fieldKey);
      return next;
    });
  }

  async function saveDraft() {
    if (
      state.kind !== "ready" ||
      !form ||
      form.is_submitted ||
      Object.values(form.reviews).some(isCorrectableReview) ||
      operationRef.current !== "idle"
    ) {
      return;
    }

    operationRef.current = "saving";
    setOperation("saving");

    try {
      const response = await fetch(`/api/submissions/${state.process.id}/form`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: buildDynamicFormValues(form.fields, inputs, false),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | SaveSubmissionDraftResult
        | ApiMessage
        | null;

      if (!response.ok || !isSaveResult(payload)) {
        toast.error(getApiMessage(payload, t("submissions.saveFailed"), t));
        return;
      }

      toast.success(t("submissions.saved"));
      onSaved();
    } catch {
      toast.error(t("submissions.connectionFailed"));
    } finally {
      operationRef.current = "idle";
      setOperation("idle");
    }
  }

  async function submitForAnalysis() {
    if (
      state.kind !== "ready" ||
      !form ||
      form.is_submitted ||
      operationRef.current !== "idle"
    ) {
      return;
    }

    const isCorrectionMode = Object.values(form.reviews).some(isCorrectableReview);
    const unsavedCorrectionField = isCorrectionMode
      ? form.fields.find(
          (field) =>
            isCorrectableReview(form.reviews[field.field_key]) &&
            !savedCorrectionFieldKeys.has(field.field_key),
        )
      : undefined;
    const pendingCorrectionField = isCorrectionMode
      ? getPendingSubmissionCorrectionField(form, inputs)
      : undefined;
    const incompleteCorrectionField =
      unsavedCorrectionField ?? pendingCorrectionField;
    if (incompleteCorrectionField) {
      toast.error(t("submissions.correctionsIncomplete"));
      const pendingSectionIndex = sections.indexOf(
        getSubmissionFieldSection(incompleteCorrectionField, defaultSection),
      );
      if (pendingSectionIndex >= 0) setActiveSectionIndex(pendingSectionIndex);
      requestAnimationFrame(() => {
        document
          .getElementById(`dynamic-form-field-${incompleteCorrectionField.field_key}`)
          ?.focus();
      });
      return;
    }

    const validation = validateDynamicFormValues(form.fields, inputs, t);
    if (!validation.valid) {
      toast.error(validation.message);
      const invalidField = form.fields.find(
        (field) => field.field_key === validation.fieldKey,
      );
      const invalidSectionIndex = invalidField
        ? sections.indexOf(getSubmissionFieldSection(invalidField, defaultSection))
        : -1;

      if (invalidSectionIndex >= 0) {
        setActiveSectionIndex(invalidSectionIndex);
      }
      requestAnimationFrame(() => {
        document
          .getElementById(`dynamic-form-field-${validation.fieldKey}`)
          ?.focus();
      });
      return;
    }

    operationRef.current = "submitting";
    setOperation("submitting");

    try {
      const response = await fetch(`/api/submissions/${state.process.id}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: buildDynamicFormValues(form.fields, inputs, true),
        }),
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !isSubmitResult(payload)) {
        toast.error(
          getApiMessage(payload, t("submissions.submitFailed"), t),
        );
        return;
      }

      toast.success(
        t(isCorrectionMode ? "submissions.resubmitted" : "submissions.submitted"),
      );
      onSubmitted(state.process);
    } catch {
      toast.error(t("submissions.connectionFailed"));
    } finally {
      operationRef.current = "idle";
      setOperation("idle");
    }
  }

  async function respondToReturn() {
    if (state.kind !== "ready" || !form || !returnReview || operationRef.current !== "idle") return;

    if (returnChoice === "REVISE") {
      const unsavedCorrectionField = form.fields.find(
        (field) =>
          isCorrectableReview(form.reviews[field.field_key]) &&
          !savedCorrectionFieldKeys.has(field.field_key),
      );
      const pendingCorrectionField = getPendingSubmissionCorrectionField(form, inputs);
      const incompleteCorrectionField =
        unsavedCorrectionField ?? pendingCorrectionField;
      if (incompleteCorrectionField) {
        toast.error(t("submissions.correctionsIncomplete"));
        const pendingSectionIndex = sections.indexOf(
          getSubmissionFieldSection(incompleteCorrectionField, defaultSection),
        );
        if (pendingSectionIndex >= 0) setActiveSectionIndex(pendingSectionIndex);
        requestAnimationFrame(() => {
          document
            .getElementById(`dynamic-form-field-${incompleteCorrectionField.field_key}`)
            ?.focus();
        });
        return;
      }

      const validation = validateDynamicFormValues(form.fields, inputs, t);
      if (!validation.valid) {
        toast.error(validation.message);
        return;
      }
    }

    operationRef.current = "responding";
    setOperation("responding");
    try {
      if (!returnResponseResolvedRef.current) {
        const response = await fetch(`/api/submissions/${state.process.id}/return-review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ choice: returnChoice, justification: returnJustification.trim() || null }),
        });
        const payload = await response.json().catch(() => null) as unknown;
        if (!response.ok || !isReturnReviewResult(payload)) {
          toast.error(getApiMessage(payload, t("submissions.returnReviewResponseFailed"), t));
          return;
        }
        if (payload.choice !== "REVISE") {
          toast.success(t(`submissions.returnChoicesSuccess.${payload.choice}`));
          onReturnResolved(payload.choice);
          return;
        }
        returnResponseResolvedRef.current = true;
      }

      operationRef.current = "submitting";
      setOperation("submitting");
      const submitResponse = await fetch(`/api/submissions/${state.process.id}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: buildDynamicFormValues(form.fields, inputs, true),
        }),
      });
      const submitPayload = await submitResponse.json().catch(() => null) as unknown;
      if (!submitResponse.ok || !isSubmitResult(submitPayload)) {
        toast.error(getApiMessage(submitPayload, t("submissions.submitFailed"), t));
        return;
      }

      toast.success(t("submissions.resubmitted"));
      onSubmitted(state.process);
    } catch {
      toast.error(t("submissions.connectionFailed"));
    } finally {
      operationRef.current = "idle";
      setOperation("idle");
    }
  }

  return (
    <div
      aria-labelledby="submission-form-title"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-3 backdrop-blur-[2px] sm:p-6"
      role="dialog"
    >
      <div className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl ${returnReview ? "h-[92dvh] w-[94vw] max-w-none" : "max-h-[94dvh] w-full max-w-3xl"}`}>
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-teal-700">
              {state.process.code} · {t(returnReview ? "submissions.returnReviewLabel" : "submissions.draftLabel")}
            </p>
            <h2
              className="mt-1 truncate text-xl font-bold text-slate-900"
              id="submission-form-title"
            >
              {state.template.name}
            </h2>
          </div>
          <button
            aria-label={t("submissions.closeForm")}
            autoFocus
            className="grid size-10 shrink-0 place-items-center rounded-lg text-slate-500 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </header>

        {state.kind === "error" ? (
          <div className="overflow-y-auto p-6">
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
              <AlertCircle aria-hidden="true" className="size-6 text-rose-700" />
              <p className="mt-3 text-sm leading-6 text-rose-800">{state.message}</p>
              <p className="mt-2 text-xs leading-5 text-rose-700">
                {t("submissions.existingStructure", { code: state.process.code })}
              </p>
              <button
                className="mt-4 rounded-lg bg-rose-800 px-4 py-2 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                onClick={onRetry}
                type="button"
              >
                {t("submissions.retryForm")}
              </button>
            </div>
          </div>
        ) : form ? (
          <SubmissionDialogContent
            activeSectionIndex={visibleSectionIndex}
            form={form}
            inputs={inputs}
            operation={operation}
            returnChoice={returnChoice}
            returnJustification={returnJustification}
            returnReview={returnReview}
            processId={state.process.id}
            onFieldChange={updateField}
            onSectionChange={setActiveSectionIndex}
            onSave={() => void saveDraft()}
            onSubmit={() => void submitForAnalysis()}
            onReturnChoiceChange={setReturnChoice}
            onReturnJustificationChange={setReturnJustification}
            onReturnResponse={() => void respondToReturn()}
            onSaveCorrection={saveCorrectionField}
            onEditCorrection={editCorrectionField}
            savedCorrectionFieldKeys={savedCorrectionFieldKeys}
          />
        ) : null}
      </div>
    </div>
  );
}

function SubmissionDialogContent({
  activeSectionIndex,
  processId,
  form,
  inputs,
  operation,
  returnReview,
  returnChoice,
  returnJustification,
  savedCorrectionFieldKeys,
  onFieldChange,
  onSectionChange,
  onSave,
  onSubmit,
  onReturnChoiceChange,
  onReturnJustificationChange,
  onReturnResponse,
  onSaveCorrection,
  onEditCorrection,
}: SubmissionDialogContentProps) {
  const { t, i18n } = useTranslation();
  const orderedFields = [...form.fields].sort(
    (first, second) => first.order_index - second.order_index,
  );
  const defaultSection = t("submissions.generalSection");
  const sections = getSubmissionFormSections(orderedFields, defaultSection);
  const hasSectionTabs = sections.length > 1;
  const awaitingReturnResponse = Boolean(returnReview && form.is_submitted);
  const hasCorrectionFields = Object.values(form.reviews).some(isCorrectableReview);
  const isCorrectionMode = hasCorrectionFields && (Boolean(returnReview) || !form.is_submitted);
  const hasCorrectionContext = Boolean(returnReview || isCorrectionMode);
  const pendingCorrectionField = isCorrectionMode
    ? getPendingSubmissionCorrectionField(form, inputs)
    : undefined;
  const correctionFormIsValid = isCorrectionMode
    ? validateDynamicFormValues(form.fields, inputs, t).valid
    : true;
  const correctionFields = orderedFields.filter((field) =>
    isCorrectableReview(form.reviews[field.field_key]),
  );
  const pendingCorrectionCount = correctionFields.filter(
    (field) => !savedCorrectionFieldKeys.has(field.field_key),
  ).length;
  const canResubmit =
    isCorrectionMode &&
    correctionFields.length > 0 &&
    pendingCorrectionCount === 0 &&
    !pendingCorrectionField &&
    correctionFormIsValid;

  function handleSectionTabKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
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

    if (nextSectionIndex === null) {
      return;
    }

    event.preventDefault();
    onSectionChange(nextSectionIndex);
    requestAnimationFrame(() => {
      document
        .getElementById(`submission-form-section-tab-${nextSectionIndex}`)
        ?.focus();
    });
  }

  return (
    <>
      <div className={hasCorrectionContext ? "grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)] lg:grid-cols-[22rem_minmax(0,1fr)] lg:grid-rows-1 xl:grid-cols-[26rem_minmax(0,1fr)]" : "flex min-h-0 flex-1 flex-col"}>
        {hasCorrectionContext && (
          <aside className="max-h-[40dvh] overflow-y-auto border-b border-amber-200 bg-amber-50/50 p-4 sm:p-5 lg:max-h-none lg:border-b-0 lg:border-r lg:p-6">
          <section className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950" aria-labelledby="return-review-summary-title">
            <div className="flex items-start gap-3">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-800" />
              <div className="min-w-0">
                <h3 className="text-sm font-bold" id="return-review-summary-title">{t(awaitingReturnResponse ? "submissions.returnReviewTitle" : "submissions.correctionModeTitle")}</h3>
                <p className="mt-1 text-sm leading-6">{awaitingReturnResponse ? t("submissions.returnReviewDescription") : t("submissions.correctionModeDescription")}</p>
                {isCorrectionMode && <p className="mt-3 w-fit rounded-full bg-amber-200 px-3 py-1 text-xs font-bold text-amber-950">{t("submissions.correctionsRemaining", { count: pendingCorrectionCount })}</p>}
                {returnReview?.triage_decision?.justification && <div className="mt-3 rounded-lg border border-amber-200 bg-white/75 p-3"><p className="text-xs font-bold uppercase tracking-wide text-amber-800">{t("submissions.bracvamJustification")}</p><p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">{returnReview.triage_decision.justification}</p></div>}
                {returnReview && <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-amber-900">
                  <span>{t("submissions.returnOpenedAt", { date: formatSubmissionDate(returnReview.opened_at, i18n.resolvedLanguage) })}</span>
                  {returnReview.due_date && <span>{t("submissions.returnDueDate", { date: formatSubmissionDate(returnReview.due_date, i18n.resolvedLanguage) })}</span>}
                </div>}
              </div>
            </div>
            {returnReview && awaitingReturnResponse && <div className="mt-4 grid gap-3 border-t border-amber-200 pt-4"><label className="grid gap-1.5 text-sm font-bold">{t("submissions.returnChoiceLabel")}<select className="min-h-11 rounded-xl border border-amber-300 bg-white px-3 font-normal text-slate-900" disabled={operation !== "idle"} onChange={(event) => onReturnChoiceChange(event.target.value as SubmissionReturnReviewChoice)} value={returnChoice}>{returnReview.available_choices.map((choice) => <option key={choice} value={choice}>{t(`submissions.returnChoices.${choice}`)}</option>)}</select></label><label className="grid gap-1.5 text-sm font-bold">{t("submissions.returnJustificationLabel")}<textarea className="min-h-20 rounded-xl border border-amber-300 bg-white p-3 font-normal text-slate-900" disabled={operation !== "idle"} maxLength={4000} onChange={(event) => onReturnJustificationChange(event.target.value)} placeholder={t("submissions.returnJustificationPlaceholder")} value={returnJustification} /></label><button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-amber-800 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60" disabled={operation !== "idle" || (returnChoice === "REVISE" && !canResubmit)} onClick={onReturnResponse} type="button">{operation !== "idle" && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}{operation !== "idle" ? t(returnChoice === "REVISE" ? "submissions.resubmitting" : "submissions.respondingToReturn") : t(returnChoice === "REVISE" ? "submissions.confirmAndResubmit" : "submissions.confirmReturnChoice")}</button></div>}
          </section>
          </aside>
        )}

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {form.is_submitted && !returnReview && (
          <div className="mx-5 mt-5 flex shrink-0 items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900 sm:mx-6">
            <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            {t("submissions.alreadySubmitted")}
          </div>
        )}

        {hasSectionTabs && (
          <div
            aria-label={t("submissions.formSectionsLabel")}
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-200 bg-slate-50 px-5 pt-3 sm:px-6"
            role="tablist"
          >
            {sections.map((section, sectionIndex) => {
              const isActive = sectionIndex === activeSectionIndex;
              const sectionCorrectionCount = orderedFields.filter(
                (field) =>
                  getSubmissionFieldSection(field, defaultSection) === section &&
                  isCorrectableReview(form.reviews[field.field_key]),
              ).length;
              const reviewedCount = orderedFields.filter(
                (field) =>
                  getSubmissionFieldSection(field, defaultSection) === section &&
                  isCorrectableReview(form.reviews[field.field_key]) &&
                  !savedCorrectionFieldKeys.has(field.field_key),
              ).length;

              return (
                <button
                  aria-controls={`submission-form-section-panel-${sectionIndex}`}
                  aria-selected={isActive}
                  className={`min-h-11 shrink-0 whitespace-nowrap rounded-t-xl border border-b-0 px-4 py-2 text-sm font-bold outline-none transition focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 ${
                    isActive
                      ? "border-slate-200 bg-white text-teal-800"
                      : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                  id={`submission-form-section-tab-${sectionIndex}`}
                  key={section}
                  onClick={() => onSectionChange(sectionIndex)}
                  onKeyDown={(event) =>
                    handleSectionTabKeyDown(event, sectionIndex)
                  }
                  role="tab"
                  tabIndex={isActive ? 0 : -1}
                  type="button"
                >
                  {section}{sectionCorrectionCount > 0 && <span className="ml-2 rounded-full bg-amber-200 px-2 py-0.5 text-[0.65rem] text-amber-950" aria-label={t("submissions.reviewedFieldsCount", { count: reviewedCount })}>{reviewedCount}</span>}
                </button>
              );
            })}
          </div>
        )}

        <form
          className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6"
          onSubmit={(event) => event.preventDefault()}
        >
          {sections.map((section, sectionIndex) => (
            <div
              aria-labelledby={hasSectionTabs ? `submission-form-section-tab-${sectionIndex}` : undefined}
              hidden={hasSectionTabs && sectionIndex !== activeSectionIndex}
              id={hasSectionTabs ? `submission-form-section-panel-${sectionIndex}` : undefined}
              key={section}
              role={hasSectionTabs ? "tabpanel" : undefined}
            >
              <fieldset className="grid gap-5 rounded-2xl border border-slate-200 p-4 sm:p-5">
                <legend className={hasSectionTabs ? "sr-only" : "px-2 text-sm font-bold uppercase tracking-wide text-teal-800"}>
                  {section}
                </legend>
                {orderedFields
                  .filter(
                    (field) =>
                      getSubmissionFieldSection(field, defaultSection) === section,
                  )
                  .map((field) => {
                    const review = form.reviews[field.field_key];
                    const isCorrectionField = isCorrectableReview(review);
                    const isLockedDuringCorrection = Boolean(
                      isCorrectionMode && !isCorrectionField,
                    );
                    const canEditReturnedField = Boolean(
                      returnReview &&
                      returnChoice === "REVISE" &&
                      isCorrectionField &&
                      !savedCorrectionFieldKeys.has(field.field_key),
                    );
                    const isSavedCorrection =
                      isCorrectionField &&
                      savedCorrectionFieldKeys.has(field.field_key);
                    const correctionChanged = isCorrectionField
                      ? isSubmissionCorrectionFieldChanged(
                          form,
                          inputs,
                          field.field_key,
                        )
                      : false;

                    return <div className={isCorrectionField ? "rounded-xl border-2 border-amber-400 bg-amber-50/60 p-4" : undefined} key={field.field_key}>
                      {review && <div className="mb-4 border-b border-amber-200 pb-3"><p className="text-xs font-bold uppercase tracking-wide text-amber-900">{t("submissions.fieldReviewed", { status: t(`submissions.reviewStatuses.${review.status}`, { defaultValue: review.status }) })}</p>{review.comments && <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-amber-950">{review.comments}</p>}</div>}
                      {isLockedDuringCorrection && <div className="mb-3 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"><LockKeyhole aria-hidden="true" className="size-3.5 shrink-0" />{t("submissions.fieldLockedDuringCorrection")}</div>}
                      <DynamicFormFieldControl
                        disabled={isSavedCorrection || (form.is_submitted && !canEditReturnedField) || operation !== "idle" || isLockedDuringCorrection}
                        field={field}
                        onChange={(value) => onFieldChange(field.field_key, value)}
                        processId={processId}
                        value={inputs[field.field_key]}
                      />
                      {isCorrectionField && <div className="mt-4 flex flex-wrap items-center gap-2"><button className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-amber-800 px-3 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={operation !== "idle" || isSavedCorrection || !correctionChanged} onClick={() => onSaveCorrection(field.field_key)} type="button"><Check aria-hidden="true" className="size-4" />{t("submissions.saveCorrection")}</button><button className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-amber-700 bg-white px-3 text-xs font-bold text-amber-900 disabled:cursor-not-allowed disabled:opacity-50" disabled={operation !== "idle" || !isSavedCorrection} onClick={() => onEditCorrection(field.field_key)} type="button"><FilePenLine aria-hidden="true" className="size-4" />{t("submissions.editCorrection")}</button>{isSavedCorrection && <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">{t("submissions.correctionSaved")}</span>}</div>}
                    </div>;
                  })}
              </fieldset>
            </div>
          ))}
        </form>
        </div>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
        <p className="text-xs leading-5 text-slate-500">{t(returnReview && returnChoice !== "REVISE" ? "submissions.returnReviewFooterNotice" : hasCorrectionContext ? "submissions.correctionResubmitNotice" : "submissions.saveNotice")}</p>
        {!form.is_submitted && (
          <div className="flex flex-wrap justify-end gap-2">
            {!isCorrectionMode && <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal-700 bg-white px-4 py-2 text-sm font-semibold text-teal-800 outline-none transition hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              disabled={operation !== "idle"}
              onClick={onSave}
              type="button"
            >
              {operation === "saving" ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Save aria-hidden="true" className="size-4" />
              )}
              {operation === "saving" ? t("submissions.saving") : t("submissions.saveDraft")}
            </button>}
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              disabled={operation !== "idle" || (isCorrectionMode && !canResubmit)}
              onClick={onSubmit}
              type="button"
            >
              {operation === "submitting" ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="size-4" />
              )}
              {operation === "submitting"
                ? t(isCorrectionMode ? "submissions.resubmitting" : "submissions.submitting")
                : t(isCorrectionMode ? "submissions.confirmAndResubmit" : "submissions.submit")}
            </button>
          </div>
        )}
      </footer>
    </>
  );
}

function getSubmissionFormSections(
  fields: DynamicFormField[],
  defaultSection: string,
) {
  return [
    ...new Set(
      [...fields]
        .sort((first, second) => first.order_index - second.order_index)
        .map((field) => getSubmissionFieldSection(field, defaultSection)),
    ),
  ];
}

function isCorrectableReview(review: DynamicFormReview | undefined) {
  return review?.status === "NEEDS_REVISION" || review?.status === "REJECTED";
}

function getSubmissionFieldSection(
  field: DynamicFormField,
  defaultSection: string,
) {
  return field.section?.trim() || defaultSection;
}

function getFirstReviewedSectionIndex(form: SubmissionForm, defaultSection: string) {
  const sections = getSubmissionFormSections(form.fields, defaultSection);
  const reviewedField = form.fields.find((field) =>
    isCorrectableReview(form.reviews[field.field_key]),
  );
  return reviewedField ? Math.max(sections.indexOf(getSubmissionFieldSection(reviewedField, defaultSection)), 0) : 0;
}

function formatSubmissionDate(value: string, locale: string | undefined) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(date);
}

function SubmissionCatalogMessage({
  title,
  description,
  actionLabel,
  onAction,
}: SubmissionCatalogMessageProps) {
  return (
    <section className="grid flex-1 place-items-center py-12" aria-live="polite">
      <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm">
        <FilePenLine aria-hidden="true" className="mx-auto size-9 text-teal-700" />
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

function buildFallbackTemplate(draft: ProcessInstance): SubmissionTemplate {
  return {
    id: draft.template_key,
    key: draft.template_key,
    name: draft.template_key,
    description: null,
    is_active: false,
  };
}

function isTemplateList(value: unknown): value is SubmissionTemplate[] {
  return Array.isArray(value) && value.every(isTemplate);
}

function isTemplate(value: unknown): value is SubmissionTemplate {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.key === "string" &&
    typeof value.name === "string" &&
    (value.description === undefined ||
      value.description === null ||
      typeof value.description === "string") &&
    typeof value.is_active === "boolean"
  );
}

function isProcessInstance(value: unknown): value is ProcessInstance {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.title === "string" &&
    typeof value.status === "string" &&
    typeof value.template_key === "string" &&
    typeof value.version_number === "number"
  );
}

function isSubmissionForm(value: unknown): value is SubmissionForm {
  if (!isRecord(value)) return false;

  return (
    typeof value.form_instance_id === "string" &&
    typeof value.template_key === "string" &&
    typeof value.is_submitted === "boolean" &&
    Array.isArray(value.fields) &&
    value.fields.every(isDynamicFormField) &&
    isRecord(value.values) &&
    isRecord(value.reviews)
  );
}

function isDynamicFormField(value: unknown): value is DynamicFormField {
  if (!isRecord(value)) return false;

  return (
    typeof value.field_key === "string" &&
    typeof value.label === "string" &&
    typeof value.field_type === "string" &&
    typeof value.is_required === "boolean" &&
    typeof value.order_index === "number"
  );
}

function isSaveResult(value: unknown): value is SaveSubmissionDraftResult {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    typeof value.form_instance_id === "string"
  );
}

function isSubmitResult(value: unknown): value is SubmitSubmissionResult {
  return (
    isRecord(value) &&
    typeof value.activity_key === "string" &&
    typeof value.run_number === "number" &&
    typeof value.status === "string" &&
    (value.artifact_id === undefined ||
      value.artifact_id === null ||
      typeof value.artifact_id === "string")
  );
}

function isReturnReview(value: unknown): value is SubmissionReturnReview {
  return isRecord(value) && typeof value.run_number === "number" && (value.source === "TRIAGE" || value.source === "AI_PRE_EVALUATION") && typeof value.opened_at === "string" && Array.isArray(value.available_choices) && value.available_choices.every(isReturnReviewChoice);
}

function isReturnReviewResult(value: unknown): value is SubmissionReturnReviewResult {
  return isRecord(value) && isReturnReviewChoice(value.choice) && typeof value.process_status === "string";
}

function isReturnReviewChoice(value: unknown): value is SubmissionReturnReviewChoice {
  return value === "REVISE" || value === "CONTEST_AI" || value === "WITHDRAW";
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getApiMessage(value: unknown, fallback: string, t: TFunction) {
  return getLocalizedApiError(isRecord(value) ? value : null, fallback, t);
}

async function requestTemplates(t: TFunction): Promise<SubmissionCatalogState> {
  try {
    const response = await fetch("/api/submissions/templates", {
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok || !isTemplateList(payload)) {
      return {
        kind: "error",
        message: getApiMessage(
          payload,
          t("submissions.templatesLoadFailed"),
          t,
        ),
      };
    }

    return { kind: "ready", templates: payload };
  } catch {
    return {
      kind: "error",
      message: t("submissions.connectionFailed"),
    };
  }
}

async function requestDrafts(t: TFunction): Promise<SubmissionDraftsState> {
  try {
    const response = await fetch("/api/submissions/drafts", {
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok || !isProcessInstanceList(payload)) {
      return {
        kind: "error",
        message: getApiMessage(
          payload,
          t("submissions.draftsLoadFailed"),
          t,
        ),
      };
    }

    return { kind: "ready", drafts: payload };
  } catch {
    return {
      kind: "error",
      message: t("submissions.connectionFailed"),
    };
  }
}

async function requestSubmittedSubmissions(t: TFunction): Promise<SubmittedSubmissionsState> {
  try {
    const response = await fetch("/api/submissions/sent", {
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok || !isProcessInstanceList(payload)) {
      return {
        kind: "error",
        message: getApiMessage(
          payload,
          t("submissions.submittedLoadFailed"),
          t,
        ),
      };
    }

    return { kind: "ready", submissions: payload };
  } catch {
    return {
      kind: "error",
      message: t("submissions.connectionFailed"),
    };
  }
}

function isProcessInstanceList(value: unknown): value is ProcessInstance[] {
  return Array.isArray(value) && value.every(isProcessInstance);
}
