"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.createSession = createSession;
exports.finishSession = finishSession;
exports.getSession = getSession;
exports.getSessions = getSessions;
exports.addEvent = addEvent;
exports.events = events;
exports.stats = stats;
exports.providers = providers;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_fs_1 = __importDefault(require("node:fs"));
const node_os_1 = __importDefault(require("node:os"));
const node_path_1 = __importDefault(require("node:path"));
const dir = process.env.AGENT_LENS_DATA_DIR ||
    node_path_1.default.join(node_os_1.default.homedir(), ".agent-lens");
node_fs_1.default.mkdirSync(dir, { recursive: true });
const dbPath = process.env.AGENT_LENS_DB ||
    node_path_1.default.join(dir, "agent-lens.db");
/*
 * Explicit type annotation prevents TS4023 when declaration
 * files are generated.
 */
const database = new better_sqlite3_1.default(dbPath);
exports.db = database;
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
function createSession(session) {
    database.prepare(`
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
  `).run({
        id: session.id,
        command: session.command,
        startedAt: session.startedAt,
        endedAt: session.endedAt ?? null,
        status: session.status,
        provider: session.provider ?? null,
        model: session.model ?? null,
        agent: session.agent ?? null,
        metadata: JSON.stringify(session.metadata ?? {})
    });
}
function finishSession(id, status, endedAt = new Date().toISOString()) {
    const result = database.prepare(`
    UPDATE sessions
    SET status = ?, ended_at = ?
    WHERE id = ?
  `).run(status, endedAt, id);
    return result.changes > 0;
}
function getSession(id) {
    const row = database.prepare(`
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
  `).get(id);
    if (!row) {
        return undefined;
    }
    return {
        ...row,
        metadata: parseJSON(row.metadata)
    };
}
function getSessions(limit = 250) {
    const rows = database.prepare(`
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
  `).all(Math.min(Math.max(Number(limit) || 250, 1), 1000));
    return rows.map(row => ({
        ...row,
        metadata: parseJSON(row.metadata)
    }));
}
function addEvent(event) {
    const result = database.prepare(`
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
  `).run({
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
        data: JSON.stringify(event.data ?? {})
    });
    return Number(result.lastInsertRowid);
}
function events(limit = 250) {
    return database.prepare(`
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
  `).all(Math.min(Math.max(Number(limit) || 250, 1), 1000));
}
function stats() {
    return database.prepare(`
    SELECT
      COUNT(*) AS totalEvents,
      COUNT(DISTINCT session_id) AS totalSessions,

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
  `).get();
}
function providers() {
    return database.prepare(`
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
  `).all();
}
function parseJSON(value) {
    if (!value) {
        return {};
    }
    try {
        return JSON.parse(String(value));
    }
    catch {
        return {};
    }
}
//# sourceMappingURL=storage.js.map