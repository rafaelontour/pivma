"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bot,
  ListChecks,
  Lock,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import {
  getSettingsCapabilities,
  getSettingsModules,
  hasAnySettingsAccess,
  isCurrentUser,
} from "@/components/configuracoes";
import type {
  ModuleIconProps,
  SettingsHubProps,
  SettingsModuleCardProps,
  SettingsSessionCapabilities,
} from "@/types/Configuracoes";

export function SettingsHub({ initialCapabilities }: SettingsHubProps) {
  const [capabilities, setCapabilities] = useState<SettingsSessionCapabilities | null>(
    initialCapabilities ?? null,
  );
  const [isLoading, setIsLoading] = useState(!initialCapabilities);

  useEffect(() => {
    if (initialCapabilities) return;

    const controller = new AbortController();

    async function loadCapabilities() {
      try {
        const response = await fetch("/api/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as unknown;

        if (response.ok && isCurrentUser(payload)) {
          setCapabilities(getSettingsCapabilities(payload));
        }
      } catch {
        // Erros de conexão são absorvidos mantendo o estado seguro
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadCapabilities();

    return () => controller.abort();
  }, [initialCapabilities]);

  if (isLoading) {
    return (
      <section
        aria-busy="true"
        aria-live="polite"
        className="flex flex-1 items-center justify-center py-16 text-sm text-slate-600"
      >
        <span className="mr-3 size-3 animate-pulse rounded-full bg-teal-600" />
        Carregando módulos de configuração…
      </section>
    );
  }

  const effectiveCapabilities = capabilities ?? {
    canManageForms: false,
    canViewAiEvaluations: false,
    canManageUsers: false,
  };

  const hasAccess = hasAnySettingsAccess(effectiveCapabilities);
  const modules = getSettingsModules(effectiveCapabilities);

  return (
    <section aria-label="Módulos de Configuração" className="flex-1 py-6 sm:py-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
          Recursos de parametrização e gestão
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          Gerencie formulários de submissão, bibliotecas de critérios de inteligência
          artificial e diretório de usuários da plataforma com base nos seus perfis de acesso.
        </p>
      </div>

      {!hasAccess ? (
        <div
          aria-live="polite"
          className="flex flex-col items-start gap-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-6 sm:p-8"
        >
          <div className="flex items-center gap-3 text-amber-900">
            <ShieldAlert aria-hidden="true" className="size-6 shrink-0 text-amber-700" />
            <h3 className="text-base font-semibold">
              Nenhum módulo de configuração disponível
            </h3>
          </div>
          <p className="text-sm text-amber-800">
            Sua conta atual não possui permissões administrativas ou de configuração
            concedidas para acessar formulários, avaliações por IA ou gestão de usuários.
            Caso precise de acesso, solicite autorização a uma pessoa administradora.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <SettingsModuleCard key={module.id} module={module} />
          ))}
        </div>
      )}
    </section>
  );
}

function SettingsModuleCard({ module }: SettingsModuleCardProps) {
  if (!module.isAllowed) {
    return (
      <article
        aria-label={`${module.title} (Acesso restrito)`}
        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-6 opacity-75 shadow-xs transition"
      >
        <div>
          <div className="flex items-center justify-between gap-2">
            <span className="grid size-12 place-items-center rounded-xl bg-slate-200 text-slate-500">
              <ModuleIcon className="size-6" name={module.iconName} />
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              <Lock aria-hidden="true" className="size-3" />
              Restrito
            </span>
          </div>

          <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-800">
            {module.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            {module.description}
          </p>
        </div>

        <div className="mt-6 border-t border-slate-200 pt-4">
          <p className="text-xs font-medium text-slate-500">
            {module.deniedReason ?? "Acesso não concedido para o perfil atual."}
          </p>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-teal-400 hover:shadow-md">
      <div>
        <div className="flex items-center justify-between gap-2">
          <span className="grid size-12 place-items-center rounded-xl bg-teal-600/10 text-teal-800 ring-1 ring-teal-700/20 group-hover:bg-teal-600 group-hover:text-white transition-colors">
            <ModuleIcon className="size-6" name={module.iconName} />
          </span>
          <span className="rounded-full border border-teal-700/20 bg-teal-50 px-2.5 py-0.5 text-xs font-semibold text-teal-800">
            {module.badge}
          </span>
        </div>

        <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-900 group-hover:text-teal-900">
          {module.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {module.description}
        </p>
      </div>

      <div className="mt-6 border-t border-slate-100 pt-4">
        <Link
          aria-label={`Acessar módulo de ${module.title}`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 outline-none transition group-hover:text-teal-900 group-hover:translate-x-0.5 focus-visible:ring-2 focus-visible:ring-teal-500"
          href={module.href}
        >
          Acessar módulo
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  );
}

function ModuleIcon({ name, className }: ModuleIconProps) {
  if (name === "ListChecks") {
    return <ListChecks aria-hidden="true" className={className} />;
  }

  if (name === "Bot") {
    return <Bot aria-hidden="true" className={className} />;
  }

  return <UsersRound aria-hidden="true" className={className} />;
}
