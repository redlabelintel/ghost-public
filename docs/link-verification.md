# Link Verification Integration

## Purpose
Self-healing link validation to prevent sending broken GitHub URLs (or any URLs) to users.

## How It Works

### Before Sending Any Message
1. Extract all GitHub URLs from the response
2. Verify each URL exists via HEAD request
3. If 404 detected:
   - Block the send
   - Alert Ghost to fix the URL
   - Provide user with explanation

### Verification Rules
- **GitHub URLs** — Always verify (critical for repo links)
- **Other URLs** — Verify on first use, cache result
- **Local paths** — Skip verification
- **Timeout** — 5 seconds max per URL

## Usage

### In Scripts
```javascript
const { verifyLink, verifyLinks, extractGitHubUrls } = require('./link-verifier.js');

// Single URL
const result = await verifyLink('https://github.com/redlabelintel/ghost/blob/main/README.md');
console.log(result.valid); // true/false

// Multiple URLs
const { allValid, failures } = await verifyLinks([
  'https://github.com/redlabelintel/ghost/blob/main/README.md',
  'https://github.com/redlabelintel/ghost/blob/main/nonexistent.md'
]);

// Extract from text
const urls = extractGitHubUrls(responseText);
```

### Command Line
```bash
node scripts/link-verifier.js https://github.com/redlabelintel/ghost/blob/main/README.md
```

## Integration Points

### Ghost Response Pipeline (Manual for now)
Before sending any message containing GitHub URLs:
1. Run URLs through `verifyLinks()`
2. If failures detected:
   - Don't send the broken links
   - Alert: "Links need verification"
   - Fix and retry

### Future: Automated Hook
Integrate into message tool wrapper to auto-verify before send.

## Success Metrics

| Metric | Target |
|--------|--------|
| Zero broken GitHub links sent | ✅ 100% |
| Average verification time | <500ms |
| False positive rate (blocking valid) | <1% |

## Current Status

- ✅ Core verifier implemented
- ✅ Cache system working
- ✅ CLI functional
- ⏳ Auto-integration into message pipeline (future)

---
*Implemented: 2026-02-23*
