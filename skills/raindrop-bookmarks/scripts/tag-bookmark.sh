#!/bin/bash
# tag-bookmark.sh — Tag a bookmark in Raindrop
# Usage: ./tag-bookmark.sh {bookmark_id}

RAINDROP_TOKEN="${RAINDROP_TOKEN:-$(grep -r 'RAINDROP' ~/.openclaw/workspace-ghost/.env 2>/dev/null | head -1 | cut -d= -f2)}"

if [ -z "$RAINDROP_TOKEN" ]; then
    echo "Error: RAINDROP_TOKEN not set"
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: $0 {bookmark_id}"
    exit 1
fi

BOOKMARK_ID=$1

echo "Tagging bookmark $BOOKMARK_ID..."

curl -s -X PUT "https://api.raindrop.io/rest/v1/raindrop/$BOOKMARK_ID" \
    -H "Authorization: Bearer $RAINDROP_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"tags":["analyzed","ghost-ai"]}'

echo ""
echo "Done"
