"use client";

import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Building2,
  FlaskConical,
  LoaderCircle,
  Pencil,
  Plus,
  RefreshCw,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { compareLocalized, formatDate } from "@/i18n/format";
import { normalizeLocale } from "@/i18n/config";
import { getLocalizedApiError } from "@/i18n/errors";
import type {
  Institution,
  InstitutionCardProps,
  InstitutionalActionButtonProps,
  InstitutionalCatalogProps,
  InstitutionalCatalogSnapshot,
  InstitutionalCatalogState,
  InstitutionalDialogProps,
  InstitutionalDialogShellProps,
  InstitutionalDialogState,
  InstitutionalCatalogMessageProps,
  InstitutionalStatusBadgeProps,
  InstitutionalTarget,
  Laboratory,
} from "@/types/Institucional";
import type { ApiRecord } from "@/types/Servico";

export function InstitutionalCatalog({ initialSnapshot }: InstitutionalCatalogProps) {
  const { i18n, t } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage) ?? "pt-BR";
  const [catalog, setCatalog] = useState<InstitutionalCatalogState>(
    initialSnapshot
      ? { kind: "ready", snapshot: initialSnapshot }
      : { kind: "loading" },
  );
  const [dialog, setDialog] = useState<InstitutionalDialogState>({ kind: "closed" });
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function loadCatalog(preserveCurrent = false) {
    if (!preserveCurrent) setCatalog({ kind: "loading" });
    setIsRefreshing(preserveCurrent);

    try {
      const response = await fetch("/api/institucional/catalogo", { cache: "no-store" });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !isInstitutionalCatalogSnapshot(payload)) {
        const message = getLocalizedApiError(payload, t("institutionalCatalog.errors.load"), t);
        if (preserveCurrent) {
          toast.error(t("institutionalCatalog.errors.reconciliation"));
        } else {
          setCatalog({ kind: response.status === 403 ? "denied" : "error", message });
        }
        return false;
      }

      setCatalog({ kind: "ready", snapshot: payload });
      return true;
    } catch {
      if (preserveCurrent) {
        toast.error(t("institutionalCatalog.errors.reconciliation"));
      } else {
        setCatalog({ kind: "error", message: t("institutionalCatalog.errors.connection") });
      }
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    if (!initialSnapshot) queueMicrotask(() => void loadCatalog());
    // O snapshot inicial é estável durante a montagem.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSnapshot]);

  function openCreate(resourceKind: "institution" | "laboratory") {
    const firstInstitution = catalog.kind === "ready"
      ? catalog.snapshot.institutions.find((institution) => institution.active)
      : undefined;
    setDialog({
      kind: "form",
      mode: "create",
      resourceKind,
      target: null,
      name: "",
      institutionId: resourceKind === "laboratory" ? firstInstitution?.id ?? "" : "",
      error: null,
      isSubmitting: false,
    });
  }

  function openRename(target: InstitutionalTarget) {
    setDialog({
      kind: "form",
      mode: "rename",
      resourceKind: target.kind,
      target,
      name: target.name,
      institutionId: target.institutionId ?? "",
      error: null,
      isSubmitting: false,
    });
  }

  function openDeactivate(target: InstitutionalTarget) {
    setDialog({ kind: "deactivate", target, error: null, isSubmitting: false });
  }

  function closeDialog() {
    setDialog((current) => current.kind !== "closed" && current.isSubmitting
      ? current
      : { kind: "closed" });
  }

  async function submitDialog() {
    if (dialog.kind === "closed" || dialog.isSubmitting) return;
    if (dialog.kind === "form") {
      const name = dialog.name.trim();
      if (name.length < 1 || name.length > 255) {
        setDialog({ ...dialog, error: t("institutionalCatalog.validation.name") });
        return;
      }
      if (dialog.resourceKind === "laboratory" && dialog.mode === "create" && !dialog.institutionId) {
        setDialog({ ...dialog, error: t("institutionalCatalog.validation.institution") });
        return;
      }
    }

    const currentDialog = dialog;
    setDialog({ ...currentDialog, error: null, isSubmitting: true });
    const request = getMutationRequest(currentDialog);

    try {
      const response = await fetch(request.path, {
        method: request.method,
        headers: request.body ? { "Content-Type": "application/json" } : undefined,
        body: request.body ? JSON.stringify(request.body) : undefined,
      });
      const payload = response.status === 204
        ? null
        : await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 409) await loadCatalog(true);
        setDialog({
          ...currentDialog,
          error: getLocalizedApiError(payload, t("institutionalCatalog.errors.mutation"), t),
          isSubmitting: false,
        });
        return;
      }

      setDialog({ kind: "closed" });
      toast.success(t(successKey(currentDialog)));
      await loadCatalog(true);
    } catch {
      setDialog({
        ...currentDialog,
        error: t("institutionalCatalog.errors.connection"),
        isSubmitting: false,
      });
    }
  }

  if (catalog.kind === "loading") {
    return <CatalogMessage busy message={t("institutionalCatalog.loading")} />;
  }

  if (catalog.kind === "denied" || catalog.kind === "error") {
    return (
      <section className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <TriangleAlert aria-hidden="true" className="size-9 text-amber-600" />
        <p className="max-w-lg text-sm text-slate-700">{catalog.message}</p>
        {catalog.kind === "error" && (
          <button className={secondaryButtonClass} onClick={() => void loadCatalog()} type="button">
            <RefreshCw aria-hidden="true" className="size-4" />
            {t("institutionalCatalog.actions.retry")}
          </button>
        )}
      </section>
    );
  }

  const institutions = [...catalog.snapshot.institutions].sort((left, right) =>
    compareLocalized(left.name, right.name, locale),
  );
  const activeInstitutions = institutions.filter((institution) => institution.active);

  return (
    <section aria-label={t("institutionalCatalog.ariaLabel")} className="flex-1 py-6 sm:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{t("institutionalCatalog.title")}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {t("institutionalCatalog.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            aria-label={t("institutionalCatalog.actions.refresh")}
            className={secondaryButtonClass}
            disabled={isRefreshing}
            onClick={() => void loadCatalog(true)}
            type="button"
          >
            <RefreshCw aria-hidden="true" className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("institutionalCatalog.actions.refresh")}
          </button>
          <button className={secondaryButtonClass} onClick={() => openCreate("institution")} type="button">
            <Plus aria-hidden="true" className="size-4" />
            {t("institutionalCatalog.actions.newInstitution")}
          </button>
          <button
            className={primaryButtonClass}
            disabled={activeInstitutions.length === 0}
            onClick={() => openCreate("laboratory")}
            title={activeInstitutions.length === 0 ? t("institutionalCatalog.noActiveInstitution") : undefined}
            type="button"
          >
            <Plus aria-hidden="true" className="size-4" />
            {t("institutionalCatalog.actions.newLaboratory")}
          </button>
        </div>
      </div>

      {institutions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Building2 aria-hidden="true" className="mx-auto size-10 text-slate-400" />
          <h3 className="mt-4 font-semibold text-slate-900">{t("institutionalCatalog.empty.title")}</h3>
          <p className="mt-2 text-sm text-slate-600">{t("institutionalCatalog.empty.description")}</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
          {institutions.map((institution) => (
            <InstitutionCard
              institution={institution}
              key={institution.id}
              laboratories={catalog.snapshot.laboratories
                .filter((laboratory) => laboratory.institution.id === institution.id)
                .sort((left, right) => compareLocalized(left.name, right.name, locale))}
              locale={locale}
              onDeactivate={openDeactivate}
              onRename={openRename}
            />
          ))}
        </div>
      )}

      {dialog.kind !== "closed" && (
        <InstitutionalDialog
          institutions={activeInstitutions}
          onClose={closeDialog}
          onInstitutionChange={(institutionId) => setDialog((current) =>
            current.kind === "form" ? { ...current, institutionId, error: null } : current)}
          onNameChange={(name) => setDialog((current) =>
            current.kind === "form" ? { ...current, name, error: null } : current)}
          onSubmit={() => void submitDialog()}
          state={dialog}
        />
      )}
    </section>
  );
}

function InstitutionCard({ institution, laboratories, locale, onDeactivate, onRename }: InstitutionCardProps) {
  const { t } = useTranslation();
  const target: InstitutionalTarget = { id: institution.id, kind: "institution", name: institution.name };

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-teal-50 text-teal-800">
            <Building2 aria-hidden="true" className="size-5" />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="break-words font-bold text-slate-900">{institution.name}</h3>
              <StatusBadge active={institution.active} />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {t("institutionalCatalog.createdAt", {
                date: formatDate(institution.created_at, { locale, dateStyle: "medium" }),
              })}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <ActionButton label={t("institutionalCatalog.actions.renameInstitution", { name: institution.name })} onClick={() => onRename(target)} />
          {institution.active && (
            <ActionButton danger label={t("institutionalCatalog.actions.deactivateInstitution", { name: institution.name })} onClick={() => onDeactivate(target)} />
          )}
        </div>
      </div>
      <div className="p-5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {t("institutionalCatalog.laboratories", { count: laboratories.length })}
        </h4>
        {laboratories.length === 0 ? (
          <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            {t("institutionalCatalog.emptyLaboratories")}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-200 rounded-xl border border-slate-200">
            {laboratories.map((laboratory) => {
              const laboratoryTarget: InstitutionalTarget = {
                id: laboratory.id,
                kind: "laboratory",
                name: laboratory.name,
                institutionId: institution.id,
              };
              return (
                <li className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={laboratory.id}>
                  <div className="flex min-w-0 items-center gap-3">
                    <FlaskConical aria-hidden="true" className="size-5 shrink-0 text-teal-700" />
                    <span className="break-words text-sm font-medium text-slate-800">{laboratory.name}</span>
                    <StatusBadge active={laboratory.active} />
                  </div>
                  <div className="flex gap-2">
                    <ActionButton label={t("institutionalCatalog.actions.renameLaboratory", { name: laboratory.name })} onClick={() => onRename(laboratoryTarget)} />
                    {laboratory.active && (
                      <ActionButton danger label={t("institutionalCatalog.actions.deactivateLaboratory", { name: laboratory.name })} onClick={() => onDeactivate(laboratoryTarget)} />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </article>
  );
}

function ActionButton({ danger = false, label, onClick }: InstitutionalActionButtonProps) {
  return (
    <button
      aria-label={label}
      className={`inline-flex size-9 items-center justify-center rounded-lg border outline-none transition focus-visible:ring-2 ${danger ? "border-red-200 text-red-700 hover:bg-red-50 focus-visible:ring-red-400" : "border-slate-300 text-slate-600 hover:bg-slate-50 focus-visible:ring-teal-500"}`}
      onClick={onClick}
      title={label}
      type="button"
    >
      {danger ? <X aria-hidden="true" className="size-4" /> : <Pencil aria-hidden="true" className="size-4" />}
    </button>
  );
}

function StatusBadge({ active }: InstitutionalStatusBadgeProps) {
  const { t } = useTranslation();
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-600"}`}>
      {t(active ? "institutionalCatalog.status.active" : "institutionalCatalog.status.inactive")}
    </span>
  );
}

function InstitutionalDialog({ state, institutions, onClose, onInstitutionChange, onNameChange, onSubmit }: InstitutionalDialogProps) {
  const { t } = useTranslation();
  const isForm = state.kind === "form";
  const hasValidName = isForm && state.name.trim().length >= 1 && state.name.trim().length <= 255;
  const hasRequiredInstitution = !isForm || state.resourceKind !== "laboratory" ||
    state.mode !== "create" || institutions.some((institution) => institution.id === state.institutionId);
  const canSubmit = !isForm || (hasValidName && hasRequiredInstitution);
  const title = isForm
    ? t(`institutionalCatalog.dialog.${state.mode}.${state.resourceKind}.title`)
    : t(`institutionalCatalog.dialog.deactivate.${state.target.kind}.title`);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <DialogShell busy={state.isSubmitting} label={title} onClose={onClose} titleId="institutional-dialog-title">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-900" id="institutional-dialog-title">{title}</h2>
          <button aria-label={t("institutionalCatalog.actions.close")} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-500" disabled={state.isSubmitting} onClick={onClose} type="button">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="space-y-4 px-5 py-5">
          {isForm ? (
            <>
              {state.resourceKind === "laboratory" && state.mode === "create" && (
                <label className="block text-sm font-semibold text-slate-800">
                  {t("institutionalCatalog.fields.institution")}
                  <select autoFocus className={fieldClass} disabled={state.isSubmitting} onChange={(event) => onInstitutionChange(event.target.value)} required value={state.institutionId}>
                    <option value="">{t("institutionalCatalog.fields.selectInstitution")}</option>
                    {institutions.map((institution) => <option key={institution.id} value={institution.id}>{institution.name}</option>)}
                  </select>
                </label>
              )}
              <label className="block text-sm font-semibold text-slate-800">
                {t(state.resourceKind === "institution" ? "institutionalCatalog.fields.institutionName" : "institutionalCatalog.fields.laboratoryName")}
                <input autoFocus={state.resourceKind === "institution" || state.mode === "rename"} className={fieldClass} disabled={state.isSubmitting} maxLength={255} minLength={1} onChange={(event) => onNameChange(event.target.value)} placeholder={t("institutionalCatalog.fields.namePlaceholder")} required value={state.name} />
              </label>
            </>
          ) : (
            <p className="text-sm leading-6 text-slate-700">
              {t(`institutionalCatalog.dialog.deactivate.${state.target.kind}.description`, { name: state.target.name })}
            </p>
          )}
          {state.error && <p aria-live="assertive" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
          <button className={secondaryButtonClass} disabled={state.isSubmitting} onClick={onClose} type="button">{t("institutionalCatalog.actions.cancel")}</button>
          <button className={isForm ? primaryButtonClass : dangerButtonClass} disabled={state.isSubmitting || !canSubmit} type="submit">
            {state.isSubmitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            {t(state.isSubmitting ? "institutionalCatalog.actions.saving" : isForm ? "institutionalCatalog.actions.save" : "institutionalCatalog.actions.confirmDeactivate")}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function DialogShell({ label, titleId, busy, onClose, children }: InstitutionalDialogShellProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>("[autofocus], button, input, select")?.focus();

    return () => previousFocus.current?.focus();
  }, []);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape" && !busy) {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), [href], [tabindex]:not([tabindex='-1'])") ?? []);
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <div aria-busy={busy} aria-label={label} aria-labelledby={titleId} aria-modal="true" className="w-full max-w-lg rounded-2xl bg-white shadow-2xl" onKeyDown={handleKeyDown} ref={dialogRef} role="dialog">
        {children}
      </div>
    </div>
  );
}

function CatalogMessage({ busy, message }: InstitutionalCatalogMessageProps) {
  return (
    <section aria-busy={busy} aria-live="polite" className="flex flex-1 items-center justify-center gap-3 py-16 text-sm text-slate-600">
      <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />
      {message}
    </section>
  );
}

function getMutationRequest(state: Exclude<InstitutionalDialogState, { kind: "closed" }>) {
  if (state.kind === "deactivate") {
    return {
      method: "DELETE" as const,
      path: `/api/institucional/${state.target.kind === "institution" ? "instituicoes" : "laboratorios"}/${state.target.id}`,
    };
  }
  const collection = state.resourceKind === "institution" ? "instituicoes" : "laboratorios";
  return {
    method: state.mode === "create" ? "POST" as const : "PATCH" as const,
    path: state.mode === "create" ? `/api/institucional/${collection}` : `/api/institucional/${collection}/${state.target?.id}`,
    body: state.resourceKind === "laboratory" && state.mode === "create"
      ? { name: state.name.trim(), institution_id: state.institutionId }
      : { name: state.name.trim() },
  };
}

function successKey(state: Exclude<InstitutionalDialogState, { kind: "closed" }>) {
  if (state.kind === "deactivate") return `institutionalCatalog.success.deactivate.${state.target.kind}`;
  return `institutionalCatalog.success.${state.mode}.${state.resourceKind}`;
}

function isInstitutionalCatalogSnapshot(value: unknown): value is InstitutionalCatalogSnapshot {
  if (!value || typeof value !== "object") return false;
  const record = value as ApiRecord;
  return Array.isArray(record.institutions) && record.institutions.every(isInstitution) &&
    Array.isArray(record.laboratories) && record.laboratories.every(isLaboratory);
}

function isInstitution(value: unknown): value is Institution {
  if (!value || typeof value !== "object") return false;
  const record = value as ApiRecord;
  return typeof record.id === "string" && typeof record.name === "string" &&
    typeof record.active === "boolean" && typeof record.created_at === "string";
}

function isLaboratory(value: unknown): value is Laboratory {
  if (!value || typeof value !== "object") return false;
  const record = value as ApiRecord;
  return isInstitution(value) && isInstitutionRef(record.institution);
}

function isInstitutionRef(value: unknown) {
  if (!value || typeof value !== "object") return false;
  const record = value as ApiRecord;
  return typeof record.id === "string" && typeof record.name === "string" &&
    typeof record.active === "boolean";
}

const primaryButtonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50";
const secondaryButtonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50";
const dangerButtonClass = "inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white outline-none transition hover:bg-red-800 focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50";
const fieldClass = "mt-2 block min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-500/30 disabled:bg-slate-100";
