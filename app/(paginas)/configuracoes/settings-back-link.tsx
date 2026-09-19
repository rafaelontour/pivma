import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { SettingsBackLinkProps } from "@/types/Configuracoes";

export function SettingsBackLink({ currentModuleName }: SettingsBackLinkProps) {
  return (
    <nav
      aria-label={`Navegação de retorno a partir de ${currentModuleName}`}
      className="mb-6 flex items-center gap-2 text-xs font-semibold text-slate-500"
    >
      <Link
        className="inline-flex items-center gap-1 text-teal-700 outline-none transition hover:text-teal-900 focus-visible:ring-2 focus-visible:ring-teal-500"
        href="/configuracoes"
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        Configurações
      </Link>
      <span aria-hidden="true" className="text-slate-300">
        /
      </span>
      <span className="text-slate-700">{currentModuleName}</span>
    </nav>
  );
}
