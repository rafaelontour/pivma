"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, RefreshCw, Save, Trash2, Upload, Check } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { getLocalizedApiError } from "@/i18n/errors";
import type { ApiRecord } from "@/types/Servico";
import type { ProcessOperationsFieldProps, ProcessSamplesWorkspaceProps, SampleReceiptInput, StructureApprovalDecisionInput } from "@/types/ProcessOperations";

export function ProcessSamplesWorkspace({ processId }: ProcessSamplesWorkspaceProps) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [samples, setSamples] = useState<ApiRecord[]>([]);
  const [permissions, setPermissions] = useState<ApiRecord>({});
  const [structure, setStructure] = useState<ApiRecord | null>(null);
  const [reopenedPoints, setReopenedPoints] = useState<ApiRecord[]>([]);
  const [vials, setVials] = useState<ApiRecord[]>([]);
  const [labels, setLabels] = useState<ApiRecord[]>([]);
  const [labelPage, setLabelPage] = useState(1);
  const [labelHasNext, setLabelHasNext] = useState(false);
  const [nonconformities, setNonconformities] = useState<ApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [editingSampleId, setEditingSampleId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [sampleState, setSampleState] = useState({ chemical_name: "", cas_number: "", lot: "", safe_handling_instructions: "", reference_classification: "", purity: "", solubility: "", ghs_hazard_pictograms: [] as string[], storage_temperature_regime: "ambient", storage_temperature_min: "", storage_temperature_max: "", vial_nominal_quantity: "", vial_unit: "", packaging_type: "", expiration_date: "", reserve_vials_count: "0" });
  const [receiptCode, setReceiptCode] = useState("");
  const [receiptState, setReceiptState] = useState({ opened_at: "", temperature_celsius: "", package_state: "intact" as SampleReceiptInput["package_state"], notes: "" });
  const [receiptCheck, setReceiptCheck] = useState<ApiRecord | null>(null);
  const [receiptPhoto, setReceiptPhoto] = useState<File | null>(null);
  const [decision, setDecision] = useState({ outcome: "APPROVED" as StructureApprovalDecisionInput["outcome"], justification: "", activity_key: "", rejected_reason: "" });
  const [nonconformityDecision, setNonconformityDecision] = useState({ decision: "accept_with_caveat", justification: "", lab_guidance: "" });
  const [control, setControl] = useState({ phase_key: "", activity_key: "", laboratory_id: "", reason: "" });
  const [lookupCas, setLookupCas] = useState("");
  const [lookupResult, setLookupResult] = useState<ApiRecord | null>(null);

  const loadInternal = useCallback(async (path: string, key: "samples" | "structure" | "vials" | "nonconformities" | "labels") => {
    try {
      const response = await fetch(path, { cache: "no-store" });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) return getLocalizedApiError(payload, t(`processOperations.errors.${key}`), t);
      const record = isRecord(payload) ? payload : null;
      if (key === "samples") {
        setSamples(record && Array.isArray(record.substances) ? record.substances.filter(isRecord) : []);
        setPermissions(record && isRecord(record.permissions) ? record.permissions : {});
      }
      if (key === "structure") setStructure(record);
      if (key === "vials") setVials(record && Array.isArray(record.data) ? record.data.filter(isRecord) : []);
      if (key === "nonconformities") setNonconformities(record && Array.isArray(record.data) ? record.data.filter(isRecord) : []);
      if (key === "labels") { setLabels(record && Array.isArray(record.data) ? record.data.filter(isRecord) : []); setLabelHasNext(Boolean(record && isRecord(record.pagination) && record.pagination.has_next)); }
      return null;
    } catch { return t("processOperations.errors.connection"); }
  }, [t]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setErrors([]);
    const results = await Promise.all([
      loadInternal(`/api/processes/${processId}/samples`, "samples"),
      loadInternal(`/api/processes/${processId}/structure-approval`, "structure"),
      loadInternal(`/api/processes/${processId}/sample-receipt/vials`, "vials"),
      loadInternal(`/api/processes/${processId}/sample-receipt/nonconformities?status=open`, "nonconformities"),
      loadInternal(`/api/processes/${processId}/samples/labels?page=${labelPage}&per_page=100`, "labels"),
    ]);
    setErrors(results.flatMap((result) => result ? [result] : []));
    setLoading(false);
  }, [processId, labelPage, loadInternal]);

  useEffect(() => { const timer = window.setTimeout(() => void refresh(), 0); return () => window.clearTimeout(timer); }, [refresh]);

  async function createSample(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const input = {
      chemical_name: sampleState.chemical_name.trim(), cas_number: sampleState.cas_number.trim(), lot: sampleState.lot.trim(),
      safe_handling_instructions: sampleState.safe_handling_instructions.trim(), ...(sampleState.reference_classification.trim() ? { reference_classification: sampleState.reference_classification.trim() } : {}),
      purity: sampleState.purity.trim() || null, solubility: sampleState.solubility.trim() || null, ghs_hazard_pictograms: sampleState.ghs_hazard_pictograms,
      storage_temperature_regime: sampleState.storage_temperature_regime,
      storage_temperature_min: sampleState.storage_temperature_min === "" ? null : Number(sampleState.storage_temperature_min),
      storage_temperature_max: sampleState.storage_temperature_max === "" ? null : Number(sampleState.storage_temperature_max),
      vial_nominal_quantity: sampleState.vial_nominal_quantity === "" ? null : Number(sampleState.vial_nominal_quantity),
      vial_unit: sampleState.vial_unit.trim() || null, packaging_type: sampleState.packaging_type.trim() || null,
      expiration_date: sampleState.expiration_date || null, reserve_vials_count: Number(sampleState.reserve_vials_count),
    };
    try {
      const response = await fetch(editingSampleId ? `/api/processes/${processId}/samples/${editingSampleId}` : `/api/processes/${processId}/samples`, { method: editingSampleId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.saveSample"), t)); return; }
      toast.success(t(editingSampleId ? "processOperations.success.sampleUpdated" : "processOperations.success.sampleCreated"));
      setEditingSampleId(null);
      setSampleState({ chemical_name: "", cas_number: "", lot: "", safe_handling_instructions: "", reference_classification: "", purity: "", solubility: "", ghs_hazard_pictograms: [], storage_temperature_regime: "ambient", storage_temperature_min: "", storage_temperature_max: "", vial_nominal_quantity: "", vial_unit: "", packaging_type: "", expiration_date: "", reserve_vials_count: "0" });
      await refresh();
    } catch { toast.error(t("processOperations.errors.connection")); }
    finally { setBusy(false); }
  }

  function editSample(sample: ApiRecord) {
    if (typeof sample.id !== "string") return;
    setEditingSampleId(sample.id);
    setSampleState({ chemical_name: String(sample.chemical_name ?? ""), cas_number: String(sample.cas_number ?? ""), lot: String(sample.lot ?? ""), safe_handling_instructions: String(sample.safe_handling_instructions ?? ""), reference_classification: String(sample.reference_classification ?? ""), purity: String(sample.purity ?? ""), solubility: String(sample.solubility ?? ""), ghs_hazard_pictograms: Array.isArray(sample.ghs_hazard_pictograms) ? sample.ghs_hazard_pictograms.filter((item): item is string => typeof item === "string") : [], storage_temperature_regime: String(sample.storage_temperature_regime ?? "ambient"), storage_temperature_min: sample.storage_temperature_min == null ? "" : String(sample.storage_temperature_min), storage_temperature_max: sample.storage_temperature_max == null ? "" : String(sample.storage_temperature_max), vial_nominal_quantity: sample.vial_nominal_quantity == null ? "" : String(sample.vial_nominal_quantity), vial_unit: String(sample.vial_unit ?? ""), packaging_type: String(sample.packaging_type ?? ""), expiration_date: String(sample.expiration_date ?? ""), reserve_vials_count: String(sample.reserve_vials_count ?? 0) });
    document.getElementById("samples-title")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteSample(sample: ApiRecord) {
    if (busy || typeof sample.id !== "string" || !window.confirm(t("processOperations.confirm.removeSample", { name: sample.chemical_name }))) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/processes/${processId}/samples/${sample.id}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.deleteSample"), t)); return; }
      await refresh();
    } catch { toast.error(t("processOperations.errors.connection")); }
    finally { setBusy(false); }
  }

  async function uploadSds(sampleId: string, file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    try {
      const form = new FormData(); form.set("file", file);
      const response = await fetch(`/api/processes/${processId}/samples/${sampleId}/sds`, { method: "PUT", body: form });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.sds"), t)); return; }
      toast.success(t("processOperations.success.sds")); await refresh();
    } catch { toast.error(t("processOperations.errors.connection")); }
    finally { setBusy(false); }
  }

  async function downloadSds(sampleId: string) {
    try {
      const response = await fetch(`/api/processes/${processId}/samples/${sampleId}/sds`, { cache: "no-store" });
      if (!response.ok) { const payload = await response.json().catch(() => null) as unknown; toast.error(getLocalizedApiError(payload, t("processOperations.errors.sds"), t)); return; }
      const url = URL.createObjectURL(await response.blob()); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "sds-amostra"; anchor.click(); URL.revokeObjectURL(url);
    } catch { toast.error(t("processOperations.errors.connection")); }
  }

  async function completeSamples() {
    if (busy || !window.confirm(t("processOperations.confirm.completeSamples"))) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/processes/${processId}/samples/complete`, { method: "POST" });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.completeSamples"), t)); return; }
      toast.success(t("processOperations.success.completed")); await refresh();
    } catch { toast.error(t("processOperations.errors.connection")); }
    finally { setBusy(false); }
  }

  async function submitStructureDecision(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy || !structure || !window.confirm(t(decision.outcome === "APPROVED" ? "processOperations.confirm.approveStructure" : "processOperations.confirm.rejectStructure"))) return; setBusy(true);
    const body: StructureApprovalDecisionInput = { outcome: decision.outcome, justification: decision.justification.trim(), ...(decision.outcome === "REJECTED" ? { rejected_points: decision.activity_key ? [{ activity_key: decision.activity_key, reason: decision.rejected_reason.trim() }] : [] } : {}) };
    try {
      const response = await fetch(`/api/processes/${processId}/structure-approval/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.structureDecision"), t)); return; }
      setReopenedPoints(isRecord(payload) && Array.isArray(payload.reopened) ? payload.reopened.filter(isRecord) : []);
      toast.success(t("processOperations.success.structureDecision")); await refresh(); router.refresh();
    } catch { toast.error(t("processOperations.errors.connection")); }
    finally { setBusy(false); }
  }

  async function registerReceipt(event: React.FormEvent<HTMLFormElement> | null, checkOnly: boolean) {
    event?.preventDefault(); if (busy || !receiptCode.trim() || !receiptState.opened_at) return; setBusy(true);
    const body: SampleReceiptInput = { opened_at: new Date(receiptState.opened_at).toISOString(), temperature_celsius: Number(receiptState.temperature_celsius), package_state: receiptState.package_state, notes: receiptState.notes.trim() || null };
    try {
      const suffix = checkOnly ? "/check" : "";
      const response = await fetch(`/api/processes/${processId}/sample-receipt/vials/${encodeURIComponent(receiptCode.trim())}${suffix}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.receipt"), t)); return; }
      if (checkOnly) { setReceiptCheck(isRecord(payload) ? payload : null); toast.success(t("processOperations.success.receiptChecked")); }
      else { setReceiptCheck(null); toast.success(t("processOperations.success.receiptRegistered")); await refresh(); }
    } catch { toast.error(t("processOperations.errors.connection")); }
    finally { setBusy(false); }
  }

  async function uploadReceiptPhoto() {
    if (!receiptCode.trim() || !receiptPhoto || busy) return;
    setBusy(true);
    try {
      const form = new FormData(); form.set("file", receiptPhoto);
      const response = await fetch(`/api/processes/${processId}/sample-receipt/vials/${encodeURIComponent(receiptCode.trim())}/photos`, { method: "POST", body: form });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.photo"), t)); return; }
      setReceiptPhoto(null); toast.success(t("processOperations.success.photo")); await refresh();
    } catch { toast.error(t("processOperations.errors.connection")); }
    finally { setBusy(false); }
  }

  async function decideNonconformity(itemId: string, event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true);
    try {
      const response = await fetch(`/api/processes/${processId}/sample-receipt/nonconformities/${itemId}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...nonconformityDecision, justification: nonconformityDecision.justification.trim(), lab_guidance: nonconformityDecision.lab_guidance.trim() || null }) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.nonconformity"), t)); return; }
      toast.success(t("processOperations.success.nonconformity")); await refresh();
    } catch { toast.error(t("processOperations.errors.connection")); }
    finally { setBusy(false); }
  }

  async function submitLabControl(event: React.FormEvent<HTMLFormElement>, action: "waive" | "reopen") {
    event.preventDefault(); if (busy || !window.confirm(t(action === "waive" ? "processOperations.confirm.waiveLaboratory" : "processOperations.confirm.reopenLaboratory"))) return; setBusy(true);
    const path = action === "waive" ? `/api/processes/${processId}/phases/${encodeURIComponent(control.phase_key)}/laboratory-waivers` : `/api/processes/${processId}/activities/${encodeURIComponent(control.activity_key)}/laboratories/${control.laboratory_id}/reopen`;
    const body = action === "waive" ? { laboratory_id: control.laboratory_id, reason: control.reason.trim() } : { reason: control.reason.trim() };
    try {
      const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.labControl"), t)); return; }
      toast.success(t(action === "waive" ? "processOperations.success.waiver" : "processOperations.success.reopened")); setControl({ ...control, reason: "" }); await refresh(); router.refresh();
    } catch { toast.error(t("processOperations.errors.connection")); }
    finally { setBusy(false); }
  }

  async function lookupSample(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const response = await fetch(`/api/processes/${processId}/samples/lookup?cas=${encodeURIComponent(lookupCas.trim())}`, { cache: "no-store" });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok) { toast.error(getLocalizedApiError(payload, t("processOperations.errors.lookup"), t)); return; }
      setLookupResult(isRecord(payload) ? payload : null);
    } catch { toast.error(t("processOperations.errors.connection")); }
  }

  if (loading && samples.length === 0 && !structure) return <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-slate-600" aria-live="polite"><LoaderCircle className="size-5 animate-spin text-teal-700" aria-hidden="true" />{t("processOperations.loading")}</div>;
  return <div className="grid gap-6 py-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-3xl text-sm leading-6 text-slate-600">{t("processOperations.description")}</p><button type="button" onClick={() => void refresh()} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold"><RefreshCw className="size-4" aria-hidden="true" />{t("processOperations.actions.refresh")}</button></div>
    {errors.length > 0 && <ul className="grid gap-2" aria-live="polite">{errors.map((error, index) => <li key={`${index}-${error}`} role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">{error}</li>)}</ul>}
    <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="samples-title"><div className="flex flex-wrap items-center justify-between gap-3"><h2 id="samples-title" className="text-lg font-bold">{t("processOperations.sections.samples")}</h2></div>
      {samples.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">{t("processOperations.emptySamples")}</p> : <ul className="grid gap-3 md:grid-cols-2">{samples.map((sample) => <li key={String(sample.id)} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-bold">{String(sample.chemical_name ?? "")}</h3><p className="mt-1 text-sm text-slate-600">CAS {String(sample.cas_number ?? "")} · {t("processOperations.fields.lot")}: {String(sample.lot ?? "")}</p><p className="mt-2 text-sm text-slate-700">{String(sample.safe_handling_instructions ?? "")}</p>{typeof sample.reference_classification === "string" && <p className="mt-2 text-xs text-slate-500">{t("processOperations.fields.referenceClassification")}: {sample.reference_classification}</p>}{Array.isArray(sample.blind_codes) && <p className="mt-2 text-xs text-slate-500">{t("processOperations.fields.blindCodes")}: {sample.blind_codes.length}</p>}</div><button type="button" disabled={busy || !permissions.canEditSamples} aria-label={t("processOperations.actions.editSample", { name: String(sample.chemical_name ?? "") })} onClick={() => editSample(sample)} className="rounded-lg border border-slate-300 p-2 text-slate-700 disabled:opacity-50"><Save className="size-4" aria-hidden="true" /></button><button type="button" disabled={busy || !permissions.canEditSamples} aria-label={t("processOperations.actions.removeSample", { name: String(sample.chemical_name ?? "") })} onClick={() => void deleteSample(sample)} className="rounded-lg border border-rose-200 p-2 text-rose-700 disabled:opacity-50"><Trash2 className="size-4" aria-hidden="true" /></button></div><div className="mt-4 flex flex-wrap gap-3"><label className="inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold"><Upload className="size-4" aria-hidden="true" />{t("processOperations.actions.uploadSds")}<input type="file" className="sr-only" accept=".pdf,application/pdf" disabled={busy || !permissions.canEditSamples} onChange={(event) => void uploadSds(String(sample.id), event.target.files?.[0])} /></label>{isRecord(sample.sds) && <button type="button" onClick={() => void downloadSds(String(sample.id))} className="min-h-9 rounded-lg border border-slate-300 px-3 text-sm font-semibold">{t("processOperations.actions.downloadSds")}</button>}</div></li>)}</ul>}
      <section className="grid gap-3 border-t border-slate-200 pt-5" aria-labelledby="sample-labels-title"><h3 id="sample-labels-title" className="font-bold">{t("processOperations.sections.labels")}</h3>{labels.length === 0 ? <p className="text-sm text-slate-600">{t("processOperations.emptyLabels")}</p> : <ul className="grid gap-2 md:grid-cols-2">{labels.map((label, index) => <li key={`${String(label.code ?? "label")}-${index}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 p-3"><div><p className="font-mono font-semibold">{String(label.code ?? "")}</p><p className="text-xs text-slate-600">{String(label.study_code ?? "")} · {String(label.lot ?? "")}{isRecord(label.laboratory) ? ` · ${String(label.laboratory.name ?? "")}` : ""}</p></div><a className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold" href={`/api/processes/${processId}/samples/vials/${encodeURIComponent(String(label.code ?? ""))}/qr.svg`}>{t("processOperations.actions.downloadQr")}</a></li>)}</ul>}<div className="flex items-center gap-3"><button type="button" disabled={labelPage <= 1 || loading} onClick={() => setLabelPage((page) => Math.max(1, page - 1))} className="rounded border px-3 py-2 text-sm disabled:opacity-40">{t("common.previous")}</button><span className="text-sm">{labelPage}</span><button type="button" disabled={!labelHasNext || loading} onClick={() => setLabelPage((page) => page + 1)} className="rounded border px-3 py-2 text-sm disabled:opacity-40">{t("common.next")}</button></div></section>
      <form className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2" onSubmit={(event) => void lookupSample(event)}><h3 className="font-bold sm:col-span-2">{t("processOperations.sections.lookup")}</h3><Field label={t("processOperations.fields.cas")} required value={lookupCas} onChange={setLookupCas} /><button className="min-h-10 rounded-lg border border-teal-700 px-4 text-sm font-bold text-teal-800">{t("processOperations.actions.lookup")}</button>{lookupResult && <pre className="max-h-64 overflow-auto rounded-lg bg-slate-50 p-3 text-xs sm:col-span-2">{JSON.stringify(lookupResult, null, 2)}</pre>}</form>
      {permissions.canEditSamples === true && <form className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-2" onSubmit={(event) => void createSample(event)}><h3 className="font-bold sm:col-span-2">{t(editingSampleId ? "processOperations.actions.editSampleTitle" : "processOperations.actions.addSample")}</h3>{editingSampleId && <button type="button" onClick={() => { setEditingSampleId(null); setSampleState({ chemical_name: "", cas_number: "", lot: "", safe_handling_instructions: "", reference_classification: "", purity: "", solubility: "", ghs_hazard_pictograms: [], storage_temperature_regime: "ambient", storage_temperature_min: "", storage_temperature_max: "", vial_nominal_quantity: "", vial_unit: "", packaging_type: "", expiration_date: "", reserve_vials_count: "0" }); }} className="text-sm underline sm:col-span-2">{t("processOperations.actions.cancelEdit")}</button>}<Field label={t("processOperations.fields.chemicalName")} required value={sampleState.chemical_name} onChange={(value) => setSampleState({ ...sampleState, chemical_name: value })} /><Field label={t("processOperations.fields.cas")} required value={sampleState.cas_number} onChange={(value) => setSampleState({ ...sampleState, cas_number: value })} /><Field label={t("processOperations.fields.lot")} required value={sampleState.lot} onChange={(value) => setSampleState({ ...sampleState, lot: value })} /><Field label={t("processOperations.fields.referenceClassification")} required value={sampleState.reference_classification} onChange={(value) => setSampleState({ ...sampleState, reference_classification: value })} /><label className="grid gap-1 text-sm font-medium sm:col-span-2">{t("processOperations.fields.safeHandling")}<textarea required rows={3} value={sampleState.safe_handling_instructions} onChange={(event) => setSampleState({ ...sampleState, safe_handling_instructions: event.target.value })} className="rounded-lg border border-slate-300 p-3" /></label><label className="grid gap-1 text-sm font-medium">{t("processOperations.fields.storageRegime")}<select value={sampleState.storage_temperature_regime} onChange={(event) => setSampleState({ ...sampleState, storage_temperature_regime: event.target.value })} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3">{["ambient", "refrigerated", "frozen", "deep_frozen", "custom"].map((value) => <option value={value} key={value}>{t(`processOperations.storage.${value}`)}</option>)}</select></label><Field type="number" label={t("processOperations.fields.temperatureMin")} value={sampleState.storage_temperature_min} onChange={(value) => setSampleState({ ...sampleState, storage_temperature_min: value })} /><Field type="number" label={t("processOperations.fields.temperatureMax")} value={sampleState.storage_temperature_max} onChange={(value) => setSampleState({ ...sampleState, storage_temperature_max: value })} /><Field type="number" label={t("processOperations.fields.vialQuantity")} value={sampleState.vial_nominal_quantity} onChange={(value) => setSampleState({ ...sampleState, vial_nominal_quantity: value })} /><Field label={t("processOperations.fields.vialUnit")} value={sampleState.vial_unit} onChange={(value) => setSampleState({ ...sampleState, vial_unit: value })} /><Field label={t("processOperations.fields.packaging")} value={sampleState.packaging_type} onChange={(value) => setSampleState({ ...sampleState, packaging_type: value })} /><Field label={t("processOperations.fields.purity")} value={sampleState.purity} onChange={(value) => setSampleState({ ...sampleState, purity: value })} /><Field label={t("processOperations.fields.solubility")} value={sampleState.solubility} onChange={(value) => setSampleState({ ...sampleState, solubility: value })} /><fieldset className="grid gap-2 sm:col-span-2"><legend className="text-sm font-medium">{t("processOperations.fields.ghs")}</legend><div className="flex flex-wrap gap-3">{["GHS01", "GHS02", "GHS03", "GHS04", "GHS05", "GHS06", "GHS07", "GHS08", "GHS09"].map((code) => <label className="inline-flex items-center gap-2 text-xs" key={code}><input type="checkbox" checked={sampleState.ghs_hazard_pictograms.includes(code)} onChange={(event) => setSampleState({ ...sampleState, ghs_hazard_pictograms: event.target.checked ? [...sampleState.ghs_hazard_pictograms, code] : sampleState.ghs_hazard_pictograms.filter((item) => item !== code) })} />{code}</label>)}</div></fieldset><Field type="date" label={t("processOperations.fields.expiration")} value={sampleState.expiration_date} onChange={(value) => setSampleState({ ...sampleState, expiration_date: value })} /><Field type="number" label={t("processOperations.fields.reserveVials")} value={sampleState.reserve_vials_count} onChange={(value) => setSampleState({ ...sampleState, reserve_vials_count: value })} /><button type="submit" disabled={busy} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white disabled:opacity-50 sm:col-span-2"><Save className="size-4" aria-hidden="true" />{t(editingSampleId ? "processOperations.actions.updateSample" : "processOperations.actions.saveSample")}</button></form>}
      <button type="button" onClick={() => void completeSamples()} disabled={busy || !permissions.canEditSamples} className="min-h-10 w-fit rounded-lg border border-teal-700 px-4 text-sm font-bold text-teal-800 disabled:opacity-50">{t("processOperations.actions.completeSamples")}</button>
    </section>
    <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="structure-title"><h2 id="structure-title" className="text-lg font-bold">{t("processOperations.sections.structure")}</h2>{structure ? <><p className="text-sm text-slate-700">{t("processOperations.structureStatus", { status: String(structure.status ?? "") })}{structure.blocked_reason ? ` · ${String(structure.blocked_reason)}` : ""}{structure.run_number != null ? ` · ${t("processOperations.runNumber", { run: structure.run_number })}` : ""}</p>{reopenedPoints.length > 0 && <ul className="grid gap-2 rounded-lg border border-teal-200 bg-teal-50 p-3" aria-label={t("processOperations.sections.reopenedPoints")}>{reopenedPoints.map((item, index) => { const activityKey = String(item.activity_key ?? ""); const point = Array.isArray(structure.points) ? structure.points.find((entry) => isRecord(entry) && entry.activity_key === activityKey) : null; const href = isRecord(point) && point.activity_type === "role_assignment" ? `/processos/${processId}/composicao` : isRecord(point) && point.activity_type === "sample_definition" ? `/processos/${processId}/amostras` : null; return href ? <li key={`${activityKey}-${index}`}><Link className="text-sm font-semibold text-teal-900 underline" href={href}>{t("processOperations.reopenLink", { activity: isRecord(point) ? String(point.name ?? activityKey) : activityKey, run: Number(item.run_number ?? 0) })}</Link></li> : null; })}</ul>}<ul className="grid gap-2">{Array.isArray(structure.points) && structure.points.filter(isRecord).map((point) => <li className="rounded-lg bg-slate-50 p-3" key={String(point.activity_key)}><p className="font-semibold">{String(point.name ?? point.activity_key ?? "")}</p><p className="text-xs text-slate-600">{String(point.status ?? "")}{point.run_number != null ? ` · ${t("processOperations.runNumber", { run: point.run_number })}` : ""}</p>{Array.isArray(point.designations) && point.designations.filter(isRecord).map((designation, index) => { const user = isRecord(designation.user) ? designation.user : null; const lab = isRecord(designation.laboratory) ? designation.laboratory : null; return <p key={`${String(designation.assignment_id ?? index)}-${index}`} className="mt-1 text-xs text-slate-600">{String(user?.full_name ?? user?.username ?? "")}{lab ? ` · ${String(lab.name ?? "")}` : ""} · {designation.is_effective === false ? t("processOperations.designationInactive") : t("processOperations.designationEffective")}</p>; })}{isRecord(point.samples) && <p className="mt-1 text-xs text-slate-600">{t("processOperations.sampleCounts", { substances: new Intl.NumberFormat(i18n.resolvedLanguage).format(Number(point.samples.substance_count ?? 0)), laboratories: new Intl.NumberFormat(i18n.resolvedLanguage).format(Number(point.samples.laboratory_count ?? 0)), codes: new Intl.NumberFormat(i18n.resolvedLanguage).format(Number(point.samples.code_count ?? 0)) })}</p>}{Array.isArray(point.pending) && point.pending.filter(isRecord).map((pending, index) => <p key={`${String(pending.code ?? "pending")}-${index}`} className="mt-1 text-xs text-amber-800">{String(pending.message ?? pending.code ?? "")}</p>)}</li>)}</ul>{Array.isArray(structure.decisions) && structure.decisions.length > 0 && <section className="grid gap-2 border-t border-slate-200 pt-3" aria-labelledby="structure-decisions-title"><h3 id="structure-decisions-title" className="font-semibold">{t("processOperations.sections.structureHistory")}</h3>{structure.decisions.filter(isRecord).map((item, index) => { const decidedBy = isRecord(item.decided_by) ? item.decided_by : null; const date = typeof item.decided_at === "string" ? new Intl.DateTimeFormat(i18n.resolvedLanguage, { dateStyle: "medium", timeStyle: "short" }).format(new Date(item.decided_at)) : ""; return <article className="rounded-lg bg-slate-50 p-3 text-sm" key={`${String(item.id ?? index)}-${index}`}><p className="font-semibold">{t("processOperations.decisionHistory", { run: Number(item.run_number ?? 0), outcome: t(`processOperations.outcomes.${String(item.outcome ?? "").toLowerCase()}`), person: String(decidedBy?.full_name ?? decidedBy?.username ?? ""), date })}</p><p className="mt-1 text-xs text-slate-600">{String(item.justification ?? "")}</p>{Array.isArray(item.rejected_points) && item.rejected_points.filter(isRecord).map((point, pointIndex) => <p className="mt-1 text-xs text-rose-800" key={`${String(point.activity_key ?? pointIndex)}-${pointIndex}`}>{String(point.activity_key ?? "")}: {String(point.reason ?? "")}</p>)}</article>; })}</section>}{permissions.canDecideStructure === true && <form className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2" onSubmit={(event) => void submitStructureDecision(event)}><h3 className="font-semibold sm:col-span-2">{t("processOperations.actions.structureDecision")}</h3><label className="grid gap-1 text-sm font-medium">{t("processOperations.fields.outcome")}<select value={decision.outcome} onChange={(event) => setDecision({ ...decision, outcome: event.target.value as StructureApprovalDecisionInput["outcome"] })} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3"><option value="APPROVED">{t("processOperations.outcomes.approved")}</option><option value="REJECTED">{t("processOperations.outcomes.rejected")}</option></select></label><Field label={t("processOperations.fields.justification")} required value={decision.justification} onChange={(value) => setDecision({ ...decision, justification: value })} /><Field label={t("processOperations.fields.activityKey")} required={decision.outcome === "REJECTED"} value={decision.activity_key} onChange={(value) => setDecision({ ...decision, activity_key: value })} /><Field label={t("processOperations.fields.rejectedReason")} required={decision.outcome === "REJECTED"} value={decision.rejected_reason} onChange={(value) => setDecision({ ...decision, rejected_reason: value })} /><button className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white sm:col-span-2">{t("processOperations.actions.submitDecision")}</button></form>}</> : <p className="text-sm text-slate-600">{t("processOperations.emptyStructure")}</p>}</section>
    <section className="grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" aria-labelledby="receipt-title"><h2 id="receipt-title" className="text-lg font-bold">{t("processOperations.sections.receipt")}</h2>{vials.length === 0 ? <p className="text-sm text-slate-600">{t("processOperations.emptyVials")}</p> : <ul className="grid gap-2 md:grid-cols-2">{vials.map((vial, index) => <li className="rounded-lg border border-slate-200 p-3" key={`${String(vial.code ?? "vial")}-${index}`}><p className="font-mono font-semibold">{String(vial.code ?? "")}</p><p className="mt-1 text-xs text-slate-600">{String(vial.status ?? "")}{isRecord(vial.laboratory) ? ` · ${String(vial.laboratory.name ?? "")}` : ""}</p>{Array.isArray(vial.photos) && <div className="mt-2 flex flex-wrap gap-2">{vial.photos.filter(isRecord).map((photo, photoIndex) => typeof photo.id === "string" && <a className="text-xs font-semibold text-teal-800 underline" key={`${photo.id}-${photoIndex}`} href={`/api/processes/${processId}/sample-receipt/photos/${photo.id}`}>{String(photo.filename ?? t("processOperations.actions.downloadPhoto"))}</a>)}</div>}</li>)}</ul>}{permissions.canRegisterReceipt === true && <form className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2" onSubmit={(event) => void registerReceipt(event, true)}><h3 className="font-semibold sm:col-span-2">{t("processOperations.actions.registerReceipt")}</h3><Field label={t("processOperations.fields.sampleCode")} required value={receiptCode} onChange={setReceiptCode} /><Field type="datetime-local" label={t("processOperations.fields.openedAt")} required value={receiptState.opened_at} onChange={(value) => setReceiptState({ ...receiptState, opened_at: value })} /><Field type="number" label={t("processOperations.fields.temperature")} required value={receiptState.temperature_celsius} onChange={(value) => setReceiptState({ ...receiptState, temperature_celsius: value })} /><label className="grid gap-1 text-sm font-medium">{t("processOperations.fields.packageState")}<select value={receiptState.package_state} onChange={(event) => setReceiptState({ ...receiptState, package_state: event.target.value as SampleReceiptInput["package_state"] })} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3">{["intact", "damaged", "violated"].map((value) => <option key={value} value={value}>{t(`processOperations.packages.${value}`)}</option>)}</select></label><Field label={t("processOperations.fields.notes")} value={receiptState.notes} onChange={(value) => setReceiptState({ ...receiptState, notes: value })} /><div className="flex flex-wrap gap-2 sm:col-span-2"><button type="submit" disabled={busy} className="min-h-10 rounded-lg border border-teal-700 px-4 text-sm font-bold text-teal-800">{t("processOperations.actions.checkReceipt")}</button><button type="button" disabled={busy || !receiptCheck} onClick={() => void registerReceipt(null, false)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white disabled:opacity-40"><Check className="size-4" aria-hidden="true" />{t("processOperations.actions.confirmReceipt")}</button></div></form>}<div className="grid gap-3 rounded-lg bg-slate-50 p-4 sm:grid-cols-[1fr_auto]"><label className="grid gap-1 text-sm font-medium">{t("processOperations.fields.receiptPhoto")}<input type="file" accept="image/*" disabled={busy || !permissions.canRegisterReceipt} onChange={(event) => setReceiptPhoto(event.target.files?.[0] ?? null)} className="min-h-10 rounded-lg border border-slate-300 bg-white p-2" /></label><button type="button" disabled={busy || !permissions.canRegisterReceipt || !receiptPhoto || !receiptCode.trim()} onClick={() => void uploadReceiptPhoto()} className="self-end min-h-10 rounded-lg border border-teal-700 px-4 text-sm font-bold text-teal-800">{t("processOperations.actions.uploadPhoto")}</button></div>{receiptCheck && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm" role="status">{String(receiptCheck.message ?? "")}</p>}</section>
    {nonconformities.length > 0 && <section className="grid gap-4 rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">{t("processOperations.sections.nonconformities")}</h2>{nonconformities.map((item) => permissions.canDecideNonconformity === true && <form key={String(item.id)} onSubmit={(event) => void decideNonconformity(String(item.id), event)} className="grid gap-3 rounded-lg border border-slate-200 p-3"><p className="font-semibold">{String(item.alert ?? item.code ?? "")}</p><label className="grid gap-1 text-sm font-medium">{t("processOperations.fields.decision")}<select value={nonconformityDecision.decision} onChange={(event) => setNonconformityDecision({ ...nonconformityDecision, decision: event.target.value })} className="min-h-10 rounded-lg border border-slate-300 bg-white px-3">{["accept_with_caveat", "resend", "disqualify"].map((value) => <option key={value} value={value}>{t(`processOperations.nonconformityDecisions.${value}`)}</option>)}</select></label><Field label={t("processOperations.fields.justification")} required value={nonconformityDecision.justification} onChange={(value) => setNonconformityDecision({ ...nonconformityDecision, justification: value })} /><Field label={t("processOperations.fields.labGuidance")} value={nonconformityDecision.lab_guidance} onChange={(value) => setNonconformityDecision({ ...nonconformityDecision, lab_guidance: value })} /><button className="min-h-10 rounded-lg bg-teal-700 px-4 text-sm font-bold text-white">{t("processOperations.actions.submitDecision")}</button></form>)}</section>}
    {permissions.canManageExecution === true && <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-bold">{t("processOperations.sections.laboratoryControls")}</h2><p className="text-sm text-slate-600">{t("processOperations.laboratoryControlsDescription")}</p><form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void submitLabControl(event, "waive")}><Field label={t("processOperations.fields.phaseKey")} required value={control.phase_key} onChange={(value) => setControl({ ...control, phase_key: value })} /><Field label={t("processOperations.fields.laboratoryId")} required value={control.laboratory_id} onChange={(value) => setControl({ ...control, laboratory_id: value })} /><Field label={t("processOperations.fields.reason")} required value={control.reason} onChange={(value) => setControl({ ...control, reason: value })} /><button className="min-h-10 rounded-lg border border-amber-500 px-4 text-sm font-bold text-amber-900">{t("processOperations.actions.waive")}</button></form><form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => void submitLabControl(event, "reopen")}><Field label={t("processOperations.fields.activityKey")} required value={control.activity_key} onChange={(value) => setControl({ ...control, activity_key: value })} /><Field label={t("processOperations.fields.laboratoryId")} required value={control.laboratory_id} onChange={(value) => setControl({ ...control, laboratory_id: value })} /><Field label={t("processOperations.fields.reason")} required value={control.reason} onChange={(value) => setControl({ ...control, reason: value })} /><button className="min-h-10 rounded-lg border border-teal-700 px-4 text-sm font-bold text-teal-800">{t("processOperations.actions.reopen")}</button></form></section>}
  </div>;
}

function Field({ label, value, onChange, type = "text", required = false }: ProcessOperationsFieldProps) {
  return <label className="grid gap-1 text-sm font-medium text-slate-800">{label}<input type={type} required={required} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 rounded-lg border border-slate-300 px-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20" /></label>;
}

function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
