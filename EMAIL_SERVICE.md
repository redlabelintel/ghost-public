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

## Limitations

- Gmail daily sending limits apply (500 emails/day for personal accounts)
- Large attachments may fail
- HTML emails require MIME formatting

---
*Locked in: February 17, 2026*
