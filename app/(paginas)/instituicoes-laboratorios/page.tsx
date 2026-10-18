"use client";

import { useTranslation } from "react-i18next";
import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { SettingsBackLink } from "@/app/(paginas)/configuracoes/settings-back-link";
import { InstitutionalCatalog } from "./institutional-catalog";

export default function InstituicoesLaboratoriosPage() {
  const { t } = useTranslation();

  return (
    <AuthenticatedShell activePage="institutional-catalog">
      <div className="pt-6">
        <SettingsBackLink
          currentModuleName={t("settings.modules.institutionalCatalog.title")}
        />
      </div>
      <InstitutionalCatalog />
    </AuthenticatedShell>
  );
}
