#!/bin/bash
#
# Himalaya Safe Send Wrapper
# Prevents duplicate emails when using Himalaya CLI
# Usage: himalaya-safe-send.sh <to> <subject> <body-file>

TO="$1"
SUBJECT="$2"
BODY_FILE="$3"

if [ -z "$TO" ] || [ -z "$SUBJECT" ] || [ -z "$BODY_FILE" ]; then
  echo "Usage: himalaya-safe-send.sh <to> <subject> <body-file>"
  exit 1
fi

BODY=$(cat "$BODY_FILE")

# Check for duplicates using the tracker
node /Users/ghost/.openclaw/workspace/scripts/email-tracker.mjs check "$TO" "$SUBJECT" "$BODY"
if [ $? -ne 0 ]; then
  echo "🚫 BLOCKED: Duplicate email detected. Not sending."
  exit 1
fi

# Check session duplicate (same request protection)
SESSION_CHECK=$(node -e "
import { checkSessionDuplicate } from './email-tracker.mjs';
const result = checkSessionDuplicate('$TO', '$SUBJECT');
console.log(result.isDuplicate ? 'DUPLICATE' : 'OK');
")

if [ "$SESSION_CHECK" = "DUPLICATE" ]; then
  echo "🚫 BLOCKED: Email already sent in this session. Not sending."
  exit 1
fi

# All checks passed - send via Himalaya
himalaya template send << EOF
From: aarontrubic@gmail.com
To: $TO
Subject: $SUBJECT

$BODY
EOF

if [ $? -eq 0 ]; then
  # Record successful send
  node /Users/ghost/.openclaw/workspace/scripts/email-tracker.mjs record "$TO" "$SUBJECT" "$BODY"
  node -e "import { markSessionSent } from './email-tracker.mjs'; markSessionSent('$TO', '$SUBJECT');"
  echo "✅ Email sent to $TO and recorded"
else
  echo "❌ Send failed"
  exit 1
fi
