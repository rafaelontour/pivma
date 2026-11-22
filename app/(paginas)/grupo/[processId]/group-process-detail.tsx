"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { GroupProcessDetailProps, ProcessCompositionSnapshot } from "@/types/ParticipacaoProcesso";
import type { ApiRecord } from "@/types/Servico";

export function GroupProcessDetail({ processId }: GroupProcessDetailProps) {
  const { t } = useTranslation();
  const [snapshot, setSnapshot] = useState<ProcessCompositionSnapshot | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetch(`/api/processes/${processId}/composition`, { cache: "no-store" })
      .then(async (response) => ({ ok: response.ok, body: await response.json().catch(() => null) as unknown }))
      .then(({ ok, body }) => {
        if (!active) return;
        if (ok && isSnapshot(body)) setSnapshot(body);
        else setError(true);
      })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [processId]);

  if (error) return <p className="my-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900" role="alert">{t("participantComposition.errors.load")}</p>;
  if (!snapshot) return <div className="flex min-h-40 items-center justify-center gap-3 text-sm text-slate-600" aria-live="polite"><LoaderCircle aria-hidden="true" className="size-5 animate-spin text-teal-700" />{t("participantComposition.loading")}</div>;

  const proponent = snapshot.participants.find((participant) => participant.active && participant.role_key === "proponent");
  const members = snapshot.participants.filter((participant) => participant.active && participant.role_key === "group_manager");
  const currentTask = snapshot.tasks.find((task) => task.status === "READY");

  return <section className="grid gap-5 py-6">
    <Link className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-teal-800 underline-offset-4 hover:underline" href="/grupo"><ArrowLeft aria-hidden="true" className="size-4" />{t("participantComposition.actions.backToList")}</Link>
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="font-mono text-xs font-bold uppercase tracking-wide text-teal-700">{snapshot.process.code}</p>
      <h2 className="mt-1 text-2xl font-bold text-slate-900">{snapshot.process.title}</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("participantComposition.index.proponent")}</dt><dd className="mt-1 font-semibold text-slate-900">{proponent?.user.full_name || proponent?.user.username || t("participantComposition.index.proponentNotIdentified")}</dd></div>
        <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("participantComposition.processDetail.status")}</dt><dd className="mt-1 font-semibold text-slate-900">{snapshot.process.status}</dd></div>
        <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("participantComposition.processDetail.currentActivity")}</dt><dd className="mt-1 font-semibold text-slate-900">{currentTask?.title ?? t("participantComposition.processDetail.noCurrentActivity")}</dd></div>
        <div className="rounded-xl bg-slate-50 p-4"><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{t("participantComposition.index.groupMembers", { count: members.length })}</dt><dd className="mt-1 font-semibold text-slate-900">{members.map((member) => member.user.full_name || member.user.username).join(", ") || t("participantComposition.index.noGroupMembers")}</dd></div>
      </dl>
    </article>
  </section>;
}

function isSnapshot(value: unknown): value is ProcessCompositionSnapshot {
  if (!value || typeof value !== "object") return false;
  const candidate = value as ApiRecord;
  return Boolean(candidate.process && typeof candidate.process === "object") && Array.isArray(candidate.participants) && Array.isArray(candidate.tasks);
}
