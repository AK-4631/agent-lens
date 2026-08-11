import Database from "better-sqlite3";
import path from "path";
import os from "os";
import { AgentEvent, Session } from "./event";

const dataDir = path.join(os.homedir(), ".agent-lens");

const fs = require("fs");

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "agent-lens.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    started_at TEXT NOT NULL,
    ended_at TEXT,
    status TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    data TEXT NOT NULL,
    FOREIGN KEY(session_id) REFERENCES sessions(id)
  );
`);

export function createSession(session: Session) {
  const stmt = db.prepare(`
    INSERT INTO sessions
    (id, command, started_at, ended_at, status)
    VALUES (?, ?, ?, ?, ?)
  `);

  stmt.run(
    session.id,
    session.command,
    session.startedAt,
    session.endedAt ?? null,
    session.status
  );
}

export function finishSession(
  id: string,
  status: "success" | "failed",
  endedAt: string
) {
  db.prepare(`
    UPDATE sessions
    SET status = ?, ended_at = ?
    WHERE id = ?
  `).run(status, endedAt, id);
}

export function addEvent(event: AgentEvent) {
  db.prepare(`
    INSERT INTO events
    (session_id, type, timestamp, data)
    VALUES (?, ?, ?, ?)
  `).run(
    event.sessionId,
    event.type,
    event.timestamp,
    JSON.stringify(event.data)
  );
}

export function getSessions() {
  const sessions = db.prepare(`
    SELECT
      id,
      command,
      started_at AS startedAt,
      ended_at AS endedAt,
      status
    FROM sessions
    ORDER BY started_at DESC
  `).all();

  return sessions;
}

export function getSession(id: string) {
  const session = db.prepare(`
    SELECT
      id,
      command,
      started_at AS startedAt,
      ended_at AS endedAt,
      status
    FROM sessions
    WHERE id = ?
  `).get(id);

  if (!session) {
    return null;
  }

  const events = db.prepare(`
    SELECT
      id,
      session_id AS sessionId,
      type,
      timestamp,
      data
    FROM events
    WHERE session_id = ?
    ORDER BY timestamp ASC
  `).all(id) as any[];

  return {
    session,
    events: events.map(event => ({
      ...event,
      data: JSON.parse(event.data)
    }))
  };
}

export function getStats() {
  const sessions = db.prepare(`
    SELECT
      COUNT(*) AS totalSessions,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successfulSessions,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) AS failedSessions
    FROM sessions
  `).get() as any;

  const events = db.prepare(`
    SELECT COUNT(*) AS totalEvents
    FROM events
  `).get() as any;

  return {
    totalSessions: sessions.totalSessions,
    successfulSessions: sessions.successfulSessions,
    failedSessions: sessions.failedSessions,
    totalEvents: events.totalEvents
  };
}
