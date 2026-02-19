# Docker Cron Setup Guide

**Status:** Reference Implementation | **For:** Custom OpenClaw Build

## Overview

This guide documents how to implement cron functionality in a Dockerized OpenClaw environment. Based on the Ghost Platform's 12-job cron architecture, adapted for containerized deployment.

## Architecture

```
┌─────────────────────────────────────────┐
│           Docker Container              │
│  ┌─────────────────────────────────┐    │
│  │      OpenClaw Gateway           │    │
│  │         (Node.js)               │    │
│  └─────────────────────────────────┘    │
│              ▲                          │
│              │ cron jobs stored in      │
│  ┌───────────┴───────────────────┐      │
│  │   Cron Scheduler Service      │      │
│  │    (node-cron / cron)         │      │
│  │         OR                    │      │
│  │   System Cron (crond)         │      │
│  └───────────────────────────────┘      │
└─────────────────────────────────────────┘
```

## Implementation Options

### Option A: Node-Cron (Recommended)

**Why:** Pure JavaScript, integrated with OpenClaw, easier debugging

```dockerfile
# Dockerfile
FROM node:20-alpine

# Install OpenClaw
RUN npm install -g openclaw

# Copy your workspace
COPY workspace/ /root/.openclaw/workspace/
COPY config/openclaw.json /root/.openclaw/

# Expose gateway port
EXPOSE 18789

# Start gateway with cron scheduler
CMD ["node", "scheduler.js"]
```

```javascript
// scheduler.js - Integrated with OpenClaw
const { CronJob } = require('cron');
const { execSync } = require('child_process');

// Job definitions (matching your Ghost Platform)
const jobs = [
  {
    name: 'session-guardian',
    schedule: '*/15 * * * *', // Every 15 min
    command: 'node /root/.openclaw/workspace/session-guardian.mjs guard',
    sessionTarget: 'main'
  },
  {
    name: 'health-check-twr',
    schedule: '*/30 * * * *', // Every 30 min
    command: 'curl -s https://twr-geo-bot.vercel.app/api/stats',
    sessionTarget: 'isolated',
    model: 'local/qwen2.5-7b-instruct'
  },
  {
    name: 'crypto-trading-snapshot',
    schedule: '0 */4 * * *', // Every 4 hours
    command: 'cd /root/.openclaw/workspace/crypto-trading-bot && npx ts-node snapshot-paper.mjs',
    sessionTarget: 'main'
  },
  {
    name: 'auto-save-repo',
    schedule: '0 * * * *', // Every hour
    command: 'cd /workspace && git add . && git commit -m "auto-save" && git push',
    sessionTarget: 'isolated'
  },
  {
    name: 'morning-standup',
    schedule: '0 30 9 * * *', // 9:30 AM daily
    timezone: 'Europe/Madrid',
    sessionTarget: 'isolated',
    model: 'local/qwen2.5-7b-instruct',
    delivery: 'announce'
  },
  {
    name: 'ai-self-improvement-digest',
    schedule: '0 30 8 * * *', // 8:30 AM daily
    timezone: 'Europe/Madrid',
    sessionTarget: 'isolated',
    model: 'local/qwen2.5-7b-instruct',
    delivery: 'announce'
  },
  {
    name: 'daily-todo-rundown',
    schedule: '0 0 8 * * *', // 8:00 AM daily
    timezone: 'Europe/Madrid',
    sessionTarget: 'main'
  },
  {
    name: 'sunday-cleanup',
    schedule: '0 0 10 * * 0', // Sunday 10 AM
    timezone: 'Europe/Madrid',
    sessionTarget: 'main'
  },
  {
    name: 'sunday-self-healing',
    schedule: '0 0 23 * * 0', // Sunday 11 PM
    timezone: 'Europe/Madrid',
    sessionTarget: 'isolated',
    model: 'local/qwen2.5-7b-instruct'
  }
];

// Initialize jobs
jobs.forEach(job => {
  new CronJob(
    job.schedule,
    () => {
      console.log(`[CRON] Executing: ${job.name}`);
      try {
        if (job.sessionTarget === 'main') {
          // Send to main session
          execSync(`openclaw sessions_send "${job.command}"`);
        } else {
          // Spawn isolated session
          execSync(`openclaw sessions_spawn --model "${job.model}" "${job.command}"`);
        }
      } catch (error) {
        console.error(`[CRON] ${job.name} failed:`, error.message);
      }
    },
    null,
    true,
    job.timezone || 'UTC'
  );
});

console.log('[CRON] Scheduler initialized with', jobs.length, 'jobs');
```

### Option B: System Cron (crond)

**Why:** Traditional, robust, minimal overhead

```dockerfile
# Dockerfile
FROM node:20-alpine

# Install crond
RUN apk add --no-cache dcron

# Install OpenClaw
RUN npm install -g openclaw

# Copy workspace and config
COPY workspace/ /root/.openclaw/workspace/
COPY config/openclaw.json /root/.openclaw/
COPY crontab /etc/crontabs/root

# Start crond + OpenClaw gateway
CMD crond -f -l 2 & openclaw gateway start
```

```cron
# /etc/crontabs/root
# Session Guardian - every 15 min
*/15 * * * * curl -X POST http://localhost:18789/v1/sessions/send -H "Authorization: Bearer TOKEN" -d '{"message":"node /root/.openclaw/workspace/session-guardian.mjs guard"}'

# TWR Health Check - every 30 min
*/30 * * * * curl -s https://twr-geo-bot.vercel.app/api/stats > /dev/null || curl -X POST http://localhost:18789/v1/message -d '{"channel":"telegram","message":"TWR Geo Bot DOWN"}'

# Crypto Bot - every 4 hours
0 */4 * * * cd /root/.openclaw/workspace/crypto-trading-bot && npx ts-node snapshot-paper.mjs

# Auto-save - hourly
0 * * * * cd /root/.openclaw/workspace && git add . && git commit -m "auto-save $(date)" && git push

# Morning standup - 9:30 AM Madrid
0 30 9 * * * TZ=Europe/Madrid curl -X POST http://localhost:18789/v1/sessions_spawn -d '{"model":"local/qwen2.5-7b-instruct","task":"morning standup"}'

# AI Digest - 8:30 AM Madrid
0 30 8 * * * TZ=Europe/Madrid curl -X POST http://localhost:18789/v1/sessions_spawn -d '{"model":"local/qwen2.5-7b-instruct","task":"self improvement digest"}'

# Daily todo - 8:00 AM Madrid
0 0 8 * * * TZ=Europe/Madrid curl -X POST http://localhost:18789/v1/sessions/send -d '{"message":"daily todo rundown"}'

# Sunday cleanup - 10:00 AM Madrid
0 0 10 * * 0 TZ=Europe/Madrid curl -X POST http://localhost:18789/v1/sessions/send -d '{"message":"weekly cleanup"}'

# Sunday self-healing - 11:00 PM Madrid
0 0 23 * * 0 TZ=Europe/Madrid curl -X POST http://localhost:18789/v1/sessions_spawn -d '{"model":"local/qwen2.5-7b-instruct","task":"self healing audit"}'
```

## OpenClaw Cron Config (JSON)

Store this in your container at `/root/.openclaw/cron.json`:

```json
{
  "jobs": [
    {
      "id": "session-guardian",
      "name": "Session Guardian",
      "enabled": true,
      "schedule": { "kind": "every", "everyMs": 900000 },
      "payload": {
        "kind": "systemEvent",
        "text": "Execute session-guardian.mjs"
      },
      "sessionTarget": "main",
      "delivery": { "mode": "none" }
    },
    {
      "id": "health-check-twr",
      "name": "TWR Geo Bot Health Check",
      "enabled": true,
      "schedule": { "kind": "every", "everyMs": 1800000 },
      "payload": {
        "kind": "agentTurn",
        "message": "Check TWR Geo Bot health. Test webhook and stats endpoints. Only report failures.",
        "model": "local/qwen2.5-7b-instruct",
        "thinking": "off"
      },
      "sessionTarget": "isolated",
      "delivery": { "mode": "announce" }
    },
    {
      "id": "crypto-trading",
      "name": "Crypto Trading Bot",
      "enabled": true,
      "schedule": { "kind": "every", "everyMs": 14400000, "anchorMs": 0 },
      "payload": {
        "kind": "systemEvent",
        "text": "Execute crypto-trading snapshot"
      },
      "sessionTarget": "main",
      "delivery": { "mode": "none" }
    },
    {
      "id": "auto-save",
      "name": "Auto-Save Protocol",
      "enabled": true,
      "schedule": { "kind": "cron", "expr": "0 * * * *", "tz": "Europe/Madrid" },
      "payload": {
        "kind": "systemEvent",
        "text": "Git add, commit, push for meeting docs"
      },
      "sessionTarget": "main",
      "delivery": { "mode": "none" }
    },
    {
      "id": "morning-standup",
      "name": "Morning Agent Standup",
      "enabled": true,
      "schedule": { "kind": "cron", "expr": "30 9 * * *", "tz": "Europe/Madrid" },
      "payload": {
        "kind": "agentTurn",
        "message": "Conduct morning standup with all agents. Review workspace status, system health, pending tasks.",
        "model": "local/qwen2.5-7b-instruct",
        "thinking": "off"
      },
      "sessionTarget": "isolated",
      "delivery": { "mode": "announce" }
    },
    {
      "id": "ai-digest",
      "name": "AI Self-Improvement Digest",
      "enabled": true,
      "schedule": { "kind": "cron", "expr": "30 8 * * *", "tz": "Europe/Madrid" },
      "payload": {
        "kind": "agentTurn",
        "message": "Generate daily AI self-improvement digest from bookmarks and sources.",
        "model": "local/qwen2.5-7b-instruct",
        "thinking": "off"
      },
      "sessionTarget": "isolated",
      "delivery": { "mode": "announce" }
    },
    {
      "id": "daily-todo",
      "name": "Daily Todo Rundown",
      "enabled": true,
      "schedule": { "kind": "cron", "expr": "0 8 * * *", "tz": "Europe/Madrid" },
      "payload": {
        "kind": "systemEvent",
        "text": "Query Supabase for today's todos and send rundown"
      },
      "sessionTarget": "main",
      "delivery": { "mode": "announce" }
    },
    {
      "id": "sunday-cleanup",
      "name": "Weekly Sunday Cleanup",
      "enabled": true,
      "schedule": { "kind": "cron", "expr": "0 10 * * 0", "tz": "Europe/Madrid" },
      "payload": {
        "kind": "systemEvent",
        "text": "Weekly directory cleanup and reorganization"
      },
      "sessionTarget": "main",
      "delivery": { "mode": "none" }
    },
    {
      "id": "sunday-self-healing",
      "name": "Sunday Self-Healing Audit",
      "enabled": true,
      "schedule": { "kind": "cron", "expr": "0 23 * * 0", "tz": "Europe/Madrid" },
      "payload": {
        "kind": "agentTurn",
        "message": "Check for silent cron failures. Verify all jobs executed in past week.",
        "model": "local/qwen2.5-7b-instruct",
        "thinking": "off"
      },
      "sessionTarget": "isolated",
      "delivery": { "mode": "announce" }
    }
  ]
}
```

## Docker Compose Example

```yaml
# docker-compose.yml
version: '3.8'

services:
  openclaw:
    build: .
    container_name: openclaw-main
    ports:
      - "18789:18789"  # Gateway
      - "1234:1234"    # LM Studio (optional)
    volumes:
      - ./workspace:/root/.openclaw/workspace
      - ./config:/root/.openclaw/config
      - ./memory:/root/.openclaw/memory
      - openclaw-data:/root/.openclaw/data
    environment:
      - OPENCLAW_TOKEN=${OPENCLAW_TOKEN}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_KEY=${SUPABASE_KEY}
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Optional: Separate cron service
  cron:
    build:
      context: .
      dockerfile: Dockerfile.cron
    container_name: openclaw-cron
    depends_on:
      - openclaw
    environment:
      - GATEWAY_URL=http://openclaw:18789
      - GATEWAY_TOKEN=${OPENCLAW_TOKEN}
    restart: unless-stopped
    volumes:
      - ./cron-logs:/var/log/cron

volumes:
  openclaw-data:
```

## Session Target Explained

| Target | Use Case | Persistence | Cost |
|--------|----------|-------------|------|
| `main` | Health checks requiring current context, urgent alerts | Runs in primary session | Varies by model |
| `isolated` | Background tasks, digests, audits, non-urgent work | Separate session, auto-cleanup | $0 (local model) |

**Ghost Platform Rule:**
- Health checks, cost monitoring → `main` (immediate attention)
- Standups, digests, cleanup → `isolated` (background processing)

## Delivery Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `none` | Silent execution | Health checks, monitoring, auto-save |
| `announce` | Post to Telegram when complete | Standups, digests, reports |
| `webhook` | POST to configured URL | External integrations |

## Monitoring Cron in Docker

```bash
# View running jobs
docker exec openclaw-main openclaw cron list

# Check job history
docker exec openclaw-main openclaw cron runs <job-id>

# View logs
docker logs openclaw-main | grep CRON
docker logs openclaw-main | grep session-guardian

# Manual trigger
docker exec openclaw-main openclaw cron run <job-id>
```

## Health Checks for Cron

```javascript
// Add to scheduler.js
const http = require('http');

// Health endpoint for Docker
http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'healthy',
      jobsRunning: jobs.length,
      uptime: process.uptime()
    }));
  }
}).listen(8080);
```

```dockerfile
# Dockerfile healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1
```

## Log Aggregation

```yaml
# docker-compose.logging.yml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yaml:/etc/loki/local-config.yaml
      
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - ./promtail-config.yaml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
```

## Troubleshooting

### Cron jobs not running
```bash
# Check if cron service is running
docker exec openclaw-main ps aux | grep cron

# Verify crontab is loaded
docker exec openclaw-main cat /etc/crontabs/root

# Check cron logs
docker exec openclaw-main cat /var/log/cron.log
```

### Timezone issues
```bash
# Set container timezone
docker exec openclaw-main date
docker exec openclaw-main ln -sf /usr/share/zoneinfo/Europe/Madrid /etc/localtime
```

### Gateway not accessible from cron
```bash
# Verify network connectivity
docker exec openclaw-cron curl http://openclaw:18789/status

# Check token validity
docker exec openclaw-cron curl -H "Authorization: Bearer TOKEN" http://openclaw:18789/v1/cron/list
```

## Migration from Host to Docker

If moving from host-based OpenClaw to Docker:

1. **Export existing cron jobs:**
```bash
openclaw cron list > cron-backup.json
```

2. **Update paths in job definitions:**
```bash
sed -i 's|/Users/ghost/.openclaw|/root/.openclaw|g' cron-backup.json
```

3. **Copy to container:**
```bash
docker cp cron-backup.json openclaw-main:/root/.openclaw/cron.json
```

4. **Restart container:**
```bash
docker restart openclaw-main
```

## Cost Optimization

All cron jobs should use `local/qwen2.5-7b-instruct` (via LM Studio) for $0 execution:

```json
{
  "payload": {
    "model": "local/qwen2.5-7b-instruct",
    "thinking": "off"
  }
}
```

Only use paid models (`claude-opus-4.6`, etc.) in `main` session when directly interacting with CEO.

---

*Documentation based on Ghost Platform production deployment*
*12 cron jobs | $0/day automation cost | 99.9% uptime*
