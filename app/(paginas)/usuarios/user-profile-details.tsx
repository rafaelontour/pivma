"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CalendarDays, LoaderCircle, ShieldCheck, UserRound, UsersRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { UserProfileDetailsProps, UserProfileDetailsState } from "@/types/AreaAutenticada";
import type { ApiRecord } from "@/types/Servico";
import type { UserProfileDetails as UserProfile } from "@/types/Usuario";
import { getLocalizedApiError } from "@/i18n/errors";

export function UserProfileDetails({ userId }: UserProfileDetailsProps) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState<UserProfileDetailsState>({ kind: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`/api/users/${userId}/profile`, { cache: "no-store", signal: controller.signal }).then(async (response) => {
      const payload = await response.json().catch(() => null) as unknown;
      if (controller.signal.aborted) return;
      if (!response.ok || !isUserProfile(payload)) { setState({ kind: "error", message: getLocalizedApiError(isRecord(payload) ? payload : null, t("userProfile.loadFailed"), t) }); return; }
      setState({ kind: "ready", profile: payload });
    }).catch(() => { if (!controller.signal.aborted) setState({ kind: "error", message: t("userProfile.connectionFailed") }); });
    return () => controller.abort();
  }, [t, userId]);
  if (state.kind === "loading") return <section className="grid min-h-64 place-items-center"><LoaderCircle aria-hidden="true" className="size-7 animate-spin text-teal-700" /></section>;
  if (state.kind === "error") return <section className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-900"><AlertCircle aria-hidden="true" className="size-6" /><p className="mt-3 font-semibold">{t("userProfile.loadTitle")}</p><p className="mt-1 text-sm">{state.message}</p></section>;
  const { account, global_profiles: profiles, local_roles: localRoles } = state.profile;
  return <section className="w-full py-7"><p className="text-xs font-bold uppercase tracking-[0.12em] text-teal-700">{t("userProfile.eyebrow")}</p><h1 className="mt-1 text-2xl font-bold text-slate-900">{account.full_name || account.username}</h1><div className="mt-5 grid gap-4 lg:grid-cols-3"><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><UserRound aria-hidden="true" className="size-6 text-teal-700" /><h2 className="mt-3 font-bold text-slate-900">{t("userProfile.account")}</h2><dl className="mt-4 grid gap-3 text-sm"><Detail label={t("users.username")} value={account.username} /><Detail label={t("users.email")} value={account.email} /><Detail label={t("users.status")} value={account.active ? t("users.activeFeminine") : t("users.inactiveFeminine")} /><Detail label={t("userProfile.createdAt")} value={formatDate(account.created_at, i18n.resolvedLanguage, t("userProfile.unavailable"))} /></dl></article><article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"><ShieldCheck aria-hidden="true" className="size-6 text-teal-700" /><h2 className="mt-3 font-bold text-slate-900">{t("userProfile.globalRoles")}</h2>{profiles.length ? <div className="mt-4 flex flex-wrap gap-2">{profiles.map((profile) => <span className="rounded-full bg-teal-100 px-3 py-1.5 text-sm font-semibold text-teal-900" key={profile.id}>{profile.name}</span>)}</div> : <p className="mt-4 text-sm text-slate-600">{t("userProfile.emptyGlobalRoles")}</p>}<p className="mt-4 text-xs text-slate-500">{t("userProfile.assignmentDatesUnavailable")}</p></article></div><article className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><UsersRound aria-hidden="true" className="size-6 text-teal-700" /><h2 className="mt-3 font-bold text-slate-900">{t("userProfile.localRoles")}</h2>{localRoles.length ? <ul className="mt-4 grid gap-3">{localRoles.map((role) => <li className="rounded-xl bg-slate-50 p-4" key={`${role.process_id}-${role.role_key}`}><p className="font-semibold text-slate-900">{role.process_code || role.process_title || role.process_id}</p><p className="mt-1 text-sm text-slate-600">{t(`participantComposition.roleLabels.${role.role_key}`, { defaultValue: role.role_key })} · {formatDate(role.assigned_at, i18n.resolvedLanguage, t("userProfile.unavailable"))}</p></li>)}</ul> : <p className="mt-4 text-sm text-slate-600">{t("userProfile.emptyLocalRoles")}</p>}<p className="mt-4 flex items-center gap-2 text-xs text-slate-500"><CalendarDays aria-hidden="true" className="size-4" />{t("userProfile.localRolesUnavailable")}</p></article></section>;
}

function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="font-semibold text-slate-600">{label}</dt><dd className="mt-0.5 text-slate-900">{value}</dd></div>; }
function formatDate(value: string | null | undefined, locale: string | undefined, fallback: string) { if (!value) return fallback; const date = new Date(value); return Number.isNaN(date.getTime()) ? fallback : new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(date); }
function isRecord(value: unknown): value is ApiRecord { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function isUserProfile(value: unknown): value is UserProfile { return isRecord(value) && isRecord(value.account) && typeof value.account.id === "string" && Array.isArray(value.global_profiles) && Array.isArray(value.local_roles); }
