"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, LoaderCircle } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { normalizeAlertList, reconcileAlertRead, reconcileAllAlertsRead, resolveAlertDestination } from "@/types/Alerta";
import type { AlertListResponse, UserAlert } from "@/types/Alerta";
import type { AlertCenterProps } from "@/types/Alerta";

export function AlertCenter({ module }: AlertCenterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { t, i18n } = useTranslation();
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(true);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AlertListResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [destinationUnavailable, setDestinationUnavailable] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef(false);
  const listRequestRef = useRef(0);
  const countRequestRef = useRef(0);

  async function refreshCount(signal?: AbortSignal) {
    const requestId = ++countRequestRef.current;
    try {
      const response = await fetch("/api/alerts?per_page=1", { cache: "no-store", signal });
      const payload = normalizeAlertList(await response.json().catch(() => null));
      if (requestId === countRequestRef.current && response.ok && payload) setCount(payload.unread_count);
    } catch { /* A temporary count failure must not affect the authenticated shell. */ }
  }

  async function loadList(nextPage = page, onlyUnread = unread) {
    const requestId = ++listRequestRef.current;
    setLoading(true); setError(false);
    try {
      const query = new URLSearchParams({ page: String(nextPage), per_page: "20" });
      if (onlyUnread) query.set("unread", "true");
      const response = await fetch(`/api/alerts?${query}`, { cache: "no-store" });
      const payload = normalizeAlertList(await response.json().catch(() => null));
      if (!response.ok || !payload) throw new Error("alerts_unavailable");
      if (requestId === listRequestRef.current) { setResult(payload); setCount(payload.unread_count); }
    } catch { if (requestId === listRequestRef.current) setError(true); }
    finally { if (requestId === listRequestRef.current) setLoading(false); }
  }

  useEffect(() => {
    const controller = new AbortController();
    // Initial fetch synchronizes the badge with the authenticated server state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCount(controller.signal);
    let timer: ReturnType<typeof setInterval> | undefined;
    const start = () => {
      if (timer) clearInterval(timer);
      if (!document.hidden) timer = setInterval(() => void refreshCount(controller.signal), 90000);
    };
    const onVisibility = () => { start(); if (!document.hidden) void refreshCount(controller.signal); };
    document.addEventListener("visibilitychange", onVisibility);
    start();
    return () => { controller.abort(); if (timer) clearInterval(timer); document.removeEventListener("visibilitychange", onVisibility); };
  }, []);

  useEffect(() => {
    // Route changes revalidate server-owned alert state in the persistent shell.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshCount();
    if (open) void loadList(page, unread);
  // Reconcile on route changes while the shared authenticated shell stays mounted.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    function refreshVisibleState() {
      if (document.hidden) return;
      void refreshCount();
      if (open) void loadList(page, unread);
    }
    document.addEventListener("visibilitychange", refreshVisibleState);
    return () => document.removeEventListener("visibilitychange", refreshVisibleState);
  // The listener reads latest values when reattached for the active panel state.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, page, unread]);

  useEffect(() => {
    if (!open) return;
    // Loading the first page is the external synchronization caused by opening the panel.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadList(1, unread); setPage(1);
    const initialFocus = panel.current?.querySelector<HTMLElement>("button:not(:disabled)");
    (initialFocus ?? panel.current)?.focus();
    function close(event: KeyboardEvent) {
      if (event.key === "Escape") { restoreFocusRef.current = true; setOpen(false); }
      if (event.key !== "Tab" || !panel.current) return;
      const focusable = Array.from(panel.current.querySelectorAll<HTMLElement>("button:not(:disabled), [href], [tabindex]:not([tabindex='-1'])"));
      if (focusable.length === 0) { event.preventDefault(); panel.current.focus(); return; }
      const first = focusable[0]; const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    function closeOutside(event: PointerEvent) {
      if (panel.current?.contains(event.target as Node) || trigger.current?.contains(event.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("keydown", close);
    document.addEventListener("pointerdown", closeOutside);
    return () => { document.removeEventListener("keydown", close); document.removeEventListener("pointerdown", closeOutside); };
  // Opening/filer changes intentionally load the initial page.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, unread]);

  useEffect(() => {
    if (open || !restoreFocusRef.current) return;
    restoreFocusRef.current = false;
    trigger.current?.focus();
  }, [open]);

  async function openAlert(alert: UserAlert) {
    setDestinationUnavailable(false);
    if (!alert.read_at) {
      setCount((value) => Math.max(0, value - 1));
      const readAt = new Date().toISOString();
      setResult((value) => value ? reconcileAlertRead(value, alert.id, readAt, unread) : value);
      void fetch(`/api/alerts/${encodeURIComponent(alert.id)}/read`, { method: "POST" })
        .then(async (response) => { if (!response.ok) throw new Error(); await refreshCount(); if (open) await loadList(page, unread); })
        .catch(() => { toast.error(t("alerts.readFailed")); void refreshCount(); if (open) void loadList(page, unread); });
    }
    if (alert.target.type === "task" && alert.target.id) {
      try {
        const response = await fetch(`/api/tasks/${encodeURIComponent(alert.target.id)}`, { cache: "no-store" });
        const task = await response.json().catch(() => null) as { activity_key?: string } | null;
        if (!response.ok || !task?.activity_key) throw new Error();
        const path = resolveAlertDestination(alert.target, module, task.activity_key);
        if (!path) throw new Error();
        router.push(path);
      } catch { setDestinationUnavailable(true); }
      return;
    }
    const path = resolveAlertDestination(alert.target, module);
    if (!path) { setDestinationUnavailable(true); return; }
    if (alert.target.type === "process" || alert.target.type === "sample_receipt") {
      try {
        const endpoint = alert.target.type === "process"
          ? `/api/processes/${encodeURIComponent(alert.target.process_id)}`
          : `/api/processes/${encodeURIComponent(alert.target.process_id)}/sample-receipt/vials?page=1&per_page=1`;
        const response = await fetch(endpoint, { cache: "no-store" });
        if (!response.ok) throw new Error();
      } catch { setDestinationUnavailable(true); return; }
    }
    router.push(path);
  }

  async function readAll() {
    if (busy) return;
    setBusy("all"); const previous = count; setCount(0);
    try {
      const response = await fetch("/api/alerts/read-all", { method: "POST" });
      if (!response.ok) throw new Error();
      const payload = await response.json().catch(() => null) as { updated?: unknown } | null;
      const updated = typeof payload?.updated === "number" ? payload.updated : 0;
      setResult((value) => value ? reconcileAllAlertsRead(value, new Date().toISOString(), unread) : value);
      setCount(0);
      toast.success(updated > 0 ? t("alerts.readAllSuccess", { count: updated }) : t("alerts.readAllEmpty"));
    } catch { setCount(previous); toast.error(t("alerts.readFailed")); }
    finally { setBusy(null); }
  }

  const dateLocale = i18n.resolvedLanguage === "en" ? "en-US" : "pt-BR";
  function messageFor(alert: UserAlert) {
    const params = alert.params;
    const code = String(params.process_code ?? "");
    const activity = String(params.activity_name ?? "");
    if (alert.kind === "task_opened") {
      const key = String(params.activity_key ?? "");
      const specific = key === "triage_evaluation" ? "triage"
        : key === "submission_return_review" ? "returnReview"
          : key.startsWith("assign_") ? "assignment"
            : key === "structure_approval" ? "structure"
              : key === "sample_receipt_resolution" ? "receiptResolution" : null;
      const messageKey = Number(params.run_number ?? 1) > 1 && !specific ? "reopened" : specific ?? "genericTask";
      const dueDate = formatAlertDate(params.due_date, dateLocale);
      return t(`alerts.taskOpened.${messageKey === "returnReview" && !dueDate ? "returnReviewNoDueDate" : messageKey}`, { code, activity, dueDate });
    }
    if (alert.kind === "submission_status_changed") {
      const status = String(params.status ?? "");
      return t(`alerts.submissionStatus.${status}`, { code, defaultValue: t("alerts.generic", { code }) });
    }
    if (alert.kind === "assignment_created" || alert.kind === "assignment_revoked") {
      const roleKey = String(params.role_key ?? "");
      const role = t(`participantComposition.roleLabels.${roleKey}`, { defaultValue: roleKey });
      return t(`alerts.kinds.${alert.kind}`, { code, role, laboratory: String(params.laboratory_name ?? "") });
    }
    if (alert.kind === "assignment_effectiveness_changed") {
      return t(params.effective === true ? "alerts.assignmentEffective" : "alerts.assignmentIneffective", { code, role: t(`participantComposition.roleLabels.${String(params.role_key ?? "")}`, { defaultValue: String(params.role_key ?? "") }), laboratory: String(params.laboratory_name ?? "") });
    }
    const vialStatus = String(params.vial_status ?? "");
    const localizedStatus = vialStatus === "accepted_with_caveat" ? t("processOperations.nonconformityDecisions.accept_with_caveat")
      : vialStatus === "replaced" ? t("alerts.vialStatuses.replaced")
        : vialStatus === "disqualified" ? t("processOperations.nonconformityDecisions.disqualify") : vialStatus;
    return t(`alerts.kinds.${alert.kind}`, { code, title: String(params.process_title ?? ""), activity, laboratory: String(params.laboratory_name ?? ""), role: String(params.role_key ?? ""), status: localizedStatus, phase: String(params.phase_name ?? ""), defaultValue: t("alerts.generic", { code }) });
  }
  return <div className="relative">
    <button ref={trigger} aria-label={t("alerts.trigger", { count })} aria-expanded={open} onClick={() => setOpen((value) => !value)} type="button" className="relative inline-flex size-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 outline-none hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500">
      <Bell aria-hidden="true" className="size-5" />{count > 0 && <span aria-hidden="true" className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-700 px-1 text-center text-[10px] font-bold leading-5 text-white">{count > 99 ? "99+" : count}</span>}
    </button>
    {open && <div ref={panel} tabIndex={-1} role="dialog" aria-modal="false" aria-label={t("alerts.title")} className="fixed inset-x-2 top-20 z-[90] flex max-h-[calc(100dvh-5.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl outline-none sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:w-[min(28rem,calc(100vw-2rem))]">
      <header className="flex items-center justify-between gap-3 border-b p-4"><h2 className="font-bold">{t("alerts.title")}</h2><button onClick={() => void readAll()} disabled={busy !== null || count === 0} className="text-xs font-semibold text-teal-800 underline disabled:opacity-50" type="button">{t("alerts.readAll")}</button></header>
      <div className="flex gap-2 border-b px-4 py-2"><button aria-pressed={unread} onClick={() => setUnread(true)} className={`rounded-full px-3 py-1.5 text-sm ${unread ? "bg-teal-100 font-bold text-teal-900" : "text-slate-600"}`} type="button">{t("alerts.unread")}</button><button aria-pressed={!unread} onClick={() => setUnread(false)} className={`rounded-full px-3 py-1.5 text-sm ${!unread ? "bg-teal-100 font-bold text-teal-900" : "text-slate-600"}`} type="button">{t("alerts.all")}</button></div>
      <div className="min-h-32 overflow-y-auto p-2" aria-live="polite">{destinationUnavailable && <p className="m-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900" role="status">{t("alerts.destinationUnavailable")}</p>}{loading ? <div className="grid min-h-32 place-items-center"><LoaderCircle className="size-5 animate-spin" aria-label={t("common.loading")} /></div> : error ? <div className="p-4 text-sm" role="alert">{t("alerts.loadError")} <button className="underline" onClick={() => void loadList()} type="button">{t("common.retry")}</button></div> : result?.data.length ? result.data.map((alert) => <button key={alert.id} onClick={() => void openAlert(alert)} type="button" className={`block w-full rounded-xl p-3 text-left outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-teal-500 ${alert.read_at ? "" : "bg-teal-50"}`}><span className="block text-sm font-semibold">{messageFor(alert)}</span><time className="mt-1 block text-xs text-slate-500" dateTime={alert.created_at}>{new Intl.DateTimeFormat(dateLocale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(alert.created_at))}</time></button>) : <p className="p-6 text-center text-sm text-slate-500">{t("alerts.empty")}</p>}</div>
      {result && <footer className="flex items-center justify-between border-t p-3 text-sm"><button disabled={!result.pagination.has_prev || loading} onClick={() => { const next = page - 1; setPage(next); void loadList(next); }} type="button" aria-label={t("alerts.previousPage")}>{t("alerts.previous")}</button><span>{t("alerts.page", { page: result.pagination.page, total: result.pagination.total_pages })}</span><button disabled={!result.pagination.has_next || loading} onClick={() => { const next = page + 1; setPage(next); void loadList(next); }} type="button" aria-label={t("alerts.nextPage")}>{t("alerts.next")}</button></footer>}
    </div>}
  </div>;
}

function formatAlertDate(value: unknown, locale: string) {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
}
