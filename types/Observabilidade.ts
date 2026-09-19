export type ObservabilityConnectionState =
  | "connecting"
  | "live"
  | "disconnected";

export type OperationalEvent = {
  event_id?: string;
  timestamp?: string;
  operation_type: string;
  correlation_id: string;
  actor_user_id?: string | null;
  resource_id?: string | null;
  status?: string;
  total_duration_ms: number;
  specialized_log_ref?: string | null;
  error_summary?: string | null;
  metadata?: Record<string, unknown>;
};

export type AiStepExecution = {
  event_id?: string;
  timestamp?: string;
  correlation_id: string;
  pipeline_name?: string;
  field_key: string;
  step_order: number;
  step_name: string;
  status?: string;
  step_duration_ms: number;
  simulated_cost?: number;
  real_cost?: number;
  model_name?: string | null;
  input_payload?: Record<string, unknown>;
  output_payload?: Record<string, unknown>;
  error_details?: Record<string, unknown> | null;
};

export type AiPipelineExecution = {
  correlation_id: string;
  pipeline_name?: string;
  form_instance_id?: string | null;
  field_key?: string | null;
  status?: string;
  started_at?: string | null;
  completed_at?: string | null;
  total_duration_ms?: number;
  total_cost?: number;
  steps?: AiStepExecution[];
};

export type OperationalHistoryOptions = {
  limit: number;
  status?: string;
  operationType?: string;
};

export type AiHistoryOptions = {
  limit: number;
  correlationId?: string;
};

export type ObservabilityStream = {
  body: ReadableStream<Uint8Array>;
};

export type OperationalFilters = {
  limit: string;
  status: string;
  operationType: string;
};

export type AiFilters = {
  limit: string;
  correlationId: string;
};

export type OperationalObservabilityState =
  | { kind: "loading"; events: OperationalEvent[] }
  | { kind: "denied"; message: string; events: OperationalEvent[] }
  | { kind: "error"; message: string; events: OperationalEvent[] }
  | { kind: "ready"; events: OperationalEvent[] };

export type AiObservabilityState =
  | { kind: "loading"; executions: AiPipelineExecution[] }
  | { kind: "denied"; message: string; executions: AiPipelineExecution[] }
  | { kind: "error"; message: string; executions: AiPipelineExecution[] }
  | { kind: "ready"; executions: AiPipelineExecution[] };

export type ObservabilityMessageProps = {
  message: string;
  onRetry?: () => void;
};

export type ConnectionBadgeProps = {
  state: ObservabilityConnectionState;
};

export type OperationalEventCardProps = {
  event: OperationalEvent;
};

export type AiExecutionCardProps = {
  execution: AiPipelineExecution;
};

export type ObservabilityPayloadDetailsProps = {
  label: string;
  value: unknown;
};
