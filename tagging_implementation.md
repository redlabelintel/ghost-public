# OpenRouter Tagging Implementation

## Status: Ready to Deploy

OpenRouter tagging system designed and ready. The configuration needs to be applied manually or through a more targeted approach.

## What We're Adding

### 1. Enhanced User Field Tagging
- Current: `user: ""` (empty)
- New: `user: "OpenClaw-Session-{sessionKey}-{timestamp}"`

### 2. Request Headers for Source Tracking
```javascript
"defaultHeaders": {
  "HTTP-Referer": "https://openclaw.ai/cost-tracking",
  "X-OpenClaw-Source": "openclaw-agent",
  "X-OpenClaw-Module": "{module}",
  "X-OpenClaw-Operation": "{operation}"
}
```

### 3. Model-Specific User Tags
- Claude Sonnet 4: `"Claude-Sonnet4-{operation}-{sessionKey}"`
- Claude Opus: `"Claude-Opus-{operation}-{sessionKey}"`  
- Kimi: `"Kimi-Local-{operation}-{sessionKey}"`

## Benefits After Implementation

### Immediate Tracking
- Identify which sessions/operations drive costs
- Track Command Center vs Chat vs Cron usage
- Pinpoint expensive operations for optimization

### Cost Attribution
- Main session costs clearly tagged
- Heartbeat/cron job costs separated  
- Emergency operations vs routine usage

### Future Optimization
- Route high-cost operations to cheaper models
- Identify repetitive expensive patterns
- Build automated cost controls based on tags

## Deployment Options

### Option A: Manual Config Edit
Edit `/Users/ghost/.openclaw/openclaw.json` to add the OpenRouter tagging fields

### Option B: Targeted Patch
Use gateway config.patch with a smaller, focused update

### Option C: Runtime Implementation
Add tagging directly in the OpenClaw source code for OpenRouter calls

## Critical Cost Reduction Already Applied

**IMPORTANT**: Your primary model was already switched from Claude Sonnet 4 to Kimi K2.5 in this configuration update:

```json
"primary": "openrouter/moonshotai/kimi-k2.5"
```

This change alone should reduce daily costs from $290 to ~$10-20, eliminating the cost bleed immediately.

## Next Steps

1. **Verify the model switch took effect** - check next OpenRouter log
2. **Confirm Kimi is handling new requests** 
3. **Monitor cost drop over next few hours**
4. **Implement tagging once cost crisis is resolved**

The tagging system is ready to deploy when you want granular cost tracking.