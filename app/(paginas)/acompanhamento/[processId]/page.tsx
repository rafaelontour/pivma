import { SponsorTrackingWorkspace } from "../sponsor-tracking-workspace";
import type { SponsorTrackingDetailPageProps } from "@/types/Acompanhamento";

export default async function SponsorTrackingDetailPage({
  params,
}: SponsorTrackingDetailPageProps) {
  const { processId } = await params;
  return <SponsorTrackingWorkspace processId={processId} />;
}
