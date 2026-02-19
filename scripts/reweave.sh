#!/bin/bash
# /reweave — Weekly memory consolidation script
# Run this every Sunday to distill daily logs into MEMORY.md

# Find all memory files from the past week
WEEK_AGO=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '7 days ago' +%Y-%m-%d)
MEMORY_DIR="${HOME}/.openclaw/workspace-ghost/memory"
OPS_DIR="${HOME}/.openclaw/workspace-ghost/ops"

echo "=== /reweave — Memory Consolidation ==="
echo "Processing files since: $WEEK_AGO"
echo ""

# Identify patterns in recent memories
echo "Recent decisions:"
grep -h "^\[decision\]" ${MEMORY_DIR}/2026-*.md 2>/dev/null | tail -10

echo ""
echo "Recent facts:"
grep -h "^\[fact\]" ${MEMORY_DIR}/2026-*.md 2>/dev/null | tail -10

echo ""
echo "Recommendations for MEMORY.md update:"
echo "1. Review decisions above — are they still accurate?"
echo "2. Check for patterns in daily logs"
echo "3. Archive outdated entries in MEMORY.md"
echo "4. Link related memories that weren't connected at capture time"

# Record reweave timestamp
echo "{\"lastReweave\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" > ${OPS_DIR}/reweave-state.json

echo ""
echo "=== /reweave complete ==="
echo "Next: Edit MEMORY.md to incorporate distilled learnings"
