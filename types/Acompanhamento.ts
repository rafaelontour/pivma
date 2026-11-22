import type { ProcessParticipant } from "./ParticipacaoProcesso";
import type { ProcessInstance } from "./Processo";
import type { ProcessTask } from "./Tarefa";

export type SponsorTrackingItem = {
  process: ProcessInstance;
  proponent: ProcessParticipant["user"] | null;
  sponsorAssignedAt: string;
};

export type SponsorTrackingDetail = SponsorTrackingItem & {
  currentTask: ProcessTask | null;
};

export type SponsorTrackingListState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: SponsorTrackingItem[] };

export type SponsorTrackingDetailState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; detail: SponsorTrackingDetail };

export type SponsorTrackingWorkspaceProps = {
  processId?: string;
};

export type SponsorTrackingDetailViewProps = {
  processId: string;
};

export type SponsorTrackingDetailFieldProps = {
  label: string;
  value: string;
};

export type SponsorTrackingLoadingProps = {
  label: string;
};

export type SponsorTrackingErrorProps = {
  message: string;
  onRetry: () => void;
};

export type SponsorTrackingDetailPageProps = {
  params: Promise<{ processId: string }>;
};

export type SponsorTrackingRouteContext = {
  params: Promise<{ processId: string }>;
};
