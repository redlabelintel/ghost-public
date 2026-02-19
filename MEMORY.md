# MEMORY.md — Long-Term Memory

Curated, distilled memories from daily operations. Review and update weekly via `/reweave`.

---

## Format Specification

Each entry should include:
- **Decision/Fact**: What happened
- **Why**: Reasoning behind it
- **Grounding**: What prior decision/fact this builds on
- **Status**: active | superseded | archived

---

## Active Decisions

### Ghost Agent Local Model Switch
**Date:** 2026-02-19  
**Type:** decision  
**Status:** active

**What:** Switched Ghost agent from OpenRouter to local/qwen2.5-7b-instruct

**Why:** 
- Auth errors (HTTP 401, "User not found") from OpenRouter
- Cost optimization strategy ($0/day target)

**Grounding:**
- Feb 17, 2026: Evening Agent Standup cron job failed with OpenRouter 404
- Feb 17, 2026: Default model switched to local for cost control
- Feb 13, 2026: 100% Local Model Switch achieved $0/day

**Action Taken:**
1. Added `local:default` profile to ghost agent auth-profiles.json
2. Patched gateway config: model changed from openrouter/moonshotai/kimi-k2.5 to local/qwen2.5-7b-instruct
3. Gateway restarted (PID 23147)

---

### Multi-Agent Deployment Complete
**Date:** 2026-02-18  
**Type:** decision  
**Status:** active

**What:** All 6 specialist agents (Tesla, Aaron, Barnum, Bond, Patton, Buffett) deployed

**Why:** 
- Need specialized capabilities across domains
- Enable agent-to-agent delegation

**Grounding:**
- Real OpenClaw Chat Integration completed (Feb 16)
- Command Center operational with live data

**Configuration:**
- Models: Ghost/Patton/Buffett on Opus 4.6, Tesla/Aaron/Barnum/Bond on Sonnet 4
- Agent-to-agent messaging enabled
- allowAgents: ["*"] for Ghost

---

### Silent Health Check Protocol
**Date:** 2026-02-19  
**Type:** decision  
**Status:** active

**What:** Health checks report failures only, not successes

**Why:**
- Reduce noise in Telegram
- Only alert when intervention needed

**Grounding:**
- User preference established (Feb 19 morning)

**Applies To:**
- TWR Geo Bot health checks
- Session Guardian
- Crypto Trading Bot (alert on BUY/SELL signals and errors only)

---

## Active Facts

### System Architecture
**Date:** Ongoing  
**Type:** fact

- **Agents:** 7 total (Ghost + 6 specialists)
- **Current Model:** local/qwen2.5-7b-instruct ($0 cost)
- **Session Context:** 59k/131k (45%)
- **Gateway:** Operational, localhost:18789

### Ars Contexta Research Applied
**Date:** 2026-02-19  
**Type:** fact

Adopted patterns from Ars Contexta methodology:
1. Schema headers in memory files ✓
2. Weekly /reweave cycle (script created)
3. Explicit ops/ directory ✓
4. MOCs for analysis/ and projects/ ✓
5. Decision annotations (why + grounding) ✓

**Why Not Full Implementation:**
- Ghost's multi-agent orchestration more sophisticated
- Already have working cost-optimized local deployment

---

## Superseded

*None yet*

---

## Archive

*None yet*

---

*Last reviewed: 2026-02-19*
*Next /reweave: 2026-02-26*
