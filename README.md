## Agent Lens MAX

Open-source observability for AI agents.
See exactly what your AI agent is doing.
Agent Lens MAX records agent sessions and transforms them into a structured, searchable observability timeline of:
```
🧠 AI model & provider detection
🤖 Agent sessions
🔧 Tool & command execution
💻 Shell processes
📤 stdout / stderr output
❌ Errors & failed sessions
📊 Real-time telemetry
🪙 Input & output token tracking
💰 Estimated AI costs
⏱️ Session duration & latency
📡 Live event streaming
🔐 API-key authentication
🗄️ Persistent event storage
📈 Agent statistics
```
```
npm install
npm run build
npm start
```
Open:
```
http://127.0.0.1:4321
```

---

## What Agent Lens MAX Gives You

Instead of running an AI agent as a black box:

```
AI Agent
   ↓
?????
```
Agent Lens MAX turns it into:
```
AI Agent
│
├── 🧠 Provider
├── 🤖 Model
├── 🔧 Commands
├── 📤 Output
├── ❌ Errors
├── 🪙 Tokens
├── 💰 Cost
├── ⏱️ Latency
└── 📊 Session
↓
Agent Lens MAX
↓
Observatory
```

---

# Features

## 🧠 AI Provider Detection

Agent Lens MAX detects AI providers from commands, environment variables, model names, and available telemetry.

Supported providers/signals include:

-  OpenAI 
-  Anthropic 
-  Google 
-  Mistral 
-  Meta 
-  DeepSeek 
-  xAI 
-  Groq 
-  Cohere 
-  OpenRouter 
-  Ollama 

Example:

```
Provider: OpenAI
```
---
🤖 Model Detection
Agent Lens MAX can identify models from commands, environment variables, and agent output.
Examples:
```
gpt-4o
gpt-4.1
gpt-4.1-mini
claude-3-5-sonnet
gemini-2.5-pro
deepseek-chat
llama-*
mistral-*
grok-*
```

---

## 🪙 Token Tracking

When the underlying agent exposes usage information, Agent Lens MAX can extract:

```
Input tokens
Output tokens
Total tokens
```
Example provider response:
```
{
"prompt_tokens": 1000,
"completion_tokens": 500,
"total_tokens": 1500
}
```

Agent Lens converts this into:

```
Input:  1000
Output: 500
Total:  1500
```
> **Important:** Agent Lens cannot magically obtain provider-native token usage when the underlying agent/provider does not expose it. Native instrumentation or provider APIs are required for guaranteed provider-side accounting.
---
💰 Cost Estimation
When a supported model and token usage are available, Agent Lens MAX estimates:
```
Input cost
Output cost
Total estimated cost
```

Example:

```
Provider: OpenAI
Model:    gpt-4o
Input:    1,000 tokens
Output:   500 tokens
Cost:     $0.007500
```
Cost estimates are observational estimates and should not be treated as official provider billing statements.
---
📡 Real-Time Events
Agent Lens records structured agent lifecycle events such as:
```
session_start
command
stdout
stderr
model_call
telemetry
error
session_end
```

Example:

```
SESSION START
      │
      ▼
COMMAND
      │
      ▼
MODEL CALL
      │
      ▼
TOOL EXECUTION
      │
      ├── stdout
      └── stderr
      │
      ▼
TELEMETRY
      │
      ▼
SESSION END
```
---
Observatory API
Agent Lens MAX exposes a local HTTP API.
Default server:
```
http://127.0.0.1:4321
```

Endpoints:

```
GET /api/health
GET /api/stats
GET /api/providers
GET /api/events
GET /api/sessions
GET /api/stream
```
---
Health
```
GET /api/health
```

Example:
```
curl http://127.0.0.1:4321/api/health
```
---
Statistics
```
GET /api/stats
```

Example:
```
curl http://127.0.0.1:4321/api/stats
```
Possible information includes:
```
totalEvents
totalSessions
successfulSessions
failedSessions
runningSessions
totalTokens
totalCost
avgLatency
```

---

## Events
```
GET /api/events
```
Example:
```
curl "http://127.0.0.1:4321/api/events?limit=50"
```

---

## Sessions
```
GET /api/sessions
```
Example:
```
curl http://127.0.0.1:4321/api/sessions
```

---

## Live Stream
```
GET /api/stream
```
The stream is intended for real-time observability clients.
---
Quick Start
1. Clone
```
git clone https://github.com/arjunkrishna09022010-bot/agent-lens-max.git
cd agent-lens-max
```

## 2. Install Dependencies
```
npm install
```

## 3. Build
```
npm run build
```

## 4. Typecheck
```
npm run typecheck
```

## 5. Run Tests
```
npm test
```

## 6. Start Agent Lens MAX
```
npm start
```
Open:
```
http://127.0.0.1:4321
```

---

# Development

## Build
```
npm run build
```
Builds both:
```
core
cli
```

---

## Typecheck
```
npm run typecheck
```
---
Tests
```
npm test
```

---

## Start
```
npm start
```
---
Clean
```
npm run clean
```

---

## Package
```
npm pack
```
---
Example Agent Session
Run a simple process:
```
node -e "console.log('AGENT_LENS_E2E_OK')"
```

Agent Lens records:
```
Session
 ├── session_start
 ├── command
 ├── stdout
 │    └── AGENT_LENS_E2E_OK
 └── session_end
```
Example:
```
╭─────────────────────────────────────────────╮
│ Agent Lens MAX                              │
╰─────────────────────────────────────────────╯
Session:  5ae5d03a-3949-4d7b-a77d-499792023639
Command:  node -e ...
Provider: Unknown
Model:    Unknown
```

After completion:
```
✓ Agent session completed successfully.

Provider: Unknown
Model: Unknown
Tokens: 0
Estimated cost: $0.000000
Session ID: 5ae5d03a-3949-4d7b-a77d-499792023639
```
---
Authentication
Agent Lens MAX supports API-key authentication.
Set the key in PowerShell:

```
$env:AGENT_LENS_API_KEY="your-secret-key"
```

Start the server:
```
npm start
```
Requests can then provide:

```
x-agent-lens-key
```

Example:
```
Invoke-RestMethod `
  "http://127.0.0.1:4321/api/stats" `
  -Headers @{
      "x-agent-lens-key" = $env:AGENT_LENS_API_KEY
  }
```
Health remains available for local availability checks:
```
GET /api/health
```

> Never commit API keys, provider credentials, or other secrets to GitHub.

---

# Environment Configuration

Create a local `.env` based on:
```
.env.example
```
Example:
```
AGENT_LENS_API_KEY=
AI_PROVIDER=
AI_MODEL=
OPENAI_MODEL=
ANTHROPIC_MODEL=
GEMINI_MODEL=
```

For PowerShell:
```
$env:AGENT_LENS_API_KEY="your-secret-key"
$env:AI_PROVIDER="OpenAI"
$env:AI_MODEL="gpt-4o"
```
---
Architecture
```

```
                         AI AGENT
                            │
                            ▼
                  ┌──────────────────┐
                  │     Collector    │
                  └────────┬─────────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
          stdout        stderr       lifecycle
             │             │             │
             └─────────────┼─────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │ Telemetry Engine │
                  └────────┬─────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
      Provider           Model            Usage
      Detection         Detection        Detection
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
                  ┌──────────────────┐
                  │  Agent Lens Core │
                  └────────┬─────────┘
                           │
                           ▼
                    Event Storage
                           │
                           ▼
                      Event Bus
                           │
                           ▼
                       HTTP API
                           │
                           ▼
                      Observatory
```

---
```
# Project Structure

```
agent-lens-max/
│
├── core/
│   ├── src/
│   │   ├── event.ts
│   │   ├── session.ts
│   │   ├── storage.ts
│   │   └── index.ts
│   │
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
│
├── cli/
│   ├── src/
│   │   ├── collector.ts
│   │   ├── telemetry.ts
│   │   ├── event-bus.ts
│   │   ├── server.ts
│   │   └── self-test.ts
│   │
│   ├── dist/
│   ├── package.json
│   └── tsconfig.json
│
├── package.json
├── package-lock.json
├── .env.example
├── .gitignore
└── README.md
```
---
Event Model
Agent Lens MAX uses structured events.
Example:
```
{
"sessionId": "5ae5d03a-3949-4d7b-a77d-499792023639",
"type": "model_call",
"timestamp": "2026-08-12T10:00:00.000Z",
"status": "success",
"provider": "OpenAI",
"model": "gpt-4o",
"inputTokens": 1000,
"outputTokens": 500,
"totalTokens": 1500,
"cost": 0.0075,
"data": {}
}
```

Supported event types:
```
session_start
session_end
command
stdout
stderr
error
model_call
telemetry
```
---
Telemetry Pipeline
```
Agent Output
│
▼
Capture
│
▼
Normalize
│
├───────────────┐
▼               ▼
Provider          Model
Detection        Detection
│               │
└───────┬───────┘
▼
Usage Detection
│
▼
Token Accounting
│
▼
Cost Estimation
│
▼
Structured Event
│
▼
Storage
```

---

# Provider-Native Telemetry

Agent Lens MAX distinguishes between:
```
Provider-native telemetry
```
and:
```
Observed agent telemetry
```

## Provider-native

The underlying provider/API explicitly returns usage:
```
{
  "usage": {
    "prompt_tokens": 1000,
    "completion_tokens": 500,
    "total_tokens": 1500
  }
}
```
This is the strongest source of token information.
---
Observed telemetry
The agent process prints usage information:
```
prompt_tokens: 1000
completion_tokens: 500
total_tokens: 1500
```

Agent Lens can extract these values from the observed output.

---

## Important distinction

```
Provider API
     │
     │ native usage
     ▼
Agent
     │
     │ exposed usage
     ▼
Agent Lens
```
If the agent does not expose usage:
```
Provider
│
│ hidden usage
▼
Agent
│
│ no usage data
▼
Agent Lens
```

Agent Lens cannot reliably reconstruct the provider's exact billing data from arbitrary stdout alone.

---

# Process Management

Agent Lens MAX launches and monitors child processes.

The collector tracks:
```
Process start
Process output
Process errors
Process exit
Session completion
```
Example:
```
Agent Lens
│
├── spawn()
│
├── stdout listener
│
├── stderr listener
│
├── telemetry processing
│
└── process exit
```

---

# Duplicate Port Protection

The default port is:

```
4321
```
If another Agent Lens instance is already running, starting a second instance should report:
```
Agent Lens: port 4321 is already in use.
An Agent Lens server may already be running at:
http://127.0.0.1:4321
```

Check the existing server:
```
Invoke-RestMethod "http://127.0.0.1:4321/api/health"
```
---
Windows / PowerShell
Start the project:
```
cd "C:\Users\Divya\Desktop\agent-lens"
npm install
npm run build
npm test
npm start
```

Check the server:
```
Invoke-RestMethod "http://127.0.0.1:4321/api/health"
```
Check statistics:
```
Invoke-RestMethod "http://127.0.0.1:4321/api/stats"
```

Check events:
```
Invoke-RestMethod "http://127.0.0.1:4321/api/events?limit=10"
```
---
Production Build
Recommended production sequence:
```
npm install
npm run typecheck
npm run clean
npm run build
npm test
npm pack
npm start
```

Or:

```
npm run typecheck; if ($LASTEXITCODE -ne 0) { exit 1 }
npm run clean; if ($LASTEXITCODE -ne 0) { exit 1 }
npm run build; if ($LASTEXITCODE -ne 0) { exit 1 }
npm test; if ($LASTEXITCODE -ne 0) { exit 1 }
npm pack; if ($LASTEXITCODE -ne 0) { exit 1 }
npm start
```
---
Testing
Agent Lens MAX includes automated tests for core telemetry behavior.
Tests cover areas such as:
```
Provider detection
Model detection
Input token extraction
Output token extraction
Total token extraction
Cost estimation
```

Run:

```
npm test
```
Expected result:
```
======================================
AGENT LENS MAX TEST SUITE
Provider detection: PASS
Model detection:    PASS
Input tokens:       PASS
Output tokens:      PASS
Total tokens:       PASS
Cost estimation:    PASS
ALL TESTS PASSED
```

---

# Production Checklist

Before deploying:
```
[ ] npm install
[ ] npm run typecheck
[ ] npm run clean
[ ] npm run build
[ ] npm test
[ ] npm pack
[ ] Configure AGENT_LENS_API_KEY
[ ] Verify API authentication
[ ] Verify /api/health
[ ] Verify /api/stats
[ ] Verify /api/events
[ ] Verify /api/sessions
[ ] Verify /api/stream
[ ] Verify provider detection
[ ] Verify model detection
[ ] Verify telemetry
[ ] Verify process shutdown
```
---
# Current Status

ComponentStatus
```
Agent sessions	✅
Event tracking	✅
Process collection	✅
stdout/stderr capture	✅
Provider detection	✅
Model detection	✅
Token extraction	✅
Cost estimation	✅
Statistics API	✅
Events API	✅
Sessions API	✅
Live stream	✅
API-key authentication	✅
Duplicate-port handling	✅
TypeScript build	✅
Automated tests	✅
npm packaging	✅
Provider-native integrations	🚧
```
---
Roadmap

Phase 1 — Core Observability
```
Session tracking
Process monitoring
stdout capture
stderr capture
Event storage
HTTP API
Statistics
```

Phase 2 — AI Telemetry
```
Provider detection
Model detection
Token extraction
Cost estimation
Telemetry events
Phase 3 — Security
API-key authentication
Localhost binding
Duplicate-port handling
Advanced role-based authentication
Audit logging
TLS deployment configuration
Phase 4 — Native Integrations
OpenAI instrumentation
Anthropic instrumentation
Google Gemini instrumentation
OpenTelemetry integration
Native streaming usage
Provider billing reconciliation
Phase 5 — Advanced Agent Observability
Sub-agent hierarchy
Tool-call tracing
File-change tracking
Agent dependency graphs
Distributed tracing
Agent performance analytics
Token budgets
Cost budgets
Alerts
Phase 6 — Platform
Advanced dashboard
Remote observability
Multi-agent monitoring
Team workspaces
Cloud deployment
Enterprise authentication
---
Why Agent Lens?
AI agents are increasingly capable, but their execution is often difficult to understand.
Agent Lens MAX provides an observability layer between the agent and the developer.
```
```
        AI AGENT
            │
            ▼
    ┌───────────────┐
    │  AGENT LENS   │
    │      MAX      │
    └───────┬───────┘
            │
     ┌──────┼──────┐
     ▼      ▼      ▼
   Model   Tools  Process
      │      │      │
      └──────┼──────┘
             ▼
         Telemetry
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
   Tokens  Cost  Errors
             │
             ▼
         Observatory
```

---

# Design Goals

Agent Lens MAX is designed around five principles:

### 1. Observability

Make agent behavior visible.

### 2. Transparency

Show where telemetry comes from.

### 3. Extensibility

Support additional providers and agents.

### 4. Local-first Operation

Run the observability layer locally without requiring a cloud service.

### 5. Developer Control

Give developers direct access to sessions, events, telemetry, and statistics.

---

# Contributing

Contributions are welcome.

Clone the repository:
```
git clone https://github.com/arjunkrishna09022010-bot/agent-lens-max.git
cd agent-lens-max
```
Install dependencies:
```
npm install
```

Run typechecking:
```
npm run typecheck
```
Build:
```
npm run build
```

Run tests:
```
npm test
```
Create a feature branch:
```
git checkout -b feature/my-feature
```

Make your changes and verify:
```
npm run typecheck
npm run build
npm test
```
Then commit:
```
git add .
git commit -m "feat: add my feature"
```

Push:

```
git push origin feature/my-feature
```
Open a pull request on GitHub.
---
Security
Never commit:
```
.env
.env.local
API keys
Provider API keys
Private tokens
Passwords
Credentials
Production secrets
```

Add sensitive files to `.gitignore`.

Example:
```
node_modules/
dist/
.env
.env.*
!.env.example
*.log
.DS_Store
```
If you discover a security issue, do not publish credentials or sensitive exploit details in a public issue.
---
License
Agent Lens MAX is intended to be open source.
Add the project's selected license to:
```

```
LICENSE

before making a formal release.

---

# Author

## Arjun Krishna

GitHub:

```
https://github.com/arjunkrishna09022010-bot
```
---
Agent Lens MAX
See what your AI agent is doing.
```
╔══════════════════════════════════════════╗
║          AGENT LENS MAX                  ║
╠══════════════════════════════════════════╣
║                                          ║
║  🧠 Models                               ║
║  🤖 Providers                            ║
║  🔧 Tools                                ║
║  💻 Processes                            ║
║  📊 Telemetry                            ║
║  🪙 Tokens                               ║
║  💰 Costs                                ║
║  ⏱️ Performance                          ║
║  ❌ Failures                             ║
║  📡 Live Events                          ║
║                                          ║
╚══════════════════════════════════════════╝
```

```
```
Build agents.
Run agents.
Observe agents.
Measure agents.
Understand agents.

                ↓

          AGENT LENS MAX
---
⭐ Star the project
If Agent Lens MAX is useful to you:
```

```
⭐ Star the repository
🐛 Report bugs
💡 Suggest features
🔧 Submit pull requests
📢 Share the project

**Agent Lens MAX — observability for the next generation of AI agents.**
