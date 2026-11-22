"use client";

import { usePathname } from "next/navigation";
import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import type {
  AuthenticatedPage,
  AuthenticatedPagesLayoutProps,
} from "@/types/AreaAutenticada";

export default function PagesLayout({ children }: AuthenticatedPagesLayoutProps) {
  const pathname = usePathname();

  if (pathname === "/" || pathname === "/login" || pathname.startsWith("/convites/")) {
    return children;
  }

  return (
    <AuthenticatedShell
      activePage={getActivePage(pathname)}
      isProponentPageAllowed={isProponentPathAllowed(pathname)}
      isSponsorPageAllowed={isSponsorPathAllowed(pathname)}
      isGroupManagerPageAllowed={isGroupManagerPathAllowed(pathname)}
    >
      {children}
    </AuthenticatedShell>
  );
}

function isSponsorPathAllowed(pathname: string) {
  return pathname === "/inicio" ||
    pathname === "/acompanhamento" ||
    pathname.startsWith("/acompanhamento/");
}

function isGroupManagerPathAllowed(pathname: string) {
  return pathname === "/inicio" || pathname === "/grupo" || pathname.startsWith("/grupo/");
}

function isProponentPathAllowed(pathname: string) {
  return pathname === "/inicio" ||
    pathname === "/submissoes" ||
    pathname.startsWith("/submissoes/");
}

function getActivePage(pathname: string): AuthenticatedPage {
  if (pathname === "/inicio") return "home";
  if (pathname.startsWith("/acompanhamento")) return "sponsor-tracking";
  if (pathname.startsWith("/submissoes")) return "submissions";
  if (pathname.startsWith("/grupo")) return "group";
  if (pathname.startsWith("/triagem")) return "triage";
  if (pathname.startsWith("/configuracoes")) return "settings";
  if (pathname.startsWith("/formularios")) return "forms";
  if (pathname.startsWith("/avaliacoes-ia")) return "ai-evaluations";
  if (pathname.startsWith("/usuarios")) return "users";
  if (pathname.startsWith("/instituicoes-laboratorios")) return "institutional-catalog";
  if (pathname.startsWith("/templates-coleta")) return "collection-templates";
  if (pathname.startsWith("/observabilidade/operacional")) return "operational-observability";
  if (pathname.startsWith("/observabilidade/ia")) return "ai-observability";
  if (pathname.endsWith("/recebimento-amostras")) return "sample-receipt";
  if (pathname.endsWith("/amostras")) return "process-samples";
  if (pathname === "/processos/composicao" || pathname.endsWith("/composicao")) {
    return "process-composition";
  }
  if (pathname.startsWith("/processos")) return "processes";

  return "home";
}
