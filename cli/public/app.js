const state = {
  stats: {},
  sessions: [],
  events: [],
  providers: []
};

const $ = id => document.getElementById(id);

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function formatCost(value) {
  return "$" + Number(value || 0).toFixed(4);
}

function formatLatency(value) {
  return `${Number(value || 0).toFixed(1)} ms`;
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function shortId(value) {
  if (!value) return "—";

  const text = String(value);

  if (text.length <= 16) {
    return text;
  }

  return `${text.slice(0, 8)}…${text.slice(-6)}`;
}

function statusClass(status) {
  switch (status) {
    case "success":
      return "badge-success";

    case "error":
    case "failed":
      return "badge-error";

    case "running":
      return "badge-running";

    default:
      return "badge-neutral";
  }
}

function badge(status) {
  const value = status || "unknown";

  return `
    <span class="badge ${statusClass(value)}">
      ${escapeHTML(value.toUpperCase())}
    </span>
  `;
}

async function api(path) {
  const response = await fetch(path, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(
      `${response.status} ${response.statusText}`
    );
  }

  return response.json();
}

async function loadData() {
  try {
    const [
      stats,
      sessions,
      events,
      providers
    ] = await Promise.all([
      api("/api/stats"),
      api("/api/sessions?limit=100"),
      api("/api/events?limit=100"),
      api("/api/providers")
    ]);

    state.stats = stats;
    state.sessions = sessions;
    state.events = events;
    state.providers = providers;

    render();

  } catch (error) {
    console.error(error);

    showToast(
      "Unable to reach Agent Lens API"
    );
  }
}

function renderStats() {
  $("totalEvents").textContent =
    formatNumber(state.stats.totalEvents);

  $("totalSessions").textContent =
    formatNumber(state.stats.totalSessions);

  $("errors").textContent =
    formatNumber(state.stats.errors);

  $("avgLatency").textContent =
    formatLatency(state.stats.avgLatency);

  $("totalTokens").textContent =
    formatNumber(state.stats.totalTokens);

  $("totalCost").textContent =
    formatCost(state.stats.totalCost);
}

function renderRecentSessions() {
  const container = $("recentSessions");

  if (!state.sessions.length) {
    container.innerHTML =
      '<div class="empty">No sessions recorded.</div>';

    return;
  }

  container.innerHTML =
    state.sessions
      .slice(0, 6)
      .map(session => `
        <div class="session-row">

          <div style="min-width:0">
            <div class="command">
              ${escapeHTML(session.command)}
            </div>

            <div class="session-id">
              ${escapeHTML(session.id)}
            </div>
          </div>

          <div>
            ${badge(session.status)}
          </div>

        </div>
      `)
      .join("");
}

function renderRecentEvents() {
  const container = $("recentEvents");

  if (!state.events.length) {
    container.innerHTML =
      '<div class="empty">No events recorded.</div>';

    return;
  }

  container.innerHTML =
    state.events
      .slice(0, 8)
      .map(event => `
        <div class="event-row">

          <div class="event-type">
            ${escapeHTML(event.type)}
          </div>

          <div>
            ${event.status
              ? badge(event.status)
              : '<span class="badge badge-neutral">EVENT</span>'
            }
          </div>

          <div class="event-time">
            ${escapeHTML(formatTime(event.timestamp))}
          </div>

        </div>
      `)
      .join("");
}

function renderProviders(target = "providerOverview") {
  const container = $(target);

  if (!state.providers.length) {
    container.innerHTML =
      '<div class="empty">No provider data recorded.</div>';

    return;
  }

  container.innerHTML =
    state.providers
      .map(provider => `
        <div class="provider-card">

          <div class="provider-name">
            ${escapeHTML(provider.provider)}
          </div>

          <div class="provider-stats">

            <div>
              <div class="provider-stat-label">
                Events
              </div>

              <div class="provider-stat-value">
                ${formatNumber(provider.events)}
              </div>
            </div>

            <div>
              <div class="provider-stat-label">
                Tokens
              </div>

              <div class="provider-stat-value">
                ${formatNumber(provider.tokens)}
              </div>
            </div>

            <div>
              <div class="provider-stat-label">
                Cost
              </div>

              <div class="provider-stat-value">
                ${formatCost(provider.cost)}
              </div>
            </div>

            <div>
              <div class="provider-stat-label">
                Latency
              </div>

              <div class="provider-stat-value">
                ${formatLatency(provider.avgLatency)}
              </div>
            </div>

          </div>

        </div>
      `)
      .join("");
}

function renderSessionsTable() {
  const table = $("sessionsTable");

  table.innerHTML =
    state.sessions
      .map(session => `
        <tr>

          <td class="mono">
            ${escapeHTML(shortId(session.id))}
          </td>

          <td>
            ${escapeHTML(session.command)}
          </td>

          <td>
            ${badge(session.status)}
          </td>

          <td>
            ${escapeHTML(formatTime(session.startedAt))}
          </td>

          <td>
            ${escapeHTML(session.provider || "—")}
          </td>

          <td>
            ${escapeHTML(session.model || "—")}
          </td>

        </tr>
      `)
      .join("");
}

function renderEventsTable() {
  const table = $("eventsTable");

  table.innerHTML =
    state.events
      .map(event => `
        <tr>

          <td class="mono">
            ${escapeHTML(event.id)}
          </td>

          <td class="mono">
            ${escapeHTML(event.type)}
          </td>

          <td>
            ${event.status
              ? badge(event.status)
              : "—"
            }
          </td>

          <td class="mono">
            ${escapeHTML(shortId(event.sessionId))}
          </td>

          <td>
            ${escapeHTML(event.provider || "—")}
          </td>

          <td>
            ${escapeHTML(formatTime(event.timestamp))}
          </td>

        </tr>
      `)
      .join("");
}

function render() {
  renderStats();
  renderRecentSessions();
  renderRecentEvents();
  renderProviders("providerOverview");
  renderProviders("providersGrid");
  renderSessionsTable();
  renderEventsTable();
}

function showView(view) {
  const views = [
    "overview",
    "sessions",
    "events",
    "providers"
  ];

  views.forEach(name => {
    const element = $(`${name}View`);

    if (name === view) {
      element.classList.remove("hidden");
    } else {
      element.classList.add("hidden");
    }
  });

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.view === view
      );
    });

  const titles = {
    overview: "System Overview",
    sessions: "Agent Sessions",
    events: "Telemetry Events",
    providers: "Provider Analytics"
  };

  $("pageTitle").textContent =
    titles[view] || "System Overview";
}

function showToast(message) {
  const toast = $("toast");

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

document
  .querySelectorAll(".nav-item")
  .forEach(button => {
    button.addEventListener("click", () => {
      showView(button.dataset.view);
    });
  });

$("refreshButton").addEventListener(
  "click",
  async () => {
    await loadData();
    showToast("Telemetry refreshed");
  }
);

loadData();

setInterval(
  loadData,
  3000
);
