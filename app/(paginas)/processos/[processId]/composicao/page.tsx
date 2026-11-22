import { CompositionWorkspace } from "../../composition-workspace";
import type { ProcessCompositionRoutePageProps } from "@/types/ParticipacaoProcesso";

export default async function ProcessCompositionPage({ params }: ProcessCompositionRoutePageProps) {
  const { processId } = await params;
  return <CompositionWorkspace processId={processId} />;
}
