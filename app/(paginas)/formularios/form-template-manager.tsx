"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bot,
  LoaderCircle,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useAccessibleDialog } from "@/components/accessible-dialog";
import {
  FORM_FIELD_TYPES,
  createEmptyFormField,
  createEmptyFormSection,
  flattenFormSections,
  formatFieldOptions,
  groupFormSections,
  parseFieldOptions,
  validateFormDefinition,
} from "@/components/formulario";
import type {
  EvaluableFieldsResponse,
  FormCatalogCardProps,
  FormCatalogState,
  FormConfirmDiscardDialogProps,
  FormEditorProps,
  FormEditorFieldProps,
  FormEditorSection,
  FormEditorState,
  FormEvaluationAssignment,
  FormFieldEditorProps,
  FormOrderButtonsProps,
  FormPageMessageProps,
  FormRuleNumberInputProps,
  FormSessionCapabilities,
  FormSectionEditorProps,
  FormTemplateCatalogItem,
  FormTemplateDetail,
  FormTemplateField,
} from "@/types/Formulario";
import type { ApiRecord } from "@/types/Servico";
import {
  FieldAiRuleModal,
  FieldAiRuleSection,
} from "./field-ai-rule-manager";

const FIELD_TYPE_LABELS = {
  text: "Texto curto",
  textarea: "Texto longo",
  select: "Seleção",
  integer: "Número inteiro",
  float: "Número decimal",
  boolean: "Sim ou não",
  date: "Data",
  file_upload: "Arquivo",
};

const EDITOR_INPUT_CLASS =
  "mt-2 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-normal normal-case tracking-normal text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function FormTemplateManager() {
  const [catalog, setCatalog] = useState<FormCatalogState>({ kind: "loading" });
  const [editor, setEditor] = useState<FormEditorState>({ kind: "closed" });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isConfirmDiscardOpen, setIsConfirmDiscardOpen] = useState(false);
  const [selectedAiField, setSelectedAiField] = useState<FormTemplateField | null>(null);
  const selectionRequestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setCatalog({ kind: "loading" });

      try {
        const [catalogResponse, sessionResponse] = await Promise.all([
          fetch("/api/forms", { cache: "no-store", signal: controller.signal }),
          fetch("/api/auth/me", { cache: "no-store", signal: controller.signal }),
        ]);
        const [catalogPayload, sessionPayload] = await Promise.all([
          catalogResponse.json().catch(() => null),
          sessionResponse.json().catch(() => null),
        ]);

        if (controller.signal.aborted) return;

        if (sessionResponse.ok && isCurrentUser(sessionPayload)) {
          setPermissions(sessionPayload.permissions);
        }

        if (!catalogResponse.ok || !isFormCatalog(catalogPayload)) {
          setCatalog(
            catalogResponse.status === 403
              ? {
                  kind: "denied",
                  message: getApiMessage(
                    catalogPayload,
                    "Seu perfil não pode consultar a gestão de formulários.",
                  ),
                }
              : {
                  kind: "error",
                  message: getApiMessage(
                    catalogPayload,
                    "Não foi possível carregar os formulários.",
                  ),
                },
          );
          return;
        }

        setCatalog({ kind: "ready", items: catalogPayload });
      } catch {
        if (!controller.signal.aborted) {
          setCatalog({
            kind: "error",
            message: "Não foi possível conectar ao serviço de formulários.",
          });
        }
      }
    }

    void load();
    return () => controller.abort();
  }, [reloadKey]);

  const canManageAi = permissions.includes("ai_evaluations.manage");

  async function selectForm(item: FormTemplateCatalogItem) {
    const requestId = selectionRequestId.current + 1;
    selectionRequestId.current = requestId;
    setHasPendingChanges(false);
    setIsConfirmDiscardOpen(false);
    setEditor({ kind: "loading", item });

    try {
      const [detailResponse, assignmentsResponse] = await Promise.all([
        fetch(
          `/api/forms/${encodeURIComponent(item.processKey)}/${encodeURIComponent(item.key)}`,
          { cache: "no-store" },
        ),
        fetch(`/api/forms/evaluable-fields/${encodeURIComponent(item.key)}`, {
          cache: "no-store",
        }),
      ]);
      const [detailPayload, assignmentsPayload] = await Promise.all([
        detailResponse.json().catch(() => null),
        assignmentsResponse.json().catch(() => null),
      ]);

      if (selectionRequestId.current !== requestId) return;

      if (!detailResponse.ok || !isFormDetail(detailPayload)) {
        setEditor({
          kind: "error",
          item,
          message: getApiMessage(
            detailPayload,
            "Não foi possível carregar a definição do formulário.",
          ),
        });
        return;
      }

      const assignments =
        assignmentsResponse.ok && isEvaluableFields(assignmentsPayload)
          ? Object.fromEntries(
              assignmentsPayload.fields.map((field) => [
                field.field_key,
                field.assignments,
              ]),
            )
          : {};

      setEditor({
        kind: "ready",
        item,
        detail: detailPayload,
        sections: groupFormSections(detailPayload.fields),
        assignments,
        isSaving: false,
      });
      setHasPendingChanges(false);
    } catch {
      if (selectionRequestId.current === requestId) {
        setEditor({
          kind: "error",
          item,
          message: "Não foi possível conectar ao serviço de formulários.",
        });
      }
    }
  }

  function updateReadyEditor(
    update: (state: Extract<FormEditorState, { kind: "ready" }>) =>
      Extract<FormEditorState, { kind: "ready" }>,
  ) {
    setHasPendingChanges(true);
    setEditor((current) => (current.kind === "ready" ? update(current) : current));
  }

  function handleBackToList() {
    if (hasPendingChanges) {
      setIsConfirmDiscardOpen(true);
      return;
    }
    setEditor({ kind: "closed" });
    setHasPendingChanges(false);
  }

  function handleConfirmDiscard() {
    setIsConfirmDiscardOpen(false);
    setEditor({ kind: "closed" });
    setHasPendingChanges(false);
  }

  async function handleUnlinkAiRule(
    field: FormTemplateField,
    assignmentId: string,
  ) {
    if (editor.kind !== "ready") return;

    updateReadyEditor((current) => ({
      ...current,
      sections: current.sections.map((section) => ({
        ...section,
        fields: section.fields.map((f) =>
          f.field_key === field.field_key
            ? { ...f, ai_evaluation_enabled: false }
            : f,
        ),
      })),
    }));

    try {
      const allCurrentAssignments = Object.values(editor.assignments).flat();
      const updatedAssignments = allCurrentAssignments
        .filter(
          (a) =>
            a.id !== assignmentId && !a.field_keys?.includes(field.field_key),
        )
        .map((a) => ({
          definition_id: a.definition_id,
          pinned_version_id: a.pinned_version_id ?? null,
          target_type: a.target_type as any,
          field_keys: a.field_keys ?? [],
          enabled: a.enabled !== false,
        }));

      const res = await fetch(
        `/api/ai-evaluations/assignments/${encodeURIComponent(editor.item.key)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments: updatedAssignments }),
        },
      );
      const payload = await res.json().catch(() => null);
      if (res.ok && payload && Array.isArray(payload.assignments)) {
        const mapped: Record<string, FormEvaluationAssignment[]> = {};
        for (const item of payload.assignments) {
          for (const k of item.field_keys ?? []) {
            if (!mapped[k]) mapped[k] = [];
            mapped[k].push(item);
          }
        }
        setEditor((current) =>
          current.kind === "ready"
            ? { ...current, assignments: mapped }
            : current,
        );
        toast.success("Avaliação por IA desvinculada deste campo.");
      }
    } catch {
      toast.error("Não foi possível sincronizar a desvinculação com o servidor.");
    }
  }

  async function saveForm() {
    if (editor.kind !== "ready" || editor.isSaving) return;

    const sectionError = validateSections(editor.sections);
    if (sectionError) {
      toast.error(sectionError);
      return;
    }

    const validation = validateFormDefinition({
      name: editor.detail.name,
      description: editor.detail.description,
      fields: flattenFormSections(editor.sections),
    });
    if (!validation.valid) {
      toast.error(validation.message);
      return;
    }

    updateReadyEditor((current) => ({ ...current, isSaving: true }));

    try {
      const response = await fetch(
        `/api/forms/${encodeURIComponent(editor.item.processKey)}/${encodeURIComponent(editor.item.key)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validation.input),
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok || !isFormDetail(payload)) {
        updateReadyEditor((current) => ({ ...current, isSaving: false }));
        toast.error(
          getApiMessage(payload, "Não foi possível salvar o formulário."),
        );
        return;
      }

      const updatedItem = {
        ...editor.item,
        name: payload.name,
        description: payload.description,
        version: payload.version,
      };
      setCatalog((current) =>
        current.kind === "ready"
          ? {
              kind: "ready",
              items: current.items.map((item) =>
                item.processKey === updatedItem.processKey &&
                item.key === updatedItem.key
                  ? updatedItem
                  : item,
              ),
            }
          : current,
      );
      setEditor({
        kind: "ready",
        item: updatedItem,
        detail: payload,
        sections: groupFormSections(payload.fields),
        assignments: editor.assignments,
        isSaving: false,
      });
      setHasPendingChanges(false);
      toast.success("Formulário salvo com os dados confirmados pela API.");
    } catch {
      updateReadyEditor((current) => ({ ...current, isSaving: false }));
      toast.error("Não foi possível conectar ao serviço de formulários.");
    }
  }

  if (editor.kind === "closed") {
    return (
      <div className="flex-1 pb-12 pt-2">
        <div className="mb-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            Gestão de formulários
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Formulários dos processos
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Selecione um formulário abaixo para configurar seções, campos e critérios de avaliação de IA.
          </p>
        </div>

        {catalog.kind === "loading" ? (
          <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
            <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />
            Carregando formulários dos processos…
          </div>
        ) : catalog.kind === "denied" || catalog.kind === "error" ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <FormPageMessage
              actionLabel={catalog.kind === "error" ? "Tentar novamente" : undefined}
              description={catalog.message}
              onAction={
                catalog.kind === "error"
                  ? () => setReloadKey((value) => value + 1)
                  : undefined
              }
              title={catalog.kind === "denied" ? "Acesso restrito" : "Falha na listagem"}
            />
          </div>
        ) : catalog.items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <FormPageMessage
              description="Nenhum formulário de processo administrável foi encontrado."
              title="Nenhum formulário disponível"
            />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {catalog.items.map((item) => (
              <FormCatalogCard
                item={item}
                key={`${item.processKey}:${item.key}`}
                onSelect={(selected) => void selectForm(selected)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (editor.kind === "loading") {
    return (
      <div className="flex-1 pb-12 pt-2">
        <div className="mb-4">
          <button
            className="inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-teal-700 outline-none transition hover:text-teal-900 focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={() => setEditor({ kind: "closed" })}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar para a lista de formulários
          </button>
        </div>
        <div className="flex min-h-96 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />
          Carregando formulário {editor.item.name}…
        </div>
      </div>
    );
  }

  if (editor.kind === "error") {
    return (
      <div className="flex-1 pb-12 pt-2">
        <div className="mb-4">
          <button
            className="inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-teal-700 outline-none transition hover:text-teal-900 focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={() => setEditor({ kind: "closed" })}
            type="button"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Voltar para a lista de formulários
          </button>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <FormPageMessage
            actionLabel="Tentar novamente"
            description={editor.message}
            onAction={() => void selectForm(editor.item)}
            title="Não foi possível abrir o formulário"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 pb-12 pt-2">
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <FormEditor
          canManageAi={canManageAi}
          hasPendingChanges={hasPendingChanges}
          onAddField={(sectionId) =>
            updateReadyEditor((current) => ({
              ...current,
              sections: current.sections.map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      fields: [
                        ...section.fields,
                        createEmptyFormField(
                          current.sections.reduce(
                            (total, item) => total + item.fields.length,
                            0,
                          ),
                          section.name,
                        ),
                      ],
                    }
                  : section,
              ),
            }))
          }
          onAddSection={() =>
            updateReadyEditor((current) => ({
              ...current,
              sections: [
                ...current.sections,
                createEmptyFormSection(current.sections.length),
              ],
            }))
          }
          onBack={handleBackToList}
          onDescriptionChange={(description) =>
            updateReadyEditor((current) => ({
              ...current,
              detail: { ...current.detail, description },
            }))
          }
          onMoveField={(sectionId, fieldIndex, direction) =>
            updateReadyEditor((current) => ({
              ...current,
              sections: current.sections.map((section) =>
                section.id === sectionId
                  ? { ...section, fields: moveItem(section.fields, fieldIndex, direction) }
                  : section,
              ),
            }))
          }
          onMoveSection={(sectionId, direction) =>
            updateReadyEditor((current) => ({
              ...current,
              sections: moveItem(
                current.sections,
                current.sections.findIndex((section) => section.id === sectionId),
                direction,
              ),
            }))
          }
          onNameChange={(name) =>
            updateReadyEditor((current) => ({
              ...current,
              detail: { ...current.detail, name },
            }))
          }
          onRemoveField={(sectionId, fieldIndex) =>
            updateReadyEditor((current) => ({
              ...current,
              sections: current.sections.map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      fields: section.fields.filter((_, index) => index !== fieldIndex),
                    }
                  : section,
              ),
            }))
          }
          onRemoveSection={(sectionId) =>
            updateReadyEditor((current) => ({
              ...current,
              sections: current.sections.filter((section) => section.id !== sectionId),
            }))
          }
          onRenameSection={(sectionId, name) =>
            updateReadyEditor((current) => ({
              ...current,
              sections: current.sections.map((section) =>
                section.id === sectionId ? { ...section, name } : section,
              ),
            }))
          }
          onSave={() => void saveForm()}
          onUpdateField={(sectionId, fieldIndex, field) =>
            updateReadyEditor((current) => ({
              ...current,
              sections: current.sections.map((section) =>
                section.id === sectionId
                  ? {
                      ...section,
                      fields: section.fields.map((item, index) =>
                        index === fieldIndex ? field : item,
                      ),
                    }
                  : section,
              ),
            }))
          }
          onOpenAiModal={(field) => setSelectedAiField(field)}
          onUnlinkAiRule={handleUnlinkAiRule}
          state={editor}
        />
      </div>

      <FormConfirmDiscardDialog
        isOpen={isConfirmDiscardOpen}
        onCancel={() => setIsConfirmDiscardOpen(false)}
        onConfirm={handleConfirmDiscard}
      />

      {selectedAiField && editor.kind === "ready" && (
        <FieldAiRuleModal
          allFields={flattenFormSections(editor.sections)}
          existingAssignments={Object.values(editor.assignments).flat()}
          field={selectedAiField}
          isOpen={Boolean(selectedAiField)}
          onClose={() => setSelectedAiField(null)}
          onRuleLinked={(newAssignments) => {
            const mapped: Record<string, FormEvaluationAssignment[]> = {};
            for (const item of newAssignments) {
              for (const k of item.field_keys ?? []) {
                if (!mapped[k]) mapped[k] = [];
                mapped[k].push(item);
              }
            }
            setEditor((curr) => {
              if (curr.kind !== "ready") return curr;
              return {
                ...curr,
                assignments: mapped,
                sections: curr.sections.map((s) => ({
                  ...s,
                  fields: s.fields.map((f) =>
                    f.field_key === selectedAiField.field_key
                      ? { ...f, ai_evaluation_enabled: true }
                      : f,
                  ),
                })),
              };
            });
            setHasPendingChanges(true);
            setSelectedAiField(null);
          }}
          templateKey={editor.item.key}
        />
      )}
    </div>
  );
}

function FormCatalogCard({ item, onSelect }: FormCatalogCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-teal-300 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex items-center rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
            {item.processName}
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-[0.7rem] font-medium text-slate-600">
            v{item.version}
          </span>
        </div>

        <h2 className="mt-3 text-lg font-bold text-slate-900">{item.name}</h2>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-end">
          <button
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-xs font-semibold text-white outline-none transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
            onClick={() => onSelect(item)}
            type="button"
          >
            <span>Configurar formulário</span>
            <ArrowRight aria-hidden="true" className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function FormEditor({
  state,
  canManageAi,
  hasPendingChanges,
  onBack,
  onNameChange,
  onDescriptionChange,
  onAddSection,
  onRenameSection,
  onRemoveSection,
  onMoveSection,
  onAddField,
  onUpdateField,
  onRemoveField,
  onMoveField,
  onSave,
  onOpenAiModal,
  onUnlinkAiRule,
}: FormEditorProps) {
  const allFields = flattenFormSections(state.sections);

  return (
    <div>
      <header className="border-b border-slate-200 p-5 sm:p-6">
        {onBack && (
          <div className="mb-4">
            <button
              className="inline-flex items-center gap-2 rounded-lg py-1 text-sm font-semibold text-teal-700 outline-none transition hover:text-teal-900 focus-visible:ring-2 focus-visible:ring-teal-500"
              onClick={onBack}
              type="button"
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              <span>Voltar para a lista de formulários</span>
            </button>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-mono text-xs font-bold text-teal-700">
                {state.item.processKey} / {state.detail.key} · v{state.detail.version}
              </p>
              {hasPendingChanges && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Alterações não salvas
                </span>
              )}
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {state.detail.name || "Editar formulário"}
            </h2>
          </div>
          <button
            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white outline-none transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
            disabled={state.isSaving}
            onClick={onSave}
            type="button"
          >
            {state.isSaving ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            {state.isSaving ? "Salvando…" : "Salvar formulário"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-800">
            Nome do formulário
            <input
              className="mt-2 min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              disabled={state.isSaving}
              maxLength={255}
              onChange={(event) => onNameChange(event.target.value)}
              value={state.detail.name}
            />
          </label>
          <label className="text-sm font-semibold text-slate-800 sm:row-span-2">
            Descrição
            <textarea
              className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-300 p-3 text-sm font-normal outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              disabled={state.isSaving}
              onChange={(event) => onDescriptionChange(event.target.value)}
              value={state.detail.description ?? ""}
            />
          </label>
          <div>
            <p className="text-sm font-semibold text-slate-800">Chave técnica</p>
            <p className="mt-2 min-h-11 rounded-xl border border-slate-200 bg-slate-100 px-3 py-3 font-mono text-xs text-slate-600">
              {state.detail.key}
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-4 p-5 sm:p-6">
        {state.sections.map((section, index) => (
          <FormSectionEditor
            allFields={allFields}
            assignments={state.assignments}
            canManageAi={canManageAi}
            disabled={state.isSaving}
            key={section.id}
            templateKey={state.detail.key}
            onAddField={() => onAddField(section.id)}
            onMove={(direction) => onMoveSection(section.id, direction)}
            onMoveField={(fieldIndex, direction) =>
              onMoveField(section.id, fieldIndex, direction)
            }
            onOpenAiModal={onOpenAiModal}
            onRemove={() => onRemoveSection(section.id)}
            onRemoveField={(fieldIndex) => onRemoveField(section.id, fieldIndex)}
            onRename={(name) => onRenameSection(section.id, name)}
            onUnlinkAiRule={onUnlinkAiRule}
            onUpdateField={(fieldIndex, field) =>
              onUpdateField(section.id, fieldIndex, field)
            }
            section={section}
            sectionCount={state.sections.length}
            sectionIndex={index}
          />
        ))}

        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-dashed border-teal-500 bg-teal-50 px-4 text-sm font-semibold text-teal-800 outline-none hover:bg-teal-100 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60"
          disabled={state.isSaving}
          onClick={onAddSection}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Adicionar seção
        </button>
      </div>
    </div>
  );
}

function FormSectionEditor({
  templateKey,
  section,
  sectionIndex,
  sectionCount,
  assignments,
  canManageAi,
  disabled,
  allFields,
  onRename,
  onRemove,
  onMove,
  onAddField,
  onUpdateField,
  onRemoveField,
  onMoveField,
  onOpenAiModal,
  onUnlinkAiRule,
}: FormSectionEditorProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-56 flex-1 text-xs font-bold uppercase tracking-wide text-slate-600">
          Nome da seção
          <input
            className="mt-2 min-h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            disabled={disabled}
            onChange={(event) => onRename(event.target.value)}
            value={section.name}
          />
        </label>
        <OrderButtons
          canMoveDown={sectionIndex < sectionCount - 1}
          canMoveUp={sectionIndex > 0}
          disabled={disabled}
          label="seção"
          onMove={onMove}
        />
        <button
          aria-label={`Remover seção ${section.name}`}
          className="grid size-10 place-items-center rounded-lg text-rose-700 outline-none hover:bg-rose-100 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
          disabled={disabled}
          onClick={onRemove}
          type="button"
        >
          <Trash2 aria-hidden="true" className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid gap-3">
        {section.fields.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
            Adicione ao menos um campo antes de salvar esta seção.
          </p>
        ) : (
          section.fields.map((field, index) => (
            <FormFieldEditor
              allFields={allFields}
              assignment={assignments[field.field_key] ?? []}
              canManageAi={canManageAi}
              canMoveDown={index < section.fields.length - 1}
              canMoveUp={index > 0}
              disabled={disabled}
              field={field}
              fieldIndex={index}
              key={`${field.field_key}:${index}`}
              onChange={(value) => onUpdateField(index, value)}
              onMove={(direction) => onMoveField(index, direction)}
              onOpenAiModal={onOpenAiModal ? () => onOpenAiModal(field) : undefined}
              onRemove={() => onRemoveField(index)}
              onUnlinkAiRule={
                onUnlinkAiRule
                  ? (assignmentId) => onUnlinkAiRule(field, assignmentId)
                  : undefined
              }
              sectionId={section.id}
              templateKey={templateKey}
            />
          ))
        )}
      </div>

      <button
        className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal-700 bg-white px-3 text-sm font-semibold text-teal-800 outline-none hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60"
        disabled={disabled}
        onClick={onAddField}
        type="button"
      >
        <Plus aria-hidden="true" className="size-4" />
        Adicionar campo
      </button>
    </section>
  );
}

function FormFieldEditor({
  templateKey,
  field,
  fieldIndex,
  sectionId,
  assignment,
  canManageAi,
  disabled,
  allFields,
  onChange,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
  onOpenAiModal,
  onUnlinkAiRule,
}: FormFieldEditorProps) {
  const inputId = `form-editor-${sectionId}-${fieldIndex}`;

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
          Campo {fieldIndex + 1}
        </p>
        <div className="flex items-center gap-1">
          <OrderButtons
            canMoveDown={canMoveDown}
            canMoveUp={canMoveUp}
            disabled={disabled}
            label={`campo ${field.label}`}
            onMove={onMove}
          />
          <button
            aria-label={`Remover campo ${field.label}`}
            className="grid size-9 place-items-center rounded-lg text-rose-700 outline-none hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
            disabled={disabled}
            onClick={onRemove}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <FieldInput label="Chave" inputId={`${inputId}-key`}>
          <input
            className={`${EDITOR_INPUT_CLASS} font-mono`}
            disabled={disabled}
            id={`${inputId}-key`}
            onChange={(event) => onChange({ ...field, field_key: event.target.value })}
            value={field.field_key}
          />
        </FieldInput>
        <FieldInput label="Rótulo" inputId={`${inputId}-label`}>
          <input
            className={EDITOR_INPUT_CLASS}
            disabled={disabled}
            id={`${inputId}-label`}
            onChange={(event) => onChange({ ...field, label: event.target.value })}
            value={field.label}
          />
        </FieldInput>
        <FieldInput label="Tipo" inputId={`${inputId}-type`}>
          <select
            className={EDITOR_INPUT_CLASS}
            disabled={disabled}
            id={`${inputId}-type`}
            onChange={(event) =>
              onChange({
                ...field,
                field_type: event.target.value,
                options: event.target.value === "select" ? field.options ?? [] : null,
              })
            }
            value={field.field_type}
          >
            {!FORM_FIELD_TYPES.includes(
              field.field_type as (typeof FORM_FIELD_TYPES)[number],
            ) && <option value={field.field_type}>{field.field_type}</option>}
            {FORM_FIELD_TYPES.map((type) => (
              <option key={type} value={type}>
                {FIELD_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </FieldInput>
        <label className="flex min-h-11 items-center gap-3 self-end rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700">
          <input
            checked={field.is_required}
            className="size-4 accent-teal-700"
            disabled={disabled}
            onChange={(event) => onChange({ ...field, is_required: event.target.checked })}
            type="checkbox"
          />
          Campo obrigatório
        </label>
        <FieldInput label="Orientação" inputId={`${inputId}-help`} wide>
          <textarea
            className={`${EDITOR_INPUT_CLASS} min-h-20 py-2`}
            disabled={disabled}
            id={`${inputId}-help`}
            onChange={(event) =>
              onChange({ ...field, help_text: event.target.value || null })
            }
            value={field.help_text ?? ""}
          />
        </FieldInput>
      </div>

      {field.field_type === "select" && (
        <FieldInput
          help="Uma opção por linha, no formato valor|rótulo."
          inputId={`${inputId}-options`}
          label="Opções"
          wide
        >
          <textarea
            className={`${EDITOR_INPUT_CLASS} min-h-24 py-2 font-mono`}
            disabled={disabled}
            id={`${inputId}-options`}
            onChange={(event) =>
              onChange({ ...field, options: parseFieldOptions(event.target.value) })
            }
            value={formatFieldOptions(field.options)}
          />
        </FieldInput>
      )}

      {(field.field_type === "integer" || field.field_type === "float") && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RuleNumberInput
            disabled={disabled}
            field={field}
            inputId={`${inputId}-min`}
            label="Valor mínimo"
            onChange={onChange}
            rule="min"
          />
          <RuleNumberInput
            disabled={disabled}
            field={field}
            inputId={`${inputId}-max`}
            label="Valor máximo"
            onChange={onChange}
            rule="max"
          />
        </div>
      )}

      {(field.field_type === "text" || field.field_type === "textarea") && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <RuleNumberInput
            disabled={disabled}
            field={field}
            inputId={`${inputId}-min-length`}
            label="Mínimo de caracteres"
            onChange={onChange}
            rule="min_length"
          />
          <RuleNumberInput
            disabled={disabled}
            field={field}
            inputId={`${inputId}-max-length`}
            label="Máximo de caracteres"
            onChange={onChange}
            rule="max_length"
          />
        </div>
      )}

      {field.field_type === "file_upload" && (
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <FieldInput label="Extensões permitidas" inputId={`${inputId}-extensions`}>
            <input
              className={EDITOR_INPUT_CLASS}
              disabled={disabled}
              id={`${inputId}-extensions`}
              onChange={(event) =>
                onChange(
                  updateRule(
                    field,
                    "allowed_extensions",
                    event.target.value
                      .split(",")
                      .map((value) => value.trim())
                      .filter(Boolean),
                  ),
                )
              }
              placeholder="pdf, docx"
              value={getStringArrayRule(field, "allowed_extensions").join(", ")}
            />
          </FieldInput>
          <RuleNumberInput
            disabled={disabled}
            field={field}
            inputId={`${inputId}-max-size`}
            label="Tamanho máximo (MB)"
            onChange={onChange}
            rule="max_size_mb"
          />
        </div>
      )}

      <FieldAiRuleSection
        allFields={allFields ?? []}
        assignment={assignment}
        canManageAi={canManageAi}
        disabled={disabled}
        field={field}
        onOpenRuleConfig={() => onOpenAiModal?.()}
        onToggleAi={(enabled) =>
          onChange({ ...field, ai_evaluation_enabled: enabled })
        }
        onUnlinkRule={(assignmentId) => onUnlinkAiRule?.(assignmentId)}
        templateKey={templateKey}
      />
    </article>
  );
}

function FormPageMessage({
  title,
  description,
  actionLabel,
  onAction,
}: FormPageMessageProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center">
      <AlertCircle aria-hidden="true" className="mx-auto size-6 text-slate-500" />
      <p className="mt-2 font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      {actionLabel && onAction && (
        <button
          className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
          onClick={onAction}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function FormConfirmDiscardDialog({
  isOpen,
  onCancel,
  onConfirm,
}: FormConfirmDiscardDialogProps) {
  const dialogRef = useAccessibleDialog(isOpen, false, onCancel);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-4"
      role="presentation"
    >
      <div
        aria-labelledby="discard-changes-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <AlertCircle aria-hidden="true" className="size-6" />
        </div>
        <h2
          className="mt-4 text-xl font-bold text-slate-900"
          id="discard-changes-title"
        >
          Descartar alterações?
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Você possui modificações não salvas neste formulário. Ao voltar para a
          lista de formulários, todas as alterações pendentes serão perdidas.
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={onCancel}
            type="button"
          >
            Continuar editando
          </button>
          <button
            className="min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white outline-none transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500"
            onClick={onConfirm}
            type="button"
          >
            Descartar alterações
          </button>
        </div>
      </div>
    </div>
  );
}

function moveItem<T>(items: T[], index: number, direction: -1 | 1) {
  const destination = index + direction;
  if (index < 0 || destination < 0 || destination >= items.length) return items;

  const next = [...items];
  const current = next[index];
  next[index] = next[destination];
  next[destination] = current;
  return next;
}

function validateSections(sections: FormEditorSection[]) {
  if (sections.length === 0) return "Inclua ao menos uma seção.";

  const names = new Set<string>();
  for (const section of sections) {
    const name = section.name.trim();
    if (!name) return "Todas as seções precisam de nome.";
    if (names.has(name.toLocaleLowerCase("pt-BR"))) {
      return `O nome de seção “${name}” está duplicado.`;
    }
    names.add(name.toLocaleLowerCase("pt-BR"));
    if (section.fields.length === 0) {
      return `Inclua ao menos um campo na seção “${name}”.`;
    }
  }
  return null;
}

function isFormCatalog(value: unknown): value is FormTemplateCatalogItem[] {
  return Array.isArray(value) && value.every(isFormCatalogItem);
}

function isFormCatalogItem(value: unknown): value is FormTemplateCatalogItem {
  return (
    isRecord(value) &&
    typeof value.processKey === "string" &&
    typeof value.processName === "string" &&
    typeof value.key === "string" &&
    typeof value.name === "string" &&
    (value.description === null || typeof value.description === "string") &&
    typeof value.version === "number"
  );
}

function isFormDetail(value: unknown): value is FormTemplateDetail {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.key === "string" &&
    typeof value.name === "string" &&
    typeof value.version === "number" &&
    (value.description === null || typeof value.description === "string") &&
    Array.isArray(value.fields) &&
    value.fields.every(isFormField)
  );
}

function isFormField(value: unknown): value is FormTemplateField {
  return (
    isRecord(value) &&
    typeof value.field_key === "string" &&
    typeof value.label === "string" &&
    typeof value.field_type === "string" &&
    typeof value.is_required === "boolean" &&
    typeof value.order_index === "number"
  );
}

function isEvaluableFields(value: unknown): value is EvaluableFieldsResponse {
  return (
    isRecord(value) &&
    Array.isArray(value.fields) &&
    value.fields.every(
      (field) =>
        isRecord(field) &&
        typeof field.field_key === "string" &&
        typeof field.label === "string" &&
        Array.isArray(field.assignments),
    )
  );
}

function isCurrentUser(value: unknown): value is FormSessionCapabilities {
  return (
    isRecord(value) &&
    Array.isArray(value.permissions) &&
    value.permissions.every((permission) => typeof permission === "string")
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

function updateRule(
  field: FormTemplateField,
  rule: string,
  value: unknown,
) {
  const validationRules = { ...(field.validation_rules ?? {}) };
  if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
    delete validationRules[rule];
  } else {
    validationRules[rule] = value;
  }
  return { ...field, validation_rules: validationRules };
}

function getStringArrayRule(field: FormTemplateField, rule: string) {
  const value = field.validation_rules?.[rule];
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function OrderButtons({
  canMoveUp,
  canMoveDown,
  disabled,
  label,
  onMove,
}: FormOrderButtonsProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        aria-label={`Mover ${label} para cima`}
        className="grid size-9 place-items-center rounded-lg text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-30"
        disabled={disabled || !canMoveUp}
        onClick={() => onMove(-1)}
        type="button"
      >
        <ArrowUp aria-hidden="true" className="size-4" />
      </button>
      <button
        aria-label={`Mover ${label} para baixo`}
        className="grid size-9 place-items-center rounded-lg text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-30"
        disabled={disabled || !canMoveDown}
        onClick={() => onMove(1)}
        type="button"
      >
        <ArrowDown aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}

function FieldInput({
  label,
  inputId,
  help,
  wide,
  children,
}: FormEditorFieldProps) {
  return (
    <label className={`text-xs font-bold uppercase tracking-wide text-slate-600 ${wide ? "sm:col-span-2" : ""}`} htmlFor={inputId}>
      {label}
      {children}
      {help && <span className="mt-1 block text-[0.7rem] font-normal normal-case tracking-normal text-slate-500">{help}</span>}
    </label>
  );
}

function RuleNumberInput({
  field,
  rule,
  label,
  inputId,
  disabled,
  onChange,
}: FormRuleNumberInputProps) {
  const current = field.validation_rules?.[rule];
  return (
    <FieldInput inputId={inputId} label={label}>
      <input
        className={EDITOR_INPUT_CLASS}
        disabled={disabled}
        id={inputId}
        min={rule.includes("length") || rule === "max_size_mb" ? 0 : undefined}
        onChange={(event) =>
          onChange(
            updateRule(
              field,
              rule,
              event.target.value === "" ? undefined : Number(event.target.value),
            ),
          )
        }
        step={rule.includes("length") ? 1 : "any"}
        type="number"
        value={typeof current === "number" ? current : ""}
      />
    </FieldInput>
  );
}
