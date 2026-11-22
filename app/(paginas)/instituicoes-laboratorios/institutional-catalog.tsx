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
  Search,
  UserPlus,
  Check,
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
  LaboratoryMemberDialogProps,
  LaboratoryMemberDialogState,
  InstitutionalCatalogMessageProps,
  InstitutionalStatusBadgeProps,
  InstitutionalTarget,
  Laboratory,
} from "@/types/Institucional";
import type { ApiRecord } from "@/types/Servico";
import type { UserList } from "@/types/Usuario";

export function InstitutionalCatalog({ initialSnapshot }: InstitutionalCatalogProps) {
  const { i18n, t } = useTranslation();
  const locale = normalizeLocale(i18n.resolvedLanguage) ?? "pt-BR";
  const [catalog, setCatalog] = useState<InstitutionalCatalogState>(
    initialSnapshot
      ? { kind: "ready", snapshot: initialSnapshot }
      : { kind: "loading" },
  );
  const [dialog, setDialog] = useState<InstitutionalDialogState>({ kind: "closed" });
  const [memberDialog, setMemberDialog] = useState<LaboratoryMemberDialogState>({ kind: "closed" });
  const [canManageAffiliations, setCanManageAffiliations] = useState(false);
  const [canManageCatalog, setCanManageCatalog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json().catch(() => null) : null)
      .then((payload) => {
        const permissions = getPermissionList(payload);
        setCanManageCatalog(permissions.includes("institutional.catalogs.manage"));
        setCanManageAffiliations([
          "institutional.affiliations.manage",
          "users.read",
          "institutional.read",
        ].every((permission) => permissions.includes(permission)));
      })
      .catch(() => setCanManageAffiliations(false));
    return () => controller.abort();
  }, []);

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

  function openAddPerson(laboratory: Laboratory) {
    setMemberDialog({
      kind: "open",
      laboratory,
      search: "",
      users: [],
      selectedUserId: "",
      error: null,
      hasSearched: false,
      isSearching: false,
      isSubmitting: false,
    });
  }

  async function searchPeople() {
    if (memberDialog.kind !== "open" || memberDialog.isSearching || memberDialog.isSubmitting) return;
    const current = memberDialog;
    if (current.search.trim().length < 2) {
      setMemberDialog({ ...current, users: [], selectedUserId: "", error: t("institutionalCatalog.members.searchRequired"), hasSearched: false });
      return;
    }
    setMemberDialog({ ...current, error: null, hasSearched: false, isSearching: true, users: [], selectedUserId: "" });
    try {
      const params = new URLSearchParams({ name: current.search.trim() });
      const response = await fetch(`/api/institucional/laboratorios/${current.laboratory.id}/membros?${params}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isUserList(payload)) {
        setMemberDialog({ ...current, error: getLocalizedApiError(payload, t("institutionalCatalog.members.searchFailed"), t), hasSearched: false, isSearching: false });
        return;
      }
      setMemberDialog({
        ...current,
        users: payload.items.filter((user) => user.active),
        error: null,
        hasSearched: true,
        isSearching: false,
      });
    } catch {
      setMemberDialog({ ...current, error: t("institutionalCatalog.members.connectionFailed"), hasSearched: false, isSearching: false });
    }
  }

  async function addPersonToLaboratory() {
    if (memberDialog.kind !== "open" || memberDialog.isSubmitting) return;
    const current = memberDialog;
    if (!current.users.some((user) => user.id === current.selectedUserId)) {
      setMemberDialog({ ...current, error: t("institutionalCatalog.members.selectPerson") });
      return;
    }
    setMemberDialog({ ...current, error: null, isSubmitting: true });
    try {
      const response = await fetch(`/api/institucional/laboratorios/${current.laboratory.id}/membros`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: current.selectedUserId }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const fallback = response.status === 409
          ? t("institutionalCatalog.members.duplicate")
          : t("institutionalCatalog.members.addFailed");
        setMemberDialog({ ...current, error: getLocalizedApiError(payload, fallback, t), isSubmitting: false });
        return;
      }
      const selectedPerson = current.users.find((user) => user.id === current.selectedUserId);
      setMemberDialog({ kind: "closed" });
      toast.success(t("institutionalCatalog.members.added", { person: selectedPerson?.full_name || selectedPerson?.username }));
    } catch {
      setMemberDialog({ ...current, error: t("institutionalCatalog.members.connectionFailed"), isSubmitting: false });
    }
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
          {canManageCatalog && (
            <>
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
            </>
          )}
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
              canManageCatalog={canManageCatalog}
              canManageAffiliations={canManageAffiliations}
              onAddPerson={openAddPerson}
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
      {memberDialog.kind === "open" && (
        <LaboratoryMemberDialog
          onClose={() => setMemberDialog((current) => current.kind === "open" && (current.isSearching || current.isSubmitting) ? current : { kind: "closed" })}
          onSearch={() => void searchPeople()}
          onSearchChange={(search) => setMemberDialog((current) => current.kind === "open" ? { ...current, search, users: [], selectedUserId: "", error: null, hasSearched: false } : current)}
          onSelectUser={(selectedUserId) => setMemberDialog((current) => current.kind === "open" ? { ...current, selectedUserId, error: null } : current)}
          onSubmit={() => void addPersonToLaboratory()}
          state={memberDialog}
        />
      )}
    </section>
  );
}

function InstitutionCard({ institution, laboratories, locale, canManageCatalog, canManageAffiliations, onAddPerson, onDeactivate, onRename }: InstitutionCardProps) {
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
        {canManageCatalog && (
          <div className="flex gap-2">
            <ActionButton label={t("institutionalCatalog.actions.renameInstitution", { name: institution.name })} onClick={() => onRename(target)} />
            {institution.active && (
              <ActionButton danger label={t("institutionalCatalog.actions.deactivateInstitution", { name: institution.name })} onClick={() => onDeactivate(target)} />
            )}
          </div>
        )}
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
                    {canManageAffiliations && laboratory.active && institution.active && (
                      <button
                        className={secondaryButtonClass}
                        onClick={() => onAddPerson(laboratory)}
                        type="button"
                      >
                        <Plus aria-hidden="true" className="size-4" />
                        {t("institutionalCatalog.members.addAction")}
                      </button>
                    )}
                    {canManageCatalog && (
                      <>
                        <ActionButton label={t("institutionalCatalog.actions.renameLaboratory", { name: laboratory.name })} onClick={() => onRename(laboratoryTarget)} />
                        {laboratory.active && (
                          <ActionButton danger label={t("institutionalCatalog.actions.deactivateLaboratory", { name: laboratory.name })} onClick={() => onDeactivate(laboratoryTarget)} />
                        )}
                      </>
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

function LaboratoryMemberDialog({ state, onClose, onSearchChange, onSelectUser, onSearch, onSubmit }: LaboratoryMemberDialogProps) {
  const { t } = useTranslation();
  const title = t("institutionalCatalog.members.dialogTitle", { laboratory: state.laboratory.name });

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <DialogShell busy={state.isSearching || state.isSubmitting} label={title} onClose={onClose} titleId="laboratory-member-dialog-title" wide>
      <div className="flex items-start justify-between gap-5 rounded-t-2xl border-b border-teal-100 bg-gradient-to-br from-teal-50 via-white to-cyan-50 px-6 py-5">
        <div className="flex min-w-0 items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-teal-700 text-white shadow-sm">
            <UserPlus aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">{t("institutionalCatalog.members.eyebrow")}</p>
            <h2 className="mt-1 break-words text-xl font-bold text-slate-950" id="laboratory-member-dialog-title">{title}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">{t("institutionalCatalog.members.description")}</p>
          </div>
        </div>
        <button aria-label={t("institutionalCatalog.actions.close")} className="shrink-0 rounded-xl border border-slate-200 bg-white p-2 text-slate-500 shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500" disabled={state.isSearching || state.isSubmitting} onClick={onClose} type="button">
          <X aria-hidden="true" className="size-5" />
        </button>
      </div>
      <form onSubmit={handleSearch}>
        <div className="px-6 pt-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="block text-sm font-bold text-slate-800" htmlFor="laboratory-member-search">{t("institutionalCatalog.members.searchLabel")}</label>
            <p className="mt-1 text-xs leading-5 text-slate-500">{t("institutionalCatalog.members.searchHint")}</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-slate-400" />
                <input autoFocus className="block min-h-12 w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-4 focus:ring-teal-500/15 disabled:bg-slate-100" disabled={state.isSearching || state.isSubmitting} id="laboratory-member-search" maxLength={255} minLength={2} onChange={(event) => onSearchChange(event.target.value)} placeholder={t("institutionalCatalog.members.searchPlaceholder")} required value={state.search} />
              </div>
              <button aria-label={t("institutionalCatalog.members.searchAction")} className={`${primaryButtonClass} min-h-12 rounded-xl px-5`} disabled={state.isSearching || state.isSubmitting || state.search.trim().length < 2} type="submit">
                {state.isSearching ? <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> : <Search aria-hidden="true" className="size-4" />}
                {t(state.isSearching ? "institutionalCatalog.members.searching" : "institutionalCatalog.members.searchAction")}
              </button>
            </div>
          </div>
        </div>
      </form>
      <form onSubmit={handleSubmit}>
        <div className="min-h-52 space-y-3 px-6 py-5">
          {state.isSearching ? (
            <div aria-live="polite" className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-center">
              <div>
                <LoaderCircle aria-hidden="true" className="mx-auto size-7 animate-spin text-teal-700" />
                <p className="mt-3 text-sm font-semibold text-slate-700">{t("institutionalCatalog.members.searching")}</p>
              </div>
            </div>
          ) : state.users.length > 0 ? (
            <fieldset>
              <legend className="mb-3 flex w-full items-center justify-between gap-3 text-sm font-bold text-slate-800">
                <span>{t("institutionalCatalog.members.results")}</span>
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-800">{t("institutionalCatalog.members.resultCount", { count: state.users.length })}</span>
              </legend>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {state.users.map((user) => (
                <label className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition ${state.selectedUserId === user.id ? "border-teal-600 bg-teal-50 shadow-sm ring-1 ring-teal-600" : "border-slate-200 bg-white hover:border-teal-300 hover:bg-slate-50"}`} key={user.id}>
                  <input checked={state.selectedUserId === user.id} className="sr-only" disabled={state.isSubmitting} name="laboratory-member" onChange={() => onSelectUser(user.id)} type="radio" value={user.id} />
                  <span className={`grid size-10 shrink-0 place-items-center rounded-full text-sm font-bold ${state.selectedUserId === user.id ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-800"}`}>{(user.full_name || "?").trim().charAt(0).toLocaleUpperCase()}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-bold text-slate-950">{user.full_name}</span>
                    <span className="mt-0.5 block break-all text-xs text-slate-500">{user.email}</span>
                  </span>
                  <span className={`grid size-6 shrink-0 place-items-center rounded-full border ${state.selectedUserId === user.id ? "border-teal-700 bg-teal-700 text-white" : "border-slate-300 bg-white text-transparent"}`}><Check aria-hidden="true" className="size-4" /></span>
                </label>
              ))}
              </div>
            </fieldset>
          ) : state.hasSearched && !state.error ? (
            <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 text-center">
              <div>
                <Search aria-hidden="true" className="mx-auto size-7 text-slate-400" />
                <p className="mt-3 text-sm font-bold text-slate-800">{t("institutionalCatalog.members.noResultsTitle")}</p>
                <p className="mt-1 text-sm text-slate-500">{t("institutionalCatalog.members.noResults", { name: state.search.trim() })}</p>
              </div>
            </div>
          ) : !state.error ? (
            <div className="grid min-h-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/70 px-6 text-center">
              <div>
                <UserPlus aria-hidden="true" className="mx-auto size-7 text-teal-700" />
                <p className="mt-3 text-sm font-bold text-slate-800">{t("institutionalCatalog.members.initialTitle")}</p>
                <p className="mt-1 text-sm text-slate-500">{t("institutionalCatalog.members.initialDescription")}</p>
              </div>
            </div>
          ) : null}
          {state.error && <p aria-live="assertive" className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">{state.error}</p>}
        </div>
        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button className={secondaryButtonClass} disabled={state.isSearching || state.isSubmitting} onClick={onClose} type="button">{t("institutionalCatalog.actions.cancel")}</button>
          <button className={primaryButtonClass} disabled={state.isSubmitting || state.isSearching || !state.selectedUserId} type="submit">
            {state.isSubmitting && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            {t(state.isSubmitting ? "institutionalCatalog.members.adding" : "institutionalCatalog.members.addAction")}
          </button>
        </div>
      </form>
    </DialogShell>
  );
}

function DialogShell({ label, titleId, busy, wide = false, onClose, children }: InstitutionalDialogShellProps) {
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
      <div aria-busy={busy} aria-label={label} aria-labelledby={titleId} aria-modal="true" className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} overflow-hidden rounded-2xl bg-white shadow-2xl`} onKeyDown={handleKeyDown} ref={dialogRef} role="dialog">
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

function getPermissionList(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const record = value as ApiRecord;
  return Array.isArray(record.permissions) && record.permissions.every((permission) => typeof permission === "string")
    ? record.permissions
    : [];
}

function isUserList(value: unknown): value is UserList {
  if (!value || typeof value !== "object") return false;
  const record = value as ApiRecord;
  return typeof record.offset === "number" && typeof record.limit === "number" && Array.isArray(record.items) &&
    record.items.every((item) => {
      if (!item || typeof item !== "object") return false;
      const user = item as ApiRecord;
      return typeof user.id === "string" && typeof user.username === "string" && typeof user.email === "string" &&
        (user.full_name === null || typeof user.full_name === "string") && typeof user.active === "boolean" && Array.isArray(user.profiles);
    });
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
