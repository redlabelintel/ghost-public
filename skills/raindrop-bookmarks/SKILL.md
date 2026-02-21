---
name: raindrop-bookmarks
description: Check, analyze, and process Raindrop bookmarks. Fetches untagged bookmarks from Raindrop.io, extracts content (handling X/Twitter blocks via browser), creates structured analysis files, commits to GitHub, and tags bookmarks as processed. Use when user asks to 'check bookmarks', 'analyze bookmarks', 'process Raindrop', 'check my bookmarks', or any bookmark-related workflow involving Raindrop.io.
---

# Raindrop Bookmarks Skill

Complete workflow for processing Raindrop bookmarks — from API check to GitHub commit.

## Prerequisites

- `RAINDROP_TOKEN` environment variable set (Raindrop API Test Token)
- GitHub repo configured for analysis files
- Browser tool available (for X/Twitter content extraction)

## Workflow

### Step 1: Check for Untagged Bookmarks

Use the API to fetch bookmarks from Unsorted collection (-1) with no tags:

```bash
curl -s -H "Authorization: Bearer $RAINDROP_TOKEN" \
  "https://api.raindrop.io/rest/v1/raindrops/-1?perpage=50" | \
  jq -r '.items[] | select((.tags | length) == 0) | "\(._id)|\(.title)|\(.link)"'
```

### Step 2: Fetch Content

For each bookmark:
1. Try `web_fetch` first (fast)
2. If X/Twitter blocks (common), use `browser` tool:
   - Open the URL
   - Wait for load
   - Extract content via snapshot
   - Click "Focus mode" if article view available

### Step 3: Create Analysis File

Generate structured markdown with:
- Source, date, URL
- Summary (2-3 sentences)
- Key Insights (bullet points)
- Strategic Relevance (how it applies to user's context)
- Action Items (checkboxes)
- Tags: `analyzed`, `ghost-ai`

Filename format: `x_bookmark_analysis_YYYY-MM-DD_{topic}_{author}.md`

### Step 4: Commit to GitHub

```bash
cd ~/ghost-repo
git add analysis/x_bookmark_analysis_*.md
git commit -m "Add bookmark analysis: [title]"
git push
```

### Step 5: Tag in Raindrop

Mark as processed with Raindrop tags:

```bash
curl -s -X PUT "https://api.raindrop.io/rest/v1/raindrop/{bookmark_id}" \
  -H "Authorization: Bearer $RAINDROP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"tags":["analyzed","ghost-ai"]}'
```

### Step 6: Send GitHub Link

Always provide absolute GitHub URL:
`https://github.com/{owner}/{repo}/blob/main/analysis/{filename}.md`

## Browser Extraction for X/Twitter

X blocks direct fetch. Use browser navigation:
1. `browser:open` with targetUrl
2. `browser:act` with `wait` (2s)
3. `browser:snapshot` to capture content
4. Look for article text in the snapshot
5. Click "Focus mode" link if available for cleaner extraction
6. Press `End` key to scroll to bottom if needed

## Error Handling

- **API fails**: Check RAINDROP_TOKEN is set
- **Browser times out**: Restart gateway, use partial context
- **Empty content**: Note in analysis that full content was unavailable
- **GitHub push fails**: Check git config, retry

## Reference Files

- [RAINDROP_API.md](references/RAINDROP_API.md) — API endpoints and examples
- [ANALYSIS_TEMPLATE.md](references/ANALYSIS_TEMPLATE.md) — File structure template
