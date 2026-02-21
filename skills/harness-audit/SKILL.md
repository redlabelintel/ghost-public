---
name: harness-audit
description: Analyze session traces to identify failure patterns and synthesize harness improvements. Uses parallel error analysis agents to diagnose tool misuse, context overflow, and incorrect memory retrieval. Generates actionable recommendations for harness tuning.
---

# Harness Audit

Analyze session traces to identify failure patterns and synthesize harness improvements. Uses parallel error analysis agents to diagnose root causes and generate actionable recommendations.

## When to Use

- After a session terminates unexpectedly or hits a limit
- When tool calls are failing repeatedly
- When context window is exhausted unexpectedly
- When memory retrieval is returning incorrect results
- Weekly harness health checks
- Before major harness changes to establish baseline

## Core Philosophy

- **Trace first, diagnose second.** Always examine the actual session log, not just the error message.
- **Parallel analysis.** Multiple specialized agents each analyze from a different angle.
- **Synthesize findings.** Combine parallel analyses into coherent recommendations.
- **Actionable output.** Every recommendation must include specific harness changes.

---

## How to Audit

### Step 1: Fetch Session Traces

Locate the session transcript file:

```bash
# Find recent session files
ls -lt ~/.openclaw/workspace-ghost/*.jsonl | head -10

# Get session ID from transcript filename
[session-id].jsonl
```

### Step 2: Parse Trace Structure

Read the JSONL file and extract:
- Message flow (user → assistant → tool → assistant)
- Tool calls and results
- Error signals (rate limits, context window, tool failures)
- Response latencies (if available)

### Step 3: Parallel Analysis

Spawn specialized analysis agents:

**Agent 1: Tool Call Analyzer**
```
Review this session trace focusing on tool usage.
- Did tools return errors? What types?
- Were tools called with correct parameters?
- Was there excessive retry behavior?
- Did tool selection match the task?
Report specific tool failures and root causes.
```

**Agent 2: Context Window Auditor**
```
Review this session trace focusing on context management.
- When did context limits trigger?
- Was pruning effective or too aggressive/conservative?
- Were there message bloat patterns?
- Did session length match expected scope?
Report context efficiency issues.
```

**Agent 3: Memory Retrieval Validator**
```
Review this session trace focusing on memory operations.
- Did memory_recall return relevant results?
- Was memory_store called appropriately?
- Were there redundant memory searches?
- Did memory inform decisions effectively?
Report memory system failures.
```

**Agent 4: Session Flow Inspector**
```
Review this session trace focusing on overall flow.
- Did the session achieve its goal?
- Where did it get stuck or loop?
- Were there abrupt terminations?
- Was user intent correctly interpreted?
Report workflow breakdowns.
```

### Step 4: Synthesize Findings

Combine parallel analyses into structured recommendations:

---

## Output Format

### Full Audit Report

```
### Harness Audit: [Session ID] — [Date]

**Session Summary:** [Goal, duration, outcome]

#### 🔴 Critical Issues (fix immediately)
1. **[Category]:** [Specific issue with trace evidence]
   → **Evidence:** [Trace excerpt or pattern]
   → **Root Cause:** [Why it happened]
   → **Harness Fix:** [Specific change to AGENTS.md, skills, or cron config]

#### 🟡 Improvements (address this week)
1. **[Category]:** [Specific issue]
   → **Evidence:** [Trace evidence]
   → **Harness Fix:** [Recommended change]

#### 🟢 Optimizations (nice to have)
1. **[Category]:** [Observation]
   → **Harness Fix:** [Suggested improvement]

#### ✅ What's Working Well
- [Positive pattern observed]

---

### Harness Changes Recommended

| Priority | File | Change | Expected Impact |
|----------|------|--------|-----------------|
| 🔴 | [file] | [specific change] | [effect] |
| 🟡 | [file] | [specific change] | [effect] |
```

---

## Integration with Workflow

### After Session Failure

1. Identify failed session ID from logs or user report
2. Run harness audit on that session
3. Implement 🔴 critical fixes immediately
4. Schedule 🟡 improvements for next cycle
5. Log findings to `harness/audit-log.md`

### Weekly Harness Health Check

1. Identify longest/oldest active sessions from `sessions_list`
2. Run audit on 2-3 representative sessions
3. Look for patterns across multiple audits
4. Update harness configs if trends emerge
5. Report weekly harness health summary

### Before/After Harness Changes

1. Run baseline audit on recent session
2. Implement harness changes
3. Run new session with same task type
4. Compare audits to verify improvement

---

## Example Analysis

### Example 1: Tool Call Failure Cascade

```
SESSION: agent:ghost:2026-02-17-evening-standup

🔴 Critical: Browser tool timeout cascade
→ Evidence: 3 consecutive browser:open timeouts at 30s
→ Root Cause: Default timeout insufficient for heavy pages
→ Harness Fix: Increase browser timeout to 60s in TOOLS.md
            Add retry logic with exponential backoff
```

### Example 2: Context Window Exhaustion

```
SESSION: agent:buffett:main — 6.2 hours duration

🔴 Critical: Context window exhausted at 131k tokens
→ Evidence: 47 tool calls, 23 web searches, no compaction triggered
→ Root Cause: Long-running analysis without session handoff
→ Harness Fix: Add session handoff every 50 tool calls in primitive TASK.md
            Implement automatic compaction at 100k tokens
```

### Example 3: Memory Misretrieval

```
SESSION: agent:tesla:market-analysis

🟡 Improvement: memory_recall returning outdated context
→ Evidence: Recalled Feb 10 data for Feb 20 query
→ Root Cause: No temporal filtering in recall query
→ Harness Fix: Add date range params to memory_recall calls
            Update MEMORY.md with recency weighting
```

---

## Harness Audit Skill Usage

### Single Session Audit

```
Read session trace: ~/.openclaw/workspace-ghost/[session-id].jsonl
Parse tool calls, errors, context usage
Spawn 4 parallel analysis agents with focused prompts
Synthesize into audit report
Recommend specific harness changes
```

### Pattern Detection (Multiple Sessions)

```
Fetch last 7 days of session traces
Run mini-audits on each (tool errors only)
Aggregate: count error types per tool
Identify: which tools fail most often
Recommend: tool-specific harness improvements
```

---

## Files to Modify

Common harness files that audits target:

- `AGENTS.md` — system prompt refinements
- `SOUL.md` — identity/behavior adjustments
- `TOOLS.md` — tool configs, timeouts, fallbacks
- `SKILL.md` files — skill-specific prompt improvements
- `cron` jobs — schedule adjustments, timeout tuning
- `HEARTBEAT.md` — periodic check modifications

---

## Success Metrics

Track these to measure harness improvement:

| Metric | Before | After |
|--------|--------|-------|
| Session completion rate | X% | Y% |
| Avg tool calls per session | N | M |
| Context window exhaustion rate | X% | Y% |
| Tool error rate | X% | Y% |
| Avg session duration | T1 | T2 |

Update metrics weekly to validate harness changes.

---

*Built for OpenClaw. Inspired by LangChain's Deep Agent improvements research.*
