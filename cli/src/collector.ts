import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import type { ChildProcess } from "node:child_process";

import {
  createSession,
  finishSession,
  addEvent
} from "@agent-lens/core";

import {
  createTelemetry,
  detectProvider,
  detectModel,
  extractTokenUsage,
  estimateCost
} from "./telemetry.js";

export async function runAgent(
  command: string,
  args: string[]
): Promise<number> {
  const sessionId = randomUUID();
  const startedAt = new Date().toISOString();

  const fullCommand = [command, ...args]
    .map(value => /\s/.test(value) ? JSON.stringify(value) : value)
    .join(" ");

  let combinedOutput = "";

  const initialProvider = detectProvider(fullCommand);
  const initialModel = detectModel(fullCommand);

  createSession({
    id: sessionId,
    command: fullCommand,
    startedAt,
    status: "running",
    provider: initialProvider,
    model: initialModel
  });

  addEvent({
    sessionId,
    type: "session_start",
    timestamp: startedAt,
    status: "running",
    provider: initialProvider,
    model: initialModel,
    data: { command: fullCommand }
  });

  addEvent({
    sessionId,
    type: "command",
    timestamp: new Date().toISOString(),
    provider: initialProvider,
    model: initialModel,
    data: { command: fullCommand }
  });

  console.log("");
  console.log("╭─────────────────────────────────────────────╮");
  console.log("│ Agent Lens MAX                              │");
  console.log("╰─────────────────────────────────────────────╯");
  console.log("");
  console.log(`Session:  ${sessionId}`);
  console.log(`Command:  ${fullCommand}`);
  console.log(`Provider: ${initialProvider}`);
  console.log(`Model:    ${initialModel}`);
  console.log("");

  let child: ChildProcess;

  try {
    child = spawn(command, args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
      windowsHide: true
    });
  } catch (error) {
    const endedAt = new Date().toISOString();

    addEvent({
      sessionId,
      type: "error",
      timestamp: endedAt,
      status: "error",
      data: {
        message: error instanceof Error
          ? error.message
          : String(error)
      }
    });

    finishSession(sessionId, "failed", endedAt);
    return 1;
  }

  const output = (
    type: "stdout" | "stderr",
    chunk: Buffer
  ) => {
    const text = chunk.toString();

    combinedOutput += text;

    if (type === "stdout") {
      process.stdout.write(text);
    } else {
      process.stderr.write(text);
    }

    const usage = extractTokenUsage(combinedOutput);
    const provider = detectProvider(
      `${fullCommand}\n${combinedOutput}`
    );
    const model = detectModel(
      fullCommand,
      combinedOutput
    );

    addEvent({
      sessionId,
      type,
      timestamp: new Date().toISOString(),
      status: type === "stderr" ? "error" : undefined,
      provider,
      model,
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
      totalTokens: usage.totalTokens,
      cost: estimateCost(
        model,
        usage.inputTokens,
        usage.outputTokens
      ),
      data: { text }
    });
  };

  child.stdout?.on("data", chunk =>
    output("stdout", chunk)
  );

  child.stderr?.on("data", chunk =>
    output("stderr", chunk)
  );

  return await new Promise<number>(resolve => {
    let settled = false;

    const complete = (code: number) => {
      if (settled) {
        return;
      }

      settled = true;

      const endedAt = new Date().toISOString();
      const telemetry = createTelemetry(
        fullCommand,
        combinedOutput
      );

      addEvent({
        sessionId,
        type: "model_call",
        timestamp: endedAt,
        status: code === 0 ? "success" : "error",
        provider: telemetry.provider,
        model: telemetry.model,
        inputTokens: telemetry.inputTokens,
        outputTokens: telemetry.outputTokens,
        totalTokens: telemetry.totalTokens,
        cost: telemetry.cost,
        data: telemetry
      });

      addEvent({
        sessionId,
        type: "telemetry",
        timestamp: endedAt,
        status: code === 0 ? "success" : "error",
        provider: telemetry.provider,
        model: telemetry.model,
        inputTokens: telemetry.inputTokens,
        outputTokens: telemetry.outputTokens,
        totalTokens: telemetry.totalTokens,
        cost: telemetry.cost,
        data: telemetry
      });

      addEvent({
        sessionId,
        type: "session_end",
        timestamp: endedAt,
        status: code === 0 ? "success" : "error",
        provider: telemetry.provider,
        model: telemetry.model,
        inputTokens: telemetry.inputTokens,
        outputTokens: telemetry.outputTokens,
        totalTokens: telemetry.totalTokens,
        cost: telemetry.cost,
        data: {
          exitCode: code
        }
      });

      finishSession(
        sessionId,
        code === 0 ? "success" : "failed",
        endedAt
      );

      console.log("");
      console.log(
        code === 0
          ? "✓ Agent session completed successfully."
          : `✗ Agent session failed with exit code ${code}.`
      );
      console.log(`Provider: ${telemetry.provider}`);
      console.log(`Model: ${telemetry.model}`);
      console.log(`Tokens: ${telemetry.totalTokens}`);
      console.log(`Estimated cost: $${telemetry.cost.toFixed(6)}`);
      console.log(`Session ID: ${sessionId}`);
      console.log("");

      resolve(code);
    };

    child.once("error", () => complete(1));

    child.once("close", code =>
      complete(code ?? 1)
    );

    const shutdown = () => {
      if (!child.killed) {
        child.kill();
      }
    };

    process.once("SIGINT", shutdown);
    process.once("SIGTERM", shutdown);
  });
}
