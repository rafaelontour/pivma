import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { UserDirectory } from "./user-directory";

export default function UsuariosPage() {
  return (
    <AuthenticatedShell activePage="users">
      <UserDirectory />
    </AuthenticatedShell>
  );
}
