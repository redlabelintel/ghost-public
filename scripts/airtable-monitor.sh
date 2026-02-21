#!/bin/bash
# Airtable Status Monitor
# Checks if Airtable API is operational and alerts when recovering from outage
# Designed for cron execution - silent unless status changes to operational

STATE_FILE="/tmp/airtable_monitor_state"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-1177694581}"

# Airtable API endpoint to test
AIRTABLE_API_URL="https://api.airtable.com/v0/meta/bases"

# Function to send Telegram alert
send_telegram_alert() {
    local message="$1"
    
    # If no bot token set, try to get from environment or skip
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        # Try to source from common locations
        if [ -f "$HOME/.openclaw/config.env" ]; then
            source "$HOME/.openclaw/config.env" 2>/dev/null || true
        fi
    fi
    
    # If still no token, log silently and exit
    if [ -z "$TELEGRAM_BOT_TOKEN" ]; then
        echo "No Telegram bot token available" >&2
        return 1
    fi
    
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\":${TELEGRAM_CHAT_ID},\"text\":\"${message}\",\"parse_mode\":\"Markdown\"}" \
        > /dev/null 2>&1
}

# Check current Airtable status
check_airtable_status() {
    # Try status page first (faster, no auth needed)
    local status_response
    status_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
        "https://status.airtable.com/api/v2/status.json" 2>/dev/null)
    
    if [ "$status_response" = "200" ]; then
        # Status page is up, now check if Airtable reports itself as operational
        local status_json
        status_json=$(curl -s --max-time 10 \
            "https://status.airtable.com/api/v2/status.json" 2>/dev/null)
        
        # Check status indicator
        local indicator
        indicator=$(echo "$status_json" | grep -o '"indicator":"[^"]*"' | cut -d'"' -f4)
        
        if [ "$indicator" = "none" ]; then
            echo "operational"
            return 0
        else
            echo "degraded"
            return 1
        fi
    fi
    
    # Fallback: try direct API check (will fail without auth but tells us if service is up)
    local api_response
    api_response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 \
        "$AIRTABLE_API_URL" 2>/dev/null)
    
    # 401 = unauthorized (service is up, just need auth)
    # 200 = success (if you had auth)
    # 5xx = server error (down)
    # 000 = connection failed (down)
    
    if [ "$api_response" = "401" ] || [ "$api_response" = "200" ]; then
        echo "operational"
        return 0
    else
        echo "down"
        return 1
    fi
}

# Read previous state
get_previous_state() {
    if [ -f "$STATE_FILE" ]; then
        cat "$STATE_FILE"
    else
        echo "unknown"
    fi
}

# Save current state
save_state() {
    echo "$1" > "$STATE_FILE"
}

# Main logic
main() {
    local current_status
    local previous_status
    
    current_status=$(check_airtable_status)
    previous_status=$(get_previous_state)
    
    # Save current state for next run
    save_state "$current_status"
    
    # Logic: Only alert if transitioning TO operational FROM down/degraded
    if [ "$current_status" = "operational" ] && [ "$previous_status" != "operational" ] && [ "$previous_status" != "unknown" ]; then
        # Airtable is back up!
        local timestamp
        timestamp=$(date '+%Y-%m-%d %H:%M:%S %Z')
        send_telegram_alert "✅ *Airtable is back online*\n\nStatus: Operational\nTime: ${timestamp}\n\nPrevious status was: ${previous_status}"
        exit 0
    fi
    
    # Silent for all other cases:
    # - Still operational (was operational)
    # - Still down (was down)  
    # - Unknown previous state (first run)
    # - Any degraded state
    
    exit 0
}

main "$@"
