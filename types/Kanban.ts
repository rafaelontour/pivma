import type { ProcessInstance } from "./Processo";
import type { ProcessTask } from "./Tarefa";

export type ProcessOperationalStage =
  | "new"
  | "review"
  | "ongoing"
  | "closed";

export type ProcessReviewState =
  | "awaiting-triage"
  | "ready-for-analysis"
  | "bracvam-review"
  | "awaiting-proponent"
  | "correction-received"
  | "in-progress"
  | "closed";

export type ProcessStagePresentation = {
  key: ProcessOperationalStage;
  tone: "teal" | "amber" | "blue" | "violet" | "slate";
};

export type ProcessKanbanItem = {
  process: ProcessInstance;
  tasks: ProcessTask[];
  stage: ProcessOperationalStage;
  reviewState: ProcessReviewState;
  currentTask: ProcessTask | null;
  currentPhase: ProcessTask["phase"] | null;
  canAnalyze: boolean;
};

export type ProcessKanbanColumn = {
  key: ProcessOperationalStage;
  label: string;
  description: string;
  items: ProcessKanbanItem[];
  total: number;
  tone: ProcessStagePresentation["tone"];
};

export type ProcessKanbanState =
  | { kind: "loading" }
  | { kind: "denied" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      processes: ProcessInstance[];
      tasks: ProcessTask[];
      updatedAt: string;
      isRefreshing: boolean;
      isStale: boolean;
    };

export type ProcessCardProps = {
  item: ProcessKanbanItem;
  onAnalyze: (process: ProcessInstance) => void;
  onViewDetails: (process: ProcessInstance) => void;
};

export type ProcessAnalysisDialogProps = {
  process: ProcessInstance;
  onClose: () => void;
  onCompleted: () => void;
};

export type ProcessDetailsState =
  | { kind: "closed" }
  | { kind: "loading"; process: ProcessInstance }
  | { kind: "error"; process: ProcessInstance; message: string }
  | { kind: "ready"; process: ProcessInstance };

export type ProcessDetailsDialogProps = {
  state: Exclude<ProcessDetailsState, { kind: "closed" }>;
  onClose: () => void;
  onRetry: () => void;
};

export type KanbanMessageProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export type ProcessDetailItemProps = {
  label: string;
  value: string;
};
