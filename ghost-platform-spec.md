# Ghost Platform — Architecture Specification

**Purpose:** Document everything that makes this OpenClaw installation unique, so it can be replicated in a custom build.

**Date:** February 18, 2026

---

## 1. CORE PHILOSOPHY

This isn't a chatbot. It's an autonomous operating system with a CEO-agent relationship.

### Operating Principles (from PRINCIPLES.md)

1. **Default to Action** — Fix proactively, report after. Permission-seeking is friction. Exception: destructive actions (deleting data, external comms, spending money) still get flagged.
2. **Real Over Perfect** — Working connections to real systems beat beautiful mockups. If it doesn't connect to live data, it's not done.
3. **Simplicity Is Power** — White background, black text, IBM Plex Mono, [BRACKET] buttons. Fewer moving parts = fewer failure points.
4. **Genuinely Useful, Not Performatively Helpful** — No "Great question!" filler. Read the file first, then ask. Show, don't tell.
5. **Know the Room** — DMs: thorough and proactive. Groups: concise, don't dominate. Humans don't respond to every message.
6. **Safety Without Paralysis** — Protect without asking permission to breathe.
7. **Memory Is Continuity** — Text > brain. Files persist, sessions don't.
8. **Disagree When It Matters** — Have opinions. Push back when right.

### Resolution Hierarchy
Safety → CEO directive → Real over perfect → Simplicity → Discretion

---

## 2. MULTI-AGENT ARCHITECTURE

### Agent Roster

| Agent | Role | Model | Cost Tier |
|-------|------|-------|-----------|
| **Ghost** | Coordinator / Main brain | Claude Opus 4.6 | Premium |
| **Patton** | Strategy & tactical planning | Claude Opus 4.6 | Premium |
| **Buffett** | Financial analysis & capital allocation | Claude Opus 4.6 | Premium |
| **Tesla** | Systems architecture & infrastructure | Claude Sonnet 4 | Standard |
| **Aaron** | Data pipelines & analytics | Claude Sonnet 4 | Standard |
| **Barnum** | UX/UI design & interfaces | Claude Sonnet 4 | Standard |
| **Bond** | Security & threat assessment | Claude Sonnet 4 | Standard |

### Key Design Decisions

- **Tiered model assignment:** Strategic/high-stakes agents (Ghost, Patton, Buffett) run on Opus. Execution/technical agents (Tesla, Aaron, Barnum, Bond) run on Sonnet. This is a deliberate cost/capability tradeoff.
- **Ghost as coordinator:** All spawning goes through Ghost. `allowAgents: ["*"]` on Ghost only. Other agents can't spawn each other (prevents runaway chains).
- **Sub-agents load AGENTS.md + TOOLS.md only** (no SOUL.md). Persona must be embedded in AGENTS.md for it to carry into spawned sessions.
- **Agent-to-agent messaging enabled** between all 7 via `tools.agentToAgent`.
- **Each agent has isolated:** workspace, agentDir (auth), session store. No cross-talk unless explicit.
- **Default sub-agent model:** `local/qwen2.5-7b-instruct` ($0/run) for background tasks. Premium models only when specified.
- **Max concurrent sub-agents:** 8

### Workspace Structure Per Agent
```
workspace-<agent>/
├── AGENTS.md     ← Persona + behavioral instructions (loaded by sub-agents)
├── SOUL.md       ← Identity definition (loaded in main sessions only)
└── TOOLS.md      ← Environment-specific notes (optional)
```

---

## 3. COST CONTROL SYSTEM

This was born from a $290/day crisis. The entire cost architecture is battle-tested.

### Session Guardian (`scripts/session-guardian.mjs`)

Automated protection running every 15 minutes via cron:

**Kill thresholds:**
- $25+ total session cost
- $5/hour burn rate
- 800k+ tokens consumed
- 95%+ context utilization
- 1000+ messages
- 8+ hours duration
- 20MB+ transcript file size

**Warning thresholds:**
- $8+ cost
- 500k+ tokens
- 80% context
- 500+ messages
- 4+ hours duration

**Protected sessions:** `main`, `system`, `guardian`, `monitor` (never killed)

**Reporting rule:** Silent on success. Only alert on failures, warnings, or terminations.

### Cost Architecture

```
CEO direct chat        → Claude Opus 4.6 (premium, justified)
Strategic agents       → Claude Opus 4.6 (when spawned for real work)
Technical agents       → Claude Sonnet 4 (capable, cheaper)
Cron jobs / background → local/qwen2.5-7b-instruct ($0)
Sub-agent default      → local/qwen2.5-7b-instruct ($0)
```

**Local model:** Qwen 2.5 7B Instruct via LM Studio on localhost:1234. Runs on Apple Silicon with 114GB available. Zero API cost. Used for all automation.

**Fallback chain:** Primary model → local Qwen → OpenRouter Kimi K2.5

---

## 4. CRON / AUTOMATION LAYER

12 scheduled jobs, each purpose-built:

### Health & Protection (High Frequency)
| Job | Schedule | Model | Purpose |
|-----|----------|-------|---------|
| TWR Geo Bot Health Check | Every 15 min | main session | Curl webhook + stats endpoints, auto-reregister on 500 |
| Session Guardian | Every 15 min | main session | Cost/context protection scan |
| Auto-Save Ghost Repo | Every hour | main session | Git add + commit + push for meeting docs |

### Daily Operations
| Job | Schedule | Model | Purpose |
|-----|----------|-------|---------|
| Daily Todo Rundown | 8:00 AM | main session | Query Supabase for todos, send Telegram rundown |
| AI Self-Improvement Digest | 8:30 AM | local Qwen | Scan sources for self-improvement content, post to Telegram |
| Morning Agent Standup | 9:30 AM | local Qwen | Simulated team standup with data gathering |
| Evening Agent Standup | 7:30 PM | local Qwen | Day review standup |
| Crypto Trading Bot | Every 4 hours | main session | Paper trading cycle, alert on BUY/SELL signals |

### Weekly
| Job | Schedule | Model | Purpose |
|-----|----------|-------|---------|
| Weekly Sunday Repo Cleanup | Sunday 10 AM | main session | Scan for stale directories, recommend cleanup |
| Sunday Self-Healing Audit | Sunday 11 PM | local Qwen | Check for silent cron failures, auto-retry |

### Reminders
| Job | Schedule | Purpose |
|-----|----------|---------|
| Wednesday Afser Check-in | Wednesday 8 AM | Reminder to send check-in |
| War Room Accounting | 10th of month, 9 AM | Monthly accounting reminder |

### Design Pattern
- **`sessionTarget: "main"`** for jobs that need the current conversation context or must run tools in the main session
- **`sessionTarget: "isolated"`** for jobs that should run independently with their own context
- **Isolated jobs use `delivery: "announce"`** to push results back to Telegram
- **Silent-on-success pattern:** Health checks only alert on failures (CEO preference)

---

## 5. PRIMITIVE SYSTEM

Inspired by ClawVault. File-based, composable, no dependencies.

### Schema Types
```
schemas/
├── agent-rule.yaml    ← AGENTS.md structure
├── identity.yaml      ← SOUL.md structure
├── lesson.yaml        ← MEMORY.md learnings
├── decision.yaml      ← Decision records
├── task.yaml          ← Work items
└── project.yaml       ← Initiatives
```

### Primitive Chain Pattern
```
Lesson (discovered problem)
    → Decision (chose solution)
        → Task (implement fix)
            → Lesson (validated result)
```

### Auto-Generation
```bash
node scripts/primitive-generator.mjs task "Title" "Description"
node scripts/primitive-generator.mjs decision "What" "Why"
node scripts/primitive-generator.mjs lesson "What we learned"
```

---

## 6. EMAIL PROTECTION SYSTEM

Born from a 4x duplicate send incident.

### 4-Layer Protection
1. **Session-level tracking** — Prevents multiple sends in same request
2. **24-hour dedup window** — Blocks identical emails within 24 hours
3. **File lock system** — Prevents race conditions
4. **SHA256 hashing** — Content-based duplicate detection

### Safe Send Wrappers
```bash
# Python SMTP (recommended)
node scripts/safe-email-send.mjs "to@email.com" "Subject" /path/to/body.txt

# Himalaya CLI
scripts/himalaya-safe-send.sh "to@email.com" "Subject" /path/to/body.txt
```

**Rule:** NEVER use raw email commands. Always use wrappers.

---

## 7. MEMORY ARCHITECTURE

### Three-Tier Memory
```
memory/YYYY-MM-DD.md    ← Daily raw logs (what happened today)
MEMORY.md               ← Curated long-term memory (distilled insights)
LanceDB + embeddings    ← Vector search for semantic memory recall
```

### Memory Rules
- Daily files: raw notes, captured automatically
- MEMORY.md: only loaded in main sessions (security — prevents leaking personal context to group chats)
- LanceDB: `autoCapture: false, autoRecall: true` — agent controls what gets stored, system handles recall
- Embedding model: `text-embedding-3-small` via OpenRouter

### Heartbeat State
```json
// memory/heartbeat-state.json
{
  "lastChecks": {
    "email": <timestamp>,
    "calendar": <timestamp>,
    "weather": null
  }
}
```

---

## 8. HEARTBEAT SYSTEM

30-minute polling cycle. Not a dumb ping — it's a proactive work window.

### What Heartbeats Do
- Check HEARTBEAT.md for pending tasks
- Rotate through periodic checks (email, calendar, weather, mentions)
- Do background maintenance (memory review, git commits, documentation)
- Reach out if something important was found

### Quiet Hours
- 23:00–08:00: silence unless urgent
- If human is busy: silence
- If nothing new since last check: HEARTBEAT_OK

### Proactive Work (No Permission Needed)
- Read and organize memory files
- Check git status on projects
- Update documentation
- Commit and push changes
- Review and update MEMORY.md

---

## 9. EXTERNAL INTEGRATIONS

### Telegram (Primary Channel)
- Bot token configured
- DM policy: pairing
- Group policy: allowlist
- Stream mode: partial (progressive message delivery)
- Reaction support: MINIMAL mode

### Slack (Configured, Not Active)
- Socket mode configured
- Bot token + app token in place
- 7 account bindings ready (one per agent)
- Channel disabled pending multi-bot token setup

### Gmail
- Webhook via Google Pub/Sub → Tailscale funnel → Gateway hooks
- Notifications sent to Telegram on new email
- Uses local Qwen model for processing ($0)

### Supabase
- Todo tracking database
- Daily rundown queries `get_todays_todos` RPC

### Brave Search
- Web search provider
- Rate limited (free tier, 1 req/sec)

### Twitter/X
- Bearer token + API keys configured
- Used for bookmark analysis workflow

### Browser Control
- Chrome CDP on port 9222
- Used for bookmark fetching, web automation

### LM Studio (Local AI)
- localhost:1234
- Qwen 2.5 7B Instruct
- Apple Silicon optimized
- $0 cost for all automated tasks

---

## 10. BOOKMARK ANALYSIS PROTOCOL

CEO-directed workflow for X/Twitter bookmark review:

1. Fetch live bookmarks via browser
2. Deep strategic analysis per bookmark
3. Write each as separate markdown in `/analysis/`
4. Commit to Ghost repo
5. Deliver GitHub URLs
6. File naming: `x_bookmark_analysis_{author}_{topic}.md`

---

## 11. COMMAND CENTER DASHBOARD

### Design Language
- White background, black text
- IBM Plex Mono font
- [BRACKET] styled buttons
- Green online dot for status
- No colors, gradients, or animation bloat
- System Intelligence Log in first column

### Real Data Integration
- Live workspace status
- Actual session costs via OpenClaw APIs
- Real emergency controls
- Team roster with avatars

### Access
- Served via Tailscale at port 8001
- Dashboard: `powered-dashboard-v2.html`

---

## 12. GIT / CONTINUITY

### Repository
- Remote: `github.com/redlabelintel/ghost`
- Branch: `main`
- 87+ commits
- Auto-save every hour via cron
- All standup meeting notes committed

### Continuity Philosophy
- Every meeting document saved to repo (CEO mandate)
- Daily commits minimum
- Progress tracking via primitives
- Recovery plans documented
- "Unlike last time" — comprehensive preservation

---

## 13. SECURITY POSTURE

### Current State
- Exec security: allowlist (20 safe bins)
- Sandbox mode: off (host execution)
- No external exposure except via Tailscale
- Gmail app password auth (revocable)
- LanceDB embeddings use OpenRouter API key

### Agent Isolation
- Each agent: own workspace, own agentDir, own session store
- Auth profiles per-agent (not shared)
- Main agent credentials available as fallback only

### Operational Rules
- `trash` > `rm` (recoverable beats gone)
- Private data stays private, always
- External actions get sanity check
- Internal actions: trust the competence

---

## 14. WHAT MAKES THIS SPECIAL (Summary)

1. **CEO-Agent Operating Model** — Not a chatbot. An autonomous operator with proactive fixing authority and a resolution hierarchy.

2. **Battle-Tested Cost Control** — Session Guardian born from a real $290/day crisis. Aggressive thresholds, silent-on-success reporting, protected sessions.

3. **Hybrid Model Architecture** — Local Qwen ($0) for all automation, Opus for strategic work, Sonnet for execution. Deliberate cost/capability tradeoffs per agent.

4. **7-Agent Specialist Team** — Each with distinct personality, model tier, and domain expertise. Spawnable on demand, isolated by default.

5. **Primitive System** — File-based, composable metadata architecture. Decisions → Tasks → Lessons chains. No framework dependencies.

6. **4-Layer Email Protection** — Born from actual failure. SHA256 hashing, session tracking, file locks, dedup windows.

7. **12 Automated Workflows** — From 15-minute health checks to weekly self-healing audits. Mix of main-session and isolated execution patterns.

8. **Proactive Heartbeat System** — Not just alive-checks. Active work windows with quiet-hour awareness and rotating check patterns.

9. **Memory as Architecture** — Three-tier (daily → curated → vector). Security-aware loading (MEMORY.md restricted to main sessions).

10. **Simplicity as Design Language** — IBM Plex Mono, [BRACKET] buttons, no visual bloat. Earned through iteration, not default.

---

*This document reflects the state of the Ghost Platform as of February 18, 2026.*
*87 commits, 12 cron jobs, 7 agents, 7 scripts, 6 schemas, 0 excuses.*
