export type ProcessTaskStatus = "READY" | "COMPLETED" | "CANCELLED";

export type ProcessTask = {
  id: string;
  process: {
    id: string;
    code: string;
    title: string;
  };
  activity_key: string;
  activity_run_number: number;
  phase: {
    key: string;
    order: number;
  };
  title: string;
  assigned_role: string | null;
  status: ProcessTaskStatus;
  due_date: string | null;
  can_act: boolean;
};

export type ProcessTaskList = {
  items: ProcessTask[];
  total: number;
  page: number;
  size: number;
};

export type ProcessTaskListOptions = {
  page: number;
  size: number;
};
