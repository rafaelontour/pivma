import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { CompositionWorkspace } from "../../composition-workspace";
import type { ProcessCompositionRoutePageProps } from "@/types/ParticipacaoProcesso";

export default async function ProcessCompositionPage({ params }: ProcessCompositionRoutePageProps) {
  const { processId } = await params;
  return <AuthenticatedShell activePage="process-composition"><CompositionWorkspace processId={processId} /></AuthenticatedShell>;
}
