import Database from "better-sqlite3";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { AgentEvent } from "./event.js";
import type {
  AgentSession,
  SessionStatus
} from "./session.js";

const dataDir =
  process.env.AGENT_LENS_DATA_DIR ||
  path.join(os.homedir(), ".agent-lens");

fs.mkdirSync(dataDir, { recursive: true });

const dbPath =
  process.env.AGENT_LENS_DB ||
  path.join(dataDir, "agent-lens.db");

const database: Database.Database =
  new Database(dbPath);

database.pragma("journal_mode = WAL");
database.pragma("synchronous = NORMAL");
database.pragma("busy_timeout = 5000");
database.pragma("foreign_keys = ON");

database.exec(`
CREATE TABLE IF NOT EXISTS sessions(
  id TEXT PRIMARY KEY,
  command TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  status TEXT NOT NULL,
  provider TEXT,
  model TEXT,
  agent TEXT,
  metadata TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  type TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  status TEXT,
  provider TEXT,
  model TEXT,
  agent TEXT,
  latency_ms REAL,
  input_tokens INTEGER,
  output_tokens INTEGER,
  total_tokens INTEGER,
  cost REAL,
  data TEXT DEFAULT '{}',
  FOREIGN KEY(session_id)
    REFERENCES sessions(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_events_session_time
ON events(session_id, timestamp);

CREATE INDEX IF NOT EXISTS idx_events_time
ON events(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_events_provider
ON events(provider);

CREATE INDEX IF NOT EXISTS idx_events_type
ON events(type);

CREATE INDEX IF NOT EXISTS idx_sessions_started
ON sessions(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_status
ON sessions(status);
`);

interface SessionRow {
  id: string;
  command: string;
  startedAt: string;
  endedAt?: string | null;
  status: SessionStatus;
  provider?: string | null;
  model?: string | null;
  agent?: string | null;
  metadata: string;
}

export interface EventRow {
  id: number;
  sessionId: string;
  type: string;
  timestamp: string;
  status?: string | null;
  provider?: string | null;
  model?: string | null;
  agent?: string | null;
  latencyMs?: number | null;
  inputTokens?: number | null;
  outputTokens?: number | null;
  totalTokens?: number | null;
  cost?: number | null;
  data: string;
}

export interface Stats {
  totalEvents: number;
  totalSessions: number;
  errors: number;
  totalTokens: number;
  totalCost: number;
  avgLatency: number;
  successfulSessions: number;
  failedSessions: number;
  runningSessions: number;
}

export interface ProviderStats {
  provider: string;
  events: number;
  tokens: number;
  cost: number;
  avgLatency: number;
}

function clampLimit(value: number): number {
  if (!Number.isFinite(value)) {
    return 250;
  }

  return Math.min(
    Math.max(Math.floor(value), 1),
    1000
  );
}

function parseJSON(
  value: unknown
): Record<string, unknown> {
  if (!value) {
    return {};
  }

  try {
    const parsed = JSON.parse(String(value));

    if (
      parsed &&
      typeof parsed === "object" &&
      !Array.isArray(parsed)
    ) {
      return parsed;
    }
  } catch {
    // Ignore malformed metadata.
  }

  return {};
}

export function createSession(
  session: AgentSession
): void {
  database
    .prepare(`
      INSERT INTO sessions(
        id,
        command,
        started_at,
        ended_at,
        status,
        provider,
        model,
        agent,
        metadata
      )
      VALUES(
        @id,
        @command,
        @startedAt,
        @endedAt,
        @status,
        @provider,
        @model,
        @agent,
        @metadata
      )
    `)
    .run({
      id: session.id,
      command: session.command,
      startedAt: session.startedAt,
      endedAt: session.endedAt ?? null,
      status: session.status,
      provider: session.provider ?? null,
      model: session.model ?? null,
      agent: session.agent ?? null,
      metadata: JSON.stringify(
        session.metadata ?? {}
      )
    });
}

export function finishSession(
  id: string,
  status: SessionStatus,
  endedAt = new Date().toISOString()
): boolean {
  const result = database
    .prepare(`
      UPDATE sessions
      SET
        status = ?,
        ended_at = ?
      WHERE id = ?
    `)
    .run(status, endedAt, id);

  return result.changes > 0;
}

export function getSession(
  id: string
): AgentSession | undefined {
  const row = database
    .prepare(`
      SELECT
        id,
        command,
        started_at AS startedAt,
        ended_at AS endedAt,
        status,
        provider,
        model,
        agent,
        metadata
      FROM sessions
      WHERE id = ?
    `)
    .get(id) as SessionRow | undefined;

  if (!row) {
    return undefined;
  }

  return {
    id: row.id,
    command: row.command,
    startedAt: row.startedAt,
    ...(row.endedAt
      ? { endedAt: row.endedAt }
      : {}),
    status: row.status,
    ...(row.provider
      ? { provider: row.provider }
      : {}),
    ...(row.model
      ? { model: row.model }
      : {}),
    ...(row.agent
      ? { agent: row.agent }
      : {}),
    metadata: parseJSON(row.metadata)
  };
}

export function getSessions(
  limit = 250
): AgentSession[] {
  const rows = database
    .prepare(`
      SELECT
        id,
        command,
        started_at AS startedAt,
        ended_at AS endedAt,
        status,
        provider,
        model,
        agent,
        metadata
      FROM sessions
      ORDER BY started_at DESC
      LIMIT ?
    `)
    .all(clampLimit(limit)) as SessionRow[];

  return rows.map(row => ({
    id: row.id,
    command: row.command,
    startedAt: row.startedAt,
    ...(row.endedAt
      ? { endedAt: row.endedAt }
      : {}),
    status: row.status,
    ...(row.provider
      ? { provider: row.provider }
      : {}),
    ...(row.model
      ? { model: row.model }
      : {}),
    ...(row.agent
      ? { agent: row.agent }
      : {}),
    metadata: parseJSON(row.metadata)
  }));
}

export function addEvent(
  event: AgentEvent
): number {
  const result = database
    .prepare(`
      INSERT INTO events(
        session_id,
        type,
        timestamp,
        status,
        provider,
        model,
        agent,
        latency_ms,
        input_tokens,
        output_tokens,
        total_tokens,
        cost,
        data
      )
      VALUES(
        @sessionId,
        @type,
        @timestamp,
        @status,
        @provider,
        @model,
        @agent,
        @latencyMs,
        @inputTokens,
        @outputTokens,
        @totalTokens,
        @cost,
        @data
      )
    `)
    .run({
      sessionId: event.sessionId,
      type: event.type,
      timestamp: event.timestamp,
      status: event.status ?? null,
      provider: event.provider ?? null,
      model: event.model ?? null,
      agent: event.agent ?? null,
      latencyMs: event.latencyMs ?? null,
      inputTokens: event.inputTokens ?? null,
      outputTokens: event.outputTokens ?? null,
      totalTokens: event.totalTokens ?? null,
      cost: event.cost ?? null,
      data: JSON.stringify(
        event.data ?? {}
      )
    });

  return Number(result.lastInsertRowid);
}

export function events(
  limit = 250
): EventRow[] {
  return database
    .prepare(`
      SELECT
        id,
        session_id AS sessionId,
        type,
        timestamp,
        status,
        provider,
        model,
        agent,
        latency_ms AS latencyMs,
        input_tokens AS inputTokens,
        output_tokens AS outputTokens,
        total_tokens AS totalTokens,
        cost,
        data
      FROM events
      ORDER BY timestamp DESC, id DESC
      LIMIT ?
    `)
    .all(clampLimit(limit)) as EventRow[];
}

export function stats(): Stats {
  const result = database
    .prepare(`
      SELECT
        COUNT(*) AS totalEvents,

        COUNT(DISTINCT session_id)
          AS totalSessions,

        COALESCE(
          SUM(
            CASE
              WHEN status = 'error'
                OR type = 'error'
              THEN 1
              ELSE 0
            END
          ),
          0
        ) AS errors,

        COALESCE(
          SUM(
            COALESCE(
              total_tokens,
              COALESCE(input_tokens, 0)
                + COALESCE(output_tokens, 0),
              0
            )
          ),
          0
        ) AS totalTokens,

        COALESCE(
          SUM(COALESCE(cost, 0)),
          0
        ) AS totalCost,

        COALESCE(
          AVG(latency_ms),
          0
        ) AS avgLatency

      FROM events
    `)
    .get() as {
      totalEvents: number;
      totalSessions: number;
      errors: number;
      totalTokens: number;
      totalCost: number;
      avgLatency: number;
    };

  const sessionCounts = database
    .prepare(`
      SELECT
        SUM(
          CASE
            WHEN status = 'success'
            THEN 1 ELSE 0
          END
        ) AS successfulSessions,

        SUM(
          CASE
            WHEN status = 'failed'
            THEN 1 ELSE 0
          END
        ) AS failedSessions,

        SUM(
          CASE
            WHEN status = 'running'
            THEN 1 ELSE 0
          END
        ) AS runningSessions

      FROM sessions
    `)
    .get() as {
      successfulSessions: number | null;
      failedSessions: number | null;
      runningSessions: number | null;
    };

  return {
    totalEvents: Number(result.totalEvents),
    totalSessions: Number(result.totalSessions),
    errors: Number(result.errors),
    totalTokens: Number(result.totalTokens),
    totalCost: Number(result.totalCost),
    avgLatency: Number(result.avgLatency),
    successfulSessions:
      Number(sessionCounts.successfulSessions ?? 0),
    failedSessions:
      Number(sessionCounts.failedSessions ?? 0),
    runningSessions:
      Number(sessionCounts.runningSessions ?? 0)
  };
}

export function providers(): ProviderStats[] {
  return database
    .prepare(`
      SELECT
        COALESCE(
          NULLIF(provider, ''),
          'Unknown'
        ) AS provider,

        COUNT(*) AS events,

        COALESCE(
          SUM(
            COALESCE(
              total_tokens,
              COALESCE(input_tokens, 0)
                + COALESCE(output_tokens, 0),
              0
            )
          ),
          0
        ) AS tokens,

        COALESCE(
          SUM(COALESCE(cost, 0)),
          0
        ) AS cost,

        COALESCE(
          AVG(latency_ms),
          0
        ) AS avgLatency

      FROM events
      GROUP BY provider
      ORDER BY events DESC
    `)
    .all() as ProviderStats[];
}

export function sessionEvents(
  sessionId: string,
  limit = 1000
): EventRow[] {
  return database
    .prepare(`
      SELECT
        id,
        session_id AS sessionId,
        type,
        timestamp,
        status,
        provider,
        model,
        agent,
        latency_ms AS latencyMs,
        input_tokens AS inputTokens,
        output_tokens AS outputTokens,
        total_tokens AS totalTokens,
        cost,
        data
      FROM events
      WHERE session_id = ?
      ORDER BY timestamp ASC, id ASC
      LIMIT ?
    `)
    .all(
      sessionId,
      clampLimit(limit)
    ) as EventRow[];
}

export function databaseInfo() {
  return {
    path: dbPath,
    dataDir,
    journalMode: "WAL"
  };
}
