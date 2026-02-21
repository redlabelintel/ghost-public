# Agent Sentinel Implementation

## Core Components

### 1. Baseline Tracker (`baseline-tracker.mjs`)

Tracks normal patterns over 7-day rolling window.

**Metrics tracked:**
- Tool call frequency per tool
- Tool sequence patterns (Markov chains)
- Context window growth rate
- Session duration distributions
- Error rates per tool
- Token velocity (tokens/minute)

**Storage:** Supabase `sentinel_baselines` table

### 2. Real-Time Monitor (`session-monitor.mjs`)

Hooks into OpenClaw session lifecycle.

**Monitors:**
- Pre-tool-call validation
- Post-tool-result analysis
- Context window checkpoints
- User message entropy
- Response coherence

**Integration:** Middleware in OpenClaw's tool execution pipeline

### 3. Anomaly Detector (`anomaly-detector.mjs`)

Statistical analysis engine.

**Algorithms:**
- Z-score detection for numeric metrics
- Markov chain probability for sequences
- Shannon entropy for input analysis
- Cosine similarity for semantic drift

**Output:** Anomaly score (0-100) + severity level

### 4. Alert Manager (`alert-manager.mjs`)

Routes alerts to appropriate channels.

**Channels:**
- Telegram (immediate)
- Session log (always)
- Supabase (persistent)
- Visual dashboard (if enabled)

### 5. Auto-Remediator (`auto-remediator.mjs`)

Takes action on critical alerts.

**Actions:**
- Kill session
- Block tool
- Require confirmation
- Alert human

---

## Deployment Options

### Option A: Integrated (Recommended)

Sentinel runs as OpenClaw middleware.

**Pros:**
- Real-time monitoring
- Direct tool interception
- No latency

**Cons:**
- Requires OpenClaw extension point
- Runs in same process

### Option B: Sidecar (Container)

Sentinel runs as separate process.

**Pros:**
- Isolation
- Independent scaling
- Can monitor multiple agents

**Cons:**
- Requires IPC
- Monitoring delay
- Complex setup

### Option C: Log Analysis (Simplest)

Sentinel scans session logs periodically.

**Pros:**
- Easy to deploy
- No session integration needed
- Works with any setup

**Cons:**
- Delayed detection (minutes, not seconds)
- Reactive not proactive

---

## Implementation Priority

**Week 1 (MVP):**
- [ ] Baseline tracker for tool calls
- [ ] Simple threshold detection
- [ ] Alert storage to Supabase
- [ ] Telegram notifications

**Week 2 (Enhanced):**
- [ ] Sequence analysis
- [ ] Context poisoning detection
- [ ] Hallucination drift tracking
- [ ] Auto-kill on critical alerts

**Week 3 (Production):**
- [ ] Real-time session hooks
- [ ] Visual dashboard
- [ ] Custom pattern rules
- [ ] Integration with harness audit

---

## Testing Strategy

**Synthetic attacks:**
1. Send prompt injection attempts → Verify detection
2. Call exec 10 times fast → Verify anomaly flag
3. Stuff context with noise → Verify poisoning alert
4. Contradict memory with bad data → Verify drift detection

**False positive testing:**
1. Normal workflow for 1 week
2. Review alert rate
3. Tune thresholds if >5% false positives

---

## Current Status

**Not yet implemented.** Skill specification ready. Awaiting build priority.

**Estimated build time:**
- MVP: 4 hours
- Full implementation: 16 hours
- Testing: 4 hours