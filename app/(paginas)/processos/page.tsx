import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { ProcessKanban } from "./process-kanban";

export default function ProcessosPage() {
  return (
    <AuthenticatedShell activePage="processes">
      <ProcessKanban />
    </AuthenticatedShell>
  );
}
