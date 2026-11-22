"use client";

import { useTranslation } from "react-i18next";
import { SettingsBackLink } from "@/app/(paginas)/configuracoes/settings-back-link";
import { InstitutionalCatalog } from "./institutional-catalog";

export default function InstituicoesLaboratoriosPage() {
  const { t } = useTranslation();

  return (
    <>
      <div className="pt-6">
        <SettingsBackLink
          currentModuleName={t("settings.modules.institutionalCatalog.title")}
        />
      </div>
      <InstitutionalCatalog />
    </>
  );
}
