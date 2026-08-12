export type UsageSource =
  | "provider-native"
  | "agent-lens"
  | "unknown";

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  source: UsageSource;
};

export type Telemetry = {
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  usageSource: UsageSource;
};

const PROVIDERS: Array<[string, RegExp]> = [
  ["OpenAI", /openai|gpt-|o1-|o3-|o4-|o5-|chatgpt/i],
  ["Anthropic", /anthropic|claude/i],
  ["Google", /google|gemini/i],
  ["Mistral", /mistral/i],
  ["Meta", /llama|meta-ai/i],
  ["DeepSeek", /deepseek/i],
  ["xAI", /grok|xai/i],
  ["Groq", /groq/i],
  ["Cohere", /cohere/i],
  ["OpenRouter", /openrouter/i],
  ["Ollama", /ollama/i]
];

const MODELS: RegExp[] = [
  /\b(gpt-[\w.-]+)\b/i,
  /\b(o[1-5](?:-[\w.-]+)?)\b/i,
  /\b(claude-[\w.-]+)\b/i,
  /\b(gemini-[\w.-]+)\b/i,
  /\b(deepseek-[\w.-]+)\b/i,
  /\b(llama-[\w.-]+)\b/i,
  /\b(mistral-[\w.-]+)\b/i,
  /\b(grok-[\w.-]+)\b/i
];

function numberFrom(
  text: string,
  patterns: RegExp[]
): number {
  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      const value = Number(match[1]);

      if (
        Number.isFinite(value) &&
        value >= 0
      ) {
        return value;
      }
    }
  }

  return 0;
}

export function detectProvider(
  command: string,
  environment: NodeJS.ProcessEnv = process.env
): string {
  const haystack = [
    command,
    environment.AI_PROVIDER,
    environment.PROVIDER,
    environment.OPENAI_API_KEY
      ? "openai"
      : "",
    environment.ANTHROPIC_API_KEY
      ? "anthropic"
      : "",
    environment.GOOGLE_API_KEY
      ? "google"
      : "",
    environment.GEMINI_API_KEY
      ? "gemini"
      : "",
    environment.GROQ_API_KEY
      ? "groq"
      : "",
    environment.OPENROUTER_API_KEY
      ? "openrouter"
      : "",
    environment.OLLAMA_HOST
      ? "ollama"
      : ""
  ].join(" ");

  for (const [provider, pattern] of PROVIDERS) {
    if (pattern.test(haystack)) {
      return provider;
    }
  }

  return "Unknown";
}

export function detectModel(
  command: string,
  text = "",
  environment: NodeJS.ProcessEnv = process.env
): string {
  const explicit =
    environment.AI_MODEL ||
    environment.MODEL ||
    environment.OPENAI_MODEL ||
    environment.ANTHROPIC_MODEL ||
    environment.GEMINI_MODEL;

  if (explicit) {
    return explicit;
  }

  const haystack =
    `${command}\n${text}`;

  for (const pattern of MODELS) {
    const match =
      haystack.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "Unknown";
}

/*
 * Provider-native usage.
 *
 * This only reports provider-native when
 * recognizable provider usage fields exist.
 */
export function extractProviderNativeUsage(
  text: string
): TokenUsage | null {
  if (!text.trim()) {
    return null;
  }

  // OpenAI / OpenAI-compatible
  const promptTokens =
    numberFrom(text, [
      /"prompt_tokens"\s*:\s*(\d+)/i
    ]);

  const completionTokens =
    numberFrom(text, [
      /"completion_tokens"\s*:\s*(\d+)/i
    ]);

  const totalTokens =
    numberFrom(text, [
      /"total_tokens"\s*:\s*(\d+)/i
    ]);

  if (
    promptTokens > 0 ||
    completionTokens > 0 ||
    totalTokens > 0
  ) {
    return {
      inputTokens: promptTokens,
      outputTokens: completionTokens,
      totalTokens:
        totalTokens ||
        promptTokens +
        completionTokens,
      source: "provider-native"
    };
  }

  // Anthropic
  const anthropicInput =
    numberFrom(text, [
      /"input_tokens"\s*:\s*(\d+)/i
    ]);

  const anthropicOutput =
    numberFrom(text, [
      /"output_tokens"\s*:\s*(\d+)/i
    ]);

  if (
    anthropicInput > 0 ||
    anthropicOutput > 0
  ) {
    return {
      inputTokens: anthropicInput,
      outputTokens: anthropicOutput,
      totalTokens:
        anthropicInput +
        anthropicOutput,
      source: "provider-native"
    };
  }

  // Gemini
  const geminiInput =
    numberFrom(text, [
      /"promptTokenCount"\s*:\s*(\d+)/i
    ]);

  const geminiOutput =
    numberFrom(text, [
      /"candidatesTokenCount"\s*:\s*(\d+)/i
    ]);

  const geminiTotal =
    numberFrom(text, [
      /"totalTokenCount"\s*:\s*(\d+)/i
    ]);

  if (
    geminiInput > 0 ||
    geminiOutput > 0 ||
    geminiTotal > 0
  ) {
    return {
      inputTokens: geminiInput,
      outputTokens: geminiOutput,
      totalTokens:
        geminiTotal ||
        geminiInput +
        geminiOutput,
      source: "provider-native"
    };
  }

  return null;
}

/*
 * Agent Lens fallback extraction.
 */
export function extractAgentLensUsage(
  text: string
): TokenUsage {
  const inputTokens =
    numberFrom(text, [
      /input[_\s-]*tokens?\s*[:=]\s*(\d+)/i,
      /prompt[_\s-]*tokens?\s*[:=]\s*(\d+)/i
    ]);

  const outputTokens =
    numberFrom(text, [
      /output[_\s-]*tokens?\s*[:=]\s*(\d+)/i,
      /completion[_\s-]*tokens?\s*[:=]\s*(\d+)/i
    ]);

  const explicitTotal =
    numberFrom(text, [
      /total[_\s-]*tokens?\s*[:=]\s*(\d+)/i,
      /tokens?\s+used\s*[:=]\s*(\d+)/i
    ]);

  return {
    inputTokens,
    outputTokens,
    totalTokens:
      explicitTotal ||
      inputTokens +
      outputTokens,
    source:
      inputTokens > 0 ||
      outputTokens > 0 ||
      explicitTotal > 0
        ? "agent-lens"
        : "unknown"
  };
}

/*
 * Unified API.
 *
 * Provider-native data takes priority.
 */
export function extractTokenUsage(
  text: string
): TokenUsage {
  return (
    extractProviderNativeUsage(text) ??
    extractAgentLensUsage(text)
  );
}

/*
 * Backward compatibility.
 */
export function extractUsage(
  text: string
): TokenUsage {
  return extractTokenUsage(text);
}

type Pricing = {
  input: number;
  output: number;
};

const PRICING: Record<string, Pricing> = {
  "gpt-4o": {
    input: 2.5,
    output: 10
  },
  "gpt-4o-mini": {
    input: 0.15,
    output: 0.6
  },
  "gpt-4.1": {
    input: 2,
    output: 8
  },
  "gpt-4.1-mini": {
    input: 0.4,
    output: 1.6
  },
  "gpt-4.1-nano": {
    input: 0.1,
    output: 0.4
  },
  "claude-3-5-sonnet": {
    input: 3,
    output: 15
  },
  "claude-3-7-sonnet": {
    input: 3,
    output: 15
  },
  "claude-3-5-haiku": {
    input: 0.8,
    output: 4
  },
  "gemini-2.5-pro": {
    input: 1.25,
    output: 10
  },
  "gemini-2.5-flash": {
    input: 0.3,
    output: 2.5
  },
  "deepseek-chat": {
    input: 0.27,
    output: 1.1
  }
};

function findPricing(
  model: string
): Pricing | null {
  const normalized =
    model.toLowerCase();

  for (
    const [name, pricing]
    of Object.entries(PRICING)
  ) {
    if (normalized.includes(name)) {
      return pricing;
    }
  }

  return null;
}

export function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing =
    findPricing(model);

  if (!pricing) {
    return 0;
  }

  const inputCost =
    inputTokens /
    1_000_000 *
    pricing.input;

  const outputCost =
    outputTokens /
    1_000_000 *
    pricing.output;

  return Number(
    (
      inputCost +
      outputCost
    ).toFixed(8)
  );
}

export function createTelemetry(
  command: string,
  text = ""
): Telemetry {
  const usage =
    extractTokenUsage(text);

  const provider =
    detectProvider(command);

  const model =
    detectModel(
      command,
      text
    );

  return {
    provider,
    model,
    inputTokens:
      usage.inputTokens,
    outputTokens:
      usage.outputTokens,
    totalTokens:
      usage.totalTokens,
    cost:
      estimateCost(
        model,
        usage.inputTokens,
        usage.outputTokens
      ),
    usageSource:
      usage.source
  };
}
