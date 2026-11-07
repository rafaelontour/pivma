import { AuthenticatedShell } from "@/app/_components/authenticated-shell";
import { CollectionTemplateManager } from "./template-manager";

export default function CollectionTemplatesPage() {
  return <AuthenticatedShell activePage="collection-templates"><CollectionTemplateManager /></AuthenticatedShell>;
}
