import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { SettingsBackLink } from "@/app/(paginas)/configuracoes/settings-back-link";
import { FormTemplateManager } from "./form-template-manager";

export default function FormulariosPage() {
  return (
    <AuthenticatedShell activePage="forms">
      <div className="pt-6">
        <SettingsBackLink currentModuleName="Formulários" />
      </div>
      <FormTemplateManager />
    </AuthenticatedShell>
  );
}
