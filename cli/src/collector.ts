import { randomUUID } from "crypto";
import { spawn } from "child_process";
import {
  createSession,
  finishSession,
  addEvent
} from "@agent-lens/core";

export async function runAgent(
  command: string,
  args: string[]
): Promise<number> {
  const sessionId = randomUUID();
  const startedAt = new Date().toISOString();

  const fullCommand = [command, ...args].join(" ");

  console.log("");
  console.log("╭─────────────────────────────────────────────╮");
  console.log("│ Agent Lens                                  │");
  console.log("╰─────────────────────────────────────────────╯");
  console.log("");
  console.log(`Session: ${sessionId}`);
  console.log(`Command: ${fullCommand}`);
  console.log("");

  createSession({
    id: sessionId,
    command: fullCommand,
    startedAt,
    status: "running"
  });

  addEvent({
    sessionId,
    type: "session_start",
    timestamp: startedAt,
    data: {
      command: fullCommand
    }
  });

  addEvent({
    sessionId,
    type: "command",
    timestamp: new Date().toISOString(),
    data: {
      command: fullCommand
    }
  });

  const child = spawn(command, args, {
    shell: true,
    stdio: ["inherit", "pipe", "pipe"]
  });

  child.stdout.on("data", chunk => {
    const text = chunk.toString();

    process.stdout.write(text);

    addEvent({
      sessionId,
      type: "stdout",
      timestamp: new Date().toISOString(),
      data: {
        text
      }
    });
  });

  child.stderr.on("data", chunk => {
    const text = chunk.toString();

    process.stderr.write(text);

    addEvent({
      sessionId,
      type: "stderr",
      timestamp: new Date().toISOString(),
      data: {
        text
      }
    });
  });

  return new Promise(resolve => {
    child.on("close", code => {
      const success = code === 0;
      const endedAt = new Date().toISOString();

      addEvent({
        sessionId,
        type: "session_end",
        timestamp: endedAt,
        data: {
          exitCode: code
        }
      });

      finishSession(
        sessionId,
        success ? "success" : "failed",
        endedAt
      );

      console.log("");
      console.log(
        success
          ? "✓ Agent session completed successfully."
          : `✗ Agent session failed with exit code ${code}.`
      );

      console.log("");
      console.log(`Session ID: ${sessionId}`);
      console.log("");

      resolve(code ?? 1);
    });
  });
}
