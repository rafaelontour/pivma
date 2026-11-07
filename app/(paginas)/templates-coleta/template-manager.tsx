"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowDown, ArrowUp, Download, LoaderCircle, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getLocalizedApiError } from "@/i18n/errors";
import type { CollectionTemplate, CollectionTemplateColumn, CollectionTemplateColumnType, CollectionTemplateSummary } from "@/types/TemplateColeta";
import type { CollectionTemplateInput, CollectionTemplateColumnInput, CollectionTemplateMinimumFieldsProps } from "@/types/TemplateColeta";
import type { CollectionTemplateColumnEditState } from "@/types/TemplateColeta";
import type { ApiRecord } from "@/types/Servico";

export function CollectionTemplateManager() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<CollectionTemplateSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CollectionTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [minExperiments, setMinExperiments] = useState("1");
  const [minReplicates, setMinReplicates] = useState("1");
  const [columnKey, setColumnKey] = useState("");
  const [columnLabel, setColumnLabel] = useState("");
  const [columnType, setColumnType] = useState<CollectionTemplateColumnType>("text");
  const [columnRequired, setColumnRequired] = useState(false);
  const [columnOptions, setColumnOptions] = useState("");
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [columnEdit, setColumnEdit] = useState<CollectionTemplateColumnEditState>({ key: "", label: "", type: "text", required: false, options: "" });
  const visibleTemplates = templates.filter((template) => `${template.name} ${template.description ?? ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  const refresh = useCallback(async (templateId?: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/collection-templates", { cache: "no-store" });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok || !Array.isArray(payload)) throw new Error(getLocalizedApiError(payload, t("collectionTemplates.errors.load"), t));
      setTemplates(payload as CollectionTemplateSummary[]);
      const id = templateId ?? selected?.id;
      if (id) {
        const detailResponse = await fetch(`/api/collection-templates/${id}`, { cache: "no-store" });
        const detail = await detailResponse.json().catch(() => null) as unknown;
        if (!detailResponse.ok || !isTemplate(detail)) throw new Error(getLocalizedApiError(detail, t("collectionTemplates.errors.load"), t));
        setSelected(detail);
        setName(detail.name);
        setDescription(detail.description ?? "");
        setMinExperiments(String(detail.min_experiments));
        setMinReplicates(String(detail.min_replicates));
      } else setSelected(null);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t("collectionTemplates.errors.connection");
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [selected, t]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  async function createTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const input: CollectionTemplateInput = { name: name.trim(), description: description.trim() || null, min_experiments: Number(minExperiments), min_replicates: Number(minReplicates) };
      const response = await fetch("/api/collection-templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok || !isTemplate(payload)) { toast.error(getLocalizedApiError(payload, t("collectionTemplates.errors.save"), t)); return; }
      toast.success(t("collectionTemplates.success.created"));
      setName(""); setDescription(""); setMinExperiments("1"); setMinReplicates("1");
      await refresh(payload.id);
    } catch { toast.error(t("collectionTemplates.errors.connection")); }
    finally { setBusy(false); }
  }

  async function saveTemplate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy || selected.locked) return;
    setBusy(true);
    try {
      const input: CollectionTemplateInput = { name: name.trim(), description: description.trim() || null, min_experiments: Number(minExperiments), min_replicates: Number(minReplicates) };
      const response = await fetch(`/api/collection-templates/${selected.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok || !isTemplate(payload)) { toast.error(getLocalizedApiError(payload, t("collectionTemplates.errors.save"), t)); return; }
      toast.success(t("collectionTemplates.success.saved"));
      await refresh(selected.id);
    } catch { toast.error(t("collectionTemplates.errors.connection")); }
    finally { setBusy(false); }
  }

  async function addColumn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected || busy || selected.locked) return;
    const options = columnType === "select" ? columnOptions.split("\n").map((item) => item.trim()).filter(Boolean) : null;
    const input: CollectionTemplateColumnInput = { key: columnKey.trim(), label: columnLabel.trim(), type: columnType, required: columnRequired, options, position: selected.columns.length + 1 };
    setBusy(true);
    try {
      const response = await fetch(`/api/collection-templates/${selected.id}/columns`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("collectionTemplates.errors.column"), t)); return; }
      setColumnKey(""); setColumnLabel(""); setColumnOptions(""); setColumnRequired(false); setColumnType("text");
      toast.success(t("collectionTemplates.success.columnAdded"));
      await refresh(selected.id);
    } catch { toast.error(t("collectionTemplates.errors.connection")); }
    finally { setBusy(false); }
  }

  async function removeColumn(column: CollectionTemplateColumn) {
    if (!selected || busy || selected.locked || !window.confirm(t("collectionTemplates.confirm.removeColumn", { label: column.label }))) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/collection-templates/${selected.id}/columns/${column.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("collectionTemplates.errors.column"), t)); return; }
      toast.success(t("collectionTemplates.success.columnRemoved"));
      await refresh(selected.id);
    } catch { toast.error(t("collectionTemplates.errors.connection")); }
    finally { setBusy(false); }
  }

  function startColumnEdit(column: CollectionTemplateColumn) {
    setEditingColumnId(column.id);
    setColumnEdit({ key: column.key, label: column.label, type: column.type, required: column.required, options: column.options?.join("\n") ?? "" });
  }

  async function saveColumnEdit(event: React.FormEvent<HTMLFormElement>, columnId: string) {
    event.preventDefault();
    if (!selected || busy || selected.locked) return;
    const options = columnEdit.type === "select" ? columnEdit.options.split("\n").map((item) => item.trim()).filter(Boolean) : null;
    setBusy(true);
    try {
      const response = await fetch(`/api/collection-templates/${selected.id}/columns/${columnId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: columnEdit.key.trim(), label: columnEdit.label.trim(), type: columnEdit.type, required: columnEdit.required, options }) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("collectionTemplates.errors.column"), t)); return; }
      setEditingColumnId(null);
      toast.success(t("collectionTemplates.success.columnUpdated"));
      await refresh(selected.id);
    } catch { toast.error(t("collectionTemplates.errors.connection")); }
    finally { setBusy(false); }
  }

  async function moveColumn(column: CollectionTemplateColumn, direction: -1 | 1) {
    if (!selected || busy || selected.locked) return;
    const ordered = [...selected.columns].sort((a, b) => a.position - b.position);
    const index = ordered.findIndex((item) => item.id === column.id);
    const neighbor = ordered[index + direction];
    if (!neighbor) return;
    setBusy(true);
    try {
      const temporaryPosition = Math.max(...ordered.map((item) => item.position), 0) + 1;
      const first = await fetch(`/api/collection-templates/${selected.id}/columns/${column.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: temporaryPosition }) });
      const firstBody = await first.json().catch(() => null) as unknown;
      if (!first.ok) { toast.error(getLocalizedApiError(firstBody, t("collectionTemplates.errors.column"), t)); return; }
      const second = await fetch(`/api/collection-templates/${selected.id}/columns/${neighbor.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: column.position }) });
      const secondBody = await second.json().catch(() => null) as unknown;
      if (!second.ok) { toast.error(getLocalizedApiError(secondBody, t("collectionTemplates.errors.column"), t)); await refresh(selected.id); return; }
      const third = await fetch(`/api/collection-templates/${selected.id}/columns/${column.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ position: neighbor.position }) });
      const thirdBody = await third.json().catch(() => null) as unknown;
      if (!third.ok) { toast.error(getLocalizedApiError(thirdBody, t("collectionTemplates.errors.column"), t)); await refresh(selected.id); return; }
      await refresh(selected.id);
    } catch { toast.error(t("collectionTemplates.errors.connection")); }
    finally { setBusy(false); }
  }

  async function download(format: "csv" | "xlsx") {
    if (!selected) return;
    try {
      const response = await fetch(`/api/collection-templates/${selected.id}/file?format=${format}`, { cache: "no-store" });
      if (!response.ok) { const payload = await response.json().catch(() => null) as unknown; toast.error(getLocalizedApiError(payload, t("collectionTemplates.errors.download"), t)); return; }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${selected.name.replace(/[^a-z0-9-_]+/gi, "-")}.${format}`; anchor.click(); URL.revokeObjectURL(url);
    } catch { toast.error(t("collectionTemplates.errors.connection")); }
  }

  return <div className="grid gap-6 py-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-3xl text-sm leading-6 text-slate-600">{t("collectionTemplates.description")}</p><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw className="size-4" aria-hidden="true" />{t("collectionTemplates.actions.refresh")}</button></div>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">{error}<button className="ml-3 underline" onClick={() => void refresh()} type="button">{t("common.retry")}</button></div>}
    {loading && <p className="flex items-center gap-2 text-sm text-slate-600" aria-live="polite"><LoaderCircle className="size-4 animate-spin" aria-hidden="true" />{t("collectionTemplates.loading")}</p>}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(17rem,0.7fr)_minmax(0,1.3fr)]">
      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="collection-template-list-title"><h2 className="text-lg font-bold" id="collection-template-list-title">{t("collectionTemplates.catalog")}</h2>
        <label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.search")}<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3" /></label>
        {visibleTemplates.length === 0 && !loading ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{templates.length > 0 && search.trim() ? t("collectionTemplates.noMatches") : t("collectionTemplates.empty")}</p> : <ul className="grid gap-2">{visibleTemplates.map((template) => <li key={template.id}><button type="button" onClick={() => void refresh(template.id)} className={`w-full rounded-lg border p-3 text-left ${selected?.id === template.id ? "border-teal-500 bg-teal-50" : "border-slate-200 hover:bg-slate-50"}`}><span className="block font-semibold text-slate-900">{template.name}</span><span className="mt-1 block text-xs text-slate-600">{t("collectionTemplates.minimums", { experiments: template.min_experiments, replicates: template.min_replicates })}{template.locked ? ` · ${t("collectionTemplates.locked")}` : ""}</span></button></li>)}</ul>}
        <form className="mt-2 grid gap-3 border-t border-slate-200 pt-4" onSubmit={(event) => void createTemplate(event)}><h3 className="font-semibold text-slate-900">{t("collectionTemplates.actions.create")}</h3><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.name")}<input required maxLength={255} value={name} onChange={(event) => setName(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3" /></label><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.description")}<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className="rounded-lg border border-slate-300 p-3" /></label><MinimumFields minExperiments={minExperiments} minReplicates={minReplicates} setMinExperiments={setMinExperiments} setMinReplicates={setMinReplicates} /><button disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white disabled:opacity-50"><Plus className="size-4" aria-hidden="true" />{t("collectionTemplates.actions.create")}</button></form>
      </section>
      <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="collection-template-detail-title"><h2 className="text-lg font-bold" id="collection-template-detail-title">{selected?.name ?? t("collectionTemplates.select")}</h2>
        {selected && <>
          {selected.locked && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" role="status">{t("collectionTemplates.lockedDescription")}</p>}
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void saveTemplate(event)}><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.name")}<input required maxLength={255} disabled={selected.locked || busy} value={name} onChange={(event) => setName(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:bg-slate-100" /></label><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.description")}<input disabled={selected.locked || busy} value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:bg-slate-100" /></label><MinimumFields minExperiments={minExperiments} minReplicates={minReplicates} setMinExperiments={setMinExperiments} setMinReplicates={setMinReplicates} disabled={selected.locked || busy} /><button disabled={selected.locked || busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white disabled:opacity-50"><Save className="size-4" aria-hidden="true" />{t("collectionTemplates.actions.save")}</button></form>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={() => void download("csv")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold"><Download className="size-4" aria-hidden="true" />CSV</button><button type="button" onClick={() => void download("xlsx")} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold"><Download className="size-4" aria-hidden="true" />XLSX</button></div>
          <section className="grid gap-3 border-t border-slate-200 pt-4" aria-labelledby="collection-columns-title"><h3 id="collection-columns-title" className="font-bold">{t("collectionTemplates.columns")}</h3>{selected.columns.length === 0 ? <p className="text-sm text-slate-600">{t("collectionTemplates.noColumns")}</p> : <ul className="grid gap-2">{[...selected.columns].sort((a, b) => a.position - b.position).map((column, index, items) => <li key={column.id} className="grid gap-3 rounded-lg border border-slate-200 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="font-semibold">{column.label}<span className="ml-2 font-mono text-xs text-slate-500">{column.key}</span></p><p className="text-xs text-slate-600">{t(`collectionTemplates.columnTypes.${column.type}`)}{column.required ? ` · ${t("collectionTemplates.required")}` : ""}</p></div><div className="flex gap-1"><button aria-label={t("collectionTemplates.actions.moveUp", { label: column.label })} disabled={busy || selected.locked || index === 0} onClick={() => void moveColumn(column, -1)} type="button" className="rounded border p-2 disabled:opacity-40"><ArrowUp className="size-4" aria-hidden="true" /></button><button aria-label={t("collectionTemplates.actions.moveDown", { label: column.label })} disabled={busy || selected.locked || index === items.length - 1} onClick={() => void moveColumn(column, 1)} type="button" className="rounded border p-2 disabled:opacity-40"><ArrowDown className="size-4" aria-hidden="true" /></button><button type="button" disabled={busy || selected.locked} onClick={() => editingColumnId === column.id ? setEditingColumnId(null) : startColumnEdit(column)} className="min-h-9 rounded border border-slate-300 px-3 text-xs font-semibold disabled:opacity-40">{t(editingColumnId === column.id ? "collectionTemplates.actions.cancelColumnEdit" : "collectionTemplates.actions.editColumn")}</button><button aria-label={t("collectionTemplates.actions.remove", { label: column.label })} disabled={busy || selected.locked} onClick={() => void removeColumn(column)} type="button" className="rounded border border-rose-200 p-2 text-rose-700 disabled:opacity-40"><Trash2 className="size-4" aria-hidden="true" /></button></div></div>{editingColumnId === column.id && <form onSubmit={(event) => void saveColumnEdit(event, column.id)} className="grid gap-3 border-t pt-3 sm:grid-cols-2"><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.columnKey")}<input required pattern="[a-z][a-z0-9_]{0,63}" disabled={busy} value={columnEdit.key} onChange={(event) => setColumnEdit({ ...columnEdit, key: event.target.value })} className="min-h-10 rounded-lg border border-slate-300 px-3 font-mono" /></label><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.columnLabel")}<input required maxLength={255} disabled={busy} value={columnEdit.label} onChange={(event) => setColumnEdit({ ...columnEdit, label: event.target.value })} className="min-h-10 rounded-lg border border-slate-300 px-3" /></label><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.columnType")}<select disabled={busy} value={columnEdit.type} onChange={(event) => setColumnEdit({ ...columnEdit, type: event.target.value as CollectionTemplateColumnEditState["type"] })} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3">{(["text", "integer", "decimal", "date", "select"] as CollectionTemplateColumnEditState["type"][]).map((item) => <option key={item} value={item}>{t(`collectionTemplates.columnTypes.${item}`)}</option>)}</select></label><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={columnEdit.required} disabled={busy} onChange={(event) => setColumnEdit({ ...columnEdit, required: event.target.checked })} />{t("collectionTemplates.required")}</label>{columnEdit.type === "select" && <label className="grid gap-1 text-sm font-medium sm:col-span-2">{t("collectionTemplates.fields.options")}<textarea required rows={3} disabled={busy} value={columnEdit.options} onChange={(event) => setColumnEdit({ ...columnEdit, options: event.target.value })} className="rounded-lg border border-slate-300 p-3" /></label>}<button disabled={busy} className="min-h-10 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white sm:col-span-2">{t("collectionTemplates.actions.saveColumn")}</button></form>}</li>)}</ul>}
            <form className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-2" onSubmit={(event) => void addColumn(event)}><h4 className="font-semibold sm:col-span-2">{t("collectionTemplates.actions.addColumn")}</h4><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.columnKey")}<input required pattern="[a-z][a-z0-9_]{0,63}" disabled={busy || selected.locked} value={columnKey} onChange={(event) => setColumnKey(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 font-mono" /></label><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.columnLabel")}<input required maxLength={255} disabled={busy || selected.locked} value={columnLabel} onChange={(event) => setColumnLabel(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3" /></label><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.columnType")}<select disabled={busy || selected.locked} value={columnType} onChange={(event) => setColumnType(event.target.value as CollectionTemplateColumnType)} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3">{(["text", "integer", "decimal", "date", "select"] as CollectionTemplateColumnType[]).map((item) => <option key={item} value={item}>{t(`collectionTemplates.columnTypes.${item}`)}</option>)}</select></label><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={columnRequired} disabled={busy || selected.locked} onChange={(event) => setColumnRequired(event.target.checked)} />{t("collectionTemplates.required")}</label>{columnType === "select" && <label className="grid gap-1 text-sm font-medium sm:col-span-2">{t("collectionTemplates.fields.options")}<textarea required value={columnOptions} disabled={busy || selected.locked} onChange={(event) => setColumnOptions(event.target.value)} rows={3} className="rounded-lg border border-slate-300 p-3" /></label>}<button disabled={busy || selected.locked} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2"><Plus className="size-4" aria-hidden="true" />{t("collectionTemplates.actions.addColumn")}</button></form>
          </section>
        </>}
      </section>
    </div>
  </div>;
}

function MinimumFields({ minExperiments, minReplicates, setMinExperiments, setMinReplicates, disabled }: CollectionTemplateMinimumFieldsProps) {
  const { t } = useTranslation();
  return <><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.minExperiments")}<input type="number" min="1" required value={minExperiments} disabled={disabled} onChange={(event) => setMinExperiments(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:bg-slate-100" /></label><label className="grid gap-1 text-sm font-medium">{t("collectionTemplates.fields.minReplicates")}<input type="number" min="1" required value={minReplicates} disabled={disabled} onChange={(event) => setMinReplicates(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 disabled:bg-slate-100" /></label></>;
}

function isTemplate(value: unknown): value is CollectionTemplate {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value) && typeof (value as ApiRecord).id === "string" && typeof (value as ApiRecord).name === "string" && Array.isArray((value as ApiRecord).columns);
}
