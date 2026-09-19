"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AlertTriangle, Link2, LoaderCircle, Save } from "lucide-react";
import { toast } from "sonner";
import type {
  AiEvaluationAssignment,
  AiEvaluationAssignmentInput,
  AiEvaluationAssignmentManagerProps,
  AiEvaluationAssignmentManagerState,
  AiEvaluationAssignments,
  AiEvaluationDefinitionPage,
  AiEvaluationDefinitionSummary,
  AiEvaluationOrphanResolution,
  AiEvaluationTargetType,
} from "@/types/AvaliacaoIa";
import type { EvaluableFieldsResponse } from "@/types/Formulario";
import type { ApiRecord } from "@/types/Servico";

const TARGET_TYPES: AiEvaluationTargetType[] = ["field", "field_set", "document", "form", "process"];

export function AiEvaluationAssignmentManager({ context }: AiEvaluationAssignmentManagerProps) {
  const [state, setState] = useState<AiEvaluationAssignmentManagerState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setState({ kind: "loading" });
      try {
        const [assignmentsResponse, definitionsResponse, fieldsResponse] = await Promise.all([
          fetch(`/api/ai-evaluations/assignments/${encodeURIComponent(context.templateKey)}`, { cache: "no-store", signal: controller.signal }),
          fetch("/api/ai-evaluations?limit=100&offset=0", { cache: "no-store", signal: controller.signal }),
          fetch(`/api/forms/evaluable-fields/${encodeURIComponent(context.templateKey)}`, { cache: "no-store", signal: controller.signal }),
        ]);
        const [assignmentsPayload, definitionsPayload, fieldsPayload] = await Promise.all([
          assignmentsResponse.json().catch(() => null),
          definitionsResponse.json().catch(() => null),
          fieldsResponse.json().catch(() => null),
        ]);
        if (controller.signal.aborted) return;
        if (!assignmentsResponse.ok || !isAssignments(assignmentsPayload) || !definitionsResponse.ok || !isDefinitionPage(definitionsPayload) || !fieldsResponse.ok || !isEvaluableFields(fieldsPayload)) {
          setState({ kind: "error", message: getApiMessage(!assignmentsResponse.ok ? assignmentsPayload : !definitionsResponse.ok ? definitionsPayload : fieldsPayload, "Não foi possível carregar as associações deste formulário.") });
          return;
        }
        const fieldKeys = fieldsPayload.fields.map((field) => field.field_key);
        const orphanIds = findOrphanIds(assignmentsPayload.assignments ?? [], definitionsPayload.items, fieldKeys);
        setState({
          kind: "ready",
          assignments: assignmentsPayload.assignments ?? [],
          definitions: definitionsPayload.items,
          validFieldKeys: fieldKeys,
          selectedDefinitionIds: findSelectedDefinitions(assignmentsPayload.assignments ?? [], context.fieldKey),
          orphanAssignmentIds: orphanIds,
          orphanResolution: "",
          isSaving: false,
        });
      } catch {
        if (!controller.signal.aborted) setState({ kind: "error", message: "Não foi possível conectar ao serviço de associações." });
      }
    }
    void load();
    return () => controller.abort();
  }, [context.fieldKey, context.templateKey, reloadKey]);

  function toggleDefinition(definitionId: string) {
    setState((current) => {
      if (current.kind !== "ready") return current;
      const selectedDefinitionIds = current.selectedDefinitionIds.includes(definitionId)
        ? current.selectedDefinitionIds.filter((id) => id !== definitionId)
        : [...current.selectedDefinitionIds, definitionId];
      return { ...current, selectedDefinitionIds };
    });
  }

  function setOrphanResolution(orphanResolution: AiEvaluationOrphanResolution) {
    setState((current) => current.kind === "ready" ? { ...current, orphanResolution } : current);
  }

  async function save() {
    if (state.kind !== "ready" || state.isSaving) return;
    if (state.orphanAssignmentIds.length > 0 && state.orphanResolution === "") {
      toast.error("Escolha explicitamente se as referências órfãs devem ser preservadas ou removidas.");
      return;
    }
    const selectedDefinitions = state.definitions.filter((definition) => state.selectedDefinitionIds.includes(definition.id));
    if (selectedDefinitions.some((definition) => (definition.published_versions ?? 0) < 1)) {
      toast.error("Publique a avaliação antes de associá-la a uma submissão.");
      return;
    }
    const assignments = buildAssignmentInput(
      state.assignments,
      state.selectedDefinitionIds,
      context.fieldKey,
      state.orphanAssignmentIds,
      state.orphanResolution,
    );
    if (!assignments) {
      toast.error("A API retornou uma associação com alvo inválido. Remova a referência órfã para continuar.");
      return;
    }
    setState((current) => current.kind === "ready" ? { ...current, isSaving: true } : current);
    try {
      const response = await fetch(`/api/ai-evaluations/assignments/${encodeURIComponent(context.templateKey)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignments }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isAssignments(payload)) {
        toast.error(getApiMessage(payload, "Não foi possível salvar as associações."));
        return;
      }
      const confirmed = payload.assignments ?? [];
      const orphanIds = findOrphanIds(confirmed, state.definitions, state.validFieldKeys);
      setState((current) => current.kind === "ready" ? {
        ...current,
        assignments: confirmed,
        selectedDefinitionIds: findSelectedDefinitions(confirmed, context.fieldKey),
        orphanAssignmentIds: orphanIds,
        orphanResolution: "",
        isSaving: false,
      } : current);
      toast.success("Associações salvas com as versões efetivas confirmadas pela API.");
    } catch {
      toast.error("Não foi possível conectar ao serviço de associações.");
    } finally {
      setState((current) => current.kind === "ready" ? { ...current, isSaving: false } : current);
    }
  }

  const publishedDefinitions = state.kind === "ready"
    ? state.definitions.filter((definition) => (definition.published_versions ?? 0) > 0)
    : [];

  return (
    <section className="mb-5 rounded-2xl border border-violet-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="assignment-title">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><div className="flex items-center gap-2 text-violet-700"><Link2 aria-hidden="true" className="size-5" /><p className="text-xs font-bold uppercase tracking-[0.14em]">Associações do formulário</p></div><h2 className="mt-2 text-xl font-bold text-slate-900" id="assignment-title">Campo {context.fieldKey}</h2><p className="mt-1 font-mono text-xs text-slate-500">Template {context.templateKey}</p></div>
        <Link className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500" href="/formularios">Voltar aos formulários</Link>
      </div>

      {state.kind === "loading" ? <div className="mt-5 flex min-h-28 items-center justify-center gap-2 text-sm text-slate-600"><LoaderCircle aria-hidden="true" className="size-5 animate-spin" />Carregando associações…</div>
        : state.kind === "error" ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4"><p className="text-sm font-semibold text-rose-900">{state.message}</p><button className="mt-3 min-h-10 rounded-lg bg-rose-700 px-3 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-rose-500" onClick={() => setReloadKey((value) => value + 1)} type="button">Tentar novamente</button></div>
        : <div className="mt-5 grid gap-4">
          <p className="text-sm leading-6 text-slate-600">Somente avaliações que já possuem versão publicada podem ser vinculadas. A API confirma automaticamente a versão efetiva usada.</p>
          {publishedDefinitions.length === 0 ? <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">Nenhuma avaliação publicada está disponível. Publique uma versão na biblioteca antes de criar o vínculo.</p>
            : <div className="grid gap-2 sm:grid-cols-2">{publishedDefinitions.map((definition) => {
              const currentAssignment = state.assignments.find((assignment) => assignment.definition_id === definition.id && assignment.target_type === "field" && (assignment.field_keys ?? []).includes(context.fieldKey));
              return <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 hover:border-violet-300" key={definition.id}><input checked={state.selectedDefinitionIds.includes(definition.id)} className="mt-1 size-4 accent-violet-700" disabled={state.isSaving} onChange={() => toggleDefinition(definition.id)} type="checkbox" /><span><span className="block text-sm font-bold text-slate-900">{definition.name}</span><span className="mt-1 block text-xs text-slate-500">{currentAssignment?.effective_version_number ? `Vínculo atual na versão ${currentAssignment.effective_version_number}` : `${definition.published_versions} versão(ões) publicada(s)`}</span></span></label>;
            })}</div>}

          {state.orphanAssignmentIds.length > 0 && <fieldset className="rounded-xl border border-amber-300 bg-amber-50 p-4"><legend className="px-1 text-sm font-bold text-amber-950">Referências órfãs encontradas</legend><div className="mt-1 flex gap-2 text-sm leading-6 text-amber-900"><AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p>{state.orphanAssignmentIds.length} associação(ões) apontam para campo ou avaliação ausente. Escolha como tratá-las nesta substituição em lote.</p></div><div className="mt-3 grid gap-2"><label className="flex items-center gap-2 text-sm font-semibold text-amber-950"><input checked={state.orphanResolution === "preserve"} disabled={state.isSaving} name="orphan-resolution" onChange={() => setOrphanResolution("preserve")} type="radio" />Preservar referências órfãs</label><label className="flex items-center gap-2 text-sm font-semibold text-amber-950"><input checked={state.orphanResolution === "remove"} disabled={state.isSaving} name="orphan-resolution" onChange={() => setOrphanResolution("remove")} type="radio" />Remover referências órfãs desta atualização</label></div></fieldset>}

          <button className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-bold text-white outline-none hover:bg-violet-800 focus-visible:ring-2 focus-visible:ring-violet-500 disabled:opacity-60" disabled={state.isSaving} onClick={() => void save()} type="button">{state.isSaving ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Save aria-hidden="true" className="size-4" />}Salvar associações</button>
        </div>}
    </section>
  );
}

function buildAssignmentInput(assignments: AiEvaluationAssignment[], selectedDefinitionIds: string[], fieldKey: string, orphanIds: string[], orphanResolution: AiEvaluationOrphanResolution): AiEvaluationAssignmentInput[] | null {
  const retained = assignments.filter((assignment) => orphanResolution !== "remove" || !orphanIds.includes(assignment.id));
  const handled = new Set<string>();
  const result: AiEvaluationAssignmentInput[] = [];
  for (const assignment of retained) {
    if (!isTargetType(assignment.target_type)) return null;
    const touchesField = assignment.target_type === "field" && (assignment.field_keys ?? []).includes(fieldKey);
    if (touchesField && selectedDefinitionIds.includes(assignment.definition_id)) {
      handled.add(assignment.definition_id);
      result.push(toInput(assignment, assignment.field_keys ?? []));
    } else if (touchesField) {
      const fieldKeys = (assignment.field_keys ?? []).filter((key) => key !== fieldKey);
      if (fieldKeys.length > 0) result.push(toInput(assignment, fieldKeys));
    } else {
      result.push(toInput(assignment, assignment.field_keys ?? []));
    }
  }
  for (const definitionId of selectedDefinitionIds) {
    if (!handled.has(definitionId)) result.push({ definition_id: definitionId, pinned_version_id: null, target_type: "field", field_keys: [fieldKey], enabled: true });
  }
  return result;
}

function toInput(assignment: AiEvaluationAssignment, fieldKeys: string[]): AiEvaluationAssignmentInput {
  return { definition_id: assignment.definition_id, pinned_version_id: assignment.pinned_version_id ?? null, target_type: assignment.target_type as AiEvaluationTargetType, field_keys: fieldKeys, enabled: assignment.enabled };
}

function findSelectedDefinitions(assignments: AiEvaluationAssignment[], fieldKey: string) {
  return [...new Set(assignments.filter((assignment) => assignment.enabled && assignment.target_type === "field" && (assignment.field_keys ?? []).includes(fieldKey)).map((assignment) => assignment.definition_id))];
}

function findOrphanIds(assignments: AiEvaluationAssignment[], definitions: AiEvaluationDefinitionSummary[], validFieldKeys: string[]) {
  const definitionIds = new Set(definitions.map((definition) => definition.id));
  const fields = new Set(validFieldKeys);
  return assignments.filter((assignment) => !definitionIds.has(assignment.definition_id) || (assignment.field_keys ?? []).some((fieldKey) => !fields.has(fieldKey)) || !isTargetType(assignment.target_type)).map((assignment) => assignment.id);
}

function isAssignments(value: unknown): value is AiEvaluationAssignments {
  return isRecord(value) && typeof value.template_key === "string" && Array.isArray(value.assignments) && value.assignments.every((assignment) => isRecord(assignment) && typeof assignment.id === "string" && typeof assignment.definition_id === "string" && typeof assignment.definition_name === "string" && typeof assignment.target_type === "string" && typeof assignment.enabled === "boolean");
}

function isDefinitionPage(value: unknown): value is AiEvaluationDefinitionPage {
  return isRecord(value) && Array.isArray(value.items) && value.items.every((item) => isRecord(item) && typeof item.id === "string" && typeof item.name === "string");
}

function isEvaluableFields(value: unknown): value is EvaluableFieldsResponse {
  return isRecord(value) && Array.isArray(value.fields) && value.fields.every((field) => isRecord(field) && typeof field.field_key === "string" && typeof field.label === "string" && Array.isArray(field.assignments));
}

function isTargetType(value: string): value is AiEvaluationTargetType { return TARGET_TYPES.includes(value as AiEvaluationTargetType); }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function getApiMessage(value: unknown, fallback: string) { return isRecord(value) && typeof value.message === "string" ? value.message : fallback; }
