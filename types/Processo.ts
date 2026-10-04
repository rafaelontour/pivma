export const PROCESS_KANBAN_PERMISSION_CODES = [
  "triage.review",
] as const;

export type ProcessInstance = {
  id: string;
  code: string;
  title: string;
  status: string;
  template_key: string;
  version_number: number;
  started_at?: string | null;
  closed_at?: string | null;
  closure_reason?: string | null;
  available_actions?: ProcessAvailableAction[];
  has_been_submitted?: boolean;
};

export type ProcessAvailableAction = "DELETE" | "ARCHIVE";

export type ProcessList = {
  items: ProcessInstance[];
  total: number;
  page: number;
  size: number;
};

export type ProcessListOptions = {
  page: number;
  size: number;
  status?: string;
};
