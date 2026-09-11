import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { FormTemplateManager } from "./form-template-manager";

export default function FormulariosPage() {
  return (
    <AuthenticatedShell activePage="forms">
      <FormTemplateManager />
    </AuthenticatedShell>
  );
}
