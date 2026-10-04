"use client";

import { useTranslation } from "react-i18next";
import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { SettingsBackLink } from "@/app/(paginas)/configuracoes/settings-back-link";
import { FormTemplateManager } from "./form-template-manager";

export default function FormulariosPage() {
  const { t } = useTranslation();
  return (
    <AuthenticatedShell activePage="forms">
      <div className="pt-6">
        <SettingsBackLink currentModuleName={t("formBuilder.moduleName")} />
      </div>
      <FormTemplateManager />
    </AuthenticatedShell>
  );
}
