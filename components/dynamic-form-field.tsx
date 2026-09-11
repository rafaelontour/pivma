"use client";

import { useState } from "react";
import { Bot, Download, LoaderCircle, Trash2 } from "lucide-react";
import {
  getDynamicFormAllowedFileExtensions,
  getDynamicFormMaximumFileSizeMb,
  getDynamicFormNumericRule,
  getDynamicFormOptions,
  isSupportedDynamicFormField,
  serializeDynamicFormOption,
  validateDynamicFormFile,
} from "@/components/formulario";
import type {
  DynamicFormField,
  DynamicFormFieldControlProps,
  DynamicFormFieldHelpProps,
  DynamicFormFieldLabelProps,
  DynamicFormFieldValueProps,
  SubmissionAttachment,
  SubmissionAttachmentRemovedResult,
  SubmissionAttachmentUploadResult,
} from "@/types/Submissao";
import type { ApiRecord } from "@/types/Servico";

export function DynamicFormFieldControl({
  field,
  value,
  disabled,
  onChange,
  onAttachmentChange,
  processId,
}: DynamicFormFieldControlProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const [attachment, setAttachment] = useState<SubmissionAttachment | null>(
    field.attachment ?? null,
  );
  const [isChangingAttachment, setIsChangingAttachment] = useState(false);
  const fieldId = `dynamic-form-field-${field.field_key}`;
  const helpId = field.help_text ? `${fieldId}-help` : undefined;
  const inputClassName =
    "mt-2 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  async function uploadAttachment(file: File) {
    if (!processId) {
      setFileError("O processo precisa estar criado antes do envio do arquivo.");
      return;
    }
    setIsChangingAttachment(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const response = await fetch(
        `/api/submissions/${processId}/attachments/${encodeURIComponent(field.field_key)}`,
        { method: "POST", body },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isAttachmentUpload(payload)) {
        setFileError(getApiMessage(payload, "Não foi possível enviar o arquivo."));
        return;
      }
      setAttachment(payload.attachment);
      setFileError(null);
      onChange(payload.attachment.artifact_id);
      onAttachmentChange?.(payload.attachment);
    } catch {
      setFileError("Não foi possível conectar ao serviço de anexos.");
    } finally {
      setIsChangingAttachment(false);
    }
  }

  async function removeAttachment() {
    if (!processId || !attachment) return;
    setIsChangingAttachment(true);
    try {
      const response = await fetch(
        `/api/submissions/${processId}/attachments/${encodeURIComponent(field.field_key)}`,
        { method: "DELETE" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isAttachmentRemoved(payload) || !payload.removed) {
        setFileError(getApiMessage(payload, "Não foi possível remover o arquivo."));
        return;
      }
      setAttachment(null);
      setFileError(null);
      onChange("");
      onAttachmentChange?.(null);
    } catch {
      setFileError("Não foi possível conectar ao serviço de anexos.");
    } finally {
      setIsChangingAttachment(false);
    }
  }

  if (field.field_type === "file_upload") {
    const constraintsId = `${fieldId}-constraints`;
    const errorId = fileError ? `${fieldId}-error` : undefined;
    const describedBy = [helpId, constraintsId, errorId]
      .filter(Boolean)
      .join(" ");
    return (
      <div>
        <FieldLabel field={field} fieldId={fieldId} />
        <input
          accept={getFileAccept(field)}
          aria-describedby={describedBy}
          aria-invalid={fileError ? true : undefined}
          className={`${inputClassName} cursor-pointer p-1.5 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-700 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-teal-800`}
          disabled={disabled || isChangingAttachment}
          id={fieldId}
          onChange={(event) => {
            const file = event.target.files?.[0];

            if (!file) {
              return;
            }

            const error = validateDynamicFormFile(file, field);
            if (error) {
              event.currentTarget.value = "";
              setFileError(error);
              return;
            }

            void uploadAttachment(file);
          }}
          required={field.is_required && !attachment}
          type="file"
        />
        <p className="mt-2 text-xs leading-5 text-slate-500" id={constraintsId}>
          {getFileConstraintMessage(field)} O arquivo é enviado e confirmado separadamente.
        </p>
        {isChangingAttachment && <p className="mt-2 flex items-center gap-2 text-xs font-semibold text-teal-800"><LoaderCircle aria-hidden="true" className="size-4 animate-spin" />Atualizando anexo…</p>}
        {attachment && <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3"><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-teal-950">{attachment.filename}</p><p className="mt-1 text-[0.68rem] text-teal-800">{formatFileSize(attachment.size)} · {attachment.extension.toUpperCase()}</p></div>{processId && <a className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-teal-300 bg-white px-2.5 text-xs font-bold text-teal-800 outline-none focus-visible:ring-2 focus-visible:ring-teal-500" href={`/api/submissions/${processId}/attachments/${encodeURIComponent(field.field_key)}`}><Download aria-hidden="true" className="size-3.5" />Baixar</a>}{!disabled && <button aria-label={`Remover ${attachment.filename}`} className="grid size-9 place-items-center rounded-lg text-rose-700 outline-none hover:bg-rose-50 focus-visible:ring-2 focus-visible:ring-rose-500" disabled={isChangingAttachment} onClick={() => void removeAttachment()} type="button"><Trash2 aria-hidden="true" className="size-4" /></button>}</div>}
        <FieldHelp field={field} helpId={helpId} />
        {fileError && (
          <p
            className="mt-2 text-xs font-semibold text-rose-700"
            id={errorId}
            role="alert"
          >
            {fileError}
          </p>
        )}
      </div>
    );
  }

  if (!isSupportedDynamicFormField(field.field_type)) {
    return (
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 p-4">
        <p className="text-sm font-semibold text-slate-800">
          {field.label}
          {field.is_required && <span className="ml-1 text-rose-700">*</span>}
        </p>
        <p className="mt-1 text-xs leading-5 text-amber-900">
          O tipo de campo “{field.field_type}” ainda não é suportado pela
          interface.
        </p>
      </div>
    );
  }

  if (field.field_type === "boolean") {
    return (
      <div>
        <label
          className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-800 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-500"
          htmlFor={fieldId}
        >
          <input
            aria-describedby={helpId}
            checked={value === true}
            className="size-4 accent-teal-700"
            disabled={disabled}
            id={fieldId}
            onChange={(event) => onChange(event.target.checked)}
            type="checkbox"
          />
          <span>
            {field.label}
            {field.is_required && <span className="ml-1 text-rose-700">*</span>}
          </span>
        </label>
        <FieldHelp field={field} helpId={helpId} />
      </div>
    );
  }

  return (
    <div>
      <FieldLabel field={field} fieldId={fieldId} />
      {field.field_type === "textarea" ? (
        <textarea
          aria-describedby={helpId}
          className={`${inputClassName} min-h-28 resize-y`}
          disabled={disabled}
          id={fieldId}
          maxLength={getDynamicFormNumericRule(field, "max_length")}
          minLength={getDynamicFormNumericRule(field, "min_length")}
          onChange={(event) => onChange(event.target.value)}
          required={field.is_required}
          value={typeof value === "string" ? value : ""}
        />
      ) : field.field_type === "select" ? (
        <select
          aria-describedby={helpId}
          className={inputClassName}
          disabled={disabled}
          id={fieldId}
          onChange={(event) => onChange(event.target.value)}
          required={field.is_required}
          value={typeof value === "string" ? value : ""}
        >
          <option value="">Selecione uma opção</option>
          {getDynamicFormOptions(field.options).map((option) => (
            <option
              key={serializeDynamicFormOption(option.value)}
              value={serializeDynamicFormOption(option.value)}
            >
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          aria-describedby={helpId}
          className={inputClassName}
          disabled={disabled}
          id={fieldId}
          max={getDynamicFormNumericRule(field, "max")}
          maxLength={getDynamicFormNumericRule(field, "max_length")}
          min={getDynamicFormNumericRule(field, "min")}
          minLength={getDynamicFormNumericRule(field, "min_length")}
          onChange={(event) => onChange(event.target.value)}
          required={field.is_required}
          step={field.field_type === "float" ? "any" : undefined}
          type={getInputType(field.field_type)}
          value={typeof value === "string" ? value : ""}
        />
      )}
      <FieldHelp field={field} helpId={helpId} />
    </div>
  );
}

export function DynamicFormFieldValue({
  field,
  value,
}: DynamicFormFieldValueProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
        {field.label}
      </p>
      <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
        {formatDynamicFormValue(field, value)}
      </div>
    </div>
  );
}

function FieldLabel({ field, fieldId }: DynamicFormFieldLabelProps) {
  return (
    <label className="text-sm font-semibold text-slate-800" htmlFor={fieldId}>
      {field.label}
      {field.is_required && <span className="ml-1 text-rose-700">*</span>}
      {field.ai_evaluation_enabled && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[0.65rem] font-bold text-violet-800"><Bot aria-hidden="true" className="size-3" />Pré-avaliação por IA</span>}
    </label>
  );
}

function FieldHelp({
  field,
  helpId,
}: DynamicFormFieldHelpProps) {
  return field.help_text ? (
    <p className="mt-2 text-xs leading-5 text-slate-500" id={helpId}>
      {field.help_text}
    </p>
  ) : null;
}

function getFileAccept(field: DynamicFormField) {
  const extensions = getDynamicFormAllowedFileExtensions(field);
  return extensions.length > 0
    ? extensions.map((extension) => `.${extension}`).join(",")
    : undefined;
}

function getFileConstraintMessage(field: DynamicFormField) {
  const extensions = getDynamicFormAllowedFileExtensions(field);
  const maximumSizeMb = getDynamicFormMaximumFileSizeMb(field);
  const parts = [];

  if (extensions.length > 0) {
    parts.push(
      `Formatos aceitos: ${extensions
        .map((value) => value.toUpperCase())
        .join(", ")}.`,
    );
  }
  if (maximumSizeMb) {
    parts.push(`Tamanho máximo: ${maximumSizeMb} MB.`);
  }

  return parts.length > 0 ? parts.join(" ") : "Selecione um arquivo válido.";
}

function getInputType(fieldType: string) {
  if (fieldType === "integer" || fieldType === "float") return "number";
  if (fieldType === "date") return "date";
  return "text";
}

function formatDynamicFormValue(field: DynamicFormField, value: unknown) {
  if (value === undefined || value === null || value === "") {
    return "Não informado";
  }
  if (field.field_type === "boolean" && typeof value === "boolean") {
    return value ? "Sim" : "Não";
  }
  if (field.field_type === "select") {
    const option = getDynamicFormOptions(field.options).find(
      (candidate) => candidate.value === value,
    );
    if (option) return option.label;
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value, null, 2);
}

function isAttachmentUpload(value: unknown): value is SubmissionAttachmentUploadResult {
  return isRecord(value) && typeof value.field_key === "string" && isAttachment(value.attachment) && typeof value.replaced_previous === "boolean";
}

function isAttachmentRemoved(value: unknown): value is SubmissionAttachmentRemovedResult {
  return isRecord(value) && typeof value.field_key === "string" && typeof value.removed === "boolean";
}

function isAttachment(value: unknown): value is SubmissionAttachment {
  return isRecord(value) && typeof value.artifact_id === "string" && typeof value.filename === "string" && typeof value.size === "number" && typeof value.extension === "string" && typeof value.checksum_sha256 === "string" && typeof value.uploaded_at === "string";
}

function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function getApiMessage(value: unknown, fallback: string) { return isRecord(value) && typeof value.message === "string" ? value.message : fallback; }
function formatFileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} MB`; }
