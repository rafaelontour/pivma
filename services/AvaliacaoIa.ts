import "server-only";

import { isAxiosError } from "axios";
import type { AxiosResponse } from "axios";
import { tryit } from "radash";
import { apiOrigin, http } from "./Http";
import type {
  AiCriterion,
  AiCriterionTestResult,
  AiEvaluationAssignment,
  AiEvaluationAssignments,
  AiEvaluationDefinition,
  AiEvaluationDefinitionPage,
  AiEvaluationDefinitionSummary,
  AiEvaluationListOptions,
  AiEvaluationTestInput,
  AiEvaluationTestResult,
  AiEvaluationVersion,
  AiEvaluationVersionSummary,
  CreateAiEvaluationInput,
  PatchAiEvaluationVersionInput,
  PublishAiEvaluationResult,
  ReplaceAiEvaluationAssignmentsInput,
  SuggestAiCriteriaInput,
  SuggestAiCriteriaResult,
  SuggestedAiCriterion,
} from "@/types/AvaliacaoIa";
import type { ApiRecord, ServiceResult } from "@/types/Servico";

export async function listAiEvaluations(
  accessToken: string,
  options: AiEvaluationListOptions,
) {
  return executeRequest(
    () =>
      http.get<unknown>("/ai-evaluations", {
        headers: authHeaders(accessToken),
        params: options,
      }),
    normalizeDefinitionPage,
  );
}

export async function createAiEvaluation(
  accessToken: string,
  input: CreateAiEvaluationInput,
) {
  return executeRequest(
    () =>
      http.post<unknown>("/ai-evaluations", input, {
        headers: mutationHeaders(accessToken),
      }),
    normalizeDefinition,
  );
}

export async function getAiEvaluation(
  accessToken: string,
  definitionId: string,
) {
  return executeRequest(
    () =>
      http.get<unknown>(`/ai-evaluations/${definitionId}`, {
        headers: authHeaders(accessToken),
      }),
    normalizeDefinition,
  );
}

export async function getAiEvaluationVersion(
  accessToken: string,
  definitionId: string,
  versionNumber: number,
) {
  return executeRequest(
    () =>
      http.get<unknown>(
        `/ai-evaluations/${definitionId}/versions/${versionNumber}`,
        { headers: authHeaders(accessToken) },
      ),
    normalizeVersion,
  );
}

export async function patchAiEvaluationVersion(
  accessToken: string,
  definitionId: string,
  versionNumber: number,
  input: PatchAiEvaluationVersionInput,
) {
  return executeRequest(
    () =>
      http.patch<unknown>(
        `/ai-evaluations/${definitionId}/versions/${versionNumber}`,
        input,
        { headers: mutationHeaders(accessToken) },
      ),
    normalizeVersion,
  );
}

export async function createAiEvaluationVersion(
  accessToken: string,
  definitionId: string,
) {
  return executeRequest(
    () =>
      http.post<unknown>(
        `/ai-evaluations/${definitionId}/versions`,
        undefined,
        { headers: mutationHeaders(accessToken) },
      ),
    normalizeVersion,
  );
}

export async function suggestAiCriteria(
  accessToken: string,
  input: SuggestAiCriteriaInput,
) {
  return executeRequest(
    () =>
      http.post<unknown>("/ai-evaluations/suggest-criteria", input, {
        headers: mutationHeaders(accessToken),
      }),
    normalizeSuggestions,
  );
}

export async function testAiEvaluationVersion(
  accessToken: string,
  definitionId: string,
  versionNumber: number,
  input: AiEvaluationTestInput,
) {
  return executeRequest(
    () =>
      http.post<unknown>(
        `/ai-evaluations/${definitionId}/versions/${versionNumber}/test`,
        input,
        { headers: mutationHeaders(accessToken) },
      ),
    normalizeTestResult,
  );
}

export async function publishAiEvaluationVersion(
  accessToken: string,
  definitionId: string,
  versionNumber: number,
) {
  return executeRequest(
    () =>
      http.post<unknown>(
        `/ai-evaluations/${definitionId}/versions/${versionNumber}/publish`,
        undefined,
        { headers: mutationHeaders(accessToken) },
      ),
    normalizePublishResult,
  );
}

export async function listAiEvaluationAssignments(
  accessToken: string,
  templateKey: string,
) {
  return executeRequest(
    () =>
      http.get<unknown>(
        `/form-templates/${encodeURIComponent(templateKey)}/evaluation-assignments`,
        { headers: authHeaders(accessToken) },
      ),
    normalizeAssignments,
  );
}

export async function replaceAiEvaluationAssignments(
  accessToken: string,
  templateKey: string,
  input: ReplaceAiEvaluationAssignmentsInput,
) {
  return executeRequest(
    () =>
      http.put<unknown>(
        `/form-templates/${encodeURIComponent(templateKey)}/evaluation-assignments`,
        input,
        { headers: mutationHeaders(accessToken) },
      ),
    normalizeAssignments,
  );
}

async function executeRequest<T>(
  request: () => Promise<AxiosResponse<unknown>>,
  normalize: (value: unknown) => T | null,
): Promise<ServiceResult<T>> {
  const [error, response] = await tryit(request)();
  if (error) return { ok: false, status: getStatus(error) };

  const data = normalize(response.data);
  return data ? { ok: true, data } : { ok: false };
}

function normalizeDefinitionPage(value: unknown): AiEvaluationDefinitionPage | null {
  if (
    !isRecord(value) ||
    typeof value.offset !== "number" ||
    typeof value.limit !== "number" ||
    !Array.isArray(value.items)
  ) {
    return null;
  }

  const items = value.items.map(normalizeDefinitionSummary);
  return items.every(isPresent)
    ? { offset: value.offset, limit: value.limit, items }
    : null;
}

function normalizeDefinitionSummary(
  value: unknown,
): AiEvaluationDefinitionSummary | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.mode !== "string"
  ) {
    return null;
  }

  const latestVersion =
    value.latest_version === undefined || value.latest_version === null
      ? null
      : normalizeVersionSummary(value.latest_version);
  if (value.latest_version && !latestVersion) return null;

  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    mode: value.mode,
    latest_version: latestVersion,
    published_versions:
      typeof value.published_versions === "number" ? value.published_versions : 0,
    assignments_count:
      typeof value.assignments_count === "number" ? value.assignments_count : 0,
  };
}

function normalizeDefinition(value: unknown): AiEvaluationDefinition | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    typeof value.slug !== "string" ||
    typeof value.mode !== "string"
  ) {
    return null;
  }

  const versionsValue = value.versions ?? [];
  if (!Array.isArray(versionsValue)) return null;
  const versions = versionsValue.map(normalizeVersionSummary);
  if (!versions.every(isPresent)) return null;

  return {
    id: value.id,
    name: value.name,
    slug: value.slug,
    mode: value.mode,
    description: typeof value.description === "string" ? value.description : null,
    versions,
  };
}

function normalizeVersionSummary(value: unknown): AiEvaluationVersionSummary | null {
  if (
    !isRecord(value) ||
    typeof value.version_number !== "number" ||
    typeof value.status !== "string"
  ) {
    return null;
  }
  return {
    version_number: value.version_number,
    status: value.status,
    criteria_count:
      typeof value.criteria_count === "number" ? value.criteria_count : 0,
    test_run_count:
      typeof value.test_run_count === "number" ? value.test_run_count : 0,
    published_at:
      typeof value.published_at === "string" ? value.published_at : null,
  };
}

function normalizeVersion(value: unknown): AiEvaluationVersion | null {
  if (
    !isRecord(value) ||
    typeof value.version_number !== "number" ||
    typeof value.status !== "string" ||
    typeof value.objective !== "string" ||
    typeof value.test_run_count !== "number"
  ) {
    return null;
  }

  const criteriaValue = value.criteria ?? [];
  const references = value.references ?? [];
  if (!Array.isArray(criteriaValue) || !Array.isArray(references)) return null;
  const criteria = criteriaValue.map(normalizeCriterion);
  if (!criteria.every(isPresent) || !references.every(isRecord)) return null;

  return {
    version_number: value.version_number,
    status: value.status,
    objective: value.objective,
    references,
    test_run_count: value.test_run_count,
    published_at:
      typeof value.published_at === "string" ? value.published_at : null,
    criteria,
  };
}

function normalizeCriterion(value: unknown): AiCriterion | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.order_index !== "number" ||
    typeof value.statement !== "string" ||
    typeof value.check_type !== "string" ||
    typeof value.polarity !== "string" ||
    typeof value.severity !== "string" ||
    typeof value.on_missing_info !== "string"
  ) {
    return null;
  }
  return {
    id: value.id,
    order_index: value.order_index,
    statement: value.statement,
    check_type: value.check_type,
    polarity: value.polarity,
    severity: value.severity,
    on_missing_info: value.on_missing_info,
    required_evidence:
      typeof value.required_evidence === "string" ? value.required_evidence : null,
    recommendation_hint:
      typeof value.recommendation_hint === "string"
        ? value.recommendation_hint
        : null,
  };
}

function normalizeSuggestions(value: unknown): SuggestAiCriteriaResult | null {
  if (!isRecord(value)) return null;
  const suggestionsValue = value.suggestions ?? [];
  if (!Array.isArray(suggestionsValue)) return null;
  const suggestions = suggestionsValue.map(normalizeSuggestion);
  return suggestions.every(isPresent) ? { suggestions } : null;
}

function normalizeSuggestion(value: unknown): SuggestedAiCriterion | null {
  return isRecord(value) &&
    typeof value.statement === "string" &&
    typeof value.check_type === "string" &&
    typeof value.polarity === "string" &&
    typeof value.suggested_severity === "string"
    ? {
        statement: value.statement,
        check_type: value.check_type,
        polarity: value.polarity,
        suggested_severity: value.suggested_severity,
      }
    : null;
}

function normalizeTestResult(value: unknown): AiEvaluationTestResult | null {
  if (
    !isRecord(value) ||
    (value.consolidated_result !== "positive" &&
      value.consolidated_result !== "negative") ||
    typeof value.real_cost !== "number"
  ) {
    return null;
  }
  const resultsValue = value.results ?? [];
  if (!Array.isArray(resultsValue)) return null;
  const results = resultsValue.map(normalizeCriterionTestResult);
  return results.every(isPresent)
    ? {
        consolidated_result: value.consolidated_result,
        real_cost: value.real_cost,
        results,
      }
    : null;
}

function normalizeCriterionTestResult(value: unknown): AiCriterionTestResult | null {
  if (
    !isRecord(value) ||
    typeof value.statement !== "string" ||
    typeof value.check_type !== "string" ||
    typeof value.severity !== "string" ||
    typeof value.conclusion !== "string" ||
    typeof value.is_alert !== "boolean"
  ) {
    return null;
  }
  return {
    criterion_id: typeof value.criterion_id === "string" ? value.criterion_id : null,
    statement: value.statement,
    check_type: value.check_type,
    severity: value.severity,
    conclusion: value.conclusion,
    is_alert: value.is_alert,
    evidence_excerpt: optionalString(value.evidence_excerpt),
    evidence_location: optionalString(value.evidence_location),
    justification: optionalString(value.justification),
    recommendation: optionalString(value.recommendation),
  };
}

function normalizePublishResult(value: unknown): PublishAiEvaluationResult | null {
  return isRecord(value) &&
    typeof value.version_number === "number" &&
    typeof value.status === "string" &&
    typeof value.test_warning === "boolean"
    ? {
        version_number: value.version_number,
        status: value.status,
        published_at:
          typeof value.published_at === "string" ? value.published_at : null,
        test_warning: value.test_warning,
      }
    : null;
}

function normalizeAssignments(value: unknown): AiEvaluationAssignments | null {
  if (!isRecord(value) || typeof value.template_key !== "string") return null;
  const assignmentsValue = value.assignments ?? [];
  if (!Array.isArray(assignmentsValue)) return null;
  const assignments = assignmentsValue.map(normalizeAssignment);
  return assignments.every(isPresent)
    ? { template_key: value.template_key, assignments }
    : null;
}

function normalizeAssignment(value: unknown): AiEvaluationAssignment | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.definition_id !== "string" ||
    typeof value.definition_name !== "string" ||
    typeof value.target_type !== "string" ||
    typeof value.enabled !== "boolean"
  ) {
    return null;
  }
  if (
    value.field_keys !== undefined &&
    (!Array.isArray(value.field_keys) ||
      !value.field_keys.every((fieldKey) => typeof fieldKey === "string"))
  ) {
    return null;
  }
  return {
    id: value.id,
    definition_id: value.definition_id,
    definition_name: value.definition_name,
    target_type: value.target_type,
    enabled: value.enabled,
    pinned_version_id:
      typeof value.pinned_version_id === "string" ? value.pinned_version_id : null,
    effective_version_number:
      typeof value.effective_version_number === "number"
        ? value.effective_version_number
        : null,
    field_keys: Array.isArray(value.field_keys) ? value.field_keys : [],
  };
}

function authHeaders(accessToken: string) {
  return { Cookie: `access_token=${accessToken}` };
}

function mutationHeaders(accessToken: string) {
  return { ...authHeaders(accessToken), Origin: apiOrigin };
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isPresent<T>(value: T | null): value is T {
  return value !== null;
}

function getStatus(error: Error) {
  return isAxiosError(error) ? error.response?.status : undefined;
}
