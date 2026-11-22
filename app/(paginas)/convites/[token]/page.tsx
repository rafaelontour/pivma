import { InviteWorkspace } from "./invite-workspace";
import type { InvitePageProps } from "@/types/ParticipacaoProcesso";

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  return <InviteWorkspace token={token} />;
}
