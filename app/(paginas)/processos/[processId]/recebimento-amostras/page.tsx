import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { ProcessSamplesWorkspace } from "../amostras/samples-workspace";
import type { ProcessSamplesPageProps } from "@/types/ProcessOperations";

export default async function SampleReceiptPage({ params }: ProcessSamplesPageProps) {
  const route = await params;
  return <AuthenticatedShell activePage="sample-receipt"><ProcessSamplesWorkspace processId={route.processId} /></AuthenticatedShell>;
}
