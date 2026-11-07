import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { ProcessSamplesWorkspace } from "./samples-workspace";
import type { ProcessSamplesPageProps } from "@/types/ProcessOperations";

export default async function ProcessSamplesPage({ params }: ProcessSamplesPageProps) {
  const route = await params;
  return <AuthenticatedShell activePage="process-samples"><ProcessSamplesWorkspace processId={route.processId} /></AuthenticatedShell>;
}
