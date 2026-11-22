"use client";

import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { SettingsBackLink } from "@/app/(paginas)/configuracoes/settings-back-link";
import { AiEvaluationWorkspace } from "./ai-evaluation-workspace";

export default function AvaliacoesIaPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="pt-6">
        <SettingsBackLink currentModuleName={t("aiEvaluations.moduleName")} />
      </div>
      <Suspense fallback={<div className="min-h-96 py-7 text-sm text-slate-600">{t("aiEvaluations.loadingPage")}</div>}>
        <AiEvaluationWorkspace />
      </Suspense>
    </>
  );
}
