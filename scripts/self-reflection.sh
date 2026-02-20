#!/bin/bash
# Self-Reflection Cron
# Runs: Daily at 11 PM
# Purpose: Review day's operations and identify improvements

cd ~/ghost-repo

echo "🤖 Ghost Self-Reflection - $(date)"
echo "================================"
echo ""

# Check for errors
echo "📊 Error Review:"
if [ -f memory/errors/ERROR_LOG.md ]; then
  echo "Errors logged: $(grep -c '### Error:' memory/errors/ERROR_LOG.md 2>/dev/null || echo 0)"
else
  echo "No errors logged today"
fi
echo ""

# Check memory updates
echo "📝 Memory Updates:"
echo "Recent memories:"
ls -t memory/2026-*.md 2>/dev/null | head -3 | xargs -I {} basename {}
echo ""

# Check skill usage
echo "🔧 Skills Active:"
ls skills/*/SKILL.md 2>/dev/null | wc -l | xargs echo "Total skills:"
echo ""

# Prompt for reflection
echo "💭 Reflection Prompts:"
echo "1. What failed today that shouldn't have?"
echo "2. What patterns emerged in my responses?"
echo "3. What should I do differently tomorrow?"
echo ""

echo "Log reflections to: ops/reflections/$(date +%Y-%m-%d).md"
