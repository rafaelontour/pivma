import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { SubmissionCatalog } from "./submission-catalog";

export default function SubmissoesPage() {
  return (
    <AuthenticatedShell activePage="submissions">
      <SubmissionCatalog />
    </AuthenticatedShell>
  );
}
