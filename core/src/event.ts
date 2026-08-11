export type EventType =
  | "session_start"
  | "session_end"
  | "command"
  | "stdout"
  | "stderr"
  | "file_change"
  | "error";

export interface AgentEvent {
  id?: number;
  sessionId: string;
  type: EventType;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface Session {
  id: string;
  command: string;
  startedAt: string;
  endedAt?: string;
  status: "running" | "success" | "failed";
}
