import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { SettingsBackLink } from "@/app/(paginas)/configuracoes/settings-back-link";
import { UserDirectory } from "./user-directory";

export default function UsuariosPage() {
  return (
    <AuthenticatedShell activePage="users">
      <div className="pt-6">
        <SettingsBackLink currentModuleName="Usuários" />
      </div>
      <UserDirectory />
    </AuthenticatedShell>
  );
}
