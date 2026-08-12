import {
  detectProvider,
  detectModel,
  extractTokenUsage,
  estimateCost
} from "./telemetry.js";

function assert(
  condition: boolean,
  message: string
): void {
  if (!condition) {
    throw new Error(`TEST FAILED: ${message}`);
  }
}

assert(
  detectProvider(
    "agent --provider openai --model gpt-4o"
  ) === "OpenAI",
  "provider detection"
);

assert(
  detectModel(
    "agent --model gpt-4o"
  ) === "gpt-4o",
  "model detection"
);

const usage = extractTokenUsage(
  '{"prompt_tokens":1000,"completion_tokens":500,"total_tokens":1500}'
);

assert(
  usage.inputTokens === 1000,
  "input tokens"
);

assert(
  usage.outputTokens === 500,
  "output tokens"
);

assert(
  usage.totalTokens === 1500,
  "total tokens"
);

assert(
  estimateCost(
    "gpt-4o",
    1_000_000,
    1_000_000
  ) > 0,
  "cost calculation"
);

console.log("");
console.log("======================================");
console.log("       AGENT LENS MAX TESTS");
console.log("======================================");
console.log("");
console.log("Provider detection : PASS");
console.log("Model detection    : PASS");
console.log("Input tokens       : PASS");
console.log("Output tokens      : PASS");
console.log("Total tokens       : PASS");
console.log("Cost calculation   : PASS");
console.log("");
console.log("ALL TESTS PASSED");
console.log("");
