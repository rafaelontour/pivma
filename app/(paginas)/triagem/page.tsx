import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { TriageWorkspace } from "./triage-workspace";

export default function TriagemPage() {
  return <AuthenticatedShell activePage="triage"><TriageWorkspace /></AuthenticatedShell>;
}
