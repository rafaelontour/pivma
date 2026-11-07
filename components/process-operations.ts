import type { ApiInputValidation } from "@/types/Api";
import type { ApiRecord } from "@/types/Servico";
import type { LaboratoryReopenInput, LaboratoryWaiverInput, NonconformityDecisionInput, SampleReceiptInput, SampleSubstanceCreateInput, StructureApprovalDecisionInput } from "@/types/ProcessOperations";

const GHS = ["GHS01", "GHS02", "GHS03", "GHS04", "GHS05", "GHS06", "GHS07", "GHS08", "GHS09"];
const STORAGE = ["ambient", "refrigerated", "frozen", "deep_frozen", "custom"];

export function validateSampleSubstance(value: unknown): ApiInputValidation<SampleSubstanceCreateInput> {
  if (!isRecord(value)) return invalid("Revise os dados da amostra.");
  for (const field of ["chemical_name", "cas_number", "lot", "safe_handling_instructions", "reference_classification"] as const) {
    if (typeof value[field] !== "string" || !value[field].trim()) return invalid("Preencha os campos obrigatórios da substância.");
  }
  if (String(value.chemical_name).length > 255 || String(value.cas_number).length > 32 || String(value.lot).length > 64) return invalid("Revise os limites de tamanho dos campos.");
  if (value.storage_temperature_regime !== undefined && value.storage_temperature_regime !== null && !STORAGE.includes(String(value.storage_temperature_regime))) return invalid("Selecione um regime de armazenamento válido.");
  if (value.ghs_hazard_pictograms !== undefined && value.ghs_hazard_pictograms !== null && (!Array.isArray(value.ghs_hazard_pictograms) || !value.ghs_hazard_pictograms.every((item) => GHS.includes(String(item))))) return invalid("Selecione pictogramas GHS válidos.");
  for (const key of ["storage_temperature_min", "storage_temperature_max", "vial_nominal_quantity"] as const) if (value[key] !== undefined && value[key] !== null && (typeof value[key] !== "number" || !Number.isFinite(value[key]))) return invalid("Informe valores numéricos válidos.");
  if (value.vial_nominal_quantity !== undefined && value.vial_nominal_quantity !== null && Number(value.vial_nominal_quantity) <= 0) return invalid("A quantidade nominal deve ser maior que zero.");
  if (value.reserve_vials_count !== undefined && value.reserve_vials_count !== null && (!Number.isInteger(value.reserve_vials_count) || Number(value.reserve_vials_count) < 0)) return invalid("A quantidade de frascos reserva deve ser um inteiro não negativo.");
  if (value.expiration_date !== undefined && value.expiration_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(value.expiration_date))) return invalid("Informe uma data de validade válida.");
  const allowed = new Set(["chemical_name", "cas_number", "lot", "safe_handling_instructions", "reference_classification", "purity", "solubility", "storage_temperature_regime", "storage_temperature_min", "storage_temperature_max", "vial_nominal_quantity", "vial_unit", "packaging_type", "expiration_date", "reserve_vials_count", "ghs_hazard_pictograms"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return invalid("O formulário contém campos não aceitos.");
  return { valid: true, input: value as SampleSubstanceCreateInput };
}

export function validateSampleSubstancePatch(value: unknown): ApiInputValidation<ApiRecord> {
  if (!isRecord(value) || Object.keys(value).length === 0) return invalid("Informe ao menos um campo da substância.");
  const allowed = new Set(["chemical_name", "cas_number", "lot", "safe_handling_instructions", "reference_classification", "purity", "solubility", "storage_temperature_regime", "storage_temperature_min", "storage_temperature_max", "vial_nominal_quantity", "vial_unit", "packaging_type", "expiration_date", "reserve_vials_count", "ghs_hazard_pictograms"]);
  if (Object.keys(value).some((key) => !allowed.has(key))) return invalid("O formulário contém campos não aceitos.");
  for (const key of ["chemical_name", "cas_number", "lot", "safe_handling_instructions", "reference_classification", "purity", "solubility", "vial_unit", "packaging_type"] as const) {
    if (value[key] !== undefined && value[key] !== null && typeof value[key] !== "string") return invalid("Revise os campos textuais da substância.");
  }
  if (value.storage_temperature_regime !== undefined && value.storage_temperature_regime !== null && !STORAGE.includes(String(value.storage_temperature_regime))) return invalid("Selecione um regime de armazenamento válido.");
  for (const key of ["storage_temperature_min", "storage_temperature_max", "vial_nominal_quantity"] as const) if (value[key] !== undefined && value[key] !== null && (typeof value[key] !== "number" || !Number.isFinite(value[key]))) return invalid("Informe valores numéricos válidos.");
  if (value.vial_nominal_quantity !== undefined && value.vial_nominal_quantity !== null && Number(value.vial_nominal_quantity) <= 0) return invalid("A quantidade nominal deve ser maior que zero.");
  if (value.reserve_vials_count !== undefined && value.reserve_vials_count !== null && (!Number.isInteger(value.reserve_vials_count) || Number(value.reserve_vials_count) < 0)) return invalid("A quantidade de frascos reserva deve ser um inteiro não negativo.");
  if (value.expiration_date !== undefined && value.expiration_date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(String(value.expiration_date))) return invalid("Informe uma data de validade válida.");
  if (value.ghs_hazard_pictograms !== undefined && value.ghs_hazard_pictograms !== null && (!Array.isArray(value.ghs_hazard_pictograms) || !value.ghs_hazard_pictograms.every((item) => GHS.includes(String(item))))) return invalid("Selecione pictogramas GHS válidos.");
  return { valid: true, input: value };
}

export function validateStructureApprovalDecision(value: unknown): ApiInputValidation<StructureApprovalDecisionInput> {
  if (!isRecord(value) || (value.outcome !== "APPROVED" && value.outcome !== "REJECTED") || typeof value.justification !== "string" || value.justification.trim().length < 3) return invalid("Informe uma decisão e uma justificativa válida.");
  if (value.rejected_points !== undefined && value.rejected_points !== null && (!Array.isArray(value.rejected_points) || !value.rejected_points.every((point) => isRecord(point) && typeof point.activity_key === "string" && typeof point.reason === "string" && point.reason.trim().length >= 3))) return invalid("Revise os pontos reprovados.");
  if (value.outcome === "REJECTED" && (!Array.isArray(value.rejected_points) || value.rejected_points.length === 0)) return invalid("Informe ao menos um ponto e o motivo da reprovação.");
  return { valid: true, input: { outcome: value.outcome, justification: value.justification.trim(), rejected_points: (value.rejected_points ?? null) as ApiRecord[] | null } };
}

export function validateSampleReceipt(value: unknown): ApiInputValidation<SampleReceiptInput> {
  if (!isRecord(value) || typeof value.opened_at !== "string" || !Number.isFinite(Date.parse(value.opened_at)) || typeof value.temperature_celsius !== "number" || !Number.isFinite(value.temperature_celsius) || !["intact", "damaged", "violated"].includes(String(value.package_state))) return invalid("Revise os dados do recebimento.");
  if (Date.parse(value.opened_at) > Date.now()) return invalid("A data de abertura não pode estar no futuro.");
  if (value.notes !== undefined && value.notes !== null && (typeof value.notes !== "string" || !value.notes.trim())) return invalid("Revise a observação do recebimento.");
  return { valid: true, input: { opened_at: value.opened_at, temperature_celsius: value.temperature_celsius, package_state: value.package_state as SampleReceiptInput["package_state"], notes: value.notes as string | null | undefined } };
}

export function validateNonconformityDecision(value: unknown): ApiInputValidation<NonconformityDecisionInput> {
  if (!isRecord(value) || !["accept_with_caveat", "resend", "disqualify"].includes(String(value.decision)) || typeof value.justification !== "string" || !value.justification.trim()) return invalid("Informe uma decisão e uma justificativa.");
  if (value.lab_guidance !== undefined && value.lab_guidance !== null && typeof value.lab_guidance !== "string") return invalid("Revise a orientação ao laboratório.");
  return { valid: true, input: { decision: value.decision as NonconformityDecisionInput["decision"], justification: value.justification.trim(), lab_guidance: value.lab_guidance as string | null | undefined } };
}

export function validateLaboratoryWaiver(value: unknown): ApiInputValidation<LaboratoryWaiverInput> {
  if (!isRecord(value) || typeof value.laboratory_id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.laboratory_id) || typeof value.reason !== "string" || !value.reason.trim()) return invalid("Informe o laboratório e o motivo da dispensa.");
  return { valid: true, input: { laboratory_id: value.laboratory_id, reason: value.reason.trim() } };
}

export function validateLaboratoryReopen(value: unknown): ApiInputValidation<LaboratoryReopenInput> {
  if (!isRecord(value) || typeof value.reason !== "string" || !value.reason.trim()) return invalid("Informe o motivo da reabertura.");
  return { valid: true, input: { reason: value.reason.trim() } };
}

function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function invalid<T>(message: string): ApiInputValidation<T> { return { valid: false, message }; }
