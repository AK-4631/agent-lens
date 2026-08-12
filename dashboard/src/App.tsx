import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  DollarSign,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import "./index.css";

type Event = {
  id: string;
  timestamp: string;
  provider?: string;
  model?: string;
  agent?: string;
  status?: "success" | "error" | "running";
  latencyMs?: number;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cost?: number;
  message?: string;
};

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8787";

const PROVIDERS: Record<string, { name: string; slug: string; color: string }> = {
  openai: {
    name: "OpenAI",
    slug: "openai",
    color: "#10a37f",
  },
  anthropic: {
    name: "Anthropic",
    slug: "anthropic",
    color: "#d97757",
  },
  claude: {
    name: "Claude",
    slug: "anthropic",
    color: "#d97757",
  },
  google: {
    name: "Google",
    slug: "google",
    color: "#4285f4",
  },
  gemini: {
    name: "Gemini",
    slug: "googlegemini",
    color: "#8ab4f8",
  },
  github: {
    name: "GitHub",
    slug: "github",
    color: "#f0f6fc",
  },
  copilot: {
    name: "Copilot",
    slug: "githubcopilot",
    color: "#8b5cf6",
  },
  cursor: {
    name: "Cursor",
    slug: "cursor",
    color: "#ffffff",
  },
  xai: {
    name: "xAI",
    slug: "x",
    color: "#ffffff",
  },
  grok: {
    name: "Grok",
    slug: "x",
    color: "#ffffff",
  },
  deepseek: {
    name: "DeepSeek",
    slug: "deepseek",
    color: "#4f8cff",
  },
  mistral: {
    name: "Mistral",
    slug: "mistralai",
    color: "#ff7000",
  },
  meta: {
    name: "Meta",
    slug: "meta",
    color: "#0668e1",
  },
  llama: {
    name: "Llama",
    slug: "meta",
    color: "#0668e1",
  },
  cohere: {
    name: "Cohere",
    slug: "cohere",
    color: "#39594d",
  },
  perplexity: {
    name: "Perplexity",
    slug: "perplexity",
    color: "#20b8cd",
  },
  ollama: {
    name: "Ollama",
    slug: "ollama",
    color: "#ffffff",
  },
  openrouter: {
    name: "OpenRouter",
    slug: "openrouter",
    color: "#ffffff",
  },
  vercel: {
    name: "Vercel AI",
    slug: "vercel",
    color: "#ffffff",
  },
};

function normalizeProvider(provider?: string) {
  const key = (provider || "unknown").toLowerCase().trim();

  if (PROVIDERS[key]) {
    return PROVIDERS[key];
  }

  if (key.includes("openai")) return PROVIDERS.openai;
  if (key.includes("anthropic")) return PROVIDERS.anthropic;
  if (key.includes("claude")) return PROVIDERS.claude;
  if (key.includes("gemini")) return PROVIDERS.gemini;
  if (key.includes("google")) return PROVIDERS.google;
  if (key.includes("copilot")) return PROVIDERS.copilot;
  if (key.includes("cursor")) return PROVIDERS.cursor;
  if (key.includes("deepseek")) return PROVIDERS.deepseek;
  if (key.includes("mistral")) return PROVIDERS.mistral;
  if (key.includes("llama")) return PROVIDERS.llama;
  if (key.includes("meta")) return PROVIDERS.meta;
  if (key.includes("cohere")) return PROVIDERS.cohere;
  if (key.includes("perplexity")) return PROVIDERS.perplexity;
  if (key.includes("ollama")) return PROVIDERS.ollama;
  if (key.includes("openrouter")) return PROVIDERS.openrouter;

  return {
    name: provider || "Unknown",
    slug: "artificial-intelligence",
    color: "#94a3b8",
  };
}

function ProviderIcon({ provider }: { provider?: string }) {
  const info = normalizeProvider(provider);

  return (
    <div
      className="provider-icon"
      style={{
        borderColor: `${info.color}55`,
        background: `${info.color}12`,
      }}
      title={info.name}
    >
      <img
        src={`https://cdn.simpleicons.org/${info.slug}/${info.color.replace(
          "#",
          ""
        )}`}
        alt={info.name}
        onError={(event) => {
          event.currentTarget.style.display = "none";
          const fallback = event.currentTarget
            .nextElementSibling as HTMLElement | null;

          if (fallback) fallback.style.display = "block";
        }}
      />
      <span className="provider-fallback">
        {info.name.charAt(0)}
      </span>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(Math.round(value || 0));
}

function formatMoney(value: number) {
  return `$${Number(value || 0).toFixed(4)}`;
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

async function fetchEvents(): Promise<Event[]> {
  const response = await fetch(`${API_URL}/events`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`API returned ${response.status}`);
  }

  const data = await response.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.events)) return data.events;
  if (Array.isArray(data.data)) return data.data;

  return [];
}

function App() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("all");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function loadEvents() {
    try {
      setError("");

      const data = await fetchEvents();

      setEvents(data);
      setConnected(true);
      setLastUpdated(new Date());
    } catch (err) {
      setConnected(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to connect to Agent Lens API"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();

    const timer = window.setInterval(loadEvents, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const providers = useMemo(() => {
    const map = new Map<string, number>();

    for (const event of events) {
      const provider = event.provider || "Unknown";
      map.set(provider, (map.get(provider) || 0) + 1);
    }

    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedProvider === "all") {
      return events;
    }

    return events.filter(
      (event) =>
        (event.provider || "Unknown").toLowerCase() ===
        selectedProvider.toLowerCase()
    );
  }, [events, selectedProvider]);

  const stats = useMemo(() => {
    let tokens = 0;
    let cost = 0;
    let latency = 0;
    let latencyCount = 0;
    let success = 0;
    let errors = 0;

    for (const event of events) {
      tokens +=
        event.totalTokens ??
        (event.inputTokens || 0) + (event.outputTokens || 0);

      cost += event.cost || 0;

      if (event.latencyMs != null) {
        latency += event.latencyMs;
        latencyCount++;
      }

      if (event.status === "error") {
        errors++;
      } else {
        success++;
      }
    }

    return {
      events: events.length,
      tokens,
      cost,
      avgLatency: latencyCount
        ? Math.round(latency / latencyCount)
        : 0,
      success,
      errors,
    };
  }, [events]);

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">
            <Activity size={20} />
          </div>

          <div>
            <h1>Agent Lens</h1>
            <span>AI agent observability</span>
          </div>
        </div>

        <div className="connection">
          <span
            className={`status-dot ${
              connected ? "online" : "offline"
            }`}
          />

          {connected ? "API connected" : "API disconnected"}

          <button onClick={loadEvents} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      <main className="container">
        <section className="hero">
          <div>
            <p className="eyebrow">LIVE TELEMETRY</p>
            <h2>AI Agent Activity</h2>
            <p>
              Monitor your coding agents, models, latency, tokens and
              costs in real time.
            </p>
          </div>

          <div className="live">
            <span className="pulse" />
            LIVE
          </div>
        </section>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <div>
              <strong>API connection failed</strong>
              <span>{error}</span>
            </div>
          </div>
        )}

        <section className="stats">
          <Stat
            icon={<Activity />}
            label="Events"
            value={formatNumber(stats.events)}
          />

          <Stat
            icon={<Zap />}
            label="Tokens"
            value={formatNumber(stats.tokens)}
          />

          <Stat
            icon={<DollarSign />}
            label="Estimated cost"
            value={formatMoney(stats.cost)}
          />

          <Stat
            icon={<Clock3 />}
            label="Avg latency"
            value={`${stats.avgLatency}ms`}
          />

          <Stat
            icon={<CheckCircle2 />}
            label="Successful"
            value={formatNumber(stats.success)}
          />

          <Stat
            icon={<AlertCircle />}
            label="Errors"
            value={formatNumber(stats.errors)}
          />
        </section>

        <section className="content-grid">
          <div className="panel events-panel">
            <div className="panel-header">
              <div>
                <h3>Recent events</h3>
                <p>
                  {lastUpdated
                    ? `Updated ${lastUpdated.toLocaleTimeString()}`
                    : "Waiting for data"}
                </p>
              </div>

              {loading && <RefreshCw className="spin" size={18} />}
            </div>

            <div className="filters">
              <button
                className={
                  selectedProvider === "all" ? "active" : ""
                }
                onClick={() => setSelectedProvider("all")}
              >
                All
              </button>

              {providers.map(([provider, count]) => (
                <button
                  key={provider}
                  className={
                    selectedProvider === provider ? "active" : ""
                  }
                  onClick={() => setSelectedProvider(provider)}
                >
                  <ProviderIcon provider={provider} />
                  {provider}
                  <span>{count}</span>
                </button>
              ))}
            </div>

            {filteredEvents.length === 0 ? (
              <div className="empty">
                <Server size={32} />
                <h3>No events yet</h3>
                <p>
                  Start an AI agent or send an event to the Agent Lens
                  API.
                </p>
              </div>
            ) : (
              <div className="event-list">
                {filteredEvents.map((event, index) => {
                  const provider = normalizeProvider(event.provider);

                  return (
                    <div
                      className="event-row"
                      key={event.id || `${event.timestamp}-${index}`}
                    >
                      <ProviderIcon provider={event.provider} />

                      <div className="event-main">
                        <div className="event-title">
                          <strong>
                            {event.model || provider.name}
                          </strong>

                          {event.agent && (
                            <span className="agent">
                              {event.agent}
                            </span>
                          )}
                        </div>

                        <div className="event-meta">
                          <span>{provider.name}</span>
                          <span>•</span>
                          <span>
                            {event.totalTokens ??
                              (event.inputTokens || 0) +
                                (event.outputTokens || 0)}{" "}
                            tokens
                          </span>

                          {event.latencyMs != null && (
                            <>
                              <span>•</span>
                              <span>{event.latencyMs}ms</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="event-right">
                        <Status status={event.status} />
                        <time>
                          {formatTime(event.timestamp)}
                        </time>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="panel providers-panel">
            <div className="panel-header">
              <div>
                <h3>AI providers</h3>
                <p>Detected from live events</p>
              </div>
            </div>

            <div className="provider-list">
              {providers.length === 0 ? (
                <div className="provider-empty">
                  No providers detected yet.
                </div>
              ) : (
                providers.map(([provider, count]) => {
                  const info = normalizeProvider(provider);

                  return (
                    <button
                      className="provider-card"
                      key={provider}
                      onClick={() => setSelectedProvider(provider)}
                    >
                      <ProviderIcon provider={provider} />

                      <div>
                        <strong>{info.name}</strong>
                        <span>{count} events</span>
                      </div>

                      <span className="arrow">→</span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Status({ status }: { status?: Event["status"] }) {
  const actual = status || "success";

  return (
    <span className={`status ${actual}`}>
      {actual === "success" && <CheckCircle2 size={14} />}
      {actual === "error" && <AlertCircle size={14} />}
      {actual === "running" && <RefreshCw size={14} />}
      {actual}
    </span>
  );
}

export default App;
