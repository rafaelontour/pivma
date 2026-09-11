"use client";

import { ChevronRight } from "lucide-react";
import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import type {
  AuthenticatedHomeProps,
  WelcomeCardProps,
} from "@/types/AreaAutenticada";

export function AuthenticatedHome({ page = "home" }: AuthenticatedHomeProps) {
  return (
    <AuthenticatedShell activePage={page}>
      <div className="grid flex-1 content-center gap-5 py-10 md:grid-cols-2">
        <WelcomeCard
          eyebrow="Seu ambiente"
          title="A plataforma está pronta para os próximos fluxos."
          description="Novos módulos de submissão, triagem e avaliação aparecerão nesta área conforme forem disponibilizados."
        />
        <WelcomeCard
          eyebrow="Navegação"
          title="Comece pelo menu lateral."
          description="A barra lateral pode ser recolhida para dar mais espaço ao conteúdo e continuará reunindo as próximas seções do pi*VMA."
        />
      </div>
    </AuthenticatedShell>
  );
}

function WelcomeCard({ eyebrow, title, description }: WelcomeCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-400/15">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
        {eyebrow}
      </p>
      <h2 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-teal-700">
        Em breve <ChevronRight aria-hidden="true" className="size-4" />
      </div>
    </article>
  );
}
