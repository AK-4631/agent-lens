import express from "express";
import {
  getSessions,
  getSession,
  getStats
} from "@agent-lens/core";

export function startServer(port = 4321) {
  const app = express();

  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/sessions", (_req, res) => {
    res.json(getSessions());
  });

  app.get("/api/sessions/:id", (req, res) => {
    const session = getSession(req.params.id);

    if (!session) {
      return res.status(404).json({
        error: "Session not found"
      });
    }

    res.json(session);
  });

  app.get("/api/stats", (_req, res) => {
    res.json(getStats());
  });

  app.listen(port, () => {
    console.log("");
    console.log(`Agent Lens dashboard API running on http://localhost:${port}`);
    console.log("");
  });
}
