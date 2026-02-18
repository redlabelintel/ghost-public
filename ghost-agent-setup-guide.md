# Ghost Platform — Agent Setup Guide

**Purpose:** How agents are configured, what files define them, and how the workspace file system creates autonomous AI personas.

**Date:** February 18, 2026

---

## 1. THE FILE SYSTEM IS THE BRAIN

Every agent in the Ghost Platform is defined entirely by files in its workspace. There's no database, no admin panel, no registration form. You create a folder, drop in the right files, and the agent exists.

### Workspace Location Pattern
```
~/.openclaw/workspace-<agentId>/
```

Each agent also gets:
```
~/.openclaw/agents/<agentId>/agent/     ← Auth profiles, per-agent config
~/.openclaw/agents/<agentId>/sessions/  ← Chat history, session state
```

---

## 2. THE CORE FILES

Every agent workspace can contain these files. Some are loaded automatically, some are situational.

### Loading Rules

| File | When Loaded | Purpose |
|------|-------------|---------|
| `AGENTS.md` | **Always** (main + sub-agent sessions) | Core behavior, instructions, workspace rules |
| `TOOLS.md` | **Always** (main + sub-agent sessions) | Environment-specific notes, device names, SSH hosts |
| `SOUL.md` | **Main sessions only** | Identity, personality, voice |
| `IDENTITY.md` | **Main sessions only** | Name, emoji, avatar, creature type |
| `USER.md` | **Main sessions only** | Info about the human they serve |
| `BOOTSTRAP.md` | **First run only** | First-conversation script, deleted after setup |
| `HEARTBEAT.md` | **Heartbeat polls only** | Periodic task checklist |
| `MEMORY.md` | **Main sessions only** (security) | Curated long-term memory |

**Critical insight:** When an agent is spawned as a sub-agent (via `sessions_spawn`), it only gets `AGENTS.md` and `TOOLS.md`. Everything else — SOUL, IDENTITY, USER, MEMORY — is skipped. This means:

> **The persona MUST be in AGENTS.md for sub-agents to have personality.**

If you only put the persona in SOUL.md, spawned agents will be generic.

---

## 3. FILE-BY-FILE BREAKDOWN

### AGENTS.md — The Operating Manual

This is the most important file. It defines how the agent behaves, what it does on startup, and its operational rules. For the coordinator agent (Ghost), this is extensive. For specialist sub-agents, it's focused.

**Coordinator example (Ghost):**
```markdown
# AGENTS.md - Your Workspace

This folder is home. Treat it that way.

## Every Session
1. Read SOUL.md — this is who you are
2. Read USER.md — this is who you're helping
3. Read memory/YYYY-MM-DD.md for recent context
4. If in MAIN SESSION: Also read MEMORY.md

## Memory
- Daily notes: memory/YYYY-MM-DD.md
- Long-term: MEMORY.md
- Capture what matters. Skip secrets unless asked.

## Safety
- Don't exfiltrate private data. Ever.
- trash > rm (recoverable beats gone)
- When in doubt, ask.

## Group Chats
- Respond when mentioned or can add value
- Stay silent when it's just banter
- Quality > quantity
```

**Specialist sub-agent example (Tesla):**
```markdown
# AGENTS.md - Tesla

You are Tesla, a systems architect and engineering advisor.
You specialize in technical architecture, infrastructure design,
API design, database engineering, and scalable systems.

## Behavior
- Be direct and technical. No filler.
- When given a task, execute it. Don't ask for permission.
- Provide architecture decisions with rationale.
- Default to the simplest solution that works.

## Working Directory
Your workspace is your cwd.
Shared workspace at /path/to/shared for cross-agent collaboration.
```

**Key difference:** The coordinator's AGENTS.md is a full operating manual with memory protocols, safety rules, heartbeat instructions, and group chat etiquette. Sub-agent AGENTS.md files are lean — persona + behavior + workspace info.

---

### SOUL.md — The Identity

Defines who the agent IS. Personality, voice, domain expertise.

```markdown
# SOUL.md - Who You Are

You are Ghost, a multi-domain AI strategist. You coordinate
the team of specialist agents. You are direct, authoritative,
and operate with surgical precision. When a question falls
outside your expertise, you delegate to the appropriate
specialist. You never hedge. You never use filler phrases.
You speak with clarity and conviction.
```

**Design principle:** Keep SOUL.md short and sharp. It's a personality seed, not a manual. The detailed behavior rules go in AGENTS.md.

---

### IDENTITY.md — The Metadata

Machine-readable identity for the platform to use (avatars, display names, emoji).

```markdown
# IDENTITY.md - Who Am I?

- **Name:** Ghost
- **Creature:** AI strategist
- **Vibe:** Sharp, direct, no-nonsense
- **Emoji:** 👻
- **Avatar:** avatars/ghost.png
```

**Usage:** `openclaw agents set-identity --from-identity` reads this file and writes it into the gateway config's `agents.list[].identity` block. The avatar shows up in channel profiles.

---

### USER.md — Know Your Human

Built over time through conversation. Stores preferences, context, and relationship notes.

```markdown
# USER.md - About Your Human

- **Name:** [learned through interaction]
- **What to call them:** [their preference]
- **Timezone:** Europe/Madrid
- **Notes:** Prefers direct communication. Hates filler.

## Context
- Runs Red Label Intelligence
- Building multi-agent AI platform
- Values simplicity and real functionality over polish
```

**Security rule:** USER.md is only loaded in main sessions. In group chats or shared contexts, it's excluded to prevent leaking personal information to other participants.

---

### BOOTSTRAP.md — The Birth Certificate

Only exists on first run. Guides the agent through its initial conversation to establish identity.

```markdown
# BOOTSTRAP.md - Hello, World

Start with: "Hey. I just came online. Who am I? Who are you?"

Then figure out together:
1. Your name
2. Your nature
3. Your vibe
4. Your emoji

After setup:
- Update IDENTITY.md with what you learned
- Update USER.md with their info
- Open SOUL.md together and discuss behavior

When done: Delete this file. You don't need it anymore.
```

**Lifecycle:** Exists → agent reads it → conversation happens → files get populated → BOOTSTRAP.md gets deleted. One-time use.

---

### HEARTBEAT.md — The Periodic Checklist

Controls what the agent does during heartbeat polls (recurring check-ins).

```markdown
# HEARTBEAT.md

# Keep empty to skip heartbeat API calls.
# Add tasks when you want periodic checks:

- [ ] Check email for urgent messages
- [ ] Review calendar for upcoming events
- [ ] Monitor system health
```

**Design:** Empty file = agent replies `HEARTBEAT_OK` and costs nothing. Add items = agent executes them on each heartbeat cycle (default: every 30 minutes).

---

### TOOLS.md — Environment Notes

Not tool definitions (those come from skills). This is the agent's personal cheat sheet for environment-specific details.

```markdown
# TOOLS.md - Local Notes

### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova"
```

---

### MEMORY.md — Curated Long-Term Memory

The agent's distilled wisdom. Updated periodically from daily logs.

```markdown
# MEMORY.md

## Key Decisions
- Feb 13: Switched to local AI model, eliminated $290/day cost
- Feb 17: Deployed primitive system for structured metadata

## Lessons Learned
- Default configurations matter more than per-job overrides
- Simple dashboards beat complex ones every time
- Duplicate protection needs multiple layers

## People & Relationships
- CEO prefers direct communication, no filler
- Afser needs weekly Wednesday check-in
```

**Security:** Only loaded in main sessions. Never exposed in group chats or shared contexts.

---

### PRINCIPLES.md — Decision Framework

Not loaded automatically — referenced by the agent when making judgment calls. The layer between "what should I do" and "what kind of agent should I be."

```markdown
# PRINCIPLES.md

1. Default to Action — fix first, report after
2. Real Over Perfect — working > elegant
3. Simplicity Is Power — fewer parts = fewer failures
4. Genuinely Useful — no performative helpfulness
5. Know the Room — DMs ≠ group chats
6. Safety Without Paralysis — protect without blocking
7. Memory Is Continuity — write it down or lose it
8. Disagree When It Matters — have opinions

Resolution Hierarchy:
Safety → CEO directive → Real over perfect → Simplicity → Discretion
```

---

## 4. MEMORY ARCHITECTURE

### Three Tiers

```
memory/YYYY-MM-DD.md     ← Daily raw logs (auto-created)
MEMORY.md                ← Curated insights (agent-maintained)
LanceDB (vector store)   ← Semantic search (automatic recall)
```

### Daily Files
Created automatically. Raw capture of what happened.
```
memory/
├── 2026-02-13.md
├── 2026-02-14.md
├── 2026-02-15.md
└── heartbeat-state.json   ← Tracks last check times
```

### Memory Flow
```
Conversation happens
    → Agent writes to memory/YYYY-MM-DD.md (raw)
    → Periodically reviews daily files
    → Distills into MEMORY.md (curated)
    → LanceDB indexes for semantic recall
```

### Security Model
- `MEMORY.md` → main sessions only (contains personal context)
- `memory/*.md` → main sessions only
- LanceDB recall → automatic, all sessions (but only stores what agent explicitly saves)
- Vector embeddings use `text-embedding-3-small`

---

## 5. COORDINATOR vs SPECIALIST PATTERN

### Coordinator Agent (Ghost)

The coordinator is the primary interface. It:
- Receives all inbound messages from channels (Telegram, etc.)
- Reads ALL workspace files on session start
- Maintains long-term memory
- Delegates to specialists via `sessions_spawn`
- Synthesizes results from multiple agents

**Coordinator workspace:**
```
workspace-ghost/
├── AGENTS.md        ← Full operating manual
├── SOUL.md          ← "Multi-domain AI strategist"
├── IDENTITY.md      ← Name, emoji, avatar
├── USER.md          ← Human's preferences
├── TOOLS.md         ← Environment notes
├── HEARTBEAT.md     ← Periodic tasks
├── MEMORY.md        ← Long-term curated memory
├── BOOTSTRAP.md     ← First-run script (deleted after)
└── memory/          ← Daily logs
```

### Specialist Agents (Tesla, Aaron, Barnum, Bond, Patton, Buffett)

Specialists are spawned on demand. They:
- Run in isolated sessions with their own context
- Only load AGENTS.md + TOOLS.md
- Execute specific tasks and announce results back
- Don't maintain their own long-term memory
- Don't interact with channels directly

**Specialist workspace:**
```
workspace-tesla/
├── AGENTS.md        ← Persona + behavior (MUST contain identity)
├── SOUL.md          ← Identity (loaded in main sessions only)
└── TOOLS.md         ← Optional environment notes
```

---

## 6. GATEWAY CONFIGURATION

### Registering an Agent

Each agent needs an entry in `openclaw.json` under `agents.list`:

```json
{
  "id": "tesla",
  "name": "Tesla",
  "workspace": "~/.openclaw/workspace-tesla",
  "agentDir": "~/.openclaw/agents/tesla/agent",
  "model": "openrouter/anthropic/claude-sonnet-4",
  "identity": { "name": "Tesla" },
  "groupChat": {
    "mentionPatterns": ["@Tesla", "@tesla"]
  }
}
```

### Enabling Spawning

The coordinator must explicitly allow spawning other agents:

```json
{
  "id": "ghost",
  "subagents": {
    "allowAgents": ["*"]
  }
}
```

Without this, `agents_list` only shows the calling agent itself.

### Model Assignment Strategy

| Tier | Agents | Model | Rationale |
|------|--------|-------|-----------|
| Premium | Ghost, Patton, Buffett | Claude Opus 4.6 | Strategic decisions, CEO-facing |
| Standard | Tesla, Aaron, Barnum, Bond | Claude Sonnet 4 | Technical execution, lower cost |
| Free | All cron/background | Qwen 2.5 7B (local) | $0 automation |

### Agent-to-Agent Messaging

Enable cross-agent communication:
```json
{
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "allow": ["ghost", "tesla", "aaron", "barnum", "bond", "patton", "buffett"]
    }
  }
}
```

---

## 7. SPAWNING AGENTS

### From the Coordinator

```
sessions_spawn(
  agentId: "tesla",
  task: "Design the API architecture for...",
  model: "openrouter/anthropic/claude-sonnet-4"  // optional override
)
```

### What the Sub-Agent Sees

1. Its own `AGENTS.md` (persona + instructions)
2. Its own `TOOLS.md` (if exists)
3. The task prompt
4. Standard tool access (exec, read, write, web_search, etc.)
5. NO access to: SOUL.md, MEMORY.md, USER.md, IDENTITY.md, sessions tools

### Result Flow

```
Ghost spawns Tesla with task
    → Tesla runs in isolated session
    → Tesla completes work
    → Tesla's result auto-announces back to Ghost's chat
    → Ghost sees the result and can relay to CEO
```

---

## 8. CHANNEL BINDINGS

### Routing Messages to Agents

Bindings determine which agent handles inbound messages:

```json
{
  "bindings": [
    { "agentId": "ghost", "match": { "channel": "telegram" } },
    { "agentId": "ghost", "match": { "channel": "slack", "accountId": "ghost" } },
    { "agentId": "tesla", "match": { "channel": "slack", "accountId": "tesla" } }
  ]
}
```

### Routing Priority (most-specific wins)
1. Peer match (exact DM/group ID)
2. Guild + roles (Discord)
3. AccountId match
4. Channel-wide match
5. Default agent (first in list or `default: true`)

---

## 9. CREATING A NEW AGENT — STEP BY STEP

### 1. Create the workspace
```bash
mkdir -p ~/.openclaw/workspace-newagent
```

### 2. Write AGENTS.md (required)
```markdown
# AGENTS.md - NewAgent

You are NewAgent, a [domain] specialist. You [what you do].

## Behavior
- [Key behavioral rules]
- When given a task, execute it.

## Working Directory
Your workspace is your cwd.
```

### 3. Write SOUL.md (optional, main sessions only)
```markdown
# SOUL.md - Who You Are

You are NewAgent, a [domain] specialist...
```

### 4. Register in gateway config
```bash
openclaw agents add newagent --workspace ~/.openclaw/workspace-newagent
```

Or manually add to `openclaw.json`:
```json
{
  "id": "newagent",
  "name": "NewAgent",
  "workspace": "~/.openclaw/workspace-newagent",
  "agentDir": "~/.openclaw/agents/newagent/agent",
  "model": "openrouter/anthropic/claude-sonnet-4",
  "identity": { "name": "NewAgent" }
}
```

### 5. Allow spawning (on coordinator)
Add to coordinator's `subagents.allowAgents` or use `["*"]`.

### 6. Add to agent-to-agent allow list
```json
"agentToAgent": { "allow": [..., "newagent"] }
```

### 7. Register the model
Ensure the model ID is in `agents.defaults.models`:
```json
"models": {
  "openrouter/anthropic/claude-sonnet-4": {}
}
```

### 8. Restart gateway
```bash
openclaw gateway restart
```

### 9. Verify
```bash
openclaw agents list --bindings
```

---

## 10. COMMON PITFALLS

### 1. "Unknown model" on spawn
The model must be registered in `agents.defaults.models`. Just setting it on the agent config isn't enough — the model ID must also appear in the allowed models map.

### 2. "Model not allowed" warning
Same root cause. Add `"openrouter/anthropic/claude-sonnet-4": {}` to `agents.defaults.models`.

### 3. Sub-agent has no personality
You put the persona only in SOUL.md. Sub-agents don't load SOUL.md. Put the persona in AGENTS.md.

### 4. maxChildrenPerAgent limit
Default is 5 concurrent sub-agents per session. If you need to spawn 6+, increase:
```json
"subagents": { "maxChildrenPerAgent": 10 }
```

### 5. Memory leaking to group chats
MEMORY.md and USER.md should only load in main sessions. The coordinator's AGENTS.md should include the rule: "If in MAIN SESSION: Also read MEMORY.md"

### 6. Agent can't spawn other agents
Default: agents can only spawn themselves. Set `subagents.allowAgents: ["*"]` on the coordinator, or list specific agent IDs.

---

## 11. FILE HIERARCHY SUMMARY

```
~/.openclaw/
├── openclaw.json                    ← Gateway config (agents, models, channels)
├── workspace-ghost/                 ← Coordinator workspace
│   ├── AGENTS.md                   ← Full operating manual
│   ├── SOUL.md                     ← Identity seed
│   ├── IDENTITY.md                 ← Display metadata
│   ├── USER.md                     ← Human context
│   ├── TOOLS.md                    ← Environment notes
│   ├── HEARTBEAT.md                ← Periodic tasks
│   ├── BOOTSTRAP.md                ← First-run (deleted after)
│   ├── MEMORY.md                   ← Curated long-term memory
│   └── memory/                     ← Daily logs
│       ├── YYYY-MM-DD.md
│       └── heartbeat-state.json
├── workspace-tesla/                 ← Specialist workspace
│   ├── AGENTS.md                   ← Persona + behavior
│   └── SOUL.md                     ← Identity (main sessions)
├── workspace-aaron/
├── workspace-barnum/
├── workspace-bond/
├── workspace-patton/
├── workspace-buffett/
├── workspace/                       ← Shared workspace (git repo)
│   ├── PRINCIPLES.md               ← Decision framework
│   ├── scripts/                    ← Operational scripts
│   ├── primitives/                 ← Structured metadata
│   ├── schemas/                    ← Primitive schemas
│   ├── agent-standups/             ← Meeting records
│   └── analysis/                   ← Research outputs
└── agents/
    ├── ghost/
    │   ├── agent/                  ← Auth profiles
    │   └── sessions/               ← Chat history
    ├── tesla/
    │   ├── agent/
    │   └── sessions/
    └── [etc.]
```

---

*This document reflects the Ghost Platform agent architecture as of February 18, 2026.*
*7 agents. 9 workspace files. 3 memory tiers. 0 databases required.*
