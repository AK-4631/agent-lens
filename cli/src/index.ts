import { runAgent } from "./collector.js";
import { startServer } from "./server.js";

async function main() {

  const args = process.argv.slice(2);

  const command = args[0];

  if (command === "run") {

    const target = args[1];

    const targetArgs = args.slice(2);

    if (!target) {
      console.error(
        "Usage: agent-lens run <command> [args...]"
      );

      process.exitCode = 1;
      return;
    }

    const code =
      await runAgent(
        target,
        targetArgs
      );

    process.exitCode = code;
    return;
  }

  const port =
    Number(
      process.env.AGENT_LENS_PORT || 4321
    );

  startServer(port);
}

main().catch(error => {

  console.error(
    "Fatal Agent Lens error:",
    error
  );

  process.exitCode = 1;
});
