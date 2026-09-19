import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { AiObservability } from "./ai-observability";

export default function AiObservabilityPage() {
  return (
    <AuthenticatedShell activePage="ai-observability">
      <AiObservability />
    </AuthenticatedShell>
  );
}
