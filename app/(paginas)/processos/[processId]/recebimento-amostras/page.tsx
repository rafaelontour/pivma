import { ProcessSamplesWorkspace } from "../amostras/samples-workspace";
import type { ProcessSamplesPageProps } from "@/types/ProcessOperations";

export default async function SampleReceiptPage({ params }: ProcessSamplesPageProps) {
  const route = await params;
  return <ProcessSamplesWorkspace processId={route.processId} />;
}
