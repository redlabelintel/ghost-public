# Agent Readability Audit

**Skill ID:** `agent-readability-audit`  
**Type:** Analysis / Strategy  
**Source:** Emmett (@emmettshine)  
**Version:** 1.0.0

---

## Overview

Audit any brand, website, or content for "agent readability" — how well AI systems can consume, interpret, and act on the information.

**The Dual-Audience Problem:**
- **Humans** read with eyes, emotion, context
- **AI Agents** scrape with APIs, parse with algorithms, decide with logic

**This Skill:** Evaluates and scores content for agent-friendliness.

---

## Why This Matters

| Trend | Impact |
|-------|--------|
| AI search engines | Your content is summarized by machines |
| Voice assistants | Brand info is relayed via Alexa/Siri |
| Recommendation systems | Algorithms decide if you appear |
| Agent browsing | AI visits your site before humans |
| Decision automation | B2B purchases made by AI evaluation |

**If agents can't read you, humans won't find you.**

---

## Audit Dimensions

### 1. Structured Data Presence (25 points)

**What agents need:**
- Schema.org markup
- Open Graph tags
- JSON-LD structured data
- RSS/Atom feeds
- Sitemaps

**Scoring:**
```
✅ Schema.org implementation: +10
✅ Open Graph complete: +5
✅ Twitter Cards: +3
✅ JSON-LD for key entities: +5
✅ RSS feed: +2
```

### 2. Information Architecture (25 points)

**What agents need:**
- Clear URL structure
- Semantic HTML (proper H1-H6)
- Logical navigation hierarchy
- Breadcrumb markup
- Internal linking structure

**Scoring:**
```
✅ Semantic HTML (no div soup): +8
✅ H1 unique per page: +5
✅ Heading hierarchy logical: +5
✅ BreadcrumbList schema: +4
✅ Clean URL structure: +3
```

### 3. Content Extractability (20 points)

**What agents need:**
- Main content identification
- No obfuscation (JS-only content)
- Clean text/HTML ratio
- Alt text for images
- Table/figure markup

**Scoring:**
```
✅ Content in static HTML: +8
✅ Main element identified: +5
✅ Alt text coverage >80%: +4
✅ Tables have headers: +3
```

### 4. API & Machine Access (15 points)

**What agents need:**
- Public API documentation
- Rate limit clarity
- robots.txt friendly
- No aggressive bot blocking
- Data export options

**Scoring:**
```
✅ API docs public: +5
✅ robots.txt allows agents: +3
✅ No aggressive CAPTCHA: +4
✅ Data export available: +3
```

### 5. LLM Interpretability (15 points)

**What agents need:**
- Clear, unambiguous language
- Explicit statements (not implied)
- Defined terms/acronyms
- Consistent terminology
- Key info "above the fold"

**Scoring:**
```
✅ Jargon explained: +4
✅ Clear value proposition: +5
✅ Consistent terminology: +3
✅ Key facts extractable: +3
```

---

## Output Format

```json
{
  "url": "https://example.com",
  "overall_score": 78,
  "grade": "B+",
  "agent_readable": true,
  "dimensions": {
    "structured_data": {
      "score": 20,
      "max": 25,
      "findings": [
        "✅ Schema.org Organization markup present",
        "⚠️ Missing Product schema on pricing page",
        "❌ No RSS feed found"
      ]
    },
    "information_architecture": {
      "score": 22,
      "max": 25,
      "findings": [
        "✅ Semantic HTML5 structure",
        "✅ Proper H1-H6 hierarchy",
        "⚠️ Breadcrumbs missing schema markup"
      ]
    },
    "content_extractability": {
      "score": 18,
      "max": 20,
      "findings": [
        "✅ Content in static HTML",
        "✅ Alt text coverage: 92%",
        "⚠️ Some images missing alt text"
      ]
    },
    "api_access": {
      "score": 10,
      "max": 15,
      "findings": [
        "✅ robots.txt allows all agents",
        "❌ No public API found",
        "✅ No aggressive bot protection"
      ]
    },
    "llm_interpretability": {
      "score": 8,
      "max": 15,
      "findings": [
        "⚠️ Value proposition requires inference",
        "✅ Clear about page",
        "❌ Heavy use of undefined industry jargon"
      ]
    }
  },
  "critical_issues": [
    "No structured data on product pages — agents can't understand offerings",
    "Content loaded via JavaScript — scrapers may miss key information"
  ],
  "recommendations": [
    "Add Product schema to all product pages",
    "Implement JSON-LD for key business entities",
    "Create RSS feed for blog/content updates",
    "Add alt text to remaining 8% of images",
    "Clarify value proposition in first paragraph"
  ],
  "competitive_position": "Top 40% of audited sites"
}
```

---

## Usage

### CLI

```bash
node skills/agent-readability-audit/audit.js --url https://example.com
```

### Programmatic

```javascript
const { audit } = require('./skills/agent-readability-audit');

const report = await audit({
  url: 'https://example.com',
  depth: 'homepage', // or 'full-site'
  competitorUrls: ['https://competitor1.com', 'https://competitor2.com']
});

console.log(report.grade); // 'B+'
console.log(report.critical_issues);
```

### With Comparison

```bash
node skills/agent-readability-audit/audit.js \
  --url https://yourbrand.com \
  --compare https://competitor1.com,https://competitor2.com
```

---

## Service Offering

**"Agent-First Brand Audit"**

**Package:**
1. Full audit (5 dimensions)
2. Competitive benchmarking
3. Critical issues report
4. Implementation roadmap
5. Follow-up re-audit

**Target Clients:**
- B2B companies (AI evaluates vendors)
- E-commerce (AI shopping assistants)
- Content sites (AI search traffic)
- Startups (AI due diligence)

**Pricing:** $2,500-5,000 per audit

---

## Implementation Notes

**What This Skill Does:**
1. Crawls target URL
2. Extracts technical markup
3. Analyzes content structure
4. Scores each dimension
5. Generates recommendations
6. Compares to competitors (optional)

**Required Tools:**
- Puppeteer/Playwright (crawling)
- Cheerio (HTML parsing)
- Schema validator
- Lighthouse API (optional)

---

## Files

- `audit.js` — Main implementation
- `dimensions/` — Scoring logic per dimension
- `report-template.md` — Output formatting

---

*Part of Ghost Skills Architecture*  
*Based on Emmett's "Brands for Humans & Agents"*
