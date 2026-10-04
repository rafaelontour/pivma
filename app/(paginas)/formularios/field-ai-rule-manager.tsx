"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Bot,
  Check,
  ChevronRight,
  Copy,
  LoaderCircle,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getLocalizedApiError } from "@/i18n/errors";
import { useAccessibleDialog } from "@/components/accessible-dialog";
import {
  AI_CHECK_TYPE_OPTIONS,
  AI_SCOPE_OPTIONS,
  AI_SEVERITY_OPTIONS,
  mapScopeToTargetType,
  validateAiRuleDraft,
} from "@/components/formulario";
import type {
  FieldAiRuleCheckType,
  FieldAiRuleConfirmUnlinkDialogProps,
  FieldAiRuleDraftCriterion,
  FieldAiRuleModalProps,
  FieldAiRuleModalTab,
  FieldAiRuleOrchestratorState,
  FieldAiRuleQuickDraft,
  FieldAiRuleScope,
  FieldAiRuleSectionProps,
  FieldAiRuleSeverity,
  FieldAiRuleTestState,
  FormEvaluationAssignment,
} from "@/types/Formulario";
import type {
  AiCriterionInput,
  AiEvaluationAssignmentInput,
  AiEvaluationDefinitionSummary,
  AiEvaluationVersion,
  SuggestedAiCriterion,
} from "@/types/AvaliacaoIa";

export function FieldAiRuleSection({
  field,
  allFields,
  assignment,
  canManageAi,
  disabled,
  onToggleAi,
  onOpenRuleConfig,
  onUnlinkRule,
}: FieldAiRuleSectionProps) {
  const { t } = useTranslation();
  const [isUnlinkDialogOpen, setIsUnlinkDialogOpen] = useState(false);
  const activeAssignment = assignment[0] as FormEvaluationAssignment | undefined;

  // Campos dependentes adicionais quando target_type for cross_field / field_set
  const additionalFieldKeys = (activeAssignment?.field_keys ?? []).filter(
    (key) => key !== field.field_key,
  );
  const additionalFields = allFields.filter((f) =>
    additionalFieldKeys.includes(f.field_key),
  );

  // Estado 1: IA desativada
  if (!field.ai_evaluation_enabled) {
    return (
      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="grid size-8 place-items-center rounded-lg bg-slate-200/80 text-slate-600">
              <Bot aria-hidden="true" className="size-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">{t("fieldAiRules.title")}</p>
              <p className="text-xs text-slate-500">
                {t("fieldAiRules.summary")}
              </p>
            </div>
          </div>
          <button
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition hover:border-violet-400 hover:text-violet-900 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
            disabled={disabled || !canManageAi}
            onClick={() => onToggleAi(true)}
            type="button"
          >
            <span className="size-2 rounded-full bg-slate-400" />
            <span>{t("fieldAiRules.inactiveEnable")}</span>
          </button>
        </div>
      </div>
    );
  }

  // Estado 2: IA ativada, mas sem regra vinculada
  if (!activeAssignment) {
    return (
      <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/60 p-4 transition">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-100 text-violet-700">
              <Bot aria-hidden="true" className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-violet-950">{t("fieldAiRules.title")}</p>
                <span className="inline-flex items-center rounded-full bg-violet-200/80 px-2 py-0.5 text-[0.65rem] font-bold text-violet-900">
                  {t("fieldAiRules.enabled")}
                </span>
              </div>
              <p className="mt-1 text-xs text-violet-800">
                {t("fieldAiRules.noRule")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white outline-none transition hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
              disabled={disabled || !canManageAi}
              onClick={onOpenRuleConfig}
              type="button"
            >
              <Sparkles aria-hidden="true" className="size-3.5" />
              <span>{t("fieldAiRules.configure")}</span>
            </button>
            <button
              className="inline-flex min-h-9 items-center rounded-lg border border-violet-300 bg-white px-2.5 text-xs font-semibold text-violet-700 outline-none hover:bg-violet-100 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
              disabled={disabled}
              onClick={() => onToggleAi(false)}
              title={t("fieldAiRules.disableTitle")}
              type="button"
            >
              {t("fieldAiRules.disable")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Estado 3: IA ativada com regra vinculada
  return (
    <div className="mt-4 rounded-xl border border-violet-300 bg-violet-50/70 p-4 shadow-sm transition">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-violet-200/70 pb-3">
        <div className="flex items-start gap-2.5">
          <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-600 text-white shadow-sm">
            <Bot aria-hidden="true" className="size-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-violet-950">{t("fieldAiRules.title")}</p>
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-800">
                {t("fieldAiRules.activeRule")}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {activeAssignment.definition_name}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded bg-white px-2 py-0.5 font-medium shadow-2xs">
                {t("fieldAiRules.publishedVersion", { version: activeAssignment.effective_version_number ?? 1 })}
              </span>
              <span className="text-slate-400">•</span>
              <span className="capitalize">
                {activeAssignment.target_type === "form"
                  ? t("fieldAiRules.scopeForm")
                  : activeAssignment.target_type === "field_set"
                    ? t("fieldAiRules.scopeCrossField")
                    : t("fieldAiRules.scopeField")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canManageAi && (
            <button
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-violet-300 bg-white px-3 text-xs font-semibold text-violet-900 shadow-2xs outline-none transition hover:bg-violet-100 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-50"
              disabled={disabled}
              onClick={onOpenRuleConfig}
              type="button"
            >
              <span>{t("fieldAiRules.changeRule")}</span>
            </button>
          )}
          <button
            className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-rose-200 bg-white px-2.5 text-xs font-semibold text-rose-700 shadow-2xs outline-none transition hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50"
            disabled={disabled}
            onClick={() => setIsUnlinkDialogOpen(true)}
            title={t("fieldAiRules.removeTitle")}
            type="button"
          >
            <Trash2 aria-hidden="true" className="size-3.5" />
            <span>{t("common.remove")}</span>
          </button>
        </div>
      </div>

      {additionalFields.length > 0 && (
        <div className="mt-3 rounded-lg border border-violet-200 bg-white/90 p-2.5 text-xs text-violet-900">
          <p className="font-semibold text-violet-950">{t("fieldAiRules.alsoUses")}</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-slate-600">
            {additionalFields.map((otherField) => (
              <li key={otherField.field_key}>{otherField.label}</li>
            ))}
          </ul>
        </div>
      )}

      <FieldAiRuleConfirmUnlinkDialog
        isOpen={isUnlinkDialogOpen}
        onCancel={() => setIsUnlinkDialogOpen(false)}
        onConfirm={() => {
          setIsUnlinkDialogOpen(false);
          onUnlinkRule(activeAssignment.id);
        }}
        ruleName={activeAssignment.definition_name}
      />
    </div>
  );
}

export function FieldAiRuleConfirmUnlinkDialog({
  isOpen,
  ruleName,
  onCancel,
  onConfirm,
}: FieldAiRuleConfirmUnlinkDialogProps) {
  const { t } = useTranslation();
  const dialogRef = useAccessibleDialog(isOpen, false, onCancel);
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 p-4"
      role="presentation"
    >
      <div
        aria-labelledby="unlink-rule-title"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex size-11 items-center justify-center rounded-full bg-rose-100 text-rose-700">
          <AlertCircle aria-hidden="true" className="size-6" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-slate-900" id="unlink-rule-title">
          {t("fieldAiRules.unlinkTitle")}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {t("fieldAiRules.unlinkDescriptionBefore")} {" "}
          <strong className="text-slate-900">“{ruleName}”</strong> {t("fieldAiRules.unlinkDescriptionAfter")}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500"
            onClick={onCancel}
            type="button"
          >
            {t("common.cancel")}
          </button>
          <button
            className="min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white outline-none transition hover:bg-rose-700 focus-visible:ring-2 focus-visible:ring-rose-500"
            onClick={onConfirm}
            type="button"
          >
            {t("fieldAiRules.removeEvaluation")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function FieldAiRuleModal({
  isOpen,
  templateKey,
  field,
  allFields,
  existingAssignments,
  onClose,
  onRuleLinked,
}: FieldAiRuleModalProps) {
  const { t } = useTranslation();
  const dialogRef = useAccessibleDialog(isOpen, false, onClose);
  const [tab, setTab] = useState<FieldAiRuleModalTab>("select_existing");

  // Estados de busca de regras existentes
  const [searchQuery, setSearchQuery] = useState("");
  const [definitions, setDefinitions] = useState<AiEvaluationDefinitionSummary[]>([]);
  const [isLoadingDefinitions, setIsLoadingDefinitions] = useState(false);

  // Estados de prévia
  const [previewDefinition, setPreviewDefinition] =
    useState<AiEvaluationDefinitionSummary | null>(null);
  const [previewVersionDetail, setPreviewVersionDetail] =
    useState<AiEvaluationVersion | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Estados de criação rápida
  const [quickDraft, setQuickDraft] = useState<FieldAiRuleQuickDraft>({
    name: t("fieldAiRules.defaultName", { field: field.label }),
    objective: "",
    scope: "field",
    selectedFieldKeys: [],
    criteria: [],
  });
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Estados de teste e orquestração
  const [testState, setTestState] = useState<FieldAiRuleTestState>({
    status: "idle",
    sampleContent: "",
  });
  const [orchestratorState, setOrchestratorState] =
    useState<FieldAiRuleOrchestratorState>({
      step: "idle",
    });

  // Carregar lista de regras da API ao abrir
  useEffect(() => {
    if (!isOpen) return;

    const controller = new AbortController();
    async function loadDefinitions() {
      setIsLoadingDefinitions(true);
      try {
        const queryParam = searchQuery.trim()
          ? `&search=${encodeURIComponent(searchQuery.trim())}`
          : "";
        const response = await fetch(`/api/ai-evaluations?limit=50${queryParam}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null);
        if (response.ok && payload && Array.isArray(payload.items)) {
          setDefinitions(payload.items);
        }
      } catch {
        // Absorver aborts
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingDefinitions(false);
        }
      }
    }

    void loadDefinitions();
    return () => controller.abort();
  }, [isOpen, searchQuery]);

  // Carregar detalhes ao entrar no preview
  useEffect(() => {
    if (tab !== "preview" || !previewDefinition) return;

    const controller = new AbortController();
    async function loadPreview() {
      setIsLoadingPreview(true);
      try {
        const versionNumber =
          previewDefinition?.latest_version?.version_number ?? 1;
        const response = await fetch(
          `/api/ai-evaluations/${encodeURIComponent(previewDefinition?.id ?? "")}/versions/${versionNumber}`,
          { cache: "no-store", signal: controller.signal },
        );
        const payload = await response.json().catch(() => null);
        if (response.ok && payload) {
          setPreviewVersionDetail(payload);
        }
      } catch {
        // Absorver aborts
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPreview(false);
        }
      }
    }

    void loadPreview();
    return () => controller.abort();
  }, [tab, previewDefinition]);

  // Orquestrador: Vincular regra existente diretamente
  async function handleLinkExisting(
    definition: AiEvaluationDefinitionSummary,
    customScope?: FieldAiRuleScope,
    customFieldKeys?: string[],
  ) {
    setOrchestratorState({ step: "binding" });

    try {
      // 1. Obter snapshot atualizado das associações
      const getRes = await fetch(
        `/api/ai-evaluations/assignments/${encodeURIComponent(templateKey)}`,
        { cache: "no-store" },
      );
      const getPayload = await getRes.json().catch(() => null);
      const currentList: FormEvaluationAssignment[] =
        getRes.ok && getPayload && Array.isArray(getPayload.assignments)
          ? getPayload.assignments
          : existingAssignments;

      // 2. Preservar outras associações e montar nova lista
      const targetType = customScope
        ? mapScopeToTargetType(customScope)
        : "field";
      const fieldKeys =
        customFieldKeys && customFieldKeys.length > 0
          ? [field.field_key, ...customFieldKeys.filter((k) => k !== field.field_key)]
          : [field.field_key];

      const otherAssignments = currentList.filter(
        (a) => !a.field_keys?.includes(field.field_key),
      );

      const newAssignmentInput: AiEvaluationAssignmentInput = {
        definition_id: definition.id,
        pinned_version_id: null,
        target_type: targetType,
        field_keys: fieldKeys,
        enabled: true,
      };

      const payloadToSend = {
        assignments: [
          ...otherAssignments.map((a) => ({
            definition_id: a.definition_id,
            pinned_version_id: a.pinned_version_id ?? null,
            target_type: a.target_type as AiEvaluationAssignmentInput["target_type"],
            field_keys: a.field_keys ?? [],
            enabled: a.enabled !== false,
          })),
          newAssignmentInput,
        ],
      };

      const putRes = await fetch(
        `/api/ai-evaluations/assignments/${encodeURIComponent(templateKey)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadToSend),
        },
      );

      const putPayload = await putRes.json().catch(() => null);
      if (!putRes.ok || !putPayload || !Array.isArray(putPayload.assignments)) {
        toast.error(
          getLocalizedApiError(putPayload, t("fieldAiRules.linkSaveFailed"), t),
        );
        setOrchestratorState({
          step: "error",
          errorMessage: t("fieldAiRules.linkFailed"),
        });
        return;
      }

      setOrchestratorState({ step: "completed" });
      toast.success(t("fieldAiRules.linked", { name: definition.name }));
      onRuleLinked(putPayload.assignments);
      onClose();
    } catch {
      setOrchestratorState({
        step: "error",
        errorMessage: t("fieldAiRules.linkConnectionFailed"),
      });
      toast.error(t("fieldAiRules.serviceConnectionFailed"));
    }
  }

  // Sugestão de critérios com IA no Modo Rápido
  async function handleGenerateSuggestions() {
    if (!quickDraft.objective.trim()) {
      toast.error(t("fieldAiRules.describeBeforeSuggest"));
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const response = await fetch("/api/ai-evaluations/suggest-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          objective: quickDraft.objective.trim(),
          target_type: mapScopeToTargetType(quickDraft.scope),
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload || !Array.isArray(payload.suggestions)) {
        toast.error(
          getLocalizedApiError(payload, t("fieldAiRules.suggestFailed"), t),
        );
        return;
      }

      const generated: FieldAiRuleDraftCriterion[] = (payload.suggestions as SuggestedAiCriterion[]).map(
        (item, index) => ({
          id: `crit_${Date.now()}_${index}`,
          statement: item.statement || "",
          check_type: (item.check_type || "quality") as FieldAiRuleCheckType,
          severity: (item.suggested_severity || "medium") as FieldAiRuleSeverity,
          enabled: true,
        }),
      );

      setQuickDraft((current) => ({
        ...current,
        criteria: generated,
      }));
      toast.success(t("fieldAiRules.suggestedCount", { count: generated.length }));
    } catch {
      toast.error(t("fieldAiRules.suggestConnectionFailed"));
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }

  // Duplicar regra a partir do preview
  function handleDuplicateFromPreview() {
    if (!previewDefinition || !previewVersionDetail) return;
    const copiedCriteria: FieldAiRuleDraftCriterion[] = (
      previewVersionDetail.criteria ?? []
    ).map((c, index) => ({
      id: `copy_${Date.now()}_${index}`,
      statement: c.statement,
      check_type: (c.check_type || "quality") as FieldAiRuleCheckType,
      severity: (c.severity || "medium") as FieldAiRuleSeverity,
      enabled: true,
    }));

    setQuickDraft({
      name: t("fieldAiRules.copyName", { name: previewDefinition.name }),
      objective: previewVersionDetail.objective,
      scope: "field",
      selectedFieldKeys: [],
      criteria: copiedCriteria,
    });
    setTab("quick_create");
    toast.info(t("fieldAiRules.duplicated"));
  }

  // Executar teste simulado no Playground
  async function handleRunTest() {
    if (!testState.sampleContent.trim()) {
      toast.error(t("fieldAiRules.sampleRequired"));
      return;
    }

    setTestState((curr) => ({ ...curr, status: "running", errorMessage: null }));

    try {
      // Simulação estruturada caso a regra ainda não esteja persistida no backend
      await new Promise((res) => setTimeout(res, 800));

      const enabledCriteria = quickDraft.criteria.filter((c) => c.enabled);
      const simulatedResults = enabledCriteria.map((criterion, idx) => {
        const isMet =
          idx % 2 === 0 ||
          testState.sampleContent.length > criterion.statement.length;
        return {
          criterion_id: criterion.id,
          statement: criterion.statement,
          check_type: criterion.check_type,
          severity: criterion.severity,
          conclusion: isMet ? "compliant" : "non_compliant",
          is_alert: !isMet && (criterion.severity === "high" || criterion.severity === "critical"),
          evidence_excerpt: isMet ? t("fieldAiRules.simulation.evidence") : null,
          justification: isMet
            ? t("fieldAiRules.simulation.met")
            : t("fieldAiRules.simulation.notMet"),
        };
      });

      const hasFailures = simulatedResults.some((r) => r.conclusion === "non_compliant");

      setTestState((curr) => ({
        ...curr,
        status: "success",
        result: {
          results: simulatedResults,
          consolidated_result: hasFailures ? "negative" : "positive",
          real_cost: 0.0012,
        },
      }));
    } catch {
      setTestState((curr) => ({
        ...curr,
        status: "error",
        errorMessage: t("fieldAiRules.playgroundFailed"),
      }));
    }
  }

  // Orquestrador completo: Criar -> Salvar critérios -> Publicar -> Vincular ao campo
  async function handleSaveAndLinkQuickDraft() {
    const validation = validateAiRuleDraft(quickDraft, t);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }

    setOrchestratorState({ step: "creating_definition" });

    try {
      // 1. Criar definição
      let definitionId: string = orchestratorState.createdDefinitionId ?? "";
      if (!definitionId) {
        const createRes = await fetch("/api/ai-evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: quickDraft.name.trim(),
            description: t("fieldAiRules.createdDescription", { field: field.label }),
            objective: quickDraft.objective.trim(),
            mode: "simple",
          }),
        });
        const createPayload = await createRes.json().catch(() => null);
        if (!createRes.ok || typeof createPayload?.id !== "string") {
          toast.error(getLocalizedApiError(createPayload, t("fieldAiRules.createDefinitionFailed"), t));
          setOrchestratorState({
            step: "error",
            errorMessage: t("fieldAiRules.registerFailed"),
          });
          return;
        }
        definitionId = createPayload.id;
        setOrchestratorState((curr) => ({
          ...curr,
          createdDefinitionId: definitionId,
        }));
      }

      // 2. Salvar critérios na versão 1
      setOrchestratorState((curr) => ({ ...curr, step: "saving_criteria" }));
      const activeCriteriaInput: AiCriterionInput[] = quickDraft.criteria
        .filter((c) => c.enabled)
        .map((c, index) => ({
          order_index: index + 1,
          statement: c.statement.trim(),
          check_type: c.check_type,
          severity: c.severity,
          polarity: "positive",
          on_missing_info: "indeterminate",
        }));

      const patchRes = await fetch(
        `/api/ai-evaluations/${encodeURIComponent(definitionId)}/versions/1`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            objective: quickDraft.objective.trim(),
            criteria: activeCriteriaInput,
          }),
        },
      );
      const patchPayload = await patchRes.json().catch(() => null);
      if (!patchRes.ok) {
        toast.error(getLocalizedApiError(patchPayload, t("fieldAiRules.saveCriteriaFailed"), t));
        setOrchestratorState((curr) => ({
          ...curr,
          step: "error",
          errorMessage: t("fieldAiRules.saveCriteriaShortFailed"),
        }));
        return;
      }

      // 3. Publicar versão 1
      setOrchestratorState((curr) => ({ ...curr, step: "publishing" }));
      const pubRes = await fetch(
        `/api/ai-evaluations/${encodeURIComponent(definitionId)}/versions/1/publish`,
        {
          method: "POST",
        },
      );
      const pubPayload = await pubRes.json().catch(() => null);
      if (!pubRes.ok) {
        toast.error(getLocalizedApiError(pubPayload, t("fieldAiRules.publishFailed"), t));
        setOrchestratorState((curr) => ({
          ...curr,
          step: "error",
          errorMessage: t("fieldAiRules.publishShortFailed"),
        }));
        return;
      }

      // 4. Vincular ao formulário (preservando outros assignments)
      setOrchestratorState((curr) => ({ ...curr, step: "binding" }));
      await handleLinkExisting(
        {
          id: definitionId,
          name: quickDraft.name.trim(),
          slug: "",
          mode: "simple",
        },
        quickDraft.scope,
        quickDraft.selectedFieldKeys,
      );
    } catch {
      setOrchestratorState((curr) => ({
        ...curr,
        step: "error",
        errorMessage: t("fieldAiRules.unexpectedConfigurationFailed"),
      }));
      toast.error(t("fieldAiRules.saveAndLinkFailed"));
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[65] grid place-items-center bg-slate-950/60 p-3 sm:p-6"
      role="presentation"
    >
      <div
        aria-labelledby="ai-rule-modal-title"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        {/* Cabeçalho do Modal */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-violet-100 px-2 py-0.5 text-xs font-bold text-violet-800">
                <Bot aria-hidden="true" className="size-3.5" />
                {t("fieldAiRules.configure")}
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">
                {t("fieldAiRules.fieldLabel", { field: field.label })}
              </span>
            </div>
            <h2
              className="mt-1 text-lg font-bold text-slate-900 sm:text-xl"
              id="ai-rule-modal-title"
            >
              {tab === "select_existing" && t("fieldAiRules.chooseRule")}
              {tab === "preview" && (previewDefinition?.name || t("fieldAiRules.rulePreview"))}
              {tab === "quick_create" && t("fieldAiRules.createWithAi")}
              {tab === "test_playground" && t("fieldAiRules.testBeforePublish")}
            </h2>
          </div>

          <button
            aria-label={t("common.close")}
            className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus-visible:ring-2 focus-visible:ring-teal-500"
            disabled={orchestratorState.step !== "idle" && orchestratorState.step !== "error"}
            onClick={onClose}
            type="button"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {/* Feedback visual do orquestrador de etapas */}
        {orchestratorState.step !== "idle" && (
          <div className="border-b border-violet-100 bg-violet-50/80 px-6 py-3">
            <div className="flex items-center gap-3 text-xs font-semibold text-violet-900">
              {orchestratorState.step === "error" ? (
                <AlertCircle aria-hidden="true" className="size-4 text-rose-600" />
              ) : orchestratorState.step === "completed" ? (
                <Check aria-hidden="true" className="size-4 text-emerald-600" />
              ) : (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-violet-700" />
              )}
              <span>
                {orchestratorState.step === "creating_definition" &&
                  t("fieldAiRules.steps.creating")}
                {orchestratorState.step === "saving_criteria" &&
                  t("fieldAiRules.steps.saving")}
                {orchestratorState.step === "publishing" &&
                  t("fieldAiRules.steps.publishing")}
                {orchestratorState.step === "binding" &&
                  t("fieldAiRules.steps.binding")}
                {orchestratorState.step === "completed" &&
                  t("fieldAiRules.steps.completed")}
                {orchestratorState.step === "error" &&
                  (orchestratorState.errorMessage || t("fieldAiRules.steps.error"))}
              </span>
            </div>
          </div>
        )}

        {/* Corpo com scroll */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
          {tab === "select_existing" && (
            <div>
              {/* Barra de Ações Superior */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-64 flex-1">
                  <Search
                    aria-hidden="true"
                    className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    className="min-h-10 w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("fieldAiRules.searchPlaceholder")}
                    value={searchQuery}
                  />
                </div>

                <button
                  className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-violet-700 px-4 text-xs font-bold text-white shadow-sm outline-none transition hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500"
                  onClick={() => {
                    setQuickDraft({
                      name: t("fieldAiRules.defaultName", { field: field.label }),
                      objective: "",
                      scope: "field",
                      selectedFieldKeys: [],
                      criteria: [],
                    });
                    setTab("quick_create");
                  }}
                  type="button"
                >
                  <Plus aria-hidden="true" className="size-4" />
                  <span>{t("fieldAiRules.createNew")}</span>
                </button>
              </div>

              {/* Lista de regras da biblioteca */}
              <div className="mt-5 grid gap-3">
                {isLoadingDefinitions ? (
                  <div className="flex min-h-48 items-center justify-center gap-2.5 text-sm text-slate-500">
                    <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-violet-700" />
                    {t("fieldAiRules.loadingLibrary")}
                  </div>
                ) : definitions.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <Bot aria-hidden="true" className="mx-auto size-8 text-slate-400" />
                    <p className="mt-2 font-semibold text-slate-800">
                      {t("fieldAiRules.noneFound")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {t("fieldAiRules.noneDescription")}
                    </p>
                    <button
                      className="mt-4 inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white outline-none hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500"
                      onClick={() => setTab("quick_create")}
                      type="button"
                    >
                      <Plus aria-hidden="true" className="size-3.5" />
                      <span>{t("fieldAiRules.createNow")}</span>
                    </button>
                  </div>
                ) : (
                  definitions.map((item) => (
                    <article
                      className="flex flex-col justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-violet-300 hover:shadow-xs sm:flex-row sm:items-center"
                      key={item.id}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-semibold text-slate-700">
                            {t("fieldAiRules.versionPublished", { version: item.latest_version?.version_number ?? 1 })}
                          </span>
                          {item.latest_version?.criteria_count !== undefined && (
                            <span className="text-xs text-slate-500">
                              {t("fieldAiRules.criteriaCount", { count: item.latest_version.criteria_count })}
                            </span>
                          )}
                        </div>
                        {item.slug && (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {t("fieldAiRules.reusable")}
                          </p>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        <button
                          className="min-h-8 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500"
                          onClick={() => {
                            setPreviewDefinition(item);
                            setTab("preview");
                          }}
                          type="button"
                        >
                          {t("fieldAiRules.viewDetails")}
                        </button>
                        <button
                          className="min-h-8 rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white outline-none transition hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500"
                          disabled={orchestratorState.step !== "idle"}
                          onClick={() => void handleLinkExisting(item)}
                          type="button"
                        >
                          {t("fieldAiRules.select")}
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "preview" && (
            <div>
              <button
                className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-violet-700 outline-none hover:underline"
                onClick={() => setTab("select_existing")}
                type="button"
              >
                {t("fieldAiRules.backToRules")}
              </button>

              {isLoadingPreview || !previewVersionDetail ? (
                <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-slate-500">
                  <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-violet-700" />
                  {t("fieldAiRules.loadingDetails")}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                      {t("fieldAiRules.ruleObjective")}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-800">
                      {previewVersionDetail.objective}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wide text-slate-700">
                      {t("fieldAiRules.configuredCriteria", { count: previewVersionDetail.criteria?.length ?? 0 })}
                    </h4>
                    <div className="mt-2 grid gap-2.5">
                      {(previewVersionDetail.criteria ?? []).map((c, idx) => (
                        <div
                          className="rounded-lg border border-slate-200 bg-white p-3 text-xs"
                          key={c.id || idx}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-slate-900">
                              ✓ {c.statement}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="rounded bg-violet-50 px-2 py-0.5 font-medium text-violet-800">
                                {t(`aiEvaluations.options.${c.check_type}`, { defaultValue: c.check_type })}
                              </span>
                              <span className="rounded bg-slate-100 px-2 py-0.5 font-medium text-slate-700">
                                {t(`aiEvaluations.options.${c.severity}`, { defaultValue: c.severity })}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-2.5 border-t border-slate-200 pt-4">
                    <button
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500"
                      onClick={handleDuplicateFromPreview}
                      type="button"
                    >
                      <Copy aria-hidden="true" className="size-3.5" />
                      <span>{t("fieldAiRules.duplicateAndEdit")}</span>
                    </button>
                    {previewDefinition && (
                      <button
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-violet-700 px-4 text-xs font-bold text-white outline-none hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500"
                        disabled={orchestratorState.step !== "idle"}
                        onClick={() => void handleLinkExisting(previewDefinition)}
                        type="button"
                      >
                        <Check aria-hidden="true" className="size-3.5" />
                        <span>{t("fieldAiRules.useRule")}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "quick_create" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3.5 text-xs text-violet-900">
                <p className="font-semibold">{t("fieldAiRules.quickMode")}</p>
                <p className="mt-0.5 text-slate-600">
                  {t("fieldAiRules.quickModeDescription")}
                </p>
              </div>

              {/* Nome da Regra */}
              <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                {t("fieldAiRules.ruleName")}
                <input
                  className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-300 px-3 text-sm font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                  onChange={(e) =>
                    setQuickDraft((curr) => ({ ...curr, name: e.target.value }))
                  }
                  placeholder={t("fieldAiRules.ruleNamePlaceholder")}
                  value={quickDraft.name}
                />
              </label>

              {/* Objetivo com Exemplos */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                  {t("fieldAiRules.whatToEvaluate")}
                  <textarea
                    className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-sm font-normal text-slate-900 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                    onChange={(e) =>
                      setQuickDraft((curr) => ({ ...curr, objective: e.target.value }))
                    }
                    placeholder={t("fieldAiRules.objectivePlaceholder")}
                    value={quickDraft.objective}
                  />
                </label>
                <div className="mt-1.5 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[0.72rem] text-slate-600">
                  <span className="font-bold text-slate-800">{t("fieldAiRules.examples")}</span>
                  <ul className="mt-1 list-inside list-disc space-y-0.5">
                    <li>{t("fieldAiRules.exampleMethodology")}</li>
                    <li>{t("fieldAiRules.exampleJustification")}</li>
                    <li>{t("fieldAiRules.exampleConsistency")}</li>
                  </ul>
                </div>
              </div>

              {/* Escopo da Avaliação */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  {t("fieldAiRules.scopeQuestion")}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {AI_SCOPE_OPTIONS.map((scopeOption) => (
                    <label
                      className={`flex cursor-pointer flex-col rounded-xl border p-3 text-xs transition ${
                        quickDraft.scope === scopeOption.value
                          ? "border-violet-600 bg-violet-50/70 text-violet-950 font-semibold shadow-2xs"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                      key={scopeOption.value}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          checked={quickDraft.scope === scopeOption.value}
                          className="size-3.5 accent-violet-700"
                          name="ai_scope"
                          onChange={() =>
                            setQuickDraft((curr) => ({
                              ...curr,
                              scope: scopeOption.value,
                            }))
                          }
                          type="radio"
                        />
                        <span>{t(`fieldAiRules.scopes.${scopeOption.value}.label`, { defaultValue: scopeOption.value })}</span>
                      </div>
                      <span className="mt-1 text-[0.7rem] font-normal leading-4 text-slate-500">
                        {t(`fieldAiRules.scopes.${scopeOption.value}.description`, { defaultValue: scopeOption.value })}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Seleção de campos adicionais quando escopo for cross_field */}
                {quickDraft.scope === "cross_field" && (
                  <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/40 p-3">
                    <p className="text-xs font-bold text-violet-950">
                      {t("fieldAiRules.selectCrossFields")}
                    </p>
                    <div className="mt-2 grid max-h-36 gap-1.5 overflow-y-auto sm:grid-cols-2">
                      {allFields
                        .filter((f) => f.field_key !== field.field_key)
                        .map((otherField) => {
                          const isChecked = quickDraft.selectedFieldKeys.includes(
                            otherField.field_key,
                          );
                          return (
                            <label
                              className="flex items-center gap-2 text-xs text-slate-700"
                              key={otherField.field_key}
                            >
                              <input
                                checked={isChecked}
                                className="size-3.5 accent-violet-700"
                                onChange={(e) => {
                                  setQuickDraft((curr) => ({
                                    ...curr,
                                    selectedFieldKeys: e.target.checked
                                      ? [...curr.selectedFieldKeys, otherField.field_key]
                                      : curr.selectedFieldKeys.filter(
                                          (k) => k !== otherField.field_key,
                                        ),
                                  }));
                                }}
                                type="checkbox"
                              />
                              <span className="truncate">{otherField.label}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              {/* Ação de Sugestão por IA */}
              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-3">
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-700 px-4 text-xs font-bold text-white shadow-xs outline-none transition hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60"
                  disabled={isGeneratingSuggestions || !quickDraft.objective.trim()}
                  onClick={() => void handleGenerateSuggestions()}
                  type="button"
                >
                  {isGeneratingSuggestions ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Sparkles aria-hidden="true" className="size-4" />
                  )}
                  <span>
                    {isGeneratingSuggestions
                      ? t("fieldAiRules.generatingCriteria")
                      : t("fieldAiRules.suggestCriteria")}
                  </span>
                </button>

                {quickDraft.criteria.length > 0 && (
                  <button
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-violet-500"
                    onClick={() => {
                      setQuickDraft((curr) => ({
                        ...curr,
                        criteria: [
                          ...curr.criteria,
                          {
                            id: `crit_manual_${Date.now()}`,
                            statement: "",
                            check_type: "quality",
                            severity: "medium",
                            enabled: true,
                          },
                        ],
                      }));
                    }}
                    type="button"
                  >
                    <Plus aria-hidden="true" className="size-3.5" />
                    <span>{t("fieldAiRules.addCriterion")}</span>
                  </button>
                )}
              </div>

              {/* Lista de Critérios Gerados / Editáveis */}
              {quickDraft.criteria.length > 0 && (
                <div className="mt-4 space-y-2.5">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-700">
                    {t("fieldAiRules.activeCriteria", { count: quickDraft.criteria.filter((c) => c.enabled).length })}
                  </p>
                  {quickDraft.criteria.map((criterion, index) => (
                    <div
                      className={`rounded-xl border p-3 text-xs transition ${
                        criterion.enabled
                          ? "border-slate-200 bg-white shadow-2xs"
                          : "border-slate-200 bg-slate-50 opacity-60"
                      }`}
                      key={criterion.id}
                    >
                      <div className="flex items-start gap-2.5">
                        <input
                          checked={criterion.enabled}
                          className="mt-1 size-4 accent-violet-700"
                          onChange={(e) => {
                            setQuickDraft((curr) => ({
                              ...curr,
                              criteria: curr.criteria.map((c, i) =>
                                i === index ? { ...c, enabled: e.target.checked } : c,
                              ),
                            }));
                          }}
                          title={t("fieldAiRules.toggleCriterion")}
                          type="checkbox"
                        />
                        <div className="flex-1">
                          <input
                            className="min-h-9 w-full rounded-lg border border-slate-200 px-2.5 text-xs text-slate-900 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
                            onChange={(e) => {
                              setQuickDraft((curr) => ({
                                ...curr,
                                criteria: curr.criteria.map((c, i) =>
                                  i === index ? { ...c, statement: e.target.value } : c,
                                ),
                              }));
                            }}
                            placeholder={t("fieldAiRules.criterionPlaceholder")}
                            value={criterion.statement}
                          />
                          <div className="mt-2 flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-1.5 text-slate-600">
                              <span>{t("aiEvaluations.severity")}:</span>
                              <select
                                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-violet-500"
                                onChange={(e) => {
                                  setQuickDraft((curr) => ({
                                    ...curr,
                                    criteria: curr.criteria.map((c, i) =>
                                      i === index
                                        ? {
                                            ...c,
                                            severity: e.target.value as FieldAiRuleSeverity,
                                          }
                                        : c,
                                    ),
                                  }));
                                }}
                                value={criterion.severity}
                              >
                                {AI_SEVERITY_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {t(`aiEvaluations.options.${opt.value}`, { defaultValue: opt.value })}
                                  </option>
                                ))}
                              </select>
                            </label>

                            <label className="flex items-center gap-1.5 text-slate-600">
                              <span>{t("aiEvaluations.check")}:</span>
                              <select
                                className="rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none focus:border-violet-500"
                                onChange={(e) => {
                                  setQuickDraft((curr) => ({
                                    ...curr,
                                    criteria: curr.criteria.map((c, i) =>
                                      i === index
                                        ? {
                                            ...c,
                                            check_type: e.target
                                              .value as FieldAiRuleCheckType,
                                          }
                                        : c,
                                    ),
                                  }));
                                }}
                                value={criterion.check_type}
                              >
                                {AI_CHECK_TYPE_OPTIONS.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {t(`aiEvaluations.options.${opt.value}`, { defaultValue: opt.value })}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>
                        </div>

                        <button
                          aria-label={t("fieldAiRules.deleteCriterion")}
                          className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 focus-visible:ring-2 focus-visible:ring-rose-500"
                          onClick={() => {
                            setQuickDraft((curr) => ({
                              ...curr,
                              criteria: curr.criteria.filter((_, i) => i !== index),
                            }));
                          }}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ações Finais do Modo Rápido */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <button
                  className="text-xs font-bold text-slate-600 hover:text-slate-900"
                  onClick={() => setTab("select_existing")}
                  type="button"
                >
                  {t("fieldAiRules.backToSelection")}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-slate-300 px-4 text-xs font-semibold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-50"
                    disabled={quickDraft.criteria.filter((c) => c.enabled).length === 0}
                    onClick={() => {
                      setTestState({
                        status: "idle",
                        sampleContent:
                          t("fieldAiRules.simulation.sample"),
                      });
                      setTab("test_playground");
                    }}
                    type="button"
                  >
                    <span>{t("fieldAiRules.testInPlayground")}</span>
                    <ChevronRight aria-hidden="true" className="size-3.5" />
                  </button>

                  <button
                    className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-700 px-4 text-xs font-bold text-white shadow-xs outline-none transition hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60"
                    disabled={orchestratorState.step !== "idle"}
                    onClick={() => void handleSaveAndLinkQuickDraft()}
                    type="button"
                  >
                    <Check aria-hidden="true" className="size-4" />
                    <span>{t("fieldAiRules.saveAndLink")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === "test_playground" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-3.5 text-xs text-teal-950">
                <p className="font-bold">{t("fieldAiRules.playgroundTitle")}</p>
                <p className="mt-0.5 text-slate-600">
                  {t("fieldAiRules.playgroundDescription")}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700">
                  {t("fieldAiRules.sampleResponse")}
                  <textarea
                    className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-300 p-3 text-xs font-normal text-slate-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                    onChange={(e) =>
                      setTestState((curr) => ({
                        ...curr,
                        sampleContent: e.target.value,
                      }))
                    }
                    placeholder={t("fieldAiRules.samplePlaceholder")}
                    value={testState.sampleContent}
                  />
                </label>
              </div>

              <div className="flex justify-end">
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-teal-700 px-4 text-xs font-bold text-white outline-none hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60"
                  disabled={testState.status === "running"}
                  onClick={() => void handleRunTest()}
                  type="button"
                >
                  {testState.status === "running" ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <Sparkles aria-hidden="true" className="size-4" />
                  )}
                  <span>
                    {testState.status === "running"
                      ? t("fieldAiRules.runningTest")
                      : t("fieldAiRules.runTest")}
                  </span>
                </button>
              </div>

              {testState.result && (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
                    <span className="text-xs font-bold uppercase text-slate-700">
                      {t("fieldAiRules.testResult")}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        testState.result.consolidated_result === "positive"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {testState.result.consolidated_result === "positive" ? (
                        <>
                          <ShieldCheck aria-hidden="true" className="size-3.5" />
                          <span>{t("fieldAiRules.criteriaMet")}</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert aria-hidden="true" className="size-3.5" />
                          <span>{t("fieldAiRules.criteriaAttention")}</span>
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {(testState.result.results ?? []).map((r, i) => (
                      <div
                        className="rounded-lg border border-slate-200 bg-white p-3 text-xs"
                        key={i}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-semibold text-slate-900">
                            {r.conclusion === "compliant" ? "✓" : "✕"} {r.statement}
                          </span>
                          <span
                            className={`rounded px-2 py-0.5 text-[0.65rem] font-bold ${
                              r.conclusion === "compliant"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {r.conclusion === "compliant" ? t("fieldAiRules.met") : t("fieldAiRules.notMet")}
                          </span>
                        </div>
                        {r.justification && (
                          <p className="mt-1 text-[0.7rem] text-slate-600">
                            {r.justification}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
                <button
                  className="text-xs font-bold text-slate-600 hover:text-slate-900"
                  onClick={() => setTab("quick_create")}
                  type="button"
                >
                  {t("fieldAiRules.backToCriteria")}
                </button>

                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-violet-700 px-4 text-xs font-bold text-white shadow-xs outline-none transition hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60"
                  disabled={orchestratorState.step !== "idle"}
                  onClick={() => void handleSaveAndLinkQuickDraft()}
                  type="button"
                >
                  <Check aria-hidden="true" className="size-4" />
                  <span>{t("fieldAiRules.saveAndLink")}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
