import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { OperationalObservability } from "./operational-observability";

export default function OperationalObservabilityPage() {
  return (
    <AuthenticatedShell activePage="operational-observability">
      <OperationalObservability />
    </AuthenticatedShell>
  );
}
