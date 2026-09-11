"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Bot,
  CheckCircle2,
  CircleDollarSign,
  FilePlus2,
  FlaskConical,
  LoaderCircle,
  LockKeyhole,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAccessibleDialog } from "@/components/accessible-dialog";
import { AiEvaluationAssignmentManager } from "./ai-evaluation-assignments";
import type {
  AiCriterion,
  AiCriterionCardProps,
  AiCriterionCheckType,
  AiCriterionEditorProps,
  AiCriterionInput,
  AiCriterionMissingInfoBehavior,
  AiCriterionPolarity,
  AiCriterionSeverity,
  AiEvaluationCreateDraft,
  AiEvaluationAssignmentContext,
  AiEvaluationCreateFormProps,
  AiEvaluationDefinition,
  AiEvaluationDefinitionPage,
  AiEvaluationDefinitionSummary,
  AiEvaluationEditorPanelProps,
  AiEvaluationEditorState,
  AiEvaluationLibraryCardProps,
  AiEvaluationLibraryMessageProps,
  AiEvaluationLibraryState,
  AiEvaluationMetricProps,
  AiEvaluationPublishDialogProps,
  AiEvaluationTestResult,
  AiEvaluationTestResultPanelProps,
  AiEvaluationVersion,
  AiSelectFieldProps,
  SuggestAiCriteriaResult,
} from "@/types/AvaliacaoIa";
import type { ApiRecord } from "@/types/Servico";
import type { CurrentUser } from "@/types/Usuario";

const LIBRARY_LIMIT = 50;
const CHECK_TYPES: AiCriterionCheckType[] = [
  "presence",
  "conformity",
  "quality",
  "comparison",
  "cross_field_consistency",
];
const POLARITIES: AiCriterionPolarity[] = ["positive", "negative", "consistency"];
const SEVERITIES: AiCriterionSeverity[] = ["info", "low", "medium", "high", "critical"];
const MISSING_INFO: AiCriterionMissingInfoBehavior[] = ["non_compliant", "indeterminate"];

export function AiEvaluationWorkspace() {
  const query = useSearchParams();
  const [library, setLibrary] = useState<AiEvaluationLibraryState>({ kind: "loading" });
  const [editor, setEditor] = useState<AiEvaluationEditorState>({ kind: "closed" });
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [canManage, setCanManage] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const templateKey = query.get("template") ?? "";
  const fieldKey = query.get("field") ?? "";
  const assignmentContext: AiEvaluationAssignmentContext | null =
    isTechnicalKey(templateKey) && isTechnicalKey(fieldKey)
      ? { templateKey, fieldKey }
      : null;
  const selectionRequestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    async function loadCapabilities() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => null);
        if (response.ok && isCurrentUser(payload)) {
          setCanManage(payload.permissions.includes("ai_evaluations.manage"));
        }
      } catch {
        if (!controller.signal.aborted) setCanManage(false);
      }
    }
    void loadCapabilities();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    async function loadLibrary() {
      setLibrary({ kind: "loading" });
      const query = new URLSearchParams({ limit: String(LIBRARY_LIMIT), offset: "0" });
      if (search) query.set("search", search);
      try {
        const response = await fetch(`/api/ai-evaluations?${query}`, { cache: "no-store", signal: controller.signal });
        const payload = await response.json().catch(() => null);
        if (controller.signal.aborted) return;
        if (!response.ok || !isDefinitionPage(payload)) {
          setLibrary(response.status === 403
            ? { kind: "denied", message: getApiMessage(payload, "Seu perfil não pode consultar avaliações por IA.") }
            : { kind: "error", message: getApiMessage(payload, "Não foi possível carregar a biblioteca de avaliações.") });
          return;
        }
        setLibrary({ kind: "ready", page: payload });
      } catch {
        if (!controller.signal.aborted) setLibrary({ kind: "error", message: "Não foi possível conectar ao serviço de avaliações por IA." });
      }
    }
    void loadLibrary();
    return () => controller.abort();
  }, [reloadKey, search]);

  async function loadDefinition(definitionId: string, versionNumber: number) {
    const requestId = ++selectionRequestId.current;
    setEditor({ kind: "loading", definitionId });
    try {
      const [definitionResponse, versionResponse] = await Promise.all([
        fetch(`/api/ai-evaluations/${definitionId}`, { cache: "no-store" }),
        fetch(`/api/ai-evaluations/${definitionId}/versions/${versionNumber}`, { cache: "no-store" }),
      ]);
      const [definitionPayload, versionPayload] = await Promise.all([
        definitionResponse.json().catch(() => null),
        versionResponse.json().catch(() => null),
      ]);
      if (selectionRequestId.current !== requestId) return;
      if (!definitionResponse.ok || !versionResponse.ok || !isDefinition(definitionPayload) || !isVersion(versionPayload)) {
        setEditor({ kind: "error", definitionId, message: getApiMessage(!definitionResponse.ok ? definitionPayload : versionPayload, "Não foi possível carregar os detalhes da avaliação.") });
        return;
      }
      setEditor({ kind: "ready", definition: definitionPayload, version: versionPayload, isSaving: false, isSuggesting: false, isTesting: false, isPublishing: false, testResult: null });
    } catch {
      if (selectionRequestId.current === requestId) setEditor({ kind: "error", definitionId, message: "Não foi possível conectar ao serviço de avaliações por IA." });
    }
  }

  async function selectDefinition(definition: AiEvaluationDefinitionSummary) {
    const versionNumber = definition.latest_version?.version_number;
    if (!versionNumber) {
      setEditor({ kind: "error", definitionId: definition.id, message: "A avaliação não possui uma versão disponível para consulta." });
      return;
    }
    await loadDefinition(definition.id, versionNumber);
  }

  async function createEvaluation(draft: AiEvaluationCreateDraft) {
    setIsCreating(true);
    try {
      const response = await fetch("/api/ai-evaluations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isDefinition(payload)) {
        toast.error(getApiMessage(payload, "Não foi possível criar a avaliação."));
        return false;
      }
      const latest = payload.versions?.slice().sort((first, second) => second.version_number - first.version_number)[0];
      if (!latest) {
        toast.error("A avaliação foi criada, mas a API não retornou sua versão inicial.");
        setReloadKey((value) => value + 1);
        return false;
      }
      setCreateOpen(false);
      setReloadKey((value) => value + 1);
      toast.success("Avaliação criada em rascunho.");
      await loadDefinition(payload.id, latest.version_number);
      return true;
    } catch {
      toast.error("Não foi possível conectar ao serviço de avaliações por IA.");
      return false;
    } finally {
      setIsCreating(false);
    }
  }

  function updateObjective(objective: string) {
    setEditor((current) => current.kind === "ready" ? { ...current, version: { ...current.version, objective } } : current);
  }

  function updateCriterion(criterionId: string, criterion: AiCriterion) {
    setEditor((current) => current.kind === "ready" ? { ...current, version: { ...current.version, criteria: (current.version.criteria ?? []).map((item) => item.id === criterionId ? criterion : item) } } : current);
  }

  function addCriterion() {
    setEditor((current) => {
      if (current.kind !== "ready") return current;
      const criteria = current.version.criteria ?? [];
      return { ...current, version: { ...current.version, criteria: [...criteria, createDraftCriterion(criteria.length)] } };
    });
  }

  function removeCriterion(criterionId: string) {
    setEditor((current) => current.kind === "ready" ? { ...current, version: { ...current.version, criteria: (current.version.criteria ?? []).filter((criterion) => criterion.id !== criterionId).map((criterion, index) => ({ ...criterion, order_index: index })) } } : current);
  }

  function moveCriterion(criterionId: string, direction: -1 | 1) {
    setEditor((current) => {
      if (current.kind !== "ready") return current;
      const criteria = (current.version.criteria ?? []).slice().sort((first, second) => first.order_index - second.order_index);
      const from = criteria.findIndex((criterion) => criterion.id === criterionId);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= criteria.length) return current;
      const [moved] = criteria.splice(from, 1);
      criteria.splice(to, 0, moved);
      return { ...current, version: { ...current.version, criteria: criteria.map((criterion, index) => ({ ...criterion, order_index: index })) } };
    });
  }

  async function saveVersion() {
    if (editor.kind !== "ready" || editor.version.status !== "draft") return;
    const criteria = (editor.version.criteria ?? []).map(toCriterionInput);
    if (editor.version.objective.trim().length < 3) {
      toast.error("Informe um objetivo com ao menos 3 caracteres.");
      return;
    }
    if (criteria.some((criterion) => criterion === null)) {
      toast.error("Revise os critérios: cada descrição deve ter ao menos 3 caracteres.");
      return;
    }
    setEditor((current) => current.kind === "ready" ? { ...current, isSaving: true } : current);
    try {
      const response = await fetch(`/api/ai-evaluations/${editor.definition.id}/versions/${editor.version.version_number}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ objective: editor.version.objective, criteria }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isVersion(payload)) {
        toast.error(getApiMessage(payload, "Não foi possível salvar a versão."));
        return;
      }
      setEditor((current) => current.kind === "ready" ? { ...current, version: payload, isSaving: false } : current);
      setReloadKey((value) => value + 1);
      toast.success("Versão em rascunho salva.");
    } catch {
      toast.error("Não foi possível conectar ao serviço de avaliações por IA.");
    } finally {
      setEditor((current) => current.kind === "ready" ? { ...current, isSaving: false } : current);
    }
  }

  async function suggestCriteria() {
    if (editor.kind !== "ready" || editor.version.status !== "draft") return;
    const objective = editor.version.objective.trim();
    if (objective.length < 3) {
      toast.error("Informe o objetivo antes de solicitar sugestões.");
      return;
    }
    setEditor((current) => current.kind === "ready" ? { ...current, isSuggesting: true } : current);
    try {
      const response = await fetch("/api/ai-evaluations/suggest-criteria", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ objective, target_type: "field" }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isSuggestionResult(payload)) {
        toast.error(getApiMessage(payload, "Não foi possível sugerir critérios."));
        return;
      }
      setEditor((current) => {
        if (current.kind !== "ready") return current;
        const existing = current.version.criteria ?? [];
        const suggestions = (payload.suggestions ?? []).map((suggestion, index) => ({
          id: `draft-${Date.now()}-${index}`,
          order_index: existing.length + index,
          statement: suggestion.statement,
          check_type: isCheckType(suggestion.check_type) ? suggestion.check_type : "quality",
          polarity: isPolarity(suggestion.polarity) ? suggestion.polarity : "positive",
          severity: isSeverity(suggestion.suggested_severity) ? suggestion.suggested_severity : "medium",
          on_missing_info: "indeterminate",
          required_evidence: null,
          recommendation_hint: null,
        }));
        return { ...current, isSuggesting: false, version: { ...current.version, criteria: [...existing, ...suggestions] } };
      });
      toast.success(payload.suggestions?.length ? "Sugestões adicionadas como critérios editáveis." : "A API não sugeriu novos critérios para este objetivo.");
    } catch {
      toast.error("Não foi possível conectar ao serviço de sugestões.");
    } finally {
      setEditor((current) => current.kind === "ready" ? { ...current, isSuggesting: false } : current);
    }
  }

  async function testVersion(sampleContent: string) {
    if (editor.kind !== "ready") return;
    setEditor((current) => current.kind === "ready" ? { ...current, isTesting: true } : current);
    try {
      const response = await fetch(`/api/ai-evaluations/${editor.definition.id}/versions/${editor.version.version_number}/test`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sample_content: sampleContent }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isTestResult(payload)) {
        toast.error(getApiMessage(payload, "Não foi possível executar o teste."));
        return;
      }
      setEditor((current) => current.kind === "ready" ? { ...current, testResult: payload, isTesting: false } : current);
      toast.success("Teste concluído sem alterar nenhum processo.");
    } catch {
      toast.error("Não foi possível conectar ao serviço de teste.");
    } finally {
      setEditor((current) => current.kind === "ready" ? { ...current, isTesting: false } : current);
    }
  }

  async function publishVersion() {
    if (editor.kind !== "ready" || editor.version.status !== "draft") return;
    setEditor((current) => current.kind === "ready" ? { ...current, isPublishing: true } : current);
    try {
      const response = await fetch(`/api/ai-evaluations/${editor.definition.id}/versions/${editor.version.version_number}/publish`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || typeof payload.status !== "string") {
        toast.error(getApiMessage(payload, "Não foi possível publicar a versão."));
        return;
      }
      setReloadKey((value) => value + 1);
      toast.success(payload.test_warning ? "Versão publicada. Atenção: ela ainda não possuía execução de teste." : "Versão publicada e bloqueada para edição.");
      await loadDefinition(editor.definition.id, editor.version.version_number);
    } catch {
      toast.error("Não foi possível conectar ao serviço de publicação.");
    } finally {
      setEditor((current) => current.kind === "ready" ? { ...current, isPublishing: false } : current);
    }
  }

  async function createVersion() {
    if (editor.kind !== "ready" || editor.version.status === "draft") return;
    const definitionId = editor.definition.id;
    setEditor((current) => current.kind === "ready" ? { ...current, isSaving: true } : current);
    try {
      const response = await fetch(`/api/ai-evaluations/${definitionId}/versions`, { method: "POST" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isVersion(payload)) {
        toast.error(getApiMessage(payload, "Não foi possível criar uma nova versão."));
        return;
      }
      setReloadKey((value) => value + 1);
      toast.success("Nova versão criada em rascunho.");
      await loadDefinition(definitionId, payload.version_number);
    } catch {
      toast.error("Não foi possível conectar ao serviço de avaliações por IA.");
    } finally {
      setEditor((current) => current.kind === "ready" ? { ...current, isSaving: false } : current);
    }
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  const selectedId = editor.kind === "ready" ? editor.definition.id : editor.kind === "loading" || editor.kind === "error" ? editor.definitionId : null;

  return (
    <>
      {assignmentContext && <AiEvaluationAssignmentManager context={assignmentContext} />}
      <div className="grid flex-1 gap-5 py-7 lg:grid-cols-[21rem_minmax(0,1fr)]">
        <aside className="self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {canManage && <button className="mb-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-bold text-white outline-none hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2" onClick={() => setCreateOpen(true)} type="button"><Plus aria-hidden="true" className="size-4" />Nova avaliação</button>}
          <form className="flex gap-2" onSubmit={submitSearch} role="search">
            <label className="min-w-0 flex-1"><span className="sr-only">Pesquisar avaliações</span><input className="min-h-11 w-full rounded-xl border border-slate-300 px-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20" onChange={(event) => setSearchInput(event.target.value)} placeholder="Nome da avaliação" value={searchInput} /></label>
            <button aria-label="Pesquisar avaliações" className="grid size-11 place-items-center rounded-xl bg-teal-700 text-white outline-none hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2" type="submit"><Search aria-hidden="true" className="size-4" /></button>
          </form>
          <div className="mt-4 grid gap-3">
            {library.kind === "loading" ? <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />Carregando…</div>
              : library.kind === "denied" || library.kind === "error" ? <LibraryMessage actionLabel={library.kind === "error" ? "Tentar novamente" : undefined} description={library.message} onAction={library.kind === "error" ? () => setReloadKey((value) => value + 1) : undefined} title={library.kind === "denied" ? "Acesso restrito" : "Falha na consulta"} />
              : library.page.items.length === 0 ? <LibraryMessage description={search ? `Nenhuma avaliação corresponde a “${search}”.` : "A API ainda não retornou avaliações configuradas."} title="Nenhuma avaliação encontrada" />
              : library.page.items.map((definition) => <LibraryCard definition={definition} key={definition.id} onSelect={(selected) => void selectDefinition(selected)} selected={selectedId === definition.id} />)}
          </div>
        </aside>
        <section className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm">
          {editor.kind === "closed" ? <div className="grid min-h-96 place-items-center p-8 text-center"><div className="max-w-md"><Bot aria-hidden="true" className="mx-auto size-10 text-violet-700" /><h2 className="mt-4 text-xl font-bold text-slate-900">Selecione uma avaliação</h2><p className="mt-2 text-sm leading-6 text-slate-600">Consulte versões publicadas ou edite o rascunho atual conforme suas permissões.</p></div></div>
            : <AiEvaluationEditorPanel canManage={canManage} onCreateVersion={createVersion} onCriterionAdd={addCriterion} onCriterionChange={updateCriterion} onCriterionMove={moveCriterion} onCriterionRemove={removeCriterion} onObjectiveChange={updateObjective} onPublish={publishVersion} onRetry={(definitionId) => { const definition = library.kind === "ready" ? library.page.items.find((item) => item.id === definitionId) : undefined; if (definition) void selectDefinition(definition); }} onSave={saveVersion} onSuggest={suggestCriteria} onTest={testVersion} state={editor} />}
        </section>
      </div>
      <AiEvaluationCreateForm isOpen={createOpen} isSaving={isCreating} onClose={() => setCreateOpen(false)} onSubmit={createEvaluation} />
    </>
  );
}

function LibraryCard({ definition, selected, onSelect }: AiEvaluationLibraryCardProps) {
  return (
    <button aria-pressed={selected} className={`w-full rounded-xl border p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-teal-500 ${selected ? "border-teal-500 bg-teal-50 ring-1 ring-teal-500/20" : "border-slate-200 hover:border-teal-300 hover:bg-slate-50"}`} onClick={() => onSelect(definition)} type="button">
      <div className="flex items-start justify-between gap-3"><p className="font-semibold text-slate-900">{definition.name}</p><span className="rounded-full bg-slate-100 px-2 py-1 text-[0.68rem] font-bold uppercase text-slate-600">{definition.latest_version ? formatStatus(definition.latest_version.status) : "Sem versão"}</span></div>
      <p className="mt-1 font-mono text-[0.7rem] text-slate-500">{definition.slug}</p>
      <p className="mt-3 text-xs text-slate-600">{definition.latest_version ? `Versão ${definition.latest_version.version_number} · ${definition.latest_version.criteria_count ?? 0} critérios` : "Nenhuma versão disponível"}</p>
    </button>
  );
}

function AiEvaluationEditorPanel({ state, canManage, onRetry, onObjectiveChange, onCriterionChange, onCriterionAdd, onCriterionRemove, onCriterionMove, onSave, onSuggest, onTest, onPublish, onCreateVersion }: AiEvaluationEditorPanelProps) {
  const [sampleContent, setSampleContent] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);

  if (state.kind === "loading") return <div className="flex min-h-96 items-center justify-center gap-3 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />Carregando avaliação…</div>;
  if (state.kind === "error") return <div className="grid min-h-96 place-items-center p-8"><LibraryMessage actionLabel="Tentar novamente" description={state.message} onAction={() => onRetry(state.definitionId)} title="Não foi possível abrir a avaliação" /></div>;

  const editable = canManage && state.version.status === "draft";
  const busy = state.isSaving || state.isSuggesting || state.isTesting || state.isPublishing;
  const orderedCriteria = (state.version.criteria ?? []).slice().sort((first, second) => first.order_index - second.order_index);

  return (
    <div>
      <header className="border-b border-slate-200 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><p className="font-mono text-xs font-bold text-violet-700">{state.definition.slug} · versão {state.version.version_number}</p><h2 className="mt-1 text-2xl font-bold text-slate-900">{state.definition.name}</h2><p className="mt-1 text-xs text-slate-500">O nome é definido na criação e permanece somente para leitura.</p></div>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-900">{formatStatus(state.version.status)}</span>
        </div>
        {state.definition.description && <p className="mt-3 text-sm leading-6 text-slate-600">{state.definition.description}</p>}
        {canManage && state.version.status !== "draft" && <button className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-bold text-white outline-none hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500" disabled={busy} onClick={() => void onCreateVersion()} type="button"><FilePlus2 aria-hidden="true" className="size-4" />Criar nova versão em rascunho</button>}
      </header>
      <div className="grid gap-6 p-5 sm:p-6">
        {!editable && <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700"><LockKeyhole aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-slate-500" /><p>{state.version.status === "draft" ? "Seu perfil pode consultar este rascunho, mas não alterá-lo." : "Versões publicadas são imutáveis. Crie um novo rascunho para fazer alterações."}</p></div>}
        <section><label className="block text-sm font-bold uppercase tracking-wide text-slate-600" htmlFor="ai-objective">Objetivo</label><textarea className="mt-2 min-h-28 w-full resize-y rounded-xl border border-slate-300 p-4 text-sm leading-6 text-slate-800 outline-none disabled:bg-slate-50 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={!editable || busy} id="ai-objective" maxLength={2000} onChange={(event) => onObjectiveChange(event.target.value)} value={state.version.objective} /></section>
        <div className="grid gap-3 sm:grid-cols-3"><Metric icon={<FlaskConical aria-hidden="true" className="size-4" />} label="Testes executados" value={String(state.version.test_run_count)} /><Metric icon={<Bot aria-hidden="true" className="size-4" />} label="Critérios" value={String(orderedCriteria.length)} /><Metric icon={<CircleDollarSign aria-hidden="true" className="size-4" />} label="Publicação" value={state.version.published_at ? formatDate(state.version.published_at) : "Não publicada"} /></div>
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Critérios</h3>{state.version.status === "draft" && <p className="mt-1 text-xs text-slate-500">Rascunhos não são disponibilizados para novas submissões.</p>}</div>{editable && <div className="flex flex-wrap gap-2"><button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-violet-300 px-3 text-sm font-semibold text-violet-800 outline-none hover:bg-violet-50 focus-visible:ring-2 focus-visible:ring-violet-500" disabled={busy} onClick={() => void onSuggest()} type="button">{state.isSuggesting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Sparkles aria-hidden="true" className="size-4" />}Sugerir critérios</button><button className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-800 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500" disabled={busy} onClick={onCriterionAdd} type="button"><Plus aria-hidden="true" className="size-4" />Adicionar</button></div>}</div>
          <div className="mt-3 grid gap-3">
            {orderedCriteria.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">Esta versão ainda não possui critérios.</p>
              : editable ? orderedCriteria.map((criterion, index) => <CriterionEditor criterion={criterion} disabled={busy} index={index} key={criterion.id} onChange={(updated) => onCriterionChange(criterion.id, updated)} onMove={(direction) => onCriterionMove(criterion.id, direction)} onRemove={() => onCriterionRemove(criterion.id)} total={orderedCriteria.length} />)
              : orderedCriteria.map((criterion) => <CriterionCard criterion={criterion} key={criterion.id} />)}
          </div>
        </section>
        {editable && <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-6"><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-teal-700 px-4 text-sm font-bold text-white outline-none hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-60" disabled={busy} onClick={() => void onSave()} type="button">{state.isSaving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}Salvar rascunho</button><button className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 text-sm font-bold text-emerald-900 outline-none hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60" disabled={busy} onClick={() => setPublishOpen(true)} type="button"><CheckCircle2 aria-hidden="true" className="size-4" />Publicar versão</button></div>}
        {canManage && <section><h3 className="text-sm font-bold uppercase tracking-wide text-slate-600">Teste isolado</h3><p className="mt-1 text-xs leading-5 text-slate-500">O conteúdo abaixo é avaliado somente para teste e não altera processos reais.</p><textarea className="mt-3 min-h-32 w-full resize-y rounded-xl border border-slate-300 p-4 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={busy} onChange={(event) => setSampleContent(event.target.value)} placeholder="Cole aqui um exemplo de resposta ou documento…" value={sampleContent} /><button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-violet-700 px-4 text-sm font-bold text-white outline-none hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60" disabled={busy || sampleContent.trim().length === 0} onClick={() => void onTest(sampleContent)} type="button">{state.isTesting ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <FlaskConical aria-hidden="true" className="size-4" />}Executar teste</button>{state.testResult && <AiEvaluationTestResultPanel result={state.testResult} />}</section>}
      </div>
      <AiEvaluationPublishDialog isOpen={publishOpen} isPublishing={state.isPublishing} onCancel={() => setPublishOpen(false)} onConfirm={async () => { await onPublish(); setPublishOpen(false); }} versionNumber={state.version.version_number} />
    </div>
  );
}

function AiEvaluationCreateForm({ isOpen, isSaving, onClose, onSubmit }: AiEvaluationCreateFormProps) {
  const [draft, setDraft] = useState<AiEvaluationCreateDraft>({ name: "", description: "", mode: "simple", objective: "" });
  const dialogRef = useAccessibleDialog(isOpen, isSaving, onClose);
  if (!isOpen) return null;
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (draft.name.trim().length < 3 || draft.objective.trim().length < 3) { toast.error("Informe nome e objetivo com ao menos 3 caracteres."); return; }
    if (await onSubmit(draft)) setDraft({ name: "", description: "", mode: "simple", objective: "" });
  }
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/55 p-4" role="presentation"><div aria-labelledby="create-ai-title" aria-modal="true" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6" ref={dialogRef} role="dialog" tabIndex={-1}>
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-xl font-bold text-slate-900" id="create-ai-title">Nova avaliação por IA</h2><p className="mt-1 text-sm text-slate-600">O nome será fixo. Objetivo e critérios poderão ser alterados enquanto a versão estiver em rascunho.</p></div><button aria-label="Fechar" className="grid size-10 place-items-center rounded-lg text-slate-500 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500" disabled={isSaving} onClick={onClose} type="button"><X aria-hidden="true" className="size-5" /></button></div>
      <form className="mt-5 grid gap-4" onSubmit={(event) => void submit(event)}>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Nome<input className="min-h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={isSaving} maxLength={255} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} required value={draft.name} /></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Descrição opcional<textarea className="min-h-20 rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={isSaving} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} value={draft.description} /></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Modo<select className="min-h-11 rounded-xl border border-slate-300 px-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={isSaving} onChange={(event) => setDraft((current) => ({ ...current, mode: event.target.value === "advanced" ? "advanced" : "simple" }))} value={draft.mode}><option value="simple">Simples</option><option value="advanced">Avançado</option></select></label>
        <label className="grid gap-1.5 text-sm font-semibold text-slate-800">Objetivo<textarea className="min-h-28 rounded-xl border border-slate-300 p-3 font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={isSaving} maxLength={2000} onChange={(event) => setDraft((current) => ({ ...current, objective: event.target.value }))} required value={draft.objective} /></label>
        <div className="flex justify-end gap-3 pt-2"><button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500" disabled={isSaving} onClick={onClose} type="button">Cancelar</button><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-bold text-white outline-none hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60" disabled={isSaving} type="submit">{isSaving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}Criar avaliação</button></div>
      </form>
    </div></div>
  );
}

function CriterionEditor({ criterion, index, total, disabled, onChange, onRemove, onMove }: AiCriterionEditorProps) {
  return (
    <article className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs font-bold uppercase tracking-wide text-slate-500">Critério {index + 1}</p><div className="flex gap-1"><button aria-label={`Mover critério ${index + 1} para cima`} className="grid size-9 place-items-center rounded-lg text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-40" disabled={disabled || index === 0} onClick={() => onMove(-1)} type="button"><ArrowUp aria-hidden="true" className="size-4" /></button><button aria-label={`Mover critério ${index + 1} para baixo`} className="grid size-9 place-items-center rounded-lg text-slate-600 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:opacity-40" disabled={disabled || index === total - 1} onClick={() => onMove(1)} type="button"><ArrowDown aria-hidden="true" className="size-4" /></button><button aria-label={`Remover critério ${index + 1}`} className="grid size-9 place-items-center rounded-lg text-rose-700 outline-none hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-40" disabled={disabled} onClick={onRemove} type="button"><Trash2 aria-hidden="true" className="size-4" /></button></div></div>
      <label className="mt-3 grid gap-1.5 text-xs font-semibold text-slate-700">Descrição do critério<textarea className="min-h-20 rounded-lg border border-slate-300 p-3 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={disabled} maxLength={2000} onChange={(event) => onChange({ ...criterion, statement: event.target.value })} value={criterion.statement} /></label>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><SelectField disabled={disabled} label="Verificação" onChange={(value) => onChange({ ...criterion, check_type: value })} options={CHECK_TYPES} value={criterion.check_type as AiCriterionCheckType} /><SelectField disabled={disabled} label="Severidade" onChange={(value) => onChange({ ...criterion, severity: value })} options={SEVERITIES} value={criterion.severity as AiCriterionSeverity} /><SelectField disabled={disabled} label="Polaridade" onChange={(value) => onChange({ ...criterion, polarity: value })} options={POLARITIES} value={criterion.polarity as AiCriterionPolarity} /><SelectField disabled={disabled} label="Sem informação" onChange={(value) => onChange({ ...criterion, on_missing_info: value })} options={MISSING_INFO} value={criterion.on_missing_info as AiCriterionMissingInfoBehavior} /></div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-semibold text-slate-700">Evidência necessária<input className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={disabled} onChange={(event) => onChange({ ...criterion, required_evidence: event.target.value })} value={criterion.required_evidence ?? ""} /></label><label className="grid gap-1.5 text-xs font-semibold text-slate-700">Orientação de recomendação<input className="min-h-10 rounded-lg border border-slate-300 px-3 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={disabled} onChange={(event) => onChange({ ...criterion, recommendation_hint: event.target.value })} value={criterion.recommendation_hint ?? ""} /></label></div>
    </article>
  );
}

function SelectField<T extends string>({ label, value, options, disabled, onChange }: AiSelectFieldProps<T>) {
  return <label className="grid gap-1.5 text-xs font-semibold text-slate-700">{label}<select className="min-h-10 rounded-lg border border-slate-300 px-2 text-sm font-normal outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20" disabled={disabled} onChange={(event) => onChange(event.target.value as T)} value={value}>{options.map((option) => <option key={option} value={option}>{formatOption(option)}</option>)}</select></label>;
}

function CriterionCard({ criterion }: AiCriterionCardProps) {
  return <article className="rounded-xl border border-slate-200 p-4"><div className="flex flex-wrap items-center gap-2 text-[0.7rem] font-bold uppercase text-slate-600"><span>#{criterion.order_index + 1}</span><span className="rounded-full bg-amber-50 px-2 py-1 text-amber-800">{formatOption(criterion.severity)}</span><span>{formatOption(criterion.check_type)}</span><span>{formatOption(criterion.polarity)}</span></div><p className="mt-3 text-sm font-semibold leading-6 text-slate-900">{criterion.statement}</p>{criterion.required_evidence && <p className="mt-2 text-xs leading-5 text-slate-600">Evidência: {criterion.required_evidence}</p>}{criterion.recommendation_hint && <p className="mt-1 text-xs leading-5 text-slate-600">Orientação: {criterion.recommendation_hint}</p>}</article>;
}

function AiEvaluationTestResultPanel({ result }: AiEvaluationTestResultPanelProps) {
  return (
    <div className="mt-5 rounded-xl border border-violet-200 bg-violet-50/50 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-bold text-slate-900">Resultado {result.consolidated_result === "positive" ? "positivo" : "negativo"}</p><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">Custo informado: {formatCost(result.real_cost)}</span></div>
      <div className="mt-4 grid gap-3">{(result.results ?? []).map((item, index) => <article className="rounded-lg border border-violet-100 bg-white p-4" key={`${item.criterion_id ?? item.statement}-${index}`}><div className="flex flex-wrap gap-2 text-[0.7rem] font-bold uppercase text-slate-500"><span>{formatOption(item.conclusion)}</span><span>{formatOption(item.severity)}</span>{item.is_alert && <span className="text-rose-700">Alerta</span>}</div><p className="mt-2 text-sm font-semibold text-slate-900">{item.statement}</p>{item.evidence_excerpt && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">Evidência: {item.evidence_excerpt}</p>}{item.evidence_location && <p className="mt-1 text-xs leading-5 text-slate-500">Local: {item.evidence_location}</p>}{item.justification && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">Justificativa: {item.justification}</p>}{item.recommendation && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-slate-600">Recomendação: {item.recommendation}</p>}</article>)}</div>
    </div>
  );
}

function AiEvaluationPublishDialog({ isOpen, isPublishing, versionNumber, onCancel, onConfirm }: AiEvaluationPublishDialogProps) {
  const dialogRef = useAccessibleDialog(isOpen, isPublishing, onCancel);
  if (!isOpen) return null;
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/55 p-4" role="presentation"><div aria-labelledby="publish-ai-title" aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" ref={dialogRef} role="dialog" tabIndex={-1}><LockKeyhole aria-hidden="true" className="size-8 text-emerald-700" /><h2 className="mt-3 text-xl font-bold text-slate-900" id="publish-ai-title">Publicar versão {versionNumber}?</h2><p className="mt-2 text-sm leading-6 text-slate-600">Após a publicação, objetivo e critérios desta versão ficarão imutáveis. Alterações futuras exigirão um novo rascunho.</p><div className="mt-5 flex justify-end gap-3"><button className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-bold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500" disabled={isPublishing} onClick={onCancel} type="button">Cancelar</button><button className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white outline-none hover:bg-emerald-800 focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60" disabled={isPublishing} onClick={() => void onConfirm()} type="button">{isPublishing && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}Publicar e bloquear</button></div></div></div>;
}

function Metric({ icon, label, value }: AiEvaluationMetricProps) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><div className="flex items-center gap-2 text-slate-500">{icon}</div><p className="mt-3 text-xs font-semibold text-slate-500">{label}</p><p className="mt-1 font-bold text-slate-900">{value}</p></div>;
}

function LibraryMessage({ title, description, actionLabel, onAction }: AiEvaluationLibraryMessageProps) {
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-center"><AlertCircle aria-hidden="true" className="mx-auto size-6 text-slate-500" /><p className="mt-2 font-semibold text-slate-800">{title}</p><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>{actionLabel && onAction && <button className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-teal-500" onClick={onAction} type="button"><RefreshCw aria-hidden="true" className="size-4" />{actionLabel}</button>}</div>;
}

function createDraftCriterion(orderIndex: number): AiCriterion {
  return { id: `draft-${Date.now()}-${orderIndex}`, order_index: orderIndex, statement: "", check_type: "quality", polarity: "positive", severity: "medium", on_missing_info: "indeterminate", required_evidence: null, recommendation_hint: null };
}

function toCriterionInput(criterion: AiCriterion): AiCriterionInput | null {
  if (criterion.statement.trim().length < 3 || !isCheckType(criterion.check_type) || !isPolarity(criterion.polarity) || !isSeverity(criterion.severity) || !isMissingInfo(criterion.on_missing_info)) return null;
  return { id: isUuid(criterion.id) ? criterion.id : null, order_index: criterion.order_index, statement: criterion.statement.trim(), check_type: criterion.check_type, polarity: criterion.polarity, severity: criterion.severity, on_missing_info: criterion.on_missing_info, required_evidence: criterion.required_evidence?.trim() || null, recommendation_hint: criterion.recommendation_hint?.trim() || null };
}

function isDefinitionPage(value: unknown): value is AiEvaluationDefinitionPage {
  return isRecord(value) && typeof value.offset === "number" && typeof value.limit === "number" && Array.isArray(value.items) && value.items.every(isDefinitionSummary);
}

function isDefinitionSummary(value: unknown): value is AiEvaluationDefinitionSummary {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.slug === "string" && typeof value.mode === "string";
}

function isDefinition(value: unknown): value is AiEvaluationDefinition {
  return isRecord(value) && typeof value.id === "string" && typeof value.name === "string" && typeof value.slug === "string" && typeof value.mode === "string" && Array.isArray(value.versions);
}

function isVersion(value: unknown): value is AiEvaluationVersion {
  return isRecord(value) && typeof value.version_number === "number" && typeof value.status === "string" && typeof value.objective === "string" && typeof value.test_run_count === "number" && Array.isArray(value.criteria);
}

function isSuggestionResult(value: unknown): value is SuggestAiCriteriaResult {
  return isRecord(value) && Array.isArray(value.suggestions) && value.suggestions.every((item) => isRecord(item) && typeof item.statement === "string" && typeof item.check_type === "string" && typeof item.polarity === "string" && typeof item.suggested_severity === "string");
}

function isTestResult(value: unknown): value is AiEvaluationTestResult {
  return isRecord(value) && (value.consolidated_result === "positive" || value.consolidated_result === "negative") && typeof value.real_cost === "number" && Array.isArray(value.results);
}

function isCurrentUser(value: unknown): value is CurrentUser {
  return isRecord(value) && typeof value.id === "string" && Array.isArray(value.permissions) && value.permissions.every((permission) => typeof permission === "string");
}

function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function isTechnicalKey(value: string) { return /^[A-Za-z0-9._-]{1,128}$/.test(value); }
function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value); }
function isCheckType(value: string): value is AiCriterionCheckType { return CHECK_TYPES.includes(value as AiCriterionCheckType); }
function isPolarity(value: string): value is AiCriterionPolarity { return POLARITIES.includes(value as AiCriterionPolarity); }
function isSeverity(value: string): value is AiCriterionSeverity { return SEVERITIES.includes(value as AiCriterionSeverity); }
function isMissingInfo(value: string): value is AiCriterionMissingInfoBehavior { return MISSING_INFO.includes(value as AiCriterionMissingInfoBehavior); }
function getApiMessage(value: unknown, fallback: string) { return isRecord(value) && typeof value.message === "string" ? value.message : fallback; }
function formatStatus(status: string) { const normalized = status.toLocaleLowerCase("pt-BR"); if (normalized === "draft") return "Rascunho"; if (normalized === "published") return "Publicada"; return status; }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(date); }
function formatOption(value: string) { return value.replaceAll("_", " "); }
function formatCost(value: number) { return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "USD", minimumFractionDigits: 4 }).format(value); }
