import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { CompositionWorkspace } from "../composition-workspace";

export default function ProcessCompositionIndexPage() {
  return <AuthenticatedShell activePage="process-composition"><CompositionWorkspace /></AuthenticatedShell>;
}
