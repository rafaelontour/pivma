import { Suspense } from "react";
import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { AiEvaluationWorkspace } from "./ai-evaluation-workspace";

export default function AvaliacoesIaPage() {
  return (
    <AuthenticatedShell activePage="ai-evaluations">
      <Suspense fallback={<div className="min-h-96 py-7 text-sm text-slate-600">Carregando avaliações…</div>}>
        <AiEvaluationWorkspace />
      </Suspense>
    </AuthenticatedShell>
  );
}
