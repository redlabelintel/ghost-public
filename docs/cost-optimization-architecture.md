# Cost Optimization Architecture

**Status:** Active | **Current Cost:** $0/day | **Baseline:** $290/day (crisis peak)

## Overview

The Cost Optimization Architecture eliminates runaway AI costs through a tiered model strategy, aggressive local AI deployment, and automated session protection. What began as a $290/day crisis became a $0/day sustainable system while maintaining full capability.

## Hierarchical Cost Model

### Tier 1: Local AI (Qwen 2.5 7B) — $0
**Primary Use:** All automation, cron jobs, sub-agents, background tasks

**Why:**
- Zero API cost
- Sufficient capability for most tasks
- No rate limits
- Private (no data leaves machine)

**Deployment:**
- Platform: LM Studio on Apple Silicon
- Endpoint: `localhost:1234/v1`
- Integration: OpenAI-compatible API
- Model: Qwen2.5-7B-Instruct (4.36GB)

### Tier 2: Cloud Free Tier (Kimi K2.5) — $0
**Primary Use:** Direct CEO interaction, spawned agent tasks, complex analysis

**Why:**
- OpenRouter free tier credits
- Better quality than local for nuanced tasks
- No local GPU required
- $0 with current usage

**Limits:**
- Rate limited (1 req/sec on free tier)
- Burst capacity varies
- Good for real-time, not bulk

### Tier 3: Premium Models (Reserved) — $$$ 
**Use Case:** Critical strategic decisions, complex multi-step reasoning

**When to Use:**
- Strategic planning requiring deep reasoning
- CEO facing high-stakes decisions
- Multi-agent coordination requiring nuance

**Current:** Not in regular use — Kimi K2.5 handles all direct interaction

## Cost Breakdown February 2026

| System | Model | Frequency | Cost |
|--------|-------|-----------|------|
| Health Checks (TWR Geo) | main session | Every 15 min | $0 (Kimi) |
| Session Guardian | main session | Every 15 min | $0 (Kimi) |
| Auto-Save Commits | main session | Hourly | $0 (Kimi) |
| Standups | sub-agents | 2x daily | $0 (local) |
| Crypto Bot | main session | Every 4h | $0 (Kimi) |
| AI Digest | isolated | Daily 8:30 AM | $0 (local) |
| Gmail Monitor | isolated | Webhook triggered | $0 (local) |
| Bookmark Analysis | main session | On demand | $0 (Kimi) |
| **TOTAL** | | | **$0/day** |

## Session Guardian Protection

### Kill Thresholds (Cost Protection)
- **$25 total cost** → Automatic termination
- **$5/hour burn rate** (2+ hours) → Termination
- **$8 cost** → Warning alert

### Context Protection
- **95% context usage** → Automatic kill
- **80% context usage** → Warning
- Prevents $100+ bleed from context overflow

### Duration Limits
- **8 hours max** → Automatic kill (reduced from 24h)
- **4 hours** → Warning

**Result:** Cannot exceed $25/session, estimated savings $100s/day

## Model Migration Strategy

### Step 1: Analyze Usage
- Tracked actual API calls
- Identified unnecessary premium model usage
- Found cached sessions using wrong model

### Step 2: Local Deployment
- Installed LM Studio on Apple Silicon
- Configured Qwen 2.5 7B with Metal acceleration
- Verified $0 operation mode

### Step 3: Tiered Assignment
```
┌─────────────────────────────────────────────┐
│  Tier 3: Premium (Opus 4.6)                │
│  Reserved for critical strategic work only │
├─────────────────────────────────────────────┤
│  Tier 2: Cloud Free (Kimi K2.5)            │
│  Direct CEO interaction, spawned agents    │
├─────────────────────────────────────────────┤
│  Tier 1: Local (Qwen 7B)                   │
│  All automation, sub-agents, cron jobs      │
└─────────────────────────────────────────────┘
```

### Step 4: Fallback Chain
```json
{
  "fallbacks": [
    "local/qwen2.5-7b-instruct",
    "openrouter/moonshotai/kimi-k2.5"
  ]
}
```

## Configuration For $0 Operation

### Agent Defaults
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

### Cron Job Models
```json
{
  "delivery": {
    "model": "local/qwen2.5-7b-instruct",
    "thinking": "off"
  }
}
```

### Sub-Agent Default
All spawned agents default to local Qwen unless premium explicitly requested.

## Cost Monitoring

### Real-Time Tracking
- Command Center shows "Session Cost This Session"
- Total cost across all sessions visible
- Cost per agent tracked

### Daily Reports
- Previous session cost logged to memory
- Daily spending tracked in MEMORY.md
- Alerts if trending above $0

### Zero-Cost Verification
```bash
# Confirm local model operational
curl http://localhost:1234/v1/models

# Expected: Qwen 2.5 7B available

# Test with zero-cost request
openclaw chat --model local/qwen2.5-7b-instruct "Hello"

# Expected: $0 cost reported
```

## Historical Timeline

### February 13, 2026 — Crisis
- **Cost:** $290/day detected
- **Duration:** 865 active sessions
- **Cause:** Opus/Sonnet overuse, no local model
- **Status:** CRITICAL

### February 13, 2026 — Emergency Response
- **Action:** Switched to Kimi K2.5
- **Result:** Immediate 80% cost reduction
- **Status:** URGENT → STABLE

### February 13, 2026 — Session Guardian Deployed
- **Protection:** Aggressive thresholds enacted
- **Safety:** $25 kill limit, $8 warning
- **Status:** PROTECTED

### February 18, 2026 — All $0 Migration
- **Action:** All 7 agents moved to Kimi K2.5
- **Previous:** Opus for strategic, Sonnet for technical
- **Result:** Full $0 operation
- **Status:** OPTIMIZED

## Trade-offs

### Local Model Limitations
- **Speed:** Slower than cloud (7B vs 100B+ parameters)
- **Capability:** Adequate for 80% of tasks
- **Memory:** 4GB model file required

### Zero-Cost Benefits
- **Unlimited:** No rate limit anxiety
- **Private:** Data never leaves local machine
- **Reliable:** No API downtime dependency
- **Sustainable:** Can run indefinitely

## Future Cost Protection

### Automatic Protection
- Session Guardian monitors all sessions
- Billing alerts if any session exceeds $5
- Context monitoring prevents overruns
- Model downgrading on high burn detected

### Manual Limits
- CEO approval required for Opus usage
- Sub-agents default to $0 local
- Override requires explicit model specification

## Lessons Learned

1. **Default matters** — Defaults cascade; local must be default
2. **Monitor aggressively** — 15-minute scans catch runaway
3. **Fallback chain** — Always have $0 backup ready
4. **Safety over performance** — $0 sustainable beats $$$ valuable

## Cost Comparison: Before & After

| Scenario | Before | After | Savings |
|----------|--------|-------|---------|
| Daily operations | $290 | $0 | 100% |
| Sub-agent spawn | $1-5 | $0 | 100% |
| Cron jobs | $50 | $0 | 100% |
| Standups | $20 | $0 | 100% |
| Analysis | $10 | $0 | 100% |

## Infrastructure Cost

| Component | Cost |
|-----------|------|
| GitHub repo | $0 (free tier) |
| Supabase | $0 (free tier) |
| OpenRouter | $0 (Kimi free tier) |
| Local AI | $0 (Apple Silicon) |
| Telegram bot | $0 |
| **TOTAL** | **$0** |

---

*From $290/day crisis to $0/day sustainability*
*February 13, 2026 — February 18, 2026*
*Proof that cost optimization requires both technology and discipline*
