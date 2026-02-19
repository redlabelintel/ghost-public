#!/bin/bash
# Email duplicate check before sending
# Usage: ./check-before-send.sh <to> <subject> <body-file>

TO="$1"
SUBJECT="$2"
BODY_FILE="$3"

if [ -z "$TO" ] || [ -z "$SUBJECT" ] || [ -z "$BODY_FILE" ]; then
    echo "Usage: $0 <to> <subject> <body-file>"
    exit 1
fi

BODY=$(cat "$BODY_FILE")

# Check for duplicate
RESULT=$(node /Users/ghost/.openclaw/workspace/scripts/email-tracker.mjs check "$TO" "$SUBJECT" "$BODY")

if echo "$RESULT" | grep -q '"isDuplicate":true'; then
    echo "⛔ EMAIL BLOCKED: Duplicate detected within 24 hours"
    echo "$RESULT" | jq -r '.message'
    exit 1
fi

echo "✅ No duplicate found. Safe to send."
exit 0
