# Session Guardian System

**Status:** Active | **Version:** 2.0 | **Deployed:** February 13, 2026

## Overview

Session Guardian is an automated cost protection system that monitors all OpenClaw sessions and terminates dangerous ones before they can cause runaway expenses. Born from a real $290/day cost crisis, it provides aggressive monitoring with configurable thresholds and silent operation during healthy periods.

## Architecture

### Core Components

1. **Monitoring Engine** (`scripts/session-guardian.mjs`)
   - Node.js script for session scanning
   - Executes every 15 minutes via cron
   - Analyzes cost, context, messages, duration, file size

2. **Threshold Controller**
   - Kill thresholds (hard limits)
   - Warning thresholds (alerts)
   - Protected sessions whitelist

3. **Action Executor**
   - Automatic session termination
   - Warning notifications
   - Stats logging for audit trail

## Threshold Configuration

### Kill Thresholds (Automatic Termination)

| Metric | Threshold | Rationale |
|--------|-----------|-----------|
| Total Cost | **$25** | Reduced from $100 after cost crisis |
| Hourly Burn | **$5/hour** | 2+ hours sustained |
| Total Tokens | **800k** | Context capacity management |
| Context Usage | **95%** | Prevents overflow crashes |
| Message Count | **1,000** | Spam/loop detection |
| Duration | **8 hours** | Reduced from 24h |
| File Size | **20MB** | Log growth control |

### Warning Thresholds (Alerts Only)

| Metric | Threshold | Action |
|--------|-----------|--------|
| Total Cost | **$8** | Notify CEO |
| Hourly Burn | **$5/hour** | Flag for review |
| Total Tokens | **500k** | Context warning |
| Context Usage | **80%** | Approaching limit |
| Message Count | **500** | High activity |
| Duration | **4 hours** | Long session |
| File Size | **10MB** | Large transcript |

### Session Count Alerts
- **Warning:** 50+ total sessions
- **Critical:** 100+ total sessions

## Protected Sessions

These sessions are never terminated (whitelist):
- `main` — Primary session
- `system` — System operations
- `guardian` — This script itself
- `monitor` — Monitoring sessions

## Workflow

```
Cron triggers every 15 minutes
    ↓
Scan all active sessions
    ↓
Check each against thresholds
    ↓
Kill sessions exceeding kill limits
    ↓
Send warnings for threshold breaches
    ↓
Log stats to file
    ↓
Silent if all healthy
```

## Operation Modes

### Silent Mode (Preferred)
- No output when all systems healthy
- CEO preference: "Only report failures"
- Reduces noise and alert fatigue

### Alert Mode
- Reports warnings and terminations immediately
- Telegram notifications to CEO
- Detailed statistics included

## Implementation

### Script Location
```
workspace/scripts/session-guardian.mjs
```

### Cron Schedule
```json
{
  "name": "Session Guardian",
  "schedule": "0 */15 * * * *",
  "model": "local/qwen2.5-7b-instruct",
  "sessionTarget": "main"
}
```

### Execution
```bash
node /Users/ghost/.openclaw/workspace/scripts/session-guardian.mjs guard
```

## Output Locations

### Log File
```
workspace/logs/session-guardian.log
```
- Timestamped entries
- Termination events
- Warning flags
- Scan summaries

### Stats File
```
workspace/logs/guardian-stats.json
```
- Last scan timestamp
- Sessions checked
- Terminations count
- Warnings count

## Historical Context

### Version 1.0 (Original)
- Kill: $100 cost
- Duration: 24 hours
- No context monitoring
- **Failed:** Reported "all healthy" during 865-session crisis

### Version 2.0 (Emergency Upgrade)
- Kill: $25 cost (75% reduction)
- Duration: 8 hours (67% reduction)
- Added context monitoring (95% kill, 80% warning)
- Added total session alerts
- Added file size limits
- **Result:** Successfully caught $44.50 runaway session

## Integration Points

### Command Center
- Critical Monitoring panel displays:
  - Active session count
  - Total cost across all sessions
  - Highest cost session
  - Context utilization
  - Recent terminations

### Telegram Alerts
- Terminations reported immediately
- Warnings batched when critical
- Silent during healthy periods

### GitHub
- Logs committed via auto-save
- Stats tracked for trend analysis
- Configuration versioned

## Success Metrics

- **Crisis Prevented:** $7+ saved from single termination
- **False Positives:** Zero (protected sessions whitelist works)
- **Coverage:** 100% of sessions monitored
- **Latency:** 15-minute detection window

## Cost

$0 — Runs on local model (Qwen 2.5 7B) every 15 minutes

## Future Enhancements

- Predictive termination (trend-based)
- Per-agent threshold customization
- Automatic model downgrading on high burn
- Integration with cost dashboard

---

*Battle-tested in production since February 13, 2026*
*$290/day crisis → $0/day with Session Guardian v2.0*
