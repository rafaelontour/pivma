"use client";

import { use } from "react";
import { useTranslation } from "react-i18next";
import { SettingsBackLink } from "@/app/(paginas)/configuracoes/settings-back-link";
import { UserProfileDetails } from "../user-profile-details";

export default function UserProfilePage({ params }: PageProps<"/usuarios/[userId]">) {
  const { userId } = use(params);
  const { t } = useTranslation();
  return <><div className="pt-6"><SettingsBackLink currentModuleName={t("userProfile.moduleName")} /></div><UserProfileDetails userId={userId} /></>;
}
