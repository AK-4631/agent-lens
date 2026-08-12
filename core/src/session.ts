export type SessionStatus =
  | "running"
  | "success"
  | "failed"
  | "cancelled";

export interface AgentSession {
  id: string;
  command: string;
  startedAt: string;
  endedAt?: string;
  status: SessionStatus;
  provider?: string;
  model?: string;
  agent?: string;
  metadata?: Record<string, unknown>;
}
