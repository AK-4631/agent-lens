import {
  detectProvider,
  detectModel,
  extractProviderNativeUsage,
  extractAgentLensUsage,
  extractTokenUsage,
  estimateCost
} from "./telemetry.js";

function assert(
  condition: boolean,
  message: string
): void {
  if (!condition) {
    throw new Error(
      `TEST FAILED: ${message}`
    );
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

const native =
  extractProviderNativeUsage(
    JSON.stringify({
      usage: {
        prompt_tokens: 1000,
        completion_tokens: 500,
        total_tokens: 1500
      }
    })
  );

assert(
  native !== null,
  "native usage detected"
);

assert(
  native?.source ===
    "provider-native",
  "native source"
);

assert(
  native?.inputTokens === 1000,
  "native input tokens"
);

assert(
  native?.outputTokens === 500,
  "native output tokens"
);

assert(
  native?.totalTokens === 1500,
  "native total tokens"
);

const fallback =
  extractAgentLensUsage(
    "input_tokens: 200 output_tokens: 100"
  );

assert(
  fallback.source === "agent-lens",
  "fallback source"
);

assert(
  fallback.inputTokens === 200,
  "fallback input"
);

assert(
  fallback.outputTokens === 100,
  "fallback output"
);

assert(
  fallback.totalTokens === 300,
  "fallback total"
);

const unified =
  extractTokenUsage(
    '{"prompt_tokens":1000,"completion_tokens":500,"total_tokens":1500}'
  );

assert(
  unified.source ===
    "provider-native",
  "native priority"
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
console.log(" AGENT LENS MAX TELEMETRY TEST");
console.log("======================================");
console.log("");
console.log("Provider detection:       PASS");
console.log("Model detection:          PASS");
console.log("Provider-native usage:    PASS");
console.log("Usage source tracking:    PASS");
console.log("Agent Lens fallback:      PASS");
console.log("Unified extraction:       PASS");
console.log("Cost calculation:         PASS");
console.log("");
console.log("ALL TELEMETRY TESTS PASSED");
console.log("");
