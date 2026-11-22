import { GroupProcessDetail } from "./group-process-detail";
import type { GroupProcessDetailPageProps } from "@/types/ParticipacaoProcesso";

export default async function GroupProcessPage({ params }: GroupProcessDetailPageProps) {
  const { processId } = await params;
  return <GroupProcessDetail processId={processId} />;
}
