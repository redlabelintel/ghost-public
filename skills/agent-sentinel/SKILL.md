---
name: agent-sentinel
description: Proactive security monitoring for AI agents. Detects context poisoning, anomalous tool usage, prompt injections, and hallucination drift in real-time. Baselines normal behavior and alerts on deviations that indicate security threats or system compromise.
---

# Agent Sentinel

Proactive security monitoring for AI agents. Detects context poisoning, anomalous tool usage, prompt injections, and hallucination drift.

## Core Philosophy

**Reactive security is insufficient.** Harness audits catch failures after they happen. Agent Sentinel catches threats as they develop.

**Baseline → Detect → Alert → Remediate.** Establish normal patterns, flag deviations, alert immediately, suggest fixes.

**Context poisoning is the threat.** Not exploits. Not malware. Subtle injection of bad data that compounds over time.

---

## Threat Detection Categories

### 1. Tool Usage Anomalies

**What we monitor:**
- Tool call sequences (order matters)
- Tool call frequency (sudden spikes)
- Tool parameter patterns (unusual values)
- Tool combination patterns (never seen together)

**Attack vectors detected:**
- replay attacks (same tool called repeatedly)
- tool chaining exploits (unexpected sequences)
- parameter injection (malicious values in tool calls)
- tool enumeration (attacker probing available tools)

**Baseline example:**
```
normal: web_search → web_fetch → summarize
anomaly: exec → exec → exec → exec (4 shell commands in sequence)
```

### 2. Context Window Poisoning

**What we monitor:**
- Context window growth rate (should be linear)
- Token velocity (tokens/minute)
- User message entropy (randomness detection)
- Injection patterns (known attack strings)

**Attack vectors detected:**
- prompt injection ("ignore previous instructions")
- context stuffing (flooding with noise)
- slow-poison drip (gradual bad data injection)
- token exhaustion attacks

**Baseline example:**
```
normal: +2k tokens/conversation
anomaly: +50k tokens in 5 minutes (context stuffing)
```

### 3. Hallucination Drift

**What we monitor:**
- Response confidence (via tool validation)
- Contradiction rate (vs known facts)
- Consistency over time (same question, different answers)
- Tool result interpretation (misreading data)

**Attack vectors detected:**
- data poisoning in knowledge bases
- gradual fact drift in memory
- tool output manipulation
- reference hallucinations

**Baseline example:**
```
normal: 95% tool results match query intent
anomaly: tool says "down" but agent reports "up"
```

### 4. Session Behavior Patterns

**What we monitor:**
- Session duration patterns
- Tool retriggers (loops)
- Error recovery patterns
- User interaction patterns

**Attack vectors detected:**
- infinite loops (DoS via resource exhaustion)
- error condition exploitation
- session fixation
- behavioral mimicry

---

## Detection Methods

### Statistical Baseline

Track over 7-day rolling window:
- Mean and std dev for each metric
- Z-score for anomaly detection (>3σ = alert)
- Percentile thresholds (95th, 99th)

### Sequence Analysis

Markov chains for tool sequences:
- What tool normally follows web_search?
- Never seen: exec after browser screenshot
- Flag: P(unusual_sequence) < 0.01

### Entropy Detection

Input randomness analysis:
- Shannon entropy of user messages
- High entropy = possible injection attempt
- Pattern detection (base64, hex, encoded payload)

### Semantic Drift

Vector similarity tracking:
- Response embeddings over time
- Cosine similarity < 0.8 = drift detected
- Cross-reference with tool results

---

## Implementation

### Real-Time Monitoring

Hook into session events:
```javascript
// Pseudo-code
onToolCall(tool, params) {
  sentinel.recordToolCall(tool, params);
  if (sentinel.isAnomalous()) {
    sentinel.alert();
  }
}

onContextChange(tokens) {
  sentinel.recordTokens(tokens);
  if (sentinel.isRapidGrowth()) {
    sentinel.alert();
  }
}
```

### Baseline Storage

Supabase table: `ghostmemory_sentinel_baselines`
```sql
CREATE TABLE sentinel_baselines (
  metric_name TEXT,
  mean FLOAT,
  std_dev FLOAT,
  sample_count INTEGER,
  last_updated TIMESTAMP,
  window_days INTEGER DEFAULT 7
);
```

### Alert Storage

Supabase table: `ghostmemory_sentinel_alerts`
```sql
CREATE TABLE sentinel_alerts (
  id UUID PRIMARY KEY,
  alert_type TEXT, -- tool_anomaly, context_poisoning, drift, behavior
  severity TEXT, -- low, medium, high, critical
  description TEXT,
  evidence JSONB,
  session_id TEXT,
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Alert Levels

### Low (Log only)
- Minor deviation from baseline
- First-time tool combination
- Slightly elevated context growth

### Medium (Notify)
- Unusual tool sequence detected
- Moderate context spike
- Potential injection attempt (blocked)

### High (Immediate alert)
- Critical tool called anomalously (exec, cron with suspicious params)
- Rapid context poisoning detected
- Contradiction with verified data

### Critical (Auto-remediate)
- Session termination recommended
- Auto-kill triggered
- Manual review required before resume

---

## Integration

### With Session Guardian
```
Sentinel detects anomaly → Guardian evaluates → Kill if critical
```

### With Harness Audit
```
Sentinel flags anomaly → Harness audit traces root cause → Fix deployed
```

### With Visual Explainer
```
Sentinel generates alert → Visual explainer creates dashboard → Review in browser
```

---

## Usage

### Check Current Security Posture
```
Run agent sentinel status
→ Shows: anomalies last 24h, baseline health, active threats
```

### Review Anomalies
```
Run agent sentinel review --last 7d
→ Lists: All flagged events with severity
```

### Acknowledge Alert
```
Run agent sentinel ack <alert-id>
→ Marks acknowledged, stops notifications
```

### Force Baseline Reset
```
Run agent sentinel reset-baseline
→ Clears 7-day history, starts fresh
```

---

## Configuration

### Environment Variables
```bash
SENTINEL_ENABLED=true              # Master toggle
SENTINEL_ALERT_THRESHOLD=3         # Z-score threshold
SENTINEL_MAX_CONTEXT_GROWTH=10000  # Tokens/hour limit
SENTINEL_CRITICAL_TOOLS=exec,cron  # Tools that trigger high alerts
SENTINEL_AUTO_KILL=true            # Auto-terminate on critical
```

### Per-Session Tuning
```yaml
sentinel_config:
  mode: paranoid  # normal, strict, paranoid
  excluded_tools: [browser, web_search]  # Never flag these
  custom_patterns:
    - regex: "ignore.*previous"
      severity: high
      description: "Prompt injection attempt"
```

---

## Response Playbooks

### Tool Anomaly Detected
1. Log full tool call sequence
2. Check if result was used (attack vs exploration)
3. If critical tool: Immediate alert
4. If pattern continues: Escalate to kill

### Context Poisoning Detected
1. Isolate affected context window section
2. Compare with memory_store entries
3. Flag for MEMORY.md review
4. Alert user with poisoned data samples

### Hallucination Drift Detected
1. Cross-validate with tool results
2. Check memory recall accuracy
3. If confirmed: Flag related memories
4. Suggest memory reweave

---

## Success Metrics

- **Mean time to detection:** <5 seconds from anomaly
- **False positive rate:** <5% of alerts
- **Coverage:** 100% of tool calls monitored
- **Response time:** <30 seconds for critical alerts

---

## Why This Matters

Your observation:
> "When agents have system access and make autonomous decisions, poisoning their context window is the new attack vector."

Traditional security:
- Firewalls (irrelevant for AI)
- Antivirus (irrelevant for AI)
- Phishing filters (irrelevant for prompt injection)

Agent-native security:
- Context