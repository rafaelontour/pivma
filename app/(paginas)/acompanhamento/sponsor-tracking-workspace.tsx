"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CircleDot,
  Clock3,
  Handshake,
  LoaderCircle,
  RefreshCw,
  UserRound,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { getLocalizedApiError } from "@/i18n/errors";
import type {
  SponsorTrackingDetail,
  SponsorTrackingDetailFieldProps,
  SponsorTrackingDetailViewProps,
  SponsorTrackingDetailState,
  SponsorTrackingErrorProps,
  SponsorTrackingItem,
  SponsorTrackingListState,
  SponsorTrackingLoadingProps,
  SponsorTrackingWorkspaceProps,
} from "@/types/Acompanhamento";
import type { ApiMessage, ApiRecord } from "@/types/Servico";

export function SponsorTrackingWorkspace({
  processId,
}: SponsorTrackingWorkspaceProps) {
  return processId
    ? <SponsorTrackingDetailView processId={processId} />
    : <SponsorTrackingList />;
}

function SponsorTrackingList() {
  const { i18n, t } = useTranslation();
  const [state, setState] = useState<SponsorTrackingListState>({
    kind: "loading",
  });

  const load = useCallback(async (): Promise<SponsorTrackingListState> => {
    try {
      const response = await fetch("/api/sponsorships", { cache: "no-store" });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok || !isSponsorTrackingList(payload)) {
        return {
          kind: "error",
          message: getLocalizedApiError(
            isApiMessage(payload) ? payload : null,
            t("sponsorTracking.loadFailed"),
            t,
          ),
        };
      }
      return { kind: "ready", items: payload };
    } catch {
      return {
        kind: "error",
        message: t("sponsorTracking.connectionFailed"),
      };
    }
  }, [t]);

  useEffect(() => {
    let active = true;
    void load().then((nextState) => {
      if (active) setState(nextState);
    });
    return () => {
      active = false;
    };
  }, [load]);

  if (state.kind === "loading") {
    return <LoadingState label={t("sponsorTracking.loading")} />;
  }

  if (state.kind === "error") {
    return <ErrorState message={state.message} onRetry={() => void load().then(setState)} />;
  }

  return (
    <section className="grid gap-5 py-7" aria-labelledby="sponsor-projects-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-teal-700">
            {t("sponsorTracking.listEyebrow")}
          </p>
          <h2 className="mt-1 text-xl font-bold text-slate-900" id="sponsor-projects-title">
            {t("sponsorTracking.listTitle")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {t("sponsorTracking.listDescription")}
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-teal-700 px-3 text-sm font-semibold text-teal-800 outline-none transition hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-500"
          onClick={() => void load().then(setState)}
          type="button"
        >
          <RefreshCw aria-hidden="true" className="size-4" />
          {t("sponsorTracking.refresh")}
        </button>
      </div>

      {state.items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
          <Handshake aria-hidden="true" className="mx-auto size-9 text-slate-400" />
          <p className="mt-3 font-semibold text-slate-800">
            {t("sponsorTracking.emptyTitle")}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {t("sponsorTracking.emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {state.items.map((item) => (
            <Link
              className="group flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-500"
              href={`/acompanhamento/${item.process.id}`}
              key={item.process.id}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-teal-100 text-teal-800">
                  <Handshake aria-hidden="true" className="size-5" />
                </span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${statusClass(item.process.status)}`}>
                  {t(`sponsorTracking.statuses.${item.process.status}`, {
                    defaultValue: item.process.status,
                  })}
                </span>
              </div>
              <p className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.1em] text-teal-700">
                {item.process.code}
              </p>
              <h3 className="mt-1 text-lg font-bold text-slate-900">
                {item.process.title}
              </h3>
              <dl className="mt-4 grid gap-3 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <UserRound aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">{t("sponsorTracking.proponent")}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">{participantName(item.proponent, t("common.notAssigned"))}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CalendarDays aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-slate-400" />
                  <div>
                    <dt className="text-xs font-semibold text-slate-500">{t("sponsorTracking.assignedAt")}</dt>
                    <dd className="mt-0.5 font-medium text-slate-800">{formatDate(item.sponsorAssignedAt, i18n.resolvedLanguage)}</dd>
                  </div>
                </div>
              </dl>
              <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-bold text-teal-800">
                {t("sponsorTracking.open")}
                <ArrowRight aria-hidden="true" className="size-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function SponsorTrackingDetailView({ processId }: SponsorTrackingDetailViewProps) {
  const { i18n, t } = useTranslation();
  const [state, setState] = useState<SponsorTrackingDetailState>({
    kind: "loading",
  });

  const load = useCallback(async (): Promise<SponsorTrackingDetailState> => {
    try {
      const response = await fetch(`/api/sponsorships/${processId}`, {
        cache: "no-store",
      });
      const payload = await response.json().catch(() => null) as unknown;
      if (!response.ok || !isSponsorTrackingDetail(payload)) {
        return {
          kind: "error",
          message: getLocalizedApiError(
            isApiMessage(payload) ? payload : null,
            t("sponsorTracking.detailLoadFailed"),
            t,
          ),
        };
      }
      return { kind: "ready", detail: payload };
    } catch {
      return {
        kind: "error",
        message: t("sponsorTracking.connectionFailed"),
      };
    }
  }, [processId, t]);

  useEffect(() => {
    let active = true;
    void load().then((nextState) => {
      if (active) setState(nextState);
    });
    return () => {
      active = false;
    };
  }, [load]);

  if (state.kind === "loading") {
    return <LoadingState label={t("sponsorTracking.loadingDetail")} />;
  }

  if (state.kind === "error") {
    return <ErrorState message={state.message} onRetry={() => void load().then(setState)} />;
  }

  const { detail } = state;
  const isPlanning = detail.process.status === "PLANNING";

  return (
    <section className="grid gap-5 py-7" aria-labelledby="sponsor-project-title">
      <Link className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline" href="/acompanhamento">
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t("sponsorTracking.back")}
      </Link>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.1em] text-teal-700">{detail.process.code}</p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900" id="sponsor-project-title">{detail.process.title}</h2>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide ${statusClass(detail.process.status)}`}>
            {t(`sponsorTracking.statuses.${detail.process.status}`, {
              defaultValue: detail.process.status,
            })}
          </span>
        </div>

        {isPlanning ? (
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <div className="flex items-start gap-3">
              <Clock3 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-amber-800" />
              <div>
                <h3 className="font-bold text-amber-950">{t("sponsorTracking.planningTitle")}</h3>
                <p className="mt-1 text-sm leading-6 text-amber-900">{t("sponsorTracking.planningDescription")}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-teal-200 bg-teal-50 p-5">
            <div className="flex items-start gap-3">
              <CircleDot aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-teal-800" />
              <div>
                <h3 className="font-bold text-teal-950">{t("sponsorTracking.startedTitle")}</h3>
                <p className="mt-1 text-sm leading-6 text-teal-900">{t("sponsorTracking.startedDescription")}</p>
              </div>
            </div>
          </div>
        )}

        <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DetailField label={t("sponsorTracking.proponent")} value={participantName(detail.proponent, t("common.notAssigned"))} />
          <DetailField label={t("sponsorTracking.assignedAt")} value={formatDate(detail.sponsorAssignedAt, i18n.resolvedLanguage)} />
          <DetailField label={t("sponsorTracking.processStatus")} value={t(`sponsorTracking.statuses.${detail.process.status}`, { defaultValue: detail.process.status })} />
          <DetailField label={t("sponsorTracking.phase")} value={detail.currentTask ? t("sponsorTracking.phaseNumber", { number: detail.currentTask.phase.order }) : t("sponsorTracking.notAvailable")} />
          <DetailField label={t("sponsorTracking.activity")} value={detail.currentTask?.title ?? t("sponsorTracking.notAvailable")} />
          <DetailField label={t("sponsorTracking.startedAt")} value={detail.process.started_at ? formatDate(detail.process.started_at, i18n.resolvedLanguage) : t("sponsorTracking.notStarted")} />
        </dl>
      </article>
    </section>
  );
}

function DetailField({ label, value }: SponsorTrackingDetailFieldProps) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

function LoadingState({ label }: SponsorTrackingLoadingProps) {
  return <div className="my-7 flex min-h-40 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-600" aria-live="polite"><LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />{label}</div>;
}

function ErrorState({ message, onRetry }: SponsorTrackingErrorProps) {
  const { t } = useTranslation();
  return <div className="my-7 rounded-2xl border border-rose-200 bg-rose-50 p-5" role="alert"><p className="text-sm font-semibold text-rose-900">{message}</p><button className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-800 px-4 text-sm font-bold text-white outline-none focus-visible:ring-2 focus-visible:ring-rose-500" onClick={onRetry} type="button"><RefreshCw aria-hidden="true" className="size-4" />{t("common.retry")}</button></div>;
}

function statusClass(status: string) {
  if (status === "CLOSED" || status === "CANCELLED" || status === "ARCHIVED") {
    return "bg-rose-100 text-rose-800";
  }
  if (status === "PLANNING") return "bg-amber-100 text-amber-900";
  return "bg-teal-100 text-teal-800";
}

function participantName(
  participant: SponsorTrackingItem["proponent"],
  fallback: string,
) {
  return participant?.full_name || participant?.username || fallback;
}

function formatDate(value: string, locale?: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

function isSponsorTrackingList(value: unknown): value is SponsorTrackingItem[] {
  return Array.isArray(value) && value.every(isSponsorTrackingItem);
}

function isSponsorTrackingDetail(value: unknown): value is SponsorTrackingDetail {
  if (!isSponsorTrackingItem(value)) return false;
  const detail = value as ApiRecord;
  return detail.currentTask === null || isCurrentTask(detail.currentTask);
}

function isSponsorTrackingItem(value: unknown): value is SponsorTrackingItem {
  if (!isRecord(value)) return false;
  return isProcess(value.process) &&
    (value.proponent === null || isParticipant(value.proponent)) &&
    typeof value.sponsorAssignedAt === "string";
}

function isProcess(value: unknown) {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.title === "string" &&
    typeof value.status === "string" &&
    typeof value.template_key === "string" &&
    typeof value.version_number === "number";
}

function isParticipant(value: unknown) {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.username === "string" &&
    (value.full_name === null || typeof value.full_name === "string");
}

function isCurrentTask(value: unknown) {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isRecord(value.phase) &&
    typeof value.phase.order === "number";
}

function isApiMessage(value: unknown): value is ApiMessage {
  return isRecord(value) &&
    (value.code === undefined || typeof value.code === "string") &&
    (value.message === undefined || typeof value.message === "string");
}

function isRecord(value: unknown): value is ApiRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
