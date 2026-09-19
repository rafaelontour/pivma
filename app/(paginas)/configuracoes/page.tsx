import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { SettingsHub } from "./settings-hub";

export default function ConfiguracoesPage() {
  return (
    <AuthenticatedShell activePage="settings">
      <SettingsHub />
    </AuthenticatedShell>
  );
}
