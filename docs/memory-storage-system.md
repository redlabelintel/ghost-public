# Memory Storage System

**Status:** Active | **Architecture:** Three-Tier | **Security:** Session-Aware

## Overview

The Memory Storage System provides persistent, searchable, and context-aware memory for the Ghost Platform. It implements a three-tier architecture balancing raw capture, curated wisdom, and semantic search — with security controls to prevent information leakage.

## Three-Tier Architecture

### Tier 1: Daily Raw Logs
**Purpose:** Complete session capture, unfiltered
**Format:** `memory/YYYY-MM-DD.md`
**Access:** Main sessions only (security)
**Lifecycle:** Created daily, referenced for 48 hours

**Content:**
- Conversations and decisions
- Actions taken
- Errors encountered
- System events
- CEO directives

**Example:**
```markdown
# Memory Log — February 18, 2026

## Morning

### 1:17 PM - Multi-Agent Deployment Completed
- All 6 specialist agents now spawnable
- AGENTS.md files created
- Config patched and restarted

### 1:30 PM - All Models Switched to Kimi K2.5
- Moved from Opus/Sonnet to Kimi
- Full $0 cost across all agents
```

### Tier 2: Curated Long-Term Memory
**Purpose:** Distilled wisdom, permanent reference
**File:** `MEMORY.md` (workspace root)
**Access:** Main sessions only (security critical)
**Updates:** Periodic review of daily logs

**Content:**
- Key decisions and rationale
- Lessons learned
- System preferences
- Relationship notes
- Strategic insights

**Security Note:** MEMORY.md contains personal context and is NEVER loaded in group chats or shared sessions. This prevents information leakage to other participants.

### Tier 3: Semantic Vector Search
**Purpose:** AI-powered recall across all content
**Engine:** LanceDB with embeddings
**Provider:** OpenRouter (text-embedding-3-small)
**Mode:** autoRecall: true, autoCapture: false

**How it works:**
- Agent explicitly saves memories → Vectorized and stored
- Natural language query → Semantic search returns relevant matches
- Context injection → Most relevant memories added to prompt

## Access Control Matrix

| File | Main Session | Group Chat | Sub-Agent | Cron Job |
|------|--------------|------------|-----------|----------|
| memory/YYYY-MM-DD.md | ✅ Yes | ❌ No | ❌ No | ❌ No |
| MEMORY.md | ✅ Yes | ❌ No | ❌ No | ❌ No |
| USER.md | ✅ Yes | ❌ No | ❌ No | ❌ No |
| SOUL.md | ✅ Yes | ❌ No | ❌ No | ❌ No |
| AGENTS.md | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |
| TOOLS.md | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes |

## Workflow

### Daily Capture
```
Session activity occurs
    ↓
Agent writes to memory/YYYY-MM-DD.md
    ↓
Key events flagged for MEMORY.md review
```

### Periodic Curation
```
Review recent memory/ files
    ↓
Identify significant learnings
    ↓
Update MEMORY.md with distilled wisdom
    ↓
Remove outdated information
```

### Semantic Recall
```
CEO asks question requiring context
    ↓
Vector search across LanceDB
    ↓
Relevant memories retrieved
    ↓
Injected into prompt for coherent response
```

## Configuration

```json
{
  "memorySearch": {
    "provider": "openai",
    "remote": {
      "baseUrl": "https://openrouter.ai/api/v1"
    },
    "model": "text-embedding-3-small"
  }
}
```

```json
{
  "plugins": {
    "memory-lancedb": {
      "enabled": true,
      "config": {
        "embedding": {
          "apiKey": "...",
          "model": "text-embedding-3-small"
        },
        "autoCapture": false,
        "autoRecall": true
      }
    }
  }
}
```

## Storage Locations

```
workspace-ghost/
├── memory/
│   ├── 2026-02-13.md              # Daily raw logs
│   ├── 2026-02-14.md
│   ├── 2026-02-18.md
│   ├── ai-digest-posted.json      # Digest tracking
│   └── heartbeat-state.json       # Periodic check tracking
├── MEMORY.md                       # Curated long-term memory
├── USER.md                         # Human relationship notes
└── SOUL.md                         # Agent identity
```

## GitHub Integration

- **Auto-commit:** Daily logs pushed hourly via cron
- **History:** Complete session archive since Feb 13, 2026
- **Recovery:** Full state reconstruction possible from repo

## Security Model

### Private Data (Main Sessions Only)
- User's name, preferences, personal details
- Strategic business decisions
- Sensitive operational details
- Relationship context

### Shared Data (All Sessions)
- AGENTS.md (operational instructions)
- TOOLS.md (environment notes)
- General system capabilities

### Why This Matters
If you're in a group chat with strangers, you don't want your AI assistant blurting out "As I told you yesterday about your divorce..." The session-aware loading prevents this.

## Best Practices

1. **Write it down** — Don't rely on "mental notes"
2. **Daily logs are raw** — Capture everything
3. **MEMORY.md is curated** — Distill, don't dump
4. **Update periodically** — Review weekly, clean monthly
5. **Tag important decisions** — Link to primitive system

## Cost

- **Daily logs:** $0 (local file writes)
- **MEMORY.md:** $0 (local file writes)
- **Vector search:** ~$0.0001 per query (OpenRouter embedding API)

---

*System architecture: Three-tier hybrid*
*22 daily logs | Semantic search active | Session-aware security*
