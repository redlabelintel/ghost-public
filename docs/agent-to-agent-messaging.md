# Agent-to-Agent Messaging System

**Status:** Active | **Protocol:** sessions_send | **Latency:** Real-time

## Overview

The Agent-to-Agent Messaging System enables independent AI agents to communicate, delegate tasks, and report results autonomously. It transforms the Ghost Platform from a single agent into a coordinated multi-agent workforce where specialists can be spawned on demand and work in parallel.

## Architecture

### Core Concept

```
Ghost (Coordinator) → sessions_spawn → Sub-Agent (Isolated Session)
                                              ↓
                        Results ← auto-announce ← Task Execution
```

### Key Components

1. **sessions_spawn Tool**
   - Spawns isolated sub-sessions
   - Assigns specific agent identity
   - Configures model and context
   - Auto-announces completion

2. **sessions_send Tool**
   - Direct message between agents
   - Real-time communication
   - No polling required

3. **sessions_list/subagents**
   - Monitor active sub-agents
   - Kill or steer running tasks
   - Track status and results

## Communication Patterns

### Pattern 1: Spawn → Execute → Announce
Most common — sub-agent works independently, reports back automatically.

```javascript
// Ghost spawns Tesla
sessions_spawn({
  agentId: "tesla",
  task: "Design API architecture...",
  model: "openrouter/moonshotai/kimi-k2.5"
})

// Tesla executes in isolated session
// Tesla reports via auto-announce
// Ghost receives result in chat
```

### Pattern 2: Spawn → Monitor → Harvest
Ghost polls for status, collects results when done.

```javascript
// Spawn multiple agents
const tasks = ["tesla", "aaron", "barnum"].map(agent => 
  sessions_spawn({ agentId: agent, task: "..." })
)

// Poll for completion
while (tasks.some(t => t.status === "running")) {
  await sleep(10000)
}

// Harvest results
const results = await Promise.all(tasks.map(t => getResult(t.sessionKey)))
```

### Pattern 3: Direct Message
Agents send messages to each other.

```javascript
// Ghost sends command to Patton
sessions_send({
  sessionKey: "agent:patton:main",
  message: "Strategic review needed..."
})
```

## Configuration

### Enabling Agent-to-Agent Messaging
```json
{
  "tools": {
    "agentToAgent": {
      "enabled": true,
      "allow": [
        "ghost",
        "tesla",
        "aaron",
        "barnum",
        "bond",
        "patton",
        "buffett"
      ]
    }
  }
}
```

### Spawning Permissions
```json
{
  "agents": {
    "list": [{
      "id": "ghost",
      "subagents": {
        "allowAgents": ["*"]
      }
    }]
  }
}
```

**Critical:** By default, agents can only spawn themselves. Add `allowAgents` to enable spawning others.

## Sub-Agent Lifecycle

### Phase 1: Spawn
- Isolated session created
- AGENTS.md loaded (persona + behavior)
- TOOLS.md loaded (environment notes)
- Task prompt injected

### Phase 2: Execution
- Sub-agent operates independently
- Access to all standard tools
- No access to parent's sessions/memory
- Runs on specified model

### Phase 3: Completion
- Sub-agent finishes task
- Results auto-announce to parent
- Session terminates
- Parent receives notification

## What Sub-Agents See

**Loaded Automatically:**
- Agent's AGENTS.md
- Agent's TOOLS.md
- Task prompt
- Standard tool access

**NOT Loaded:**
- SOUL.md (identity file)
- MEMORY.md (curated memory)
- USER.md (human relationships)
- IDENTITY.md (metadata)
- Parent session context

**Design Impact:** Persona must be in AGENTS.md for sub-agents to have personality.

## Practical Example: Multi-Agent Standup

```javascript
// CEO asks: "What should we build next?"
// Ghost spawns all 6 specialists in parallel

const agents = [
  { id: "tesla", role: "architecture" },
  { id: "aaron", role: "data" },
  { id: "barnum", role: "ux" },
  { id: "bond", role: "security" },
  { id: "patton", role: "strategy" },
  { id: "buffett", role: "finance" }
]

agents.forEach(agent => {
  sessions_spawn({
    agentId: agent.id,
    task: "Pitch what we should build next from your ${agent.role} perspective"
  })
})

// All 6 run simultaneously
// Each announces back when done
// Ghost compiles standup report
```

## Monitoring Active Sub-Agents

```javascript
// List all running sub-agents
subagents({ action: "list" })

// Result:
{
  "active": [{
    "sessionKey": "agent:tesla:subagent:abc123",
    "status": "running",
    "runtime": "5m 30s",
    "model": "openrouter/moonshotai/kimi-k2.5"
  }]
}
```

## Limitations & Constraints

### Concurrent Limits
- **maxChildrenPerAgent:** 10 (default: 5)
- **maxConcurrent:** 10 (system-wide)

### Context Isolation
- Sub-agents cannot see parent context
- No shared memory between sessions
- Results must be explicitly announced

### Model Restrictions
- Spawned model must be in allowed list
- Falls back to default if invalid
- Warning logged if model mismatch

## Cost Optimization

### Default Sub-Agent Model
```json
{
  "agents": {
    "defaults": {
      "subagents": {
        "model": "local/qwen2.5-7b-instruct"
      }
    }
  }
}
```

**Result:** All sub-agents default to local AI at $0 unless premium model explicitly specified.

### Premium Model Exceptions
- Critical strategic work → Opus
- Technical architecture → Sonnet
- Background tasks → Local Qwen

## Error Handling

### Common Failures

| Error | Cause | Fix |
|-------|-------|-----|
| "Unknown model" | Model not in allowed list | Add to `models.providers` |
| "Model not allowed" | Not in defaults.models | Add entry with `{}` params |
| "maxChildrenPerAgent" | Too many concurrent spawns | Wait for completion or increase limit |
| "Forbidden" | Routing error | Gateway restart or config patch |

### Retry Strategy
- Immediate retry on transient errors
- Exponential backoff on API failures
- Manual escalation on repeated failures

## Integration Points

### Command Center
- Real-time agent activity monitor
- Sub-agent status dashboard
- Kill switch for stuck agents

### Session Guardian
- Monitors sub-agent costs
- Terminates expensive spawns
- Tracks concurrent usage

### Cron Jobs
- Isolated sessions for automation
- Sub-agent as cron execution mode
- Delivery: "announce" to push results

## Advanced Patterns

### Chained Execution
```
Ghost → Tesla → Aaron → Result
(arch) → (data) → (output)
```

### Fan-Out
```
Ghost → [Tesla, Aaron, Barnum] → Merge Results
```

### Fan-In
```
[Tesla, Aaron] → Ghost → Buffett → Final Output
```

## Success Metrics

- **Spawn Success Rate:** 94%+ (after model fixes)
- **Result Delivery:** 100% auto-announce
- **Concurrent Capacity:** 10 agents
- **Average Response Time:** 30-60 seconds
- **Cost per Spawn:** $0 (default local model)

## Comparison: Single Agent vs Multi-Agent

| Single Agent | Multi-Agent |
|--------------|---------------|
| Sequential tasks | Parallel execution |
| One perspective | 7 perspectives simultaneously |
| Monolithic failure | Isolated failures |
| Single model | Model per task |
| $100+/day costs | $0/day with local defaults |

---

*Coordinating 6 specialists since February 18, 2026*
*Real-time execution | $0 default cost | Parallel by design*
