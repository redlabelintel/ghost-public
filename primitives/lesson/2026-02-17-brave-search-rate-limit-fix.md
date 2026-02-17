# AI Self-Improvement Digest - Rate Limit Fix

**Date:** February 17, 2026  
**Issue:** Brave Search API rate limit (1 req/sec on free tier)  
**Fix Applied:** Updated cron job to use max 3 sources with pacing guidance

## Changes Applied

**Before:**
- Attempted to scan 6+ sources in rapid succession
- Hit 429 errors after first request
- Digest generation failed

**After:**
- MAX 3 sources per run
- Rotating source selection (different sources each day)
- Rate limit handling instructions:
  - Space searches 2-3 seconds apart
  - If 429 error: wait 2 seconds and retry, or skip to next source
- Reduced output from 3-5 items to 2-4 items max

## Source Rotation Strategy

**Day 1:** Anthropic + Simon Willison + Hacker News  
**Day 2:** Cursor + Latent Space + OpenClaw ecosystem  
**Day 3:** Back to Tier 1 sources (cycle repeats)

This ensures coverage across all sources over time without hitting rate limits.

## Next Run

**Tomorrow (Feb 18):** 8:30 AM Madrid time  
**Expected behavior:** Successful completion with 2-4 curated items

## Alternative Solutions (if still hitting limits)

1. **Reduce to 2 sources** per run (guaranteed to work)
2. **Use `sleep` equivalent** between searches (if supported)
3. **Upgrade to paid Brave API** ($3/month for 10 req/sec)
4. **Stagger across multiple cron jobs** throughout the day

## Status

✅ Fix applied  
✅ Cron job updated  
✅ Next run: Wednesday 8:30 AM

---
*Fixed proactively per CEO protocol - February 17, 2026*
