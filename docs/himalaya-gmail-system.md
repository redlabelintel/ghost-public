# Himalaya Gmail System

**Status:** Active | **Configured:** February 17, 2026

## Overview

The Himalaya Gmail System provides secure, automated email capabilities for the Ghost Platform. It combines the Himalaya CLI with custom wrappers to enable both interactive email management and programmatic sending with comprehensive duplicate protection.

## Architecture

### Components

1. **Himalaya CLI Core**
   - IMAP/SMTP client written in Rust
   - Multi-account support
   - Config location: `~/.config/himalaya/config.toml`

2. **Safe Send Wrappers**
   - `safe-email-send.mjs` — Node.js/Python SMTP wrapper
   - `himalaya-safe-send.sh` — Himalaya CLI wrapper
   - `email-tracker.mjs` — Duplicate detection engine

3. **Gmail Webhook Integration**
   - Google Pub/Sub push notifications
   - Tailscale funnel for secure ingress
   - Local webhook server on port 8788

4. **Duplicate Protection**
   - 4-layer protection system
   - SHA256 content hashing
   - 24-hour deduplication window
   - Session-level tracking

## Configuration

### Gmail Account
- **Address:** aarontrubic@gmail.com
- **SMTP:** smtp.gmail.com:587 (STARTTLS)
- **Authentication:** 16-character app password
- **IMAP:** imap.gmail.com:993 (SSL)

### Security Notes
- App password required (not regular Google password)
- Password stored in local config only (never in repo)
- Revocable from Google Account settings anytime

## The 4-Layer Protection System

### Layer 1: Session-Level Tracking
Prevents multiple sends within the same request/session

### Layer 2: 24-Hour Window
Blocks identical emails to same recipient within 24 hours

### Layer 3: File Lock System
Prevents race conditions in concurrent access

### Layer 4: SHA256 Hashing
Content-based duplicate detection

## Usage

### Safe Send (Recommended)
```bash
# Node.js/Python SMTP wrapper
node scripts/safe-email-send.mjs \
  "recipient@example.com" \
  "Subject Line" \
  /path/to/body.txt

# Himalaya CLI wrapper
./scripts/himalaya-safe-send.sh \
  "recipient@example.com" \
  "Subject Line" \
  /path/to/body.txt
```

### Raw Himalaya (Not Recommended)
```bash
# List folders
himalaya folder list

# Read emails
himalaya envelope list --folder INBOX

# Send (without duplicate protection)
himalaya template send << 'EOF'
From: aarontrubic@gmail.com
To: recipient@example.com
Subject: Subject

Body text
EOF
```

## Automation

### Gmail Monitor
- **Trigger:** New email in INBOX
- **Mechanism:** Google Pub/Sub webhook
- **Action:** Telegram notification via local AI
- **Model:** Qwen 2.5 7B (local, $0)

### Daily Digest
- **Schedule:** 8:00 AM daily
- **Function:** Todo rundown from Supabase
- **Channel:** Telegram
- **Query:** `get_todays_todos` RPC

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| Sent folder failure | Himalaya IMAP sync issue | Expected, non-critical |
| Duplicate blocked | 4-layer protection | Intentional, logged |
| Auth failure | App password expired | Regenerate in Google Account |
| SMTP timeout | Network/connectivity | Retry with exponential backoff |

## Storage Locations

```
workspace/
├── EMAIL_SERVICE.md              # This configuration
├── scripts/
│   ├── safe-email-send.mjs       # Python SMTP wrapper
│   ├── himalaya-safe-send.sh     # Himalaya CLI wrapper
│   └── email-tracker.mjs         # Duplicate detection
└── memory/
    └── email-filters.md          # Filter rules
```

## Integration Points

- **Supabase:** Todo database for daily rundowns
- **Telegram:** Notification delivery channel
- **Session Guardian:** Error alerting
- **Cron:** Automated digest sending

## Security Posture

- App password never committed to repo
- Duplicate protection prevents spam
- Audit trail in `.email-tracker.json`
- No external email relay (direct Gmail)

## Cost

$0 — Uses Gmail free tier (500 emails/day limit)

---

*System deployed: February 17, 2026*
*4-layer protection active | Zero duplicates since deployment*
