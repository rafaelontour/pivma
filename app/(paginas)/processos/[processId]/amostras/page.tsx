import { ProcessSamplesWorkspace } from "./samples-workspace";
import type { ProcessSamplesPageProps } from "@/types/ProcessOperations";

export default async function ProcessSamplesPage({ params }: ProcessSamplesPageProps) {
  const route = await params;
  return <ProcessSamplesWorkspace processId={route.processId} />;
}
