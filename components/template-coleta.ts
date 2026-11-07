import type { ApiInputValidation } from "@/types/Api";
import type { CollectionTemplateColumnInput, CollectionTemplateColumnPatch, CollectionTemplateInput } from "@/types/TemplateColeta";
import type { ApiRecord } from "@/types/Servico";

const KEY_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;
const COLUMN_TYPES = ["text", "integer", "decimal", "date", "select"] as const;

export function validateCollectionTemplate(value: unknown): ApiInputValidation<CollectionTemplateInput> {
  if (!isRecord(value)) return invalid("Revise os campos do template.");
  if (typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 255) return invalid("Informe um nome com até 255 caracteres.");
  if (value.description !== undefined && value.description !== null && typeof value.description !== "string") return invalid("Revise a descrição do template.");
  if (!isPositiveInteger(value.min_experiments) || !isPositiveInteger(value.min_replicates)) return invalid("Experimentos e réplicas devem ser números inteiros positivos.");
  return { valid: true, input: { name: value.name.trim(), description: typeof value.description === "string" ? value.description : null, min_experiments: value.min_experiments, min_replicates: value.min_replicates } };
}

export function validateCollectionTemplatePatch(value: unknown): ApiInputValidation<Partial<CollectionTemplateInput>> {
  if (!isRecord(value) || Object.keys(value).length === 0) return invalid("Informe ao menos um campo para atualizar.");
  const result: Partial<CollectionTemplateInput> = {};
  if (value.name !== undefined) {
    if (typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 255) return invalid("Informe um nome com até 255 caracteres.");
    result.name = value.name.trim();
  }
  if (value.description !== undefined) {
    if (value.description !== null && typeof value.description !== "string") return invalid("Revise a descrição do template.");
    result.description = value.description as string | null;
  }
  if (value.min_experiments !== undefined) {
    if (!isPositiveInteger(value.min_experiments)) return invalid("O mínimo de experimentos deve ser um número inteiro positivo.");
    result.min_experiments = value.min_experiments;
  }
  if (value.min_replicates !== undefined) {
    if (!isPositiveInteger(value.min_replicates)) return invalid("O mínimo de réplicas deve ser um número inteiro positivo.");
    result.min_replicates = value.min_replicates;
  }
  return { valid: true, input: result };
}

export function validateCollectionTemplateColumn(value: unknown): ApiInputValidation<CollectionTemplateColumnInput> {
  if (!isRecord(value) || typeof value.key !== "string" || !KEY_PATTERN.test(value.key) || typeof value.label !== "string" || !value.label.trim() || value.label.trim().length > 255 || !COLUMN_TYPES.includes(value.type as (typeof COLUMN_TYPES)[number]) || typeof value.required !== "boolean") return invalid("Revise os dados da coluna.");
  const options = value.options === undefined || value.options === null ? null : value.options;
  if (options !== null && (!Array.isArray(options) || !options.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= 255))) return invalid("Informe opções válidas para a coluna.");
  if (value.type === "select" && (!Array.isArray(options) || options.length === 0)) return invalid("Uma coluna de seleção precisa ter opções.");
  if (value.type !== "select" && options !== null && Array.isArray(options) && options.length > 0) return invalid("Opções só podem ser informadas para colunas de seleção.");
  if (value.position !== undefined && (!isPositiveInteger(value.position))) return invalid("A posição deve ser um número inteiro positivo.");
  return { valid: true, input: { key: value.key, label: value.label.trim(), type: value.type as CollectionTemplateColumnInput["type"], required: value.required, options: Array.isArray(options) ? options.map((item) => item.trim()) : null, ...(typeof value.position === "number" ? { position: value.position } : {}) } };
}

export function validateCollectionTemplateColumnPatch(value: unknown): ApiInputValidation<CollectionTemplateColumnPatch> {
  if (!isRecord(value) || Object.keys(value).length === 0) return invalid("Informe ao menos um campo para atualizar.");
  const input: CollectionTemplateColumnPatch = {};
  if (value.key !== undefined) {
    if (typeof value.key !== "string" || !KEY_PATTERN.test(value.key)) return invalid("Revise a chave técnica da coluna.");
    input.key = value.key;
  }
  if (value.label !== undefined) {
    if (typeof value.label !== "string" || !value.label.trim() || value.label.trim().length > 255) return invalid("Informe um rótulo válido para a coluna.");
    input.label = value.label.trim();
  }
  if (value.type !== undefined) {
    if (!COLUMN_TYPES.includes(value.type as (typeof COLUMN_TYPES)[number])) return invalid("Selecione um tipo de coluna válido.");
    input.type = value.type as CollectionTemplateColumnInput["type"];
  }
  if (value.required !== undefined) {
    if (typeof value.required !== "boolean") return invalid("Revise se a coluna é obrigatória.");
    input.required = value.required;
  }
  if (value.options !== undefined) {
    if (value.options !== null && (!Array.isArray(value.options) || !value.options.every((item) => typeof item === "string" && item.trim() && item.length <= 255))) return invalid("Informe opções válidas para a coluna.");
    input.options = Array.isArray(value.options) ? value.options.map((item) => item.trim()) : null;
  }
  if (value.position !== undefined) {
    if (!isPositiveInteger(value.position)) return invalid("A posição deve ser um número inteiro positivo.");
    input.position = value.position;
  }
  return { valid: true, input };
}

function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function isPositiveInteger(value: unknown): value is number { return typeof value === "number" && Number.isInteger(value) && value > 0; }
function invalid<T>(message: string): ApiInputValidation<T> { return { valid: false, message }; }
