"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { InvitePreview, InviteWorkspaceProps, InviteWorkspaceState } from "@/types/ParticipacaoProcesso";
import type { ApiRecord } from "@/types/Servico";

export function InviteWorkspace({ token }: InviteWorkspaceProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [state, setState] = useState<InviteWorkspaceState>({ kind: "loading" });
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState(false);
  const returnTo = `/convites/${encodeURIComponent(token)}`;

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch(`/api/invites/${encodeURIComponent(token)}`, { cache: "no-store" }).then(async (response) => ({ response, payload: await response.json().catch(() => null) as unknown })),
      fetch("/api/auth/me", { cache: "no-store" }).then((response) => response.ok),
    ]).then(([preview, hasSession]) => {
      if (!active) return;
      setAuthenticated(hasSession);
      if (!preview.response.ok || !isInvitePreview(preview.payload)) setState({ kind: "error", message: t("invite.errors.preview") });
      else setState({ kind: "ready", invite: preview.payload });
    }).catch(() => { if (active) setState({ kind: "error", message: t("invite.errors.preview") }); });
    return () => { active = false; };
  }, [token, t]);

  async function accept() {
    setBusy(true);
    try {
      const response = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, { method: "POST" });
      if (!response.ok) { toast.error(t("invite.errors.accept")); return; }
      toast.success(t("invite.accepted"));
      router.replace("/inicio");
    } catch { toast.error(t("invite.errors.accept")); }
    finally { setBusy(false); }
  }

  return <main className="grid min-h-dvh place-items-center bg-slate-50 p-5"><section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-live="polite">
    <p className="text-xs font-bold uppercase tracking-widest text-teal-700">{t("invite.eyebrow")}</p>
    {state.kind === "loading" && <p className="mt-4">{t("invite.loading")}</p>}
    {state.kind === "error" && <p className="mt-4 text-rose-800" role="alert">{state.message}</p>}
    {state.kind === "ready" && <>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{t("invite.title")}</h1>
      <p className="mt-3 text-slate-700">{t("invite.description", { role: t(`participantComposition.roleLabels.${state.invite.role_key}`, { defaultValue: state.invite.role_key }) })}</p>
      <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="font-mono text-sm font-bold text-teal-800">{state.invite.process_code}</p><p className="mt-1 font-semibold">{state.invite.process_title}</p><p className="mt-2 text-sm text-slate-600">{state.invite.masked_email}</p></div>
      {state.invite.expired ? <p className="mt-5 text-rose-800" role="alert">{t("invite.expired")}</p> : authenticated ? <button className="mt-5 min-h-11 rounded-lg bg-teal-700 px-5 font-bold text-white disabled:opacity-60" disabled={busy} onClick={() => void accept()} type="button">{busy ? t("invite.accepting") : t("invite.acceptAction")}</button> : <div className="mt-5 flex flex-wrap gap-3"><Link className="rounded-lg bg-teal-700 px-5 py-3 font-bold text-white" href={`/login?returnTo=${encodeURIComponent(returnTo)}`}>{t("invite.login")}</Link><Link className="rounded-lg border border-teal-700 px-5 py-3 font-bold text-teal-800" href={`/login?returnTo=${encodeURIComponent(returnTo)}&mode=register`}>{t("invite.register")}</Link></div>}
    </>}
  </section></main>;
}

function isInvitePreview(value: unknown): value is InvitePreview {
  if (!value || typeof value !== "object") return false;
  const item = value as ApiRecord;
  return typeof item.role_key === "string" && typeof item.process_code === "string" && typeof item.process_title === "string" && typeof item.masked_email === "string" && typeof item.expires_at === "string" && typeof item.expired === "boolean";
}
