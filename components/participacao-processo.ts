import type { ApiInputValidation } from "@/types/Api";
import { PROCESS_PARTICIPANT_ROLES } from "@/types/ParticipacaoProcesso";
import type { ProcessCompositionInviteInput, ProcessParticipantAssignmentInput } from "@/types/ParticipacaoProcesso";
import type { ApiRecord } from "@/types/Servico";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateProcessCompositionInvite(value: unknown): ApiInputValidation<ProcessCompositionInviteInput> {
  if (!isRecord(value) || !isProcessParticipantRole(value.role_key)) {
    return invalid("Informe uma designação válida.");
  }

  if (typeof value.email !== "string") return invalid("Informe um e-mail válido.");
  const email = value.email.trim();
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return invalid("Informe um e-mail válido.");

  if (value.role_key === "participating_laboratory" || value.role_key === "lead_laboratory") {
    if (typeof value.laboratory_id !== "string" || !isProcessCompositionUuid(value.laboratory_id)) {
      return invalid("Selecione um laboratório ativo.");
    }
    return { valid: true, input: { role_key: value.role_key, email, laboratory_id: value.laboratory_id } };
  }

  if (value.laboratory_id !== undefined && value.laboratory_id !== null) {
    return invalid("A designação não aceita um laboratório.");
  }
  return { valid: true, input: { role_key: value.role_key, email } };
}

export function validateProcessParticipantAssignment(value: unknown): ApiInputValidation<ProcessParticipantAssignmentInput> {
  if (!isRecord(value) || !isProcessParticipantRole(value.role_key) || typeof value.user_id !== "string" || !isProcessCompositionUuid(value.user_id)) {
    return invalid("Informe uma pessoa e uma função válidas.");
  }
  const labRole = value.role_key === "lead_laboratory" || value.role_key === "participating_laboratory";
  if (labRole && (typeof value.laboratory_id !== "string" || !isProcessCompositionUuid(value.laboratory_id))) {
    return invalid("Selecione um laboratório válido.");
  }
  if (!labRole && value.laboratory_id !== undefined && value.laboratory_id !== null) {
    return invalid("A função selecionada não aceita um laboratório.");
  }
  return { valid: true, input: { user_id: value.user_id, role_key: value.role_key, ...(labRole ? { laboratory_id: value.laboratory_id as string } : {}) } };
}

export function validateProcessParticipantConflict(value: unknown): ApiInputValidation<{ has_conflict: boolean; justification: string }> {
  if (!isRecord(value) || typeof value.has_conflict !== "boolean" || typeof value.justification !== "string" || !value.justification.trim()) {
    return invalid("Informe a declaração e sua justificativa.");
  }
  return { valid: true, input: { has_conflict: value.has_conflict, justification: value.justification.trim() } };
}

export function isProcessCompositionUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isProcessParticipantRole(value: unknown): value is ProcessCompositionInviteInput["role_key"] {
  return typeof value === "string" && PROCESS_PARTICIPANT_ROLES.includes(value as (typeof PROCESS_PARTICIPANT_ROLES)[number]);
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function invalid<T>(message: string): ApiInputValidation<T> {
  return { valid: false, message };
}
