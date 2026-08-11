import http from "node:http";

const port = 4321;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");

  if (req.url === "/health") {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "ok",
      name: "agent-lens",
      version: "0.1.0"
    }));
    return;
  }

  if (req.url === "/") {
    res.writeHead(200);
    res.end(JSON.stringify({
      name: "Agent Lens",
      status: "running",
      version: "0.1.0"
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({
    error: "Not found"
  }));
});

server.listen(port, "127.0.0.1", () => {
  console.log("");
  console.log("==========================================");
  console.log("          AGENT LENS DASHBOARD            ");
  console.log("==========================================");
  console.log("");
  console.log("Dashboard API: http://localhost:4321");
  console.log("Health check:  http://localhost:4321/health");
  console.log("");
  console.log("Agent Lens is running.");
  console.log("Press Ctrl+C to stop.");
  console.log("");
});