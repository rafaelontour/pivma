"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  FileCheck2,
  FileClock,
  FilePenLine,
  FilePlus2,
  LoaderCircle,
  RefreshCw,
  Save,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { ProcessInstance } from "@/types/Processo";
import type { ApiMessage, ApiRecord } from "@/types/Servico";
import type {
  DynamicFormField,
  DynamicFormFieldControlProps,
  DynamicFormOption,
  DynamicFormOptionValue,
  DynamicFormValue,
  SaveSubmissionDraftResult,
  SubmissionCatalogMessageProps,
  SubmissionCatalogState,
  SubmissionDialogContentProps,
  SubmissionDialogState,
  SubmissionDraftCardProps,
  SubmissionDraftsState,
  SubmissionDeleteDialogProps,
  SubmissionFieldInputs,
  SubmissionForm,
  SubmissionFormDialogProps,
  SubmissionFormOperation,
  SubmissionTab,
  SubmissionTemplate,
  SubmissionTemplateCardProps,
  SubmittedSubmissionCardProps,
  SubmittedSubmissionsState,
  SubmitSubmissionResult,
} from "@/types/Submissao";

export function SubmissionCatalog() {
  const [activeTab, setActiveTab] = useState<SubmissionTab>("drafts");
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
  const [deletingDraft, setDeletingDraft] = useState<ProcessInstance | null>(
    null,
  );
  const isCreatingRef = useRef(false);
  const isOpeningRef = useRef(false);

  useEffect(() => {
    let active = true;

    void requestTemplates().then((nextState) => {
      if (active) {
        setState(nextState);
      }
    });

    void requestDrafts().then((nextState) => {
      if (active) {
        setDraftsState(nextState);
      }
    });

    void requestSubmittedSubmissions().then((nextState) => {
      if (active) {
        setSubmittedState(nextState);
      }
    });

    return () => {
      active = false;
    };
  }, []);

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
    if (isCreatingRef.current || isOpeningRef.current) {
      return;
    }

    isCreatingRef.current = true;
    setCreatingTemplateKey(template.key);

    try {
      const createResponse = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateKey: template.key }),
      });
      const createPayload = (await createResponse.json().catch(() => null)) as unknown;

      if (!createResponse.ok || !isProcessInstance(createPayload)) {
        toast.error(
          getApiMessage(createPayload, "Não foi possível criar o rascunho."),
        );
        return;
      }

      toast.success(
        `Formulário ${createPayload.code} iniciado. O preenchimento ainda não foi salvo.`,
      );
      await loadForm(template, createPayload);
    } catch {
      toast.error("Não foi possível conectar ao serviço de submissões.");
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
      await loadForm(template, draft);
    } finally {
      isOpeningRef.current = false;
      setOpeningDraftId(null);
    }
  }

  function refreshDrafts() {
    setDraftsState({ kind: "loading" });
    void requestDrafts().then(setDraftsState);
  }

  function refreshTemplates() {
    setState({ kind: "loading" });
    void requestTemplates().then(setState);
  }

  function refreshSubmittedSubmissions() {
    setSubmittedState({ kind: "loading" });
    void requestSubmittedSubmissions().then(setSubmittedState);
  }

  async function loadForm(
    template: SubmissionTemplate,
    process: ProcessInstance,
  ) {
    try {
      const response = await fetch(`/api/submissions/${process.id}/form`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !isSubmissionForm(payload)) {
        setDialog({
          kind: "error",
          template,
          process,
          message: getApiMessage(
            payload,
            "O rascunho foi criado, mas o formulário não pôde ser carregado.",
          ),
        });
        return;
      }

      setDialog({ kind: "ready", template, process, form: payload });
    } catch {
      setDialog({
        kind: "error",
        template,
        process,
        message: "O rascunho foi criado, mas o formulário não pôde ser carregado.",
      });
    }
  }

  return (
    <div className="flex flex-1 flex-col py-7">
      <div
        aria-label="Áreas de submissões"
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
          Nova submissão
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
          Submissões
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
          Rascunhos
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
              Continue de onde parou
            </p>
            <h2 className="mt-1 text-xl font-bold text-slate-900" id="drafts-title">
              Meus rascunhos
            </h2>
          </div>
          {draftsState.kind === "ready" && draftsState.drafts.length > 0 && (
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-teal-800 outline-none transition hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500"
              onClick={refreshDrafts}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Atualizar
            </button>
          )}
        </div>

        {draftsState.kind === "loading" ? (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-600">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />
            Carregando seus rascunhos…
          </div>
        ) : draftsState.kind === "error" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-700" />
              <div>
                <p className="font-semibold text-rose-900">Não foi possível carregar seus rascunhos</p>
                <p className="mt-1 text-sm leading-6 text-rose-800">{draftsState.message}</p>
              </div>
            </div>
            <button
              className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-800 px-4 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
              onClick={refreshDrafts}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Tentar novamente
            </button>
          </div>
        ) : draftsState.drafts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
            <FileClock aria-hidden="true" className="mx-auto size-8 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-800">Nenhum rascunho disponível</p>
            <p className="mt-1 text-sm text-slate-500">
              Depois de iniciar uma submissão, você poderá retomá-la por aqui.
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
                  isOpeningLocked={openingDraftId !== null || creatingTemplateKey !== null}
                  key={draft.id}
                  onDelete={setDeletingDraft}
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
              Acompanhe o andamento
            </p>
            <h2
              className="mt-1 text-xl font-bold text-slate-900"
              id="submitted-submissions-title"
            >
              Submissões
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
                Atualizar
              </button>
            )}
        </div>

        {submittedState.kind === "loading" ? (
          <div className="flex min-h-32 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-600">
            <LoaderCircle
              aria-hidden="true"
              className="size-5 animate-spin text-teal-700"
            />
            Carregando suas submissões…
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
                  Não foi possível carregar suas submissões
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
              Tentar novamente
            </button>
          </div>
        ) : submittedState.submissions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-8 text-center">
            <FileCheck2
              aria-hidden="true"
              className="mx-auto size-8 text-slate-400"
            />
            <p className="mt-3 font-semibold text-slate-800">
              Nenhuma submissão enviada
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Quando você enviar um método para análise, ele aparecerá aqui.
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
                <SubmittedSubmissionCard
                  key={submission.id}
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
          Comece uma proposta
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900" id="new-submission-title">
          Nova submissão
        </h2>

      <div className="mb-6 mt-3 w-full">
        <p className="text-sm leading-6 text-slate-600">
          Cada opção representa um propósito de submissão diferente. Ao escolher
          um template, criaremos a estrutura necessária para abrir o formulário.
          O preenchimento só será guardado quando você clicar em Salvar rascunho.
        </p>
      </div>

      {state.kind === "loading" ? (
        <SubmissionCatalogMessage
          description="Estamos consultando os tipos de formulário publicados pelo BraCVAM."
          title="Carregando tipos de submissão…"
        />
      ) : state.kind === "error" ? (
        <SubmissionCatalogMessage
          actionLabel="Tentar novamente"
          description={state.message}
          onAction={refreshTemplates}
          title="Não foi possível carregar as submissões"
        />
      ) : state.templates.length === 0 ? (
        <SubmissionCatalogMessage
          description="Quando um template for publicado, ele aparecerá aqui para iniciar o preenchimento."
          title="Nenhum tipo de submissão disponível"
        />
      ) : (
        <section
          aria-label="Tipos de submissão disponíveis"
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
          onRetry={() => void loadForm(dialog.template, dialog.process)}
          onSaved={refreshDrafts}
          onSubmitted={() => {
            setDialog({ kind: "closed" });
            setActiveTab("submitted");
            refreshDrafts();
            refreshSubmittedSubmissions();
          }}
          state={dialog}
        />
      )}

      {deletingDraft && (
        <SubmissionDeleteDialog
          draft={deletingDraft}
          onClose={() => setDeletingDraft(null)}
          onDeleted={(draftId) => {
            setDraftsState((current) =>
              current.kind === "ready"
                ? {
                    kind: "ready",
                    drafts: current.drafts.filter((draft) => draft.id !== draftId),
                  }
                : current,
            );
            setDeletingDraft(null);
          }}
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
        {template.description || "Este tipo de submissão ainda não possui descrição."}
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
        {isCreating ? "Criando rascunho…" : "Iniciar submissão"}
      </button>
    </article>
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
  return (
    <article className="flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-300/30">
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
          <FileClock aria-hidden="true" className="size-5" />
        </div>
        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800">
          Em preenchimento
        </span>
      </div>
      <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-teal-700">
        {draft.code}
      </p>
      <h3 className="mt-1 text-base font-bold text-slate-900">{draft.title}</h3>
      <p className="mt-1 flex-1 text-sm leading-6 text-slate-600">{templateName}</p>
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
          {isOpening ? "Abrindo…" : "Retomar edição"}
        </button>
        <button
          aria-label={`Excluir rascunho ${draft.code}`}
          className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 outline-none transition hover:border-rose-300 hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
          disabled={isOpeningLocked}
          onClick={() => onDelete(draft)}
          title="Excluir rascunho"
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-3.5" />
          Excluir
        </button>
      </div>
    </article>
  );
}

function SubmittedSubmissionCard({
  submission,
  templateName,
}: SubmittedSubmissionCardProps) {
  return (
    <article className="flex min-h-52 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-300/30">
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-teal-100 text-teal-800">
          <FileCheck2 aria-hidden="true" className="size-5" />
        </div>
        <span className="max-w-40 rounded-full bg-teal-100 px-2.5 py-1 text-center text-[11px] font-bold uppercase tracking-wide text-teal-800">
          {formatProcessStatus(submission.status)}
        </span>
      </div>
      <p className="mt-4 font-mono text-[11px] font-bold uppercase tracking-[0.1em] text-teal-700">
        {submission.code}
      </p>
      <h3 className="mt-1 text-base font-bold text-slate-900">
        {submission.title}
      </h3>
      <p className="mt-1 flex-1 text-sm leading-6 text-slate-600">
        {templateName}
      </p>
    </article>
  );
}

function SubmissionDeleteDialog({
  draft,
  onClose,
  onDeleted,
}: SubmissionDeleteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onClose]);

  async function confirmDeletion() {
    setIsDeleting(true);
    setError(null);

    try {
      const response = await fetch(`/api/submissions/${draft.id}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok) {
        setError(getApiMessage(payload, "Não foi possível excluir o rascunho."));
        return;
      }

      toast.success(getApiMessage(payload, "Rascunho excluído com sucesso."));
      onDeleted(draft.id);
    } catch {
      setError("Não foi possível conectar ao serviço de submissões.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div
      aria-describedby="delete-draft-description"
      aria-labelledby="delete-draft-title"
      aria-modal="true"
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-[2px]"
      role="alertdialog"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="grid size-11 place-items-center rounded-xl bg-rose-100 text-rose-700">
          <Trash2 aria-hidden="true" className="size-5" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900" id="delete-draft-title">
          Excluir rascunho?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600" id="delete-draft-description">
          Você está prestes a excluir <strong>{draft.code}</strong>. Essa ação não
          poderá ser desfeita.
        </p>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm leading-5 text-rose-800" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            autoFocus
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400 disabled:cursor-wait disabled:opacity-60"
            disabled={isDeleting}
            onClick={onClose}
            type="button"
          >
            Cancelar
          </button>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-rose-700 px-4 text-sm font-semibold text-white outline-none transition hover:bg-rose-800 focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            disabled={isDeleting}
            onClick={() => void confirmDeletion()}
            type="button"
          >
            {isDeleting ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Trash2 aria-hidden="true" className="size-4" />
            )}
            {isDeleting ? "Excluindo…" : "Excluir rascunho"}
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
}: SubmissionFormDialogProps) {
  const [inputs, setInputs] = useState<SubmissionFieldInputs>(() =>
    state.kind === "ready" ? buildInputs(state.form) : {},
  );
  const [operation, setOperation] = useState<SubmissionFormOperation>("idle");
  const operationRef = useRef<SubmissionFormOperation>("idle");

  function updateField(fieldKey: string, value: string | boolean) {
    setInputs((current) => ({ ...current, [fieldKey]: value }));
  }

  async function saveDraft() {
    if (
      state.kind !== "ready" ||
      state.form.is_submitted ||
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
          values: buildDraftValues(state.form.fields, inputs),
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | SaveSubmissionDraftResult
        | ApiMessage
        | null;

      if (!response.ok || !isSaveResult(payload)) {
        toast.error(getApiMessage(payload, "Não foi possível salvar o rascunho."));
        return;
      }

      toast.success(payload.message || "Rascunho salvo com sucesso.");
      onSaved();
    } catch {
      toast.error("Não foi possível conectar ao serviço de submissões.");
    } finally {
      operationRef.current = "idle";
      setOperation("idle");
    }
  }

  async function submitForAnalysis() {
    if (
      state.kind !== "ready" ||
      state.form.is_submitted ||
      operationRef.current !== "idle"
    ) {
      return;
    }

    const missingRequiredFile = state.form.fields.find(
      (field) =>
        field.field_type === "file_upload" &&
        field.is_required &&
        !hasSelectedFile(inputs[field.field_key]),
    );

    if (missingRequiredFile) {
      toast.error(
        `Selecione o arquivo obrigatório: ${missingRequiredFile.label}.`,
      );
      return;
    }

    operationRef.current = "submitting";
    setOperation("submitting");

    try {
      const response = await fetch(`/api/submissions/${state.process.id}/form`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          values: buildSubmissionValues(state.form.fields, inputs),
        }),
      });
      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !isSubmitResult(payload)) {
        toast.error(
          getApiMessage(payload, "Não foi possível enviar a submissão para análise."),
        );
        return;
      }

      toast.success("Submissão enviada para análise.");
      onSubmitted();
    } catch {
      toast.error("Não foi possível conectar ao serviço de submissões.");
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
      <div className="flex max-h-[94dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="font-mono text-xs font-bold uppercase tracking-wide text-teal-700">
              {state.process.code} · Rascunho
            </p>
            <h2
              className="mt-1 truncate text-xl font-bold text-slate-900"
              id="submission-form-title"
            >
              {state.template.name}
            </h2>
          </div>
          <button
            aria-label="Fechar formulário de submissão"
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
                A estrutura {state.process.code} já existe. Nenhum valor digitado
                é enviado enquanto Salvar rascunho não for acionado.
              </p>
              <button
                className="mt-4 rounded-lg bg-rose-800 px-4 py-2 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2"
                onClick={onRetry}
                type="button"
              >
                Tentar carregar novamente
              </button>
            </div>
          </div>
        ) : (
          <SubmissionDialogContent
            form={state.form}
            inputs={inputs}
            operation={operation}
            onFieldChange={updateField}
            onSave={() => void saveDraft()}
            onSubmit={() => void submitForAnalysis()}
          />
        )}
      </div>
    </div>
  );
}

function SubmissionDialogContent({
  form,
  inputs,
  operation,
  onFieldChange,
  onSave,
  onSubmit,
}: SubmissionDialogContentProps) {
  const orderedFields = [...form.fields].sort(
    (first, second) => first.order_index - second.order_index,
  );

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
        {form.is_submitted && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
            <Check aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            Este formulário já foi submetido e está disponível somente para
            consulta.
          </div>
        )}

        <form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
          {orderedFields.map((field) => (
            <DynamicFormFieldControl
              disabled={form.is_submitted}
              field={field}
              key={field.field_key}
              onChange={(value) => onFieldChange(field.field_key, value)}
              value={inputs[field.field_key]}
            />
          ))}
        </form>
      </div>

      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:px-6">
        <p className="text-xs leading-5 text-slate-500">
          Somente os valores confirmados em Salvar rascunho ficam disponíveis
          para continuar depois.
        </p>
        {!form.is_submitted && (
          <div className="flex flex-wrap justify-end gap-2">
            <button
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
              {operation === "saving" ? "Salvando…" : "Salvar rascunho"}
            </button>
            <button
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              disabled={operation !== "idle"}
              onClick={onSubmit}
              type="button"
            >
              {operation === "submitting" ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Send aria-hidden="true" className="size-4" />
              )}
              {operation === "submitting" ? "Enviando…" : "Enviar para análise"}
            </button>
          </div>
        )}
      </footer>
    </>
  );
}

function DynamicFormFieldControl({
  field,
  value,
  disabled,
  onChange,
}: DynamicFormFieldControlProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const fieldId = `submission-field-${field.field_key}`;
  const helpId = field.help_text ? `${fieldId}-help` : undefined;
  const inputClassName =
    "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  if (field.field_type === "file_upload") {
    const constraintsId = `${fieldId}-constraints`;
    const errorId = fileError ? `${fieldId}-error` : undefined;
    const describedBy = [helpId, constraintsId, errorId]
      .filter(Boolean)
      .join(" ");
    const selectedFileName = typeof value === "string" ? value : "";

    return (
      <div>
        <label
          className="text-sm font-semibold text-slate-800"
          htmlFor={fieldId}
        >
          {field.label}
          {field.is_required && <span className="ml-1 text-rose-700">*</span>}
        </label>
        <input
          accept={getFileAccept(field)}
          aria-describedby={describedBy}
          aria-invalid={fileError ? true : undefined}
          className={`${inputClassName} cursor-pointer p-1.5 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-800`}
          disabled={disabled}
          id={fieldId}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) {
              setFileError(null);
              onChange("");
              return;
            }

            const error = validateSelectedFile(file, field);
            if (error) {
              event.currentTarget.value = "";
              setFileError(error);
              onChange("");
              return;
            }

            setFileError(null);
            onChange(file.name);
          }}
          required={field.is_required}
          type="file"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500" id={constraintsId}>
          {getFileConstraintMessage(field)} A seleção permanece somente neste
          formulário e será enviada como referência ao concluir.
        </p>
        {selectedFileName && disabled && (
          <p className="mt-2 text-xs font-semibold text-teal-800">
            Referência registrada: {selectedFileName}
          </p>
        )}
        {field.help_text && (
          <p className="mt-2 text-xs leading-5 text-slate-500" id={helpId}>
            {field.help_text}
          </p>
        )}
        {fileError && (
          <p className="mt-2 text-xs font-semibold text-rose-700" id={errorId} role="alert">
            {fileError}
          </p>
        )}
      </div>
    );
  }

  if (!isSupportedField(field.field_type)) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          {field.label}
          {field.is_required && <span className="ml-1 text-rose-700">*</span>}
        </p>
        <p className="mt-1 text-xs leading-5 text-amber-900">
          O tipo de campo “${field.field_type}” ainda não é suportado pela
          interface.
        </p>
      </div>
    );
  }

  if (field.field_type === "boolean") {
    return (
      <div>
        <label
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-500"
          htmlFor={fieldId}
        >
          <input
            aria-describedby={helpId}
            checked={value === true}
            className="size-4 accent-teal-700"
            disabled={disabled}
            id={fieldId}
            onChange={(event) => onChange(event.target.checked)}
            type="checkbox"
          />
          <span>
            {field.label}
            {field.is_required && <span className="ml-1 text-rose-700">*</span>}
          </span>
        </label>
        {field.help_text && (
          <p className="mt-2 text-xs leading-5 text-slate-500" id={helpId}>
            {field.help_text}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label className="text-sm font-semibold text-slate-800" htmlFor={fieldId}>
        {field.label}
        {field.is_required && <span className="ml-1 text-rose-700">*</span>}
      </label>
      {field.field_type === "textarea" ? (
        <textarea
          aria-describedby={helpId}
          className={`${inputClassName} min-h-28 resize-y`}
          disabled={disabled}
          id={fieldId}
          onChange={(event) => onChange(event.target.value)}
          value={typeof value === "string" ? value : ""}
        />
      ) : field.field_type === "select" ? (
        <select
          aria-describedby={helpId}
          className={inputClassName}
          disabled={disabled}
          id={fieldId}
          onChange={(event) => onChange(event.target.value)}
          value={typeof value === "string" ? value : ""}
        >
          <option value="">Selecione uma opção</option>
          {getOptions(field.options).map((option) => (
            <option key={serializeOption(option.value)} value={serializeOption(option.value)}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          aria-describedby={helpId}
          className={inputClassName}
          disabled={disabled}
          id={fieldId}
          max={getNumericRule(field, "max")}
          min={getNumericRule(field, "min")}
          onChange={(event) => onChange(event.target.value)}
          step={field.field_type === "float" ? "any" : undefined}
          type={getInputType(field.field_type)}
          value={typeof value === "string" ? value : ""}
        />
      )}
      {field.help_text && (
        <p className="mt-2 text-xs leading-5 text-slate-500" id={helpId}>
          {field.help_text}
        </p>
      )}
    </div>
  );
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

function buildInputs(form: SubmissionForm): SubmissionFieldInputs {
  const inputs: SubmissionFieldInputs = {};

  for (const field of form.fields) {
    const value = form.values[field.field_key];
    if (value === undefined || value === null) {
      continue;
    }

    if (field.field_type === "boolean" && typeof value === "boolean") {
      inputs[field.field_key] = value;
    } else if (field.field_type === "select" && isOptionValue(value)) {
      inputs[field.field_key] = serializeOption(value);
    } else if (
      typeof value === "string" ||
      typeof value === "number"
    ) {
      inputs[field.field_key] = String(value);
    }
  }

  return inputs;
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

function buildDraftValues(
  fields: DynamicFormField[],
  inputs: SubmissionFieldInputs,
) {
  return buildFormValues(fields, inputs, false);
}

function buildSubmissionValues(
  fields: DynamicFormField[],
  inputs: SubmissionFieldInputs,
) {
  return buildFormValues(fields, inputs, true);
}

function buildFormValues(
  fields: DynamicFormField[],
  inputs: SubmissionFieldInputs,
  includeFileReferences: boolean,
) {
  const values: Record<string, DynamicFormValue> = {};

  for (const field of fields) {
    if (field.field_type === "file_upload") {
      if (includeFileReferences && Object.hasOwn(inputs, field.field_key)) {
        const value = inputs[field.field_key];
        values[field.field_key] =
          typeof value === "string" && value.trim() !== "" ? value : null;
      }
      continue;
    }

    if (
      !isSupportedField(field.field_type) ||
      !Object.hasOwn(inputs, field.field_key)
    ) {
      continue;
    }

    const value = inputs[field.field_key];

    if (field.field_type === "integer" || field.field_type === "float") {
      const normalized = typeof value === "string" ? value.trim() : "";
      values[field.field_key] = normalized === "" ? null : Number(normalized);
      continue;
    }

    if (field.field_type === "select" && typeof value === "string") {
      const option = getOptions(field.options).find(
        (candidate) => serializeOption(candidate.value) === value,
      );
      values[field.field_key] = option?.value ?? null;
      continue;
    }

    values[field.field_key] = value;
  }

  return values;
}

function hasSelectedFile(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function getAllowedFileExtensions(field: DynamicFormField) {
  const extensions = field.validation_rules?.allowed_extensions;

  if (!Array.isArray(extensions)) {
    return [];
  }

  return extensions
    .filter((extension): extension is string => typeof extension === "string")
    .map((extension) => extension.trim().toLowerCase().replace(/^\./, ""))
    .filter(Boolean);
}

function getMaximumFileSizeMb(field: DynamicFormField) {
  const maximum = field.validation_rules?.max_size_mb;
  return typeof maximum === "number" && maximum > 0 ? maximum : undefined;
}

function getFileAccept(field: DynamicFormField) {
  const extensions = getAllowedFileExtensions(field);
  return extensions.length > 0
    ? extensions.map((extension) => `.${extension}`).join(",")
    : undefined;
}

function getFileConstraintMessage(field: DynamicFormField) {
  const extensions = getAllowedFileExtensions(field);
  const maximumSizeMb = getMaximumFileSizeMb(field);
  const parts = [];

  if (extensions.length > 0) {
    parts.push(
      `Formatos aceitos: ${extensions
        .map((value) => value.toUpperCase())
        .join(", ")}.`,
    );
  }

  if (maximumSizeMb) {
    parts.push(`Tamanho máximo: ${maximumSizeMb} MB.`);
  }

  return parts.length > 0 ? parts.join(" ") : "Selecione um arquivo válido.";
}

function validateSelectedFile(file: File, field: DynamicFormField) {
  const extensions = getAllowedFileExtensions(field);
  const extension = file.name.includes(".")
    ? file.name.split(".").pop()?.toLowerCase()
    : undefined;

  if (extensions.length > 0 && (!extension || !extensions.includes(extension))) {
    return `Selecione um arquivo nos formatos: ${extensions
      .map((value) => value.toUpperCase())
      .join(", ")}.`;
  }

  const maximumSizeMb = getMaximumFileSizeMb(field);
  if (maximumSizeMb && file.size > maximumSizeMbToBytes(maximumSizeMb)) {
    return `O arquivo deve ter no máximo ${maximumSizeMb} MB.`;
  }

  return null;
}

function maximumSizeMbToBytes(value: number) {
  return value * 1024 * 1024;
}

function getOptions(options: unknown[] | null | undefined): DynamicFormOption[] {
  if (!Array.isArray(options)) {
    return [];
  }

  const normalized: DynamicFormOption[] = [];

  for (const option of options) {
    if (isOptionValue(option)) {
      normalized.push({ value: option, label: String(option) });
      continue;
    }

    if (
      option &&
      typeof option === "object" &&
      "value" in option &&
      isOptionValue(option.value)
    ) {
      normalized.push({
        value: option.value,
        label:
          "label" in option && typeof option.label === "string"
            ? option.label
            : String(option.value),
      });
    }
  }

  return normalized;
}

function serializeOption(value: DynamicFormOptionValue) {
  return JSON.stringify([typeof value, value]);
}

function getInputType(fieldType: string) {
  if (fieldType === "integer" || fieldType === "float") return "number";
  if (fieldType === "date") return "date";
  return "text";
}

function getNumericRule(field: DynamicFormField, rule: "min" | "max") {
  const value = field.validation_rules?.[rule];
  return typeof value === "number" ? value : undefined;
}

function isSupportedField(fieldType: string) {
  return [
    "text",
    "textarea",
    "integer",
    "float",
    "boolean",
    "select",
    "date",
  ].includes(fieldType);
}

function isOptionValue(value: unknown): value is DynamicFormOptionValue {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
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

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getApiMessage(value: unknown, fallback: string) {
  return isRecord(value) && typeof value.message === "string"
    ? value.message
    : fallback;
}

function formatProcessStatus(status: string) {
  const knownLabels: Record<string, string> = {
    TRIAGE: "Em triagem",
    EVALUATION: "Em avaliação",
    UNDER_EVALUATION: "Em avaliação",
    COMPLETED: "Concluída",
    CLOSED: "Encerrada",
  };

  if (knownLabels[status]) {
    return knownLabels[status];
  }

  return status
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function requestTemplates(): Promise<SubmissionCatalogState> {
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
          "Não foi possível carregar os tipos de submissão.",
        ),
      };
    }

    return { kind: "ready", templates: payload };
  } catch {
    return {
      kind: "error",
      message: "Não foi possível conectar ao serviço de submissões.",
    };
  }
}

async function requestDrafts(): Promise<SubmissionDraftsState> {
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
          "Não foi possível carregar seus rascunhos.",
        ),
      };
    }

    return { kind: "ready", drafts: payload };
  } catch {
    return {
      kind: "error",
      message: "Não foi possível conectar ao serviço de submissões.",
    };
  }
}

async function requestSubmittedSubmissions(): Promise<SubmittedSubmissionsState> {
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
          "Não foi possível carregar suas submissões.",
        ),
      };
    }

    return { kind: "ready", submissions: payload };
  } catch {
    return {
      kind: "error",
      message: "Não foi possível conectar ao serviço de submissões.",
    };
  }
}

function isProcessInstanceList(value: unknown): value is ProcessInstance[] {
  return Array.isArray(value) && value.every(isProcessInstance);
}
