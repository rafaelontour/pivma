"use client";

import { useTranslation } from "react-i18next";
import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { SettingsBackLink } from "@/app/(paginas)/configuracoes/settings-back-link";
import { UserDirectory } from "./user-directory";

export default function UsuariosPage() {
  const { t } = useTranslation();
  return (
    <AuthenticatedShell activePage="users">
      <div className="pt-6">
        <SettingsBackLink currentModuleName={t("settings.modules.users.title")} />
      </div>
      <UserDirectory />
    </AuthenticatedShell>
  );
}
