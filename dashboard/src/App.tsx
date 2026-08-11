import { useMemo, useState } from "react";
import {
  Activity,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Code2,
  DollarSign,
  GitBranch,
  Menu,
  MessageSquare,
  MoreHorizontal,
  Play,
  RefreshCw,
  Search,
  Settings,
  Terminal,
  XCircle,
  Zap
} from "lucide-react";

type Run = {
  id: string;
  agent: string;
  model: string;
  task: string;
  status: "success" | "running" | "failed";
  duration: string;
  tokens: string;
  cost: string;
  branch: string;
  time: string;
};

const runs: Run[] = [
  {
    id: "run_8f31",
    agent: "Claude Code",
    model: "Claude Sonnet",
    task: "Implement authentication middleware",
    status: "success",
    duration: "2m 14s",
    tokens: "18.4k",
    cost: "$0.42",
    branch: "feat/auth",
    time: "2 min ago"
  },
  {
    id: "run_8f29",
    agent: "Codex",
    model: "GPT-5",
    task: "Refactor API error handling",
    status: "running",
    duration: "1m 08s",
    tokens: "9.8k",
    cost: "$0.19",
    branch: "refactor/api",
    time: "4 min ago"
  },
  {
    id: "run_8f27",
    agent: "Gemini CLI",
    model: "Gemini 2.5 Pro",
    task: "Add dashboard analytics",
    status: "success",
    duration: "4m 31s",
    tokens: "31.2k",
    cost: "$0.31",
    branch: "feat/analytics",
    time: "18 min ago"
  },
  {
    id: "run_8f21",
    agent: "Claude Code",
    model: "Claude Sonnet",
    task: "Fix websocket reconnect loop",
    status: "failed",
    duration: "48s",
    tokens: "7.1k",
    cost: "$0.16",
    branch: "fix/ws",
    time: "31 min ago"
  },
  {
    id: "run_8f18",
    agent: "Codex",
    model: "GPT-5",
    task: "Generate unit tests for billing",
    status: "success",
    duration: "3m 02s",
    tokens: "22.7k",
    cost: "$0.36",
    branch: "test/billing",
    time: "42 min ago"
  }
];

function StatusIcon({ status }: { status: Run["status"] }) {
  if (status === "success") {
    return <CheckCircle2 size={17} className="status-success" />;
  }

  if (status === "failed") {
    return <XCircle size={17} className="status-failed" />;
  }

  return <RefreshCw size={17} className="status-running spin" />;
}

function StatCard({
  icon,
  label,
  value,
  detail,
  accent
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  accent: string;
}) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <div className={`stat-icon ${accent}`}>{icon}</div>
        <span className="stat-label">{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{detail}</div>
    </div>
  );
}

function App() {
  const [selectedRun, setSelectedRun] = useState<Run | null>(runs[0]);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const filteredRuns = useMemo(() => {
    const q = query.toLowerCase();

    if (!q) return runs;

    return runs.filter(
      (run) =>
        run.task.toLowerCase().includes(q) ||
        run.agent.toLowerCase().includes(q) ||
        run.branch.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? "" : "collapsed"}`}>
        <div className="brand">
          <div className="brand-mark">
            <Zap size={19} />
          </div>
          {sidebarOpen && (
            <div>
              <div className="brand-name">Agent Lens</div>
              <div className="brand-version">v0.1.0</div>
            </div>
          )}
        </div>

        <nav>
          <div className="nav-section">
            {sidebarOpen && <div className="nav-title">WORKSPACE</div>}

            <button className="nav-item active">
              <Activity size={18} />
              {sidebarOpen && <span>Overview</span>}
            </button>

            <button className="nav-item">
              <Bot size={18} />
              {sidebarOpen && <span>Agents</span>}
            </button>

            <button className="nav-item">
              <Terminal size={18} />
              {sidebarOpen && <span>Runs</span>}
            </button>

            <button className="nav-item">
              <GitBranch size={18} />
              {sidebarOpen && <span>Projects</span>}
            </button>
          </div>

          <div className="nav-section">
            {sidebarOpen && <div className="nav-title">INSIGHTS</div>}

            <button className="nav-item">
              <DollarSign size={18} />
              {sidebarOpen && <span>Costs</span>}
            </button>

            <button className="nav-item">
              <Code2 size={18} />
              {sidebarOpen && <span>Tool Calls</span>}
            </button>
          </div>
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings size={18} />
            {sidebarOpen && <span>Settings</span>}
          </button>

          <div className="connection">
            <span className="online-dot" />
            {sidebarOpen && (
              <span>
                API connected
              </span>
            )}
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="icon-button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu size={19} />
            </button>

            <div className="breadcrumb">
              <span>Workspace</span>
              <ChevronRight size={14} />
              <strong>Overview</strong>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="search">
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search runs..."
              />
              <kbd>⌘ K</kbd>
            </div>

            <button className="icon-button">
              <MessageSquare size={18} />
            </button>

            <div className="avatar">AK</div>
          </div>
        </header>

        <div className="content">
          <section className="hero">
            <div>
              <div className="eyebrow">
                <span className="pulse" />
                LIVE OBSERVABILITY
              </div>

              <h1>Agent activity at a glance.</h1>

              <p>
                Monitor every AI coding session, tool call, token and outcome
                from one place.
              </p>
            </div>

            <button className="primary-button">
              <Play size={16} />
              Start recording
            </button>
          </section>

          <section className="stats-grid">
            <StatCard
              icon={<Activity size={19} />}
              label="Agent runs"
              value="248"
              detail="+18.4% vs last week"
              accent="purple"
            />

            <StatCard
              icon={<CheckCircle2 size={19} />}
              label="Success rate"
              value="94.8%"
              detail="+2.1% vs last week"
              accent="green"
            />

            <StatCard
              icon={<Zap size={19} />}
              label="Tokens used"
              value="2.84M"
              detail="↓ 8.2% efficiency gain"
              accent="blue"
            />

            <StatCard
              icon={<DollarSign size={19} />}
              label="Estimated cost"
              value="$48.21"
              detail="$6.80 saved this week"
              accent="orange"
            />
          </section>

          <section className="dashboard-grid">
            <div className="panel runs-panel">
              <div className="panel-header">
                <div>
                  <h2>Recent runs</h2>
                  <p>Latest activity from your coding agents</p>
                </div>

                <button className="ghost-button">
                  View all
                  <ChevronRight size={15} />
                </button>
              </div>

              <div className="run-list">
                {filteredRuns.map((run) => (
                  <button
                    key={run.id}
                    className={`run-row ${
                      selectedRun?.id === run.id ? "selected" : ""
                    }`}
                    onClick={() => setSelectedRun(run)}
                  >
                    <div className="run-status">
                      <StatusIcon status={run.status} />
                    </div>

                    <div className="run-main">
                      <div className="run-title">{run.task}</div>
                      <div className="run-meta">
                        <span>{run.agent}</span>
                        <span>•</span>
                        <span>{run.branch}</span>
                        <span>•</span>
                        <span>{run.time}</span>
                      </div>
                    </div>

                    <div className="run-metrics">
                      <span>{run.tokens}</span>
                      <span>{run.cost}</span>
                    </div>

                    <ChevronRight size={16} className="row-arrow" />
                  </button>
                ))}

                {filteredRuns.length === 0 && (
                  <div className="empty">
                    No runs match your search.
                  </div>
                )}
              </div>
            </div>

            <div className="panel detail-panel">
              <div className="panel-header">
                <div>
                  <h2>Run details</h2>
                  <p>{selectedRun?.id ?? "Select a run"}</p>
                </div>

                <button className="icon-button">
                  <MoreHorizontal size={18} />
                </button>
              </div>

              {selectedRun && (
                <div className="detail-content">
                  <div className="detail-status">
                    <StatusIcon status={selectedRun.status} />
                    <span>
                      {selectedRun.status === "running"
                        ? "Currently running"
                        : selectedRun.status === "success"
                        ? "Completed successfully"
                        : "Run failed"}
                    </span>
                  </div>

                  <h3>{selectedRun.task}</h3>

                  <div className="agent-badge">
                    <div className="mini-agent">
                      {selectedRun.agent === "Codex" ? "C" : "✦"}
                    </div>
                    <div>
                      <strong>{selectedRun.agent}</strong>
                      <span>{selectedRun.model}</span>
                    </div>
                  </div>

                  <div className="detail-stats">
                    <div>
                      <span>Duration</span>
                      <strong>
                        <Clock3 size={14} />
                        {selectedRun.duration}
                      </strong>
                    </div>

                    <div>
                      <span>Tokens</span>
                      <strong>{selectedRun.tokens}</strong>
                    </div>

                    <div>
                      <span>Cost</span>
                      <strong>{selectedRun.cost}</strong>
                    </div>
                  </div>

                  <div className="timeline">
                    <div className="timeline-item">
                      <div className="timeline-dot purple" />
                      <div>
                        <strong>Prompt received</strong>
                        <span>Agent started working</span>
                      </div>
                      <small>00:00</small>
                    </div>

                    <div className="timeline-item">
                      <div className="timeline-dot blue" />
                      <div>
                        <strong>Tool call</strong>
                        <span>Read src/auth/middleware.ts</span>
                      </div>
                      <small>00:08</small>
                    </div>

                    <div className="timeline-item">
                      <div className="timeline-dot orange" />
                      <div>
                        <strong>Files changed</strong>
                        <span>4 files modified</span>
                      </div>
                      <small>01:42</small>
                    </div>

                    <div className="timeline-item">
                      <div className="timeline-dot green" />
                      <div>
                        <strong>Tests passed</strong>
                        <span>18 tests completed</span>
                      </div>
                      <small>02:14</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="bottom-grid">
            <div className="panel chart-panel">
              <div className="panel-header">
                <div>
                  <h2>Agent activity</h2>
                  <p>Runs over the last 7 days</p>
                </div>

                <select defaultValue="7d">
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                </select>
              </div>

              <div className="chart">
                <div className="chart-y">
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>

                <div className="bars">
                  {[42, 55, 37, 64, 48, 72, 58].map((height, i) => (
                    <div className="bar-column" key={i}>
                      <div
                        className="bar"
                        style={{ height: `${height}%` }}
                      />
                      <span>
                        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel agents-panel">
              <div className="panel-header">
                <div>
                  <h2>Top agents</h2>
                  <p>Usage by provider</p>
                </div>
              </div>

              <div className="agent-list">
                <div className="agent-row">
                  <div className="agent-logo claude">✦</div>
                  <div className="agent-info">
                    <strong>Claude Code</strong>
                    <span>Anthropic</span>
                  </div>
                  <strong>46%</strong>
                </div>

                <div className="agent-row">
                  <div className="agent-logo codex">C</div>
                  <div className="agent-info">
                    <strong>Codex</strong>
                    <span>OpenAI</span>
                  </div>
                  <strong>34%</strong>
                </div>

                <div className="agent-row">
                  <div className="agent-logo gemini">✦</div>
                  <div className="agent-info">
                    <strong>Gemini CLI</strong>
                    <span>Google</span>
                  </div>
                  <strong>20%</strong>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;