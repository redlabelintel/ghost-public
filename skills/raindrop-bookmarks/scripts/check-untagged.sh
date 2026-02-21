#!/bin/bash
# check-untagged.sh — Check Raindrop for untagged bookmarks
# Usage: ./check-untagged.sh

RAINDROP_TOKEN="${RAINDROP_TOKEN:-$(grep -r 'RAINDROP' ~/.openclaw/workspace-ghost/.env 2>/dev/null | head -1 | cut -d= -f2)}"

if [ -z "$RAINDROP_TOKEN" ]; then
    echo "Error: RAINDROP_TOKEN not set"
    echo "Set in environment or .env file"
    exit 1
fi

echo "Checking Raindrop for untagged bookmarks..."
echo ""

curl -s -H "Authorization: Bearer $RAINDROP_TOKEN" \
    "https://api.raindrop.io/rest/v1/raindrops/-1?perpage=50" | \
    jq -r '.items[] | select((.tags | length) == 0) | "\(._id)|\(.title)|\(.link)"'

COUNT=$(curl -s -H "Authorization: Bearer $RAINDROP_TOKEN" \
    "https://api.raindrop.io/rest/v1/raindrops/-1?perpage=50" | \
    jq '[.items[] | select((.tags | length) == 0)] | length')

echo ""
echo "Found: $COUNT untagged bookmarks"
