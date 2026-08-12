export type EventType = "session_start" | "session_end" | "model_call" | "tool_call" | "command" | "stdout" | "stderr" | "file_change" | "error" | "custom";
export interface AgentEvent {
    id?: number;
    sessionId: string;
    type: EventType;
    timestamp: string;
    status?: "running" | "success" | "error" | "cancelled";
    provider?: string;
    model?: string;
    agent?: string;
    latencyMs?: number;
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    cost?: number;
    data: Record<string, unknown>;
}
