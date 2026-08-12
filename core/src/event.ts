export type EventType =
  | "session_start"
  | "session_end"
  | "telemetry"
  | "command"
  | "stdout"
  | "stderr"
  | "error"
  | "model_call";

export type AgentEvent = {
  id?: number;
  sessionId: string;
  type: EventType;
  timestamp: string;
  status?: string;
  provider?: string;
  model?: string;
  agent?: string;
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number;
  data?: unknown;
};
