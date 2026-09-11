import type { ApiInputValidation } from "@/types/Api";
import type { ApiRecord } from "@/types/Servico";
import type {
  SaveTriageFeedbackInput,
  SaveTriageFieldReviewsInput,
  TriageDecisionInput,
  TriageDecisionOutcome,
  TriageFeedbackItemInput,
  TriageFeedbackVerdict,
  TriageFieldReviewInput,
  TriageFieldReviewStatus,
} from "@/types/Triagem";

const REVIEW_STATUSES: TriageFieldReviewStatus[] = ["APPROVED", "NEEDS_REVISION", "REJECTED"];
const FEEDBACK_VERDICTS: TriageFeedbackVerdict[] = ["agree", "disagree", "inconclusive"];
const DECISION_OUTCOMES: TriageDecisionOutcome[] = ["APPROVED", "NEEDS_REVISION", "REJECTED"];

export function validateTriageReviews(value: unknown): ApiInputValidation<SaveTriageFieldReviewsInput> {
  if (!isRecord(value) || !Array.isArray(value.reviews) || value.reviews.length === 0) return invalid("Informe ao menos um parecer de campo.");
  const reviews: TriageFieldReviewInput[] = [];
  for (const item of value.reviews) {
    if (!isRecord(item) || typeof item.field_key !== "string" || !isTechnicalKey(item.field_key) || !REVIEW_STATUSES.includes(item.status as TriageFieldReviewStatus)) return invalid("Revise os pareceres dos campos.");
    const comments = optionalText(item.comments);
    if (comments === undefined) return invalid("Há um comentário de parecer inválido.");
    if (item.status !== "APPROVED" && !comments) return invalid("Informe um comentário para campos que precisam de revisão ou foram rejeitados.");
    reviews.push({ field_key: item.field_key, status: item.status as TriageFieldReviewStatus, comments });
  }
  return { valid: true, input: { reviews } };
}

export function validateTriageFeedback(value: unknown): ApiInputValidation<SaveTriageFeedbackInput> {
  if (!isRecord(value) || !Array.isArray(value.items) || value.items.length === 0) return invalid("Informe ao menos um feedback de critério.");
  const items: TriageFeedbackItemInput[] = [];
  for (const item of value.items) {
    if (!isRecord(item) || !isUuid(item.item_id) || !FEEDBACK_VERDICTS.includes(item.verdict as TriageFeedbackVerdict)) return invalid("Revise os feedbacks dos critérios.");
    const reason = optionalText(item.reason);
    if (reason === undefined) return invalid("Há uma justificativa de feedback inválida.");
    if (item.verdict === "disagree" && !reason) return invalid("Informe o motivo da discordância com o critério automático.");
    items.push({ item_id: item.item_id, verdict: item.verdict as TriageFeedbackVerdict, reason });
  }
  return { valid: true, input: { items } };
}

export function validateTriageDecision(value: unknown): ApiInputValidation<TriageDecisionInput> {
  if (!isRecord(value) || !DECISION_OUTCOMES.includes(value.outcome as TriageDecisionOutcome) || typeof value.justification !== "string" || value.justification.trim().length < 3 || value.justification.trim().length > 4000) return invalid("Informe a decisão e uma justificativa entre 3 e 4000 caracteres.");
  return { valid: true, input: { outcome: value.outcome as TriageDecisionOutcome, justification: value.justification.trim() } };
}

export function isTriageUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
function isUuid(value: unknown): value is string { return typeof value === "string" && isTriageUuid(value); }
function isTechnicalKey(value: string) { return /^[A-Za-z0-9._-]{1,128}$/.test(value); }
function optionalText(value: unknown) { if (value === undefined || value === null) return null; return typeof value === "string" && value.length <= 4000 ? value.trim() || null : undefined; }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function invalid<T>(message: string): ApiInputValidation<T> { return { valid: false, message }; }
