import type { ApiInputValidation } from "@/types/Api";
import type { InstitutionNameInput, LaboratoryCreateInput } from "@/types/Institucional";
import type { ApiRecord } from "@/types/Servico";

export function validateInstitutionName(value: unknown): ApiInputValidation<InstitutionNameInput> {
  if (!isRecord(value) || typeof value.name !== "string") {
    return invalid("Informe um nome válido.");
  }
  const name = value.name.trim();
  return name.length >= 1 && name.length <= 255
    ? { valid: true, input: { name } }
    : invalid("O nome deve ter entre 1 e 255 caracteres.");
}

export function validateLaboratoryCreate(value: unknown): ApiInputValidation<LaboratoryCreateInput> {
  const name = validateInstitutionName(value);
  if (!name.valid || !isRecord(value) || typeof value.institution_id !== "string" || !isInstitutionalUuid(value.institution_id)) {
    return invalid(name.valid ? "Selecione uma instituição válida." : name.message);
  }
  return { valid: true, input: { ...name.input, institution_id: value.institution_id } };
}

export function isInstitutionalUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function invalid<T>(message: string): ApiInputValidation<T> {
  return { valid: false, message };
}
