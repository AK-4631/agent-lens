import express from "express";
import { randomUUID } from "node:crypto";

const app = express();
const PORT = Number(process.env.PORT) || 8787;

app.use(express.json());

const events: any[] = [];

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "agent-lens-api",
    events: events.length
  });
});

app.post("/events", (req, res) => {
  const event = {
    id: randomUUID(),
    receivedAt: new Date().toISOString(),
    ...req.body
  };

  events.push(event);

  res.status(201).json({
    success: true,
    event
  });
});

app.get("/events", (_req, res) => {
  res.json({
    count: events.length,
    events
  });
});

app.listen(PORT, () => {
  console.log("");
  console.log("==================================");
  console.log("       AGENT LENS API");
  console.log("==================================");
  console.log("");
  console.log("API:    http://localhost:" + PORT);
  console.log("Health: http://localhost:" + PORT + "/health");
  console.log("Events: http://localhost:" + PORT + "/events");
  console.log("");
});