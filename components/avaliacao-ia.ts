import type {
  AiCriterionCheckType,
  AiCriterionInput,
  AiCriterionMissingInfoBehavior,
  AiCriterionPolarity,
  AiCriterionSeverity,
  AiEvaluationAssignmentInput,
  AiEvaluationMode,
  AiEvaluationTargetType,
  AiEvaluationTestInput,
  CreateAiEvaluationInput,
  PatchAiEvaluationVersionInput,
  ReplaceAiEvaluationAssignmentsInput,
  SuggestAiCriteriaInput,
} from "@/types/AvaliacaoIa";
import type { ApiInputValidation } from "@/types/Api";
import type { ApiRecord } from "@/types/Servico";

const MODES: AiEvaluationMode[] = ["simple", "advanced"];
const TARGET_TYPES: AiEvaluationTargetType[] = [
  "field",
  "field_set",
  "document",
  "form",
  "process",
];
const CHECK_TYPES: AiCriterionCheckType[] = [
  "presence",
  "conformity",
  "quality",
  "comparison",
  "cross_field_consistency",
];
const POLARITIES: AiCriterionPolarity[] = [
  "positive",
  "negative",
  "consistency",
];
const SEVERITIES: AiCriterionSeverity[] = [
  "info",
  "low",
  "medium",
  "high",
  "critical",
];
const MISSING_INFO_BEHAVIORS: AiCriterionMissingInfoBehavior[] = [
  "non_compliant",
  "indeterminate",
];

export function validateCreateAiEvaluation(
  value: unknown,
): ApiInputValidation<CreateAiEvaluationInput> {
  if (!isRecord(value)) return invalid("Informe os dados da avaliação.");

  const name = typeof value.name === "string" ? value.name.trim() : "";
  const objective =
    typeof value.objective === "string" ? value.objective.trim() : "";
  const description =
    typeof value.description === "string"
      ? value.description.trim() || null
      : value.description === null || value.description === undefined
        ? null
        : undefined;
  const mode = value.mode === undefined ? "simple" : value.mode;

  if (name.length < 3 || name.length > 255) {
    return invalid("Informe um nome entre 3 e 255 caracteres.");
  }
  if (objective.length < 3 || objective.length > 2000) {
    return invalid("Informe um objetivo entre 3 e 2000 caracteres.");
  }
  if (description === undefined) return invalid("A descrição é inválida.");
  if (!MODES.includes(mode as AiEvaluationMode)) {
    return invalid("O modo da avaliação é inválido.");
  }

  return {
    valid: true,
    input: { name, objective, description, mode: mode as AiEvaluationMode },
  };
}

export function validatePatchAiEvaluationVersion(
  value: unknown,
): ApiInputValidation<PatchAiEvaluationVersionInput> {
  if (!isRecord(value)) return invalid("Informe os dados da versão.");

  const input: PatchAiEvaluationVersionInput = {};
  if (value.objective !== undefined) {
    if (value.objective === null) {
      input.objective = null;
    } else if (
      typeof value.objective === "string" &&
      value.objective.trim().length >= 3 &&
      value.objective.trim().length <= 2000
    ) {
      input.objective = value.objective.trim();
    } else {
      return invalid("Informe um objetivo entre 3 e 2000 caracteres.");
    }
  }

  if (value.references !== undefined) {
    if (value.references === null) {
      input.references = null;
    } else if (
      Array.isArray(value.references) &&
      value.references.every((reference) =>
        typeof reference === "string" && isUuid(reference)
      )
    ) {
      input.references = value.references;
    } else {
      return invalid("Há referências inválidas na versão.");
    }
  }

  if (value.criteria !== undefined) {
    if (value.criteria === null) {
      input.criteria = null;
    } else if (Array.isArray(value.criteria)) {
      const criteria: AiCriterionInput[] = [];
      for (const criterion of value.criteria) {
        const normalized = normalizeCriterion(criterion, criteria.length);
        if (!normalized) return invalid("Revise os critérios da avaliação.");
        criteria.push(normalized);
      }
      input.criteria = criteria;
    } else {
      return invalid("A lista de critérios é inválida.");
    }
  }

  if (Object.keys(input).length === 0) {
    return invalid("Informe ao menos uma alteração para a versão.");
  }
  return { valid: true, input };
}

export function validateSuggestAiCriteria(
  value: unknown,
): ApiInputValidation<SuggestAiCriteriaInput> {
  if (!isRecord(value)) return invalid("Informe o objetivo da sugestão.");
  const objective =
    typeof value.objective === "string" ? value.objective.trim() : "";

  if (objective.length < 3 || objective.length > 2000) {
    return invalid("Informe um objetivo entre 3 e 2000 caracteres.");
  }
  if (!TARGET_TYPES.includes(value.target_type as AiEvaluationTargetType)) {
    return invalid("O alvo da avaliação é inválido.");
  }
  return {
    valid: true,
    input: {
      objective,
      target_type: value.target_type as AiEvaluationTargetType,
    },
  };
}

export function validateAiEvaluationTest(
  value: unknown,
): ApiInputValidation<AiEvaluationTestInput> {
  if (
    !isRecord(value) ||
    typeof value.sample_content !== "string" ||
    value.sample_content.trim().length < 1
  ) {
    return invalid("Informe um conteúdo de teste.");
  }
  return {
    valid: true,
    input: { sample_content: value.sample_content.trim() },
  };
}

export function validateAiEvaluationAssignments(
  value: unknown,
): ApiInputValidation<ReplaceAiEvaluationAssignmentsInput> {
  if (!isRecord(value) || !Array.isArray(value.assignments)) {
    return invalid("Informe o conjunto completo de associações.");
  }

  const assignments: AiEvaluationAssignmentInput[] = [];
  for (const assignment of value.assignments) {
    const normalized = normalizeAssignment(assignment);
    if (!normalized) return invalid("Revise as associações informadas.");
    assignments.push(normalized);
  }
  return { valid: true, input: { assignments } };
}

function normalizeCriterion(value: unknown, index: number) {
  if (!isRecord(value)) return null;
  const statement =
    typeof value.statement === "string" ? value.statement.trim() : "";
  if (
    statement.length < 3 ||
    statement.length > 2000 ||
    !CHECK_TYPES.includes(value.check_type as AiCriterionCheckType)
  ) {
    return null;
  }

  const polarity = value.polarity ?? "positive";
  const severity = value.severity ?? "medium";
  const onMissingInfo = value.on_missing_info ?? "indeterminate";
  if (
    !POLARITIES.includes(polarity as AiCriterionPolarity) ||
    !SEVERITIES.includes(severity as AiCriterionSeverity) ||
    !MISSING_INFO_BEHAVIORS.includes(
      onMissingInfo as AiCriterionMissingInfoBehavior,
    )
  ) {
    return null;
  }

  if (value.id !== undefined && value.id !== null && !isUuid(value.id)) {
    return null;
  }
  if (
    value.order_index !== undefined &&
    (!Number.isInteger(value.order_index) || Number(value.order_index) < 0)
  ) {
    return null;
  }

  const requiredEvidence = normalizeOptionalText(value.required_evidence);
  const recommendationHint = normalizeOptionalText(value.recommendation_hint);
  if (requiredEvidence === undefined || recommendationHint === undefined) {
    return null;
  }

  return {
    id: typeof value.id === "string" ? value.id : null,
    order_index:
      typeof value.order_index === "number" ? value.order_index : index,
    statement,
    check_type: value.check_type as AiCriterionCheckType,
    polarity: polarity as AiCriterionPolarity,
    required_evidence: requiredEvidence,
    severity: severity as AiCriterionSeverity,
    on_missing_info: onMissingInfo as AiCriterionMissingInfoBehavior,
    recommendation_hint: recommendationHint,
  } satisfies AiCriterionInput;
}

function normalizeAssignment(value: unknown) {
  if (
    !isRecord(value) ||
    typeof value.definition_id !== "string" ||
    !isUuid(value.definition_id) ||
    !TARGET_TYPES.includes(value.target_type as AiEvaluationTargetType)
  ) {
    return null;
  }

  if (
    value.pinned_version_id !== undefined &&
    value.pinned_version_id !== null &&
    !isUuid(value.pinned_version_id)
  ) {
    return null;
  }
  if (
    value.field_keys !== undefined &&
    (!Array.isArray(value.field_keys) ||
      !value.field_keys.every(
        (fieldKey) => typeof fieldKey === "string" && fieldKey.trim().length > 0,
      ))
  ) {
    return null;
  }
  if (value.enabled !== undefined && typeof value.enabled !== "boolean") {
    return null;
  }

  return {
    definition_id: value.definition_id,
    pinned_version_id:
      typeof value.pinned_version_id === "string"
        ? value.pinned_version_id
        : null,
    target_type: value.target_type as AiEvaluationTargetType,
    field_keys: Array.isArray(value.field_keys) ? value.field_keys : [],
    enabled: value.enabled !== false,
  } satisfies AiEvaluationAssignmentInput;
}

function normalizeOptionalText(value: unknown) {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return undefined;
  return value.trim() || null;
}

function invalid<T>(message: string): ApiInputValidation<T> {
  return { valid: false, message };
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}
