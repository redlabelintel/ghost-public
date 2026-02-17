# Email Service Configuration

**Status:** Active | **Configured:** February 17, 2026

Working email sending capability via Gmail SMTP with app password authentication.

## Configuration

**Email Account:** aarontrubic@gmail.com  
**SMTP Server:** smtp.gmail.com:587 (STARTTLS)  
**Authentication:** App password (16-character)

## Usage

### Option 1: Python Script (Working)
```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

sender_email = "aarontrubic@gmail.com"
password = "[APP_PASSWORD]"  # Stored securely

server = smtplib.SMTP("smtp.gmail.com", 587)
server.starttls()
server.login(sender_email, password)
server.sendmail(sender_email, receiver_email, message.as_string())
server.quit()
```

### Option 2: Himalaya CLI (Configured but has sent-folder issues)
```bash
# Config location: ~/.config/himalaya/config.toml
# Folder listing works: himalaya folder list
# Sending works but fails to save to Sent folder

himalaya template send << 'EOF'
From: aarontrubic@gmail.com
To: recipient@example.com
Subject: Subject Line

Email body here
EOF
```

## Security

- App password stored in `~/.config/himalaya/config.toml`
- Never use regular Google password — always app password
- App password can be revoked from Google Account settings anytime

## When to Use

- Automated notifications from cron jobs
- Alert emails for system issues
- Quick emails without opening Gmail web interface
- Programmatic email sending from scripts

## DUPLICATE PROTECTION

**CRITICAL RULE: Only ONE email per request**

### Protection System

The email service now includes duplicate prevention:

1. **24-hour window**: Cannot send duplicate emails to same recipient with similar subject/content within 24 hours
2. **Hash tracking**: Each email is hashed and stored in `.email-tracker.json`
3. **Automatic blocking**: Duplicate attempts are rejected with error message

### Safe Send Script (Use This)

```bash
node /Users/ghost/.openclaw/workspace/scripts/safe-email-send.mjs \
  "recipient@example.com" \
  "Subject Line" \
  /path/to/body.txt
```

This script:
- ✅ Checks for duplicates first
- ✅ Sends only if unique
- ✅ Records successful sends
- ✅ Prevents accidental duplicates

**NEVER send raw emails multiple times. Always use the safe wrapper.**

## Limitations

- Gmail daily sending limits apply (500 emails/day for personal accounts)
- Large attachments may fail
- HTML emails require MIME formatting

---
*Locked in: February 17, 2026*  
*Duplicate protection added: February 17, 2026*
