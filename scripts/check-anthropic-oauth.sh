#!/bin/bash
# Check for Anthropic OAuth plugin availability
# Runs weekly to check if provider-anthropic plugin is available

echo "Checking for Anthropic OAuth plugin update..."

# Try to install the plugin
RESULT=$(openclaw plugins install provider-anthropic 2>&1)

if echo "$RESULT" | grep -q "installed successfully"; then
    echo "✅ Anthropic OAuth plugin is now available!"
    echo "Next steps:"
    echo "  1. Run: openclaw models auth login --provider anthropic --set-default"
    echo "  2. Login with your Claude Pro/Max account"
    echo "  3. Restart gateway: openclaw gateway restart"
    echo ""
    echo "Plugin installed at: $(date)"
    
    # Optional: Send notification
    # osascript -e 'display notification "Anthropic OAuth plugin is available!" with title "OpenClaw Update"'
else
    echo "❌ Plugin not available yet. Current status:"
    echo "$RESULT" | head -5
    echo ""
    echo "Will check again next week."
fi
