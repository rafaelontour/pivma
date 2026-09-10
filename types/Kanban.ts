import type { ProcessInstance } from "./Processo";

export type ProcessStatusPresentation = {
  key: string;
  label: string;
  description: string;
  statusValues: string[];
  tone: "teal" | "amber" | "blue" | "violet" | "slate";
};

export type ProcessKanbanColumn = {
  key: string;
  label: string;
  description: string;
  processes: ProcessInstance[];
  tone: ProcessStatusPresentation["tone"];
  unknown: boolean;
};

export type ProcessKanbanState =
  | { kind: "loading" }
  | { kind: "denied" }
  | { kind: "error"; message: string }
  | {
      kind: "ready";
      processes: ProcessInstance[];
      updatedAt: string;
      isRefreshing: boolean;
      isStale: boolean;
    };

export type ProcessCardProps = {
  process: ProcessInstance;
  onViewDetails: (process: ProcessInstance) => void;
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
